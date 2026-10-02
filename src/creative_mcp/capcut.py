"""CapCut desktop draft editing.

CapCut has no public API. CapCut Desktop stores every project as a folder with a
``draft_content.json`` (timeline) and ``draft_meta_info.json``. This module reads
and writes that timeline. Times are in microseconds inside the file; the public
functions take seconds.

Caveats:
* Close the project in CapCut (or go back to the home screen) before writing,
  then reopen it to see the changes; CapCut overwrites the file on save.
* Some recent CapCut builds encrypt ``draft_content.json``. Those drafts are
  detected and reported; use the desktop-control tools for them instead.
"""
from __future__ import annotations

import copy
import json
import os
import platform
import shutil
import time
import uuid
from pathlib import Path
from typing import Any

US = 1_000_000


def _uid() -> str:
    return str(uuid.uuid4()).upper()


def drafts_dir() -> Path:
    env = os.getenv("CAPCUT_DRAFTS_DIR")
    if env:
        return Path(env).expanduser()
    home = Path.home()
    if platform.system() == "Windows":
        base = Path(os.getenv("LOCALAPPDATA", home / "AppData/Local"))
        return base / "CapCut/User Data/Projects/com.lveditor.draft"
    return home / "Movies/CapCut/User Data/Projects/com.lveditor.draft"


def list_drafts() -> list[dict]:
    root = drafts_dir()
    if not root.exists():
        raise FileNotFoundError(f"CapCut drafts folder not found: {root} (set CAPCUT_DRAFTS_DIR)")
    out = []
    for d in sorted(root.iterdir(), key=lambda p: p.stat().st_mtime, reverse=True):
        if (d / "draft_content.json").exists() or (d / "draft_info.json").exists():
            out.append({"name": d.name, "path": str(d),
                        "modified": time.ctime(d.stat().st_mtime)})
    return out


def _content_file(name: str) -> Path:
    d = drafts_dir() / name
    for fn in ("draft_content.json", "draft_info.json"):
        if (d / fn).exists():
            return d / fn
    raise FileNotFoundError(f"Draft '{name}' not found in {drafts_dir()}")


def load(name: str) -> dict:
    raw = _content_file(name).read_text(encoding="utf-8", errors="replace")
    try:
        return json.loads(raw)
    except json.JSONDecodeError as e:
        raise ValueError("This draft is encrypted by your CapCut version and cannot be edited "
                         "as JSON. Use the desktop_* tools to edit it live instead.") from e


def save(name: str, data: dict) -> None:
    f = _content_file(name)
    shutil.copy2(f, f.with_suffix(".json.bak"))
    f.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")


def _empty_draft(width: int, height: int, fps: float) -> dict:
    return {
        "id": _uid(), "version": 360000, "new_version": "110.0.0",
        "name": "", "duration": 0, "fps": fps,
        "canvas_config": {"width": width, "height": height, "ratio": "original", "background": None},
        "config": {"maintrack_adsorb": True},
        "platform": {"os": platform.system().lower(), "app_source": "cc"},
        "materials": {k: [] for k in (
            "videos", "audios", "texts", "stickers", "effects", "video_effects",
            "transitions", "canvases", "speeds", "sound_channel_mappings",
            "material_animations", "beats", "vocal_separations", "placeholders")},
        "tracks": [], "keyframes": {"videos": [], "audios": [], "texts": [], "stickers": []},
        "extra_info": None, "relationships": [],
    }


