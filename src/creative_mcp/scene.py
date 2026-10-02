"""Editor scene <-> CapCut draft conversion.

A scene is a flat, editor-friendly description of a timeline:
{"draft", "width", "height", "duration", "tracks": [{"id","type"}],
 "elements": [{"id","track","type","start","duration","source_start","speed",
               "x","y","scale","rotation","alpha","volume","fade_in","fade_out",
               "keyframes": {"x": [{"t","v"}], ...}, "transition": {"key","name","duration"},
               "src","text","color","font_size","label","lib","clone_of"}]}
x/y use CapCut's -1..1 canvas coordinates; times are seconds; keyframe t is
relative to the element start. Every element is movable in space and time.
"""
from __future__ import annotations

import copy
import json
from pathlib import Path

from . import capcut
from .capcut import US

# editor property -> CapCut keyframe property types
KF_TYPES = {"x": ["KFTypePositionX"], "y": ["KFTypePositionY"], "rotation": ["KFTypeRotation"],
            "scale": ["KFTypeScaleX", "KFTypeScaleY"], "alpha": ["KFTypeGlobalAlpha"], "volume": ["KFTypeVolume"]}
KF_REV = {"KFTypePositionX": "x", "KFTypePositionY": "y", "KFTypeRotation": "rotation",
          "KFTypeScaleX": "scale", "KFTypeGlobalAlpha": "alpha", "KFTypeVolume": "volume"}
# material groups that belong to exactly one segment and are rebuilt on every apply
OWNED = ("speeds", "audio_fades", "transitions")


def _materials(data: dict) -> tuple[dict[str, dict], dict[str, str]]:
    out, group_of = {}, {}
    for group, items in data.get("materials", {}).items():
        if isinstance(items, list):
            for m in items:
                if isinstance(m, dict) and "id" in m:
                    out[m["id"]] = m
                    group_of[m["id"]] = group
    return out, group_of


