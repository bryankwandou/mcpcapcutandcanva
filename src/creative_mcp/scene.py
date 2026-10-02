"""Editor scene <-> CapCut draft conversion.

A scene is a flat, editor-friendly description of a timeline:
{"draft", "width", "height", "duration", "tracks": [{"id","type"}],
 "elements": [{"id","track","type","start","duration","x","y","scale","rotation",
               "alpha","volume","src","text","color","font_size"}]}
x/y use CapCut's -1..1 canvas coordinates. Every element is movable in space
(x/y/scale/rotation) and time (start/duration/track).
"""
from __future__ import annotations

import json
from pathlib import Path

from . import capcut
from .capcut import US


def _materials(data: dict) -> dict[str, dict]:
    out = {}
    for group in data.get("materials", {}).values():
        if isinstance(group, list):
            for m in group:
                if isinstance(m, dict) and "id" in m:
                    out[m["id"]] = m
    return out


def from_draft(name: str) -> dict:
    data = capcut.load(name)
    mats = _materials(data)
    tracks, elements = [], []
    for t in data["tracks"]:
        tracks.append({"id": t["id"], "type": t["type"]})
        for s in t["segments"]:
            m = mats.get(s["material_id"], {})
            c = s.get("clip") or {}
            tr = s["target_timerange"]
            el = {"id": s["id"], "track": t["id"], "start": tr["start"] / US,
                  "duration": tr["duration"] / US,
                  "x": c.get("transform", {}).get("x", 0.0), "y": c.get("transform", {}).get("y", 0.0),
                  "scale": c.get("scale", {}).get("x", 1.0), "rotation": c.get("rotation", 0.0),
                  "alpha": c.get("alpha", 1.0), "volume": s.get("volume", 1.0)}
            if m.get("type") == "text":
                try:
                    content = json.loads(m.get("content", "{}"))
                    el["text"] = content.get("text", "")
                except ValueError:
                    el["text"] = ""
                el.update(type="text", color=m.get("text_color", "#FFFFFF"),
                          font_size=m.get("font_size", 8.0))
            elif t["type"] == "audio":
                el.update(type="audio", src=m.get("path", ""))
            elif t["type"] in ("sticker", "effect", "filter"):  # CapCut library elements
                el.update(type=t["type"], src="", label=m.get("name") or m.get("effect_name") or t["type"],
                          preview=m.get("path") or m.get("icon_url") or "")
            else:
                el.update(type="photo" if m.get("type") == "photo" else "video", src=m.get("path", ""))
            elements.append(el)
    c = data.get("canvas_config", {})
    return {"draft": name, "width": c.get("width", 1080), "height": c.get("height", 1920),
            "duration": data.get("duration", 0) / US, "tracks": tracks, "elements": elements}


def apply_to_draft(scene: dict) -> dict:
    """Write an edited scene back into the CapCut draft (one load, one save, with backup)."""
    name = scene["draft"]
    data = capcut.load(name)
    mats = _materials(data)
    by_id = {t["id"]: t for t in data["tracks"]}
    old_segs = {s["id"]: s for t in data["tracks"] for s in t["segments"]}
    for t in by_id.values():
        t["segments"] = []
    for t in scene.get("tracks", []):
        if t["id"] not in by_id:
            nt = {"id": t["id"], "type": t["type"], "attribute": 0, "flag": 0, "segments": []}
            data["tracks"].append(nt)
            by_id[t["id"]] = nt
    added = 0
    for el in scene["elements"]:
        seg = old_segs.get(el["id"])
        if seg is None:  # element created in the editor
            seg = _new_segment(data, el)
            added += 1
        tr = seg["target_timerange"]
        tr["start"], tr["duration"] = int(el["start"] * US), int(el["duration"] * US)
        if "source_timerange" in seg:
            seg["source_timerange"]["duration"] = tr["duration"]
        c = seg.setdefault("clip", capcut._segment("", 0, 0)["clip"])
        c["transform"] = {"x": el.get("x", 0.0), "y": el.get("y", 0.0)}
        c["scale"] = {"x": el.get("scale", 1.0), "y": el.get("scale", 1.0)}
        c["rotation"], c["alpha"] = el.get("rotation", 0.0), el.get("alpha", 1.0)
        seg["volume"] = el.get("volume", 1.0)
        m = mats.get(seg["material_id"])
        if m is not None and m.get("type") == "text" and "text" in el:
            content = json.loads(m.get("content") or "{}")
            content["text"] = el["text"]
            for st in content.get("styles", []):
                st["range"] = [0, len(el["text"])]
            m["content"] = json.dumps(content, ensure_ascii=False)
            m["text_color"], m["font_size"] = el.get("color", "#FFFFFF"), el.get("font_size", 8.0)
        track = by_id.get(el["track"]) or capcut._track(data, "text" if el["type"] == "text" else
                                                         "audio" if el["type"] == "audio" else "video", None)
        track["segments"].append(seg)
    for t in data["tracks"]:
        t["segments"].sort(key=lambda s: s["target_timerange"]["start"])
    data["tracks"] = [t for t in data["tracks"] if t["segments"]]
    capcut._recalc(data)
    capcut.save(name, data)
    removed = len(set(old_segs) - {e["id"] for e in scene["elements"]})
    return {"ok": True, "elements": len(scene["elements"]), "added": added, "removed": removed}


def _new_segment(data: dict, el: dict) -> dict:
    mid = capcut._uid()
    if el["type"] == "text":
        text = el.get("text", "Text")
        h = el.get("color", "#FFFFFF").lstrip("#")
        rgb = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
        content = {"text": text, "styles": [{"range": [0, len(text)], "size": el.get("font_size", 8.0),
                                             "fill": {"content": {"solid": {"color": rgb}}}}]}
        data["materials"]["texts"].append({"id": mid, "type": "text", "alignment": 1, "typesetting": 0,
                                           "content": json.dumps(content, ensure_ascii=False)})
        seg = capcut._segment(mid, 0, 0)
        seg.pop("source_timerange")
    elif el["type"] == "audio":
        p = el["src"]
        data["materials"]["audios"].append({"id": mid, "type": "extract_music", "path": p,
                                            "name": Path(p).name, "duration": int(el["duration"] * US)})
        seg = capcut._segment(mid, 0, 0)
    else:
        p = el["src"]
        data["materials"]["videos"].append({
            "id": mid, "type": el["type"], "path": p, "material_name": Path(p).name,
            "duration": int(el["duration"] * US) if el["type"] == "video" else 10_800 * US,
            "width": data["canvas_config"]["width"], "height": data["canvas_config"]["height"],
            "crop_ratio": "free", "crop_scale": 1.0})
        seg = capcut._segment(mid, 0, 0)
    seg["id"] = el["id"]
    return seg