def create_draft(name: str, width: int = 1080, height: int = 1920, fps: float = 30.0,
                 template: str | None = None) -> dict:
    """Create a new draft. If ``template`` names an existing draft it is cloned
    (most reliable, since the file layout matches your CapCut version)."""
    root = drafts_dir()
    target = root / name
    if target.exists():
        raise FileExistsError(f"Draft '{name}' already exists")
    if template:
        shutil.copytree(root / template, target)
        data = load(name)
        data["id"] = _uid()
        data["tracks"] = []
        for k in data.get("materials", {}):
            data["materials"][k] = []
        data["duration"] = 0
        data["canvas_config"].update(width=width, height=height)
        save(name, data)
    else:
        target.mkdir(parents=True)
        data = _empty_draft(width, height, fps)
        (target / "draft_content.json").write_text(json.dumps(data), encoding="utf-8")
    meta = {"draft_id": _uid(), "draft_name": name, "draft_fold_path": str(target),
            "draft_root_path": str(root), "tm_draft_create": int(time.time() * US),
            "tm_draft_modified": int(time.time() * US), "tm_duration": 0}
    meta_file = target / "draft_meta_info.json"
    if meta_file.exists():
        old = json.loads(meta_file.read_text(encoding="utf-8"))
        old.update(meta)
        meta = old
    meta_file.write_text(json.dumps(meta, ensure_ascii=False), encoding="utf-8")
    return {"name": name, "path": str(target)}


def _track(data: dict, kind: str, index: int | None) -> dict:
    tracks = [t for t in data["tracks"] if t["type"] == kind]
    if index is not None and index < len(tracks):
        return tracks[index]
    t = {"id": _uid(), "type": kind, "attribute": 0, "flag": 0, "segments": []}
    data["tracks"].append(t)
    return t


def _segment(material_id: str, start: float, duration: float, source_start: float = 0,
             extra_refs: list[str] | None = None, **clip: Any) -> dict:
    return {
        "id": _uid(), "material_id": material_id, "visible": True, "volume": clip.get("volume", 1.0),
        "speed": 1.0, "extra_material_refs": extra_refs or [],
        "target_timerange": {"start": int(start * US), "duration": int(duration * US)},
        "source_timerange": {"start": int(source_start * US), "duration": int(duration * US)},
        "clip": {"alpha": clip.get("alpha", 1.0), "rotation": clip.get("rotation", 0.0),
                 "scale": {"x": clip.get("scale", 1.0), "y": clip.get("scale", 1.0)},
                 "transform": {"x": clip.get("x", 0.0), "y": clip.get("y", 0.0)},
                 "flip": {"horizontal": False, "vertical": False}},
        "render_index": 0, "track_render_index": 0,
    }


def _recalc(data: dict) -> None:
    end = 0
    for t in data["tracks"]:
        for s in t["segments"]:
            tr = s["target_timerange"]
            end = max(end, tr["start"] + tr["duration"])
    data["duration"] = end


def add_media(name: str, file_path: str, start: float, duration: float, kind: str = "video",
              source_start: float = 0, track_index: int | None = None, **clip: Any) -> dict:
    """kind: 'video', 'photo' or 'audio'. x/y are -1..1 canvas coordinates."""
    data = load(name)
    p = str(Path(file_path).expanduser().resolve())
    mid = _uid()
    if kind == "audio":
        data["materials"]["audios"].append({"id": mid, "type": "extract_music", "path": p,
                                            "name": Path(p).name, "duration": int(duration * US)})
        track = _track(data, "audio", track_index)
    else:
        data["materials"]["videos"].append({
            "id": mid, "type": kind, "path": p, "material_name": Path(p).name,
            "duration": int((source_start + duration) * US) if kind == "video" else 10_800 * US,
            "width": data["canvas_config"]["width"], "height": data["canvas_config"]["height"],
            "crop": {"upper_left_x": 0, "upper_left_y": 0, "upper_right_x": 1, "upper_right_y": 0,
                     "lower_left_x": 0, "lower_left_y": 1, "lower_right_x": 1, "lower_right_y": 1},
            "crop_ratio": "free", "crop_scale": 1.0})
        track = _track(data, "video", track_index)
    seg = _segment(mid, start, duration, source_start, **clip)
    track["segments"].append(seg)
    track["segments"].sort(key=lambda s: s["target_timerange"]["start"])
    _recalc(data)
    save(name, data)
    return {"segment_id": seg["id"], "track_id": track["id"]}