def from_draft(name: str) -> dict:
    data = capcut.load(name)
    mats, group_of = _materials(data)
    tracks, elements = [], []
    for t in data["tracks"]:
        tracks.append({"id": t["id"], "type": t["type"]})
        for s in t["segments"]:
            m = mats.get(s["material_id"], {})
            c = s.get("clip") or {}
            tr = s["target_timerange"]
            src_tr = s.get("source_timerange") or {}
            el = {"id": s["id"], "track": t["id"], "start": tr["start"] / US,
                  "duration": tr["duration"] / US, "source_start": src_tr.get("start", 0) / US,
                  "speed": float(s.get("speed") or 1.0),
                  "x": c.get("transform", {}).get("x", 0.0), "y": c.get("transform", {}).get("y", 0.0),
                  "scale": c.get("scale", {}).get("x", 1.0), "rotation": c.get("rotation", 0.0),
                  "alpha": c.get("alpha", 1.0), "volume": s.get("volume", 1.0),
                  "fade_in": 0.0, "fade_out": 0.0, "keyframes": {}}
            for ref in s.get("extra_material_refs", []) or []:
                g, rm = group_of.get(ref), mats.get(ref, {})
                if g == "audio_fades":
                    el["fade_in"] = rm.get("fade_in_duration", 0) / US
                    el["fade_out"] = rm.get("fade_out_duration", 0) / US
                elif g == "transitions":
                    from .capcut_library import _rid
                    rid = _rid(rm)
                    el["transition"] = {"key": f"transition:{rid}", "name": rm.get("name", "Transisi"),
                                        "duration": rm.get("duration", 500_000) / US,
                                        "vip": bool(rm.get("is_vip"))}
            for kf in s.get("common_keyframes", []) or []:
                prop = KF_REV.get(kf.get("property_type"))
                if prop:
                    el["keyframes"][prop] = [{"t": k["time_offset"] / US, "v": k["values"][0]}
                                             for k in kf.get("keyframe_list", []) if k.get("values")]
            if m.get("type") == "text":
                try:
                    el["text"] = json.loads(m.get("content", "{}")).get("text", "")
                except ValueError:
                    el["text"] = ""
                el.update(type="text", color=m.get("text_color", "#FFFFFF"), font_size=m.get("font_size", 8.0))
            elif t["type"] == "audio":
                el.update(type="audio", src=m.get("path", ""))
            elif t["type"] in ("sticker", "effect", "filter"):  # CapCut library elements
                el.update(type=t["type"], src="", label=m.get("name") or m.get("effect_name") or t["type"],
                          preview=m.get("path") or "", vip=bool(m.get("is_vip")))
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
    mats, group_of = _materials(data)
    by_id = {t["id"]: t for t in data["tracks"]}
    old_segs = {s["id"]: s for t in data["tracks"] for s in t["segments"]}
    for t in by_id.values():
        t["segments"] = []
    for t in scene.get("tracks", []):
        if t["id"] not in by_id:
            nt = {"id": t["id"], "type": t["type"], "attribute": 0, "flag": 0, "segments": []}
            data["tracks"].append(nt)
            by_id[t["id"]] = nt
    added, skipped = 0, []
    for el in scene["elements"]:
        seg = old_segs.get(el["id"])
        if seg is None:
            seg = _clone_segment(data, mats, old_segs.get(el.get("clone_of", "")), el) if el.get("clone_of") in old_segs \
                else _new_segment(data, el)
            if seg is None:
                skipped.append(el.get("label") or el["id"])
                continue
            mats, group_of = _materials(data)
            added += 1
        speed = float(el.get("speed") or 1.0)
        tr = seg["target_timerange"]
        tr["start"], tr["duration"] = int(el["start"] * US), int(el["duration"] * US)
        if "source_timerange" in seg:
            seg["source_timerange"] = {"start": int(el.get("source_start", 0) * US), "duration": int(el["duration"] * speed * US)}
        c = seg.setdefault("clip", capcut._segment("", 0, 0)["clip"])
        c["transform"] = {"x": el.get("x", 0.0), "y": el.get("y", 0.0)}
        c["scale"] = {"x": el.get("scale", 1.0), "y": el.get("scale", 1.0)}
        c["rotation"], c["alpha"] = el.get("rotation", 0.0), el.get("alpha", 1.0)
        seg["volume"] = el.get("volume", 1.0)
        _owned_refs(data, seg, el, group_of, speed)
        seg["common_keyframes"] = _keyframes(el.get("keyframes") or {})
        m = mats.get(seg["material_id"])
        if m is not None and m.get("type") == "text" and "text" in el:
            content = json.loads(m.get("content") or "{}")
            content["text"] = el["text"]
            for st in content.get("styles", []):
                st["range"] = [0, len(el["text"])]
            m["content"] = json.dumps(content, ensure_ascii=False)
            m["text_color"], m["font_size"] = el.get("color", "#FFFFFF"), el.get("font_size", 8.0)
        track = by_id.get(el["track"]) or capcut._track(data, _track_type(el["type"]), None)
        track["segments"].append(seg)
    _collect_garbage(data)
    for t in data["tracks"]:
        t["segments"].sort(key=lambda s: s["target_timerange"]["start"])
    data["tracks"] = [t for t in data["tracks"] if t["segments"]]
    capcut._recalc(data)
    capcut.save(name, data)
    removed = len(set(old_segs) - {e["id"] for e in scene["elements"]})
    out = {"ok": True, "elements": len(scene["elements"]) - len(skipped), "added": added, "removed": removed}
    if skipped:
        out["skipped"] = skipped
    return out


def _track_type(el_type: str) -> str:
    return "video" if el_type == "photo" else el_type


