"""Personal CapCut element library harvested from your own projects.

Every sticker, effect, filter, transition, animation and font you have ever
applied in a CapCut project is stored in that project's draft with its resource
id and the path of the file CapCut already downloaded on this computer. This
module collects them into ~/.creative-mcp/capcut_library.json so they can be
re-applied to any other project (and used by the templates).

Only elements your account already used are collected; nothing is downloaded
from CapCut's servers and paid (VIP) items stay as CapCut marks them.
"""
from __future__ import annotations

import copy
import json
from pathlib import Path
from typing import Any

from . import cache, capcut
from .capcut import US

FILE = cache.HOME / "capcut_library.json"

# materials group -> (kind, how it is used)
GROUPS = {
    "stickers": "sticker",
    "video_effects": "effect",
    "effects": "filter",           # filters / adjustments live here
    "transitions": "transition",
    "material_animations": "animation",
}
TRACK_FOR = {"sticker": "sticker", "effect": "effect", "filter": "filter"}
VIP_KEYS = ("is_vip", "is_pro", "vip", "commercial_music", "is_ai_feature")


def _name(m: dict) -> str:
    for k in ("name", "effect_name", "title", "material_name", "category_name"):
        if m.get(k):
            return str(m[k])
    return m.get("type", "")


def _rid(m: dict) -> str:
    for k in ("resource_id", "effect_id", "sticker_id", "third_resource_id", "id"):
        if m.get(k):
            return str(m[k])
    return ""


def _vip(m: dict) -> bool:
    return any(bool(m.get(k)) for k in VIP_KEYS)


def load_library() -> dict:
    try:
        return json.loads(FILE.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {"items": {}, "scanned": []}


def scan(drafts: list[str] | None = None) -> dict:
    """Scan CapCut projects and merge every reusable element into the library."""
    lib = load_library()
    items: dict[str, dict] = lib["items"]
    scanned, encrypted = [], []
    names = drafts or [d["name"] for d in capcut.list_drafts()]
    for name in names:
        try:
            data = capcut.load(name)
        except ValueError:
            encrypted.append(name)
            continue
        except FileNotFoundError:
            continue
        scanned.append(name)
        mats = data.get("materials", {})
        for group, kind in GROUPS.items():
            for m in mats.get(group, []) or []:
                if not isinstance(m, dict):
                    continue
                if group == "material_animations":  # one material holds several animations
                    for a in m.get("animations", []) or []:
                        _add(items, "animation", a, name, group, {**m, "animations": [a]})
                    continue
                k = kind if group != "effects" else ("filter" if m.get("type") == "filter" else "adjust")
                _add(items, k, m, name, group, m)
        for t in mats.get("texts", []) or []:  # fonts and text styles
            if t.get("font_path") or t.get("font_resource_id") or t.get("fonts"):
                font = {k: t.get(k) for k in ("font_path", "font_id", "font_name", "font_resource_id",
                                              "font_title", "fonts", "font_source_platform") if k in t}
                _add(items, "font", {"name": t.get("font_name") or t.get("font_title") or
                                     Path(str(t.get("font_path", ""))).stem,
                                     "resource_id": t.get("font_resource_id") or t.get("font_id")},
                     name, "texts", font)
    lib["scanned"] = sorted(set(lib.get("scanned", [])) | set(scanned))
    FILE.parent.mkdir(parents=True, exist_ok=True)
    FILE.write_text(json.dumps(lib, ensure_ascii=False), encoding="utf-8")
    counts: dict[str, int] = {}
    for it in items.values():
        counts[it["kind"]] = counts.get(it["kind"], 0) + 1
    return {"scanned": scanned, "encrypted_skipped": encrypted, "totals": counts}


def _add(items: dict, kind: str, ident: dict, draft: str, group: str, material: dict) -> None:
    rid = _rid(ident)
    if not rid:
        return
    key = f"{kind}:{rid}"
    if key in items:
        items[key]["used_in"] = sorted(set(items[key]["used_in"]) | {draft})
        return
    path = material.get("path") or ident.get("path") or material.get("font_path") or ""
    items[key] = {"key": key, "kind": kind, "name": _name(ident), "resource_id": rid,
                  "vip": _vip(ident) or _vip(material), "group": group,
                  "file_available": bool(path) and Path(path).exists(),
                  "used_in": [draft], "material": material}


def list_items(kind: str | None = None, query: str | None = None, free_only: bool = False) -> list[dict]:
    out = []
    for it in load_library()["items"].values():
        if kind and it["kind"] != kind:
            continue
        if query and query.lower() not in it["name"].lower():
            continue
        if free_only and it["vip"]:
            continue
        row = {k: it[k] for k in ("key", "kind", "name", "vip", "file_available", "used_in")}
        path = str(it["material"].get("path") or "")
        if Path(path).suffix.lower() in {".png", ".gif", ".webp", ".jpg", ".jpeg"} and Path(path).exists():
            row["preview"] = path
        out.append(row)
    return sorted(out, key=lambda i: (i["kind"], i["name"]))


def _seg(data: dict, sid: str) -> dict:
    for t in data["tracks"]:
        for s in t["segments"]:
            if s["id"] == sid:
                return s
    raise KeyError(f"Segment {sid} tidak ditemukan")


def apply(draft: str, key: str, start: float | None = None, duration: float | None = None,
          segment_id: str | None = None, x: float = 0.0, y: float = 0.0, scale: float = 1.0) -> dict:
    """Apply a library element to a project.

    sticker/effect/filter/adjust -> new segment at start..start+duration (sticker uses x/y/scale)
    transition                   -> attached to the END of segment_id (between it and the next clip)
    animation                    -> attached to segment_id (clip or text)
    font                         -> applied to text segment_id
    """
    item = load_library()["items"].get(key)
    if not item:
        raise KeyError(f"Elemen {key} tidak ada di library. Jalankan capcut_library_scan dulu.")
    data = capcut.load(draft)
    mats = data["materials"]
    kind, m = item["kind"], copy.deepcopy(item["material"])
    new_id = capcut._uid()

    if kind == "font":
        if not segment_id:
            raise ValueError("Font butuh segment_id dari segmen teks")
        seg = _seg(data, segment_id)
        text_m = next(t for t in mats["texts"] if t["id"] == seg["material_id"])
        text_m.update(m)
        capcut.save(draft, data)
        return {"ok": True, "applied": key, "to": segment_id}

    m["id"] = new_id
    mats.setdefault(item["group"], []).append(m)

    if kind in ("transition", "animation"):
        if not segment_id:
            raise ValueError(f"{kind} butuh segment_id")
        seg = _seg(data, segment_id)
        seg.setdefault("extra_material_refs", []).append(new_id)
        capcut.save(draft, data)
        return {"ok": True, "applied": key, "to": segment_id}

    if start is None or duration is None:
        raise ValueError(f"{kind} butuh start dan duration (detik)")
    track_type = TRACK_FOR.get(kind, "filter")
    track = capcut._track(data, track_type, None)
    seg: dict[str, Any] = capcut._segment(new_id, start, duration, x=x, y=y, scale=scale)
    seg.pop("source_timerange")
    track["segments"].append(seg)
    track["segments"].sort(key=lambda s: s["target_timerange"]["start"])
    capcut._recalc(data)
    capcut.save(draft, data)
    return {"ok": True, "applied": key, "segment_id": seg["id"],
            "range": [start, start + duration], "duration_us": int(duration * US)}