def add_text(name: str, text: str, start: float, duration: float, font_size: float = 8.0,
             color: str = "#FFFFFF", x: float = 0.0, y: float = 0.0,
             track_index: int | None = None) -> dict:
    data = load(name)
    h = color.lstrip("#")
    rgb = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    content = {"text": text, "styles": [{"range": [0, len(text)], "size": font_size,
                                         "fill": {"content": {"solid": {"color": rgb}}}}]}
    mid = _uid()
    data["materials"]["texts"].append({
        "id": mid, "type": "text", "content": json.dumps(content, ensure_ascii=False),
        "font_size": font_size, "text_color": color, "alignment": 1, "typesetting": 0})
    track = _track(data, "text", track_index)
    seg = _segment(mid, start, duration, x=x, y=y)
    seg.pop("source_timerange")
    track["segments"].append(seg)
    _recalc(data)
    save(name, data)
    return {"segment_id": seg["id"], "track_id": track["id"]}


def timeline(name: str) -> dict:
    data = load(name)
    mats: dict[str, dict] = {}
    for group in data.get("materials", {}).values():
        if isinstance(group, list):
            for m in group:
                if isinstance(m, dict) and "id" in m:
                    mats[m["id"]] = m
    tracks = []
    for t in data["tracks"]:
        segs = []
        for s in t["segments"]:
            m = mats.get(s["material_id"], {})
            tr = s["target_timerange"]
            label = m.get("path") or m.get("material_name") or m.get("name")
            if m.get("type") == "text":
                try:
                    label = json.loads(m["content"])["text"]
                except Exception:
                    label = m.get("content")
            segs.append({"id": s["id"], "start": tr["start"] / US, "duration": tr["duration"] / US,
                         "material": label, "clip": s.get("clip")})
        tracks.append({"id": t["id"], "type": t["type"], "segments": segs})
    c = data.get("canvas_config", {})
    return {"duration": data.get("duration", 0) / US, "canvas": [c.get("width"), c.get("height")],
            "tracks": tracks}


def _find(data: dict, segment_id: str) -> tuple[dict, dict]:
    for t in data["tracks"]:
        for s in t["segments"]:
            if s["id"] == segment_id:
                return t, s
    raise KeyError(f"Segment {segment_id} not found")


def update_segment(name: str, segment_id: str, start: float | None = None,
                   duration: float | None = None, **clip: Any) -> dict:
    """Move / trim / transform a segment (the JSON equivalent of drag & drop)."""
    data = load(name)
    _, s = _find(data, segment_id)
    if start is not None:
        s["target_timerange"]["start"] = int(start * US)
    if duration is not None:
        s["target_timerange"]["duration"] = int(duration * US)
        if "source_timerange" in s:
            s["source_timerange"]["duration"] = int(duration * US)
    c = s.setdefault("clip", copy.deepcopy(_segment("", 0, 0)["clip"]))
    if "x" in clip or "y" in clip:
        c["transform"]["x"] = clip.get("x", c["transform"]["x"])
        c["transform"]["y"] = clip.get("y", c["transform"]["y"])
    if "scale" in clip:
        c["scale"] = {"x": clip["scale"], "y": clip["scale"]}
    for k in ("rotation", "alpha"):
        if k in clip:
            c[k] = clip[k]
    if "volume" in clip:
        s["volume"] = clip["volume"]
    _recalc(data)
    save(name, data)
    return {"ok": True, "segment": s["id"]}


def delete_segment(name: str, segment_id: str) -> dict:
    data = load(name)
    t, s = _find(data, segment_id)
    t["segments"].remove(s)
    data["tracks"] = [t for t in data["tracks"] if t["segments"]]
    _recalc(data)
    save(name, data)
    return {"ok": True}