def _owned_refs(data: dict, seg: dict, el: dict, group_of: dict, speed: float) -> None:
    """Rebuild the per-segment speed / fade / transition materials from the element."""
    mats = data["materials"]
    refs = [r for r in seg.get("extra_material_refs", []) or [] if group_of.get(r) not in OWNED]
    if el["type"] in ("video", "audio", "photo"):
        sid = capcut._uid()
        mats.setdefault("speeds", []).append({"id": sid, "type": "speed", "mode": 0, "speed": speed, "curve_speed": None})
        refs.append(sid)
        seg["speed"] = speed
    if el["type"] in ("video", "audio") and (el.get("fade_in") or el.get("fade_out")):
        fid = capcut._uid()
        mats.setdefault("audio_fades", []).append({"id": fid, "type": "audio_fade", "fade_type": 0,
                                                  "fade_in_duration": int(el.get("fade_in", 0) * US),
                                                  "fade_out_duration": int(el.get("fade_out", 0) * US)})
        refs.append(fid)
    trx = el.get("transition")
    if trx and not str(trx.get("key", "")).startswith("demo:"):
        from . import capcut_library
        item = capcut_library.load_library()["items"].get(trx["key"])
        if item:
            m = copy.deepcopy(item["material"])
            m["id"] = capcut._uid()
            m["duration"] = int(float(trx.get("duration", 0.5)) * US)
            mats.setdefault("transitions", []).append(m)
            refs.append(m["id"])
    seg["extra_material_refs"] = refs


def _keyframes(kfs: dict) -> list:
    out = []
    for prop, points in kfs.items():
        if not points:
            continue
        for ptype in KF_TYPES.get(prop, []):
            out.append({"id": capcut._uid(), "material_id": "", "property_type": ptype, "keyframe_list": [
                {"id": capcut._uid(), "curveType": "Line", "graphID": "", "left_control": {"x": 0.0, "y": 0.0},
                 "right_control": {"x": 0.0, "y": 0.0}, "time_offset": int(p["t"] * US), "values": [float(p["v"])]}
                for p in sorted(points, key=lambda p: p["t"])]})
    return out


def _collect_garbage(data: dict) -> None:
    used = {r for t in data["tracks"] for s in t["segments"] for r in s.get("extra_material_refs", []) or []}
    for g in OWNED:
        if isinstance(data["materials"].get(g), list):
            data["materials"][g] = [m for m in data["materials"][g] if m.get("id") in used]


def _clone_segment(data: dict, mats: dict, src: dict, el: dict) -> dict:
    """A split creates a second segment with its own copy of the source material."""
    seg = copy.deepcopy(src)
    seg["id"] = el["id"]
    m = mats.get(src["material_id"])
    if m is not None:
        for items in data["materials"].values():
            if isinstance(items, list) and m in items:
                nm = copy.deepcopy(m)
                nm["id"] = capcut._uid()
                items.append(nm)
                seg["material_id"] = nm["id"]
                break
    return seg


def _new_segment(data: dict, el: dict) -> dict | None:
    mid = capcut._uid()
    if el.get("lib"):  # sticker / effect / filter from the personal CapCut library
        if str(el["lib"]).startswith("demo:"):
            return None
        from . import capcut_library
        item = capcut_library.load_library()["items"].get(el["lib"])
        if not item:
            return None
        m = copy.deepcopy(item["material"])
        m["id"] = mid
        data["materials"].setdefault(item["group"], []).append(m)
        seg = capcut._segment(mid, 0, 0)
        seg.pop("source_timerange")
    elif el["type"] == "text":
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
    elif el["type"] in ("video", "photo"):
        p = el["src"]
        data["materials"]["videos"].append({
            "id": mid, "type": el["type"], "path": p, "material_name": Path(p).name,
            "duration": int((el.get("source_start", 0) + el["duration"] * float(el.get("speed") or 1)) * US)
            if el["type"] == "video" else 10_800 * US,
            "width": data["canvas_config"]["width"], "height": data["canvas_config"]["height"],
            "crop_ratio": "free", "crop_scale": 1.0})
        seg = capcut._segment(mid, 0, 0)
    else:
        return None
    seg["id"] = el["id"]
    return seg
