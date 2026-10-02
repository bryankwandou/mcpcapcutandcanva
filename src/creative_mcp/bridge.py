"""Local bridge between the web editor (Vercel or local) and CapCut drafts on this PC.

Runs on 127.0.0.1 only and every API call needs the random token printed in the
editor link, so other websites cannot read or change your projects.

Edits are kept as a *pending scene* (~/.creative-mcp/scenes/<draft>.json) while
you preview; nothing touches the CapCut draft until /api/deploy is called.
"""
from __future__ import annotations

import json
import mimetypes
import os
import re
import secrets
import threading
import urllib.parse
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from . import cache, capcut, scene

HOME = cache.HOME
SCENES = HOME / "scenes"
EDITOR_DIR = Path(__file__).resolve().parent / "editor"
MEDIA_EXT = {".mp4", ".mov", ".m4v", ".webm", ".mkv", ".jpg", ".jpeg", ".png", ".gif", ".webp",
             ".mp3", ".wav", ".m4a", ".aac", ".ogg"}

_server: ThreadingHTTPServer | None = None
_lock = threading.Lock()


def token() -> str:
    f = HOME / "bridge.json"
    try:
        return json.loads(f.read_text())["token"]
    except (OSError, ValueError, KeyError):
        HOME.mkdir(parents=True, exist_ok=True)
        t = secrets.token_urlsafe(24)
        f.write_text(json.dumps({"token": t}))
        return t


def port() -> int:
    return int(os.getenv("CREATIVE_BRIDGE_PORT", "8765"))


def _safe(name: str) -> str:
    return re.sub(r"[^\w\- .]", "_", name)


def _scene_file(draft: str) -> Path:
    return SCENES / f"{_safe(draft)}.json"


def get_scene(draft: str) -> dict:
    f = _scene_file(draft)
    if f.exists():
        return json.loads(f.read_text(encoding="utf-8"))
    s = scene.from_draft(draft)
    s["version"] = 0
    return s


def put_scene(s: dict) -> dict:
    with _lock:
        SCENES.mkdir(parents=True, exist_ok=True)
        cur = _scene_file(s["draft"])
        old_v = json.loads(cur.read_text(encoding="utf-8")).get("version", 0) if cur.exists() else 0
        s["version"] = old_v + 1
        cur.write_text(json.dumps(s, ensure_ascii=False), encoding="utf-8")
    return {"version": s["version"]}


def deploy(draft: str) -> dict:
    res = scene.apply_to_draft(get_scene(draft))
    _scene_file(draft).unlink(missing_ok=True)
    cache.clear("capcut:")
    return res


def discard(draft: str) -> dict:
    _scene_file(draft).unlink(missing_ok=True)
    return {"ok": True}


def media_dirs() -> list[Path]:
    env = os.getenv("CREATIVE_MEDIA_DIRS")
    if env:
        return [Path(p).expanduser() for p in env.split(os.pathsep) if p]
    h = Path.home()
    return [h / d for d in ("Videos", "Movies", "Pictures", "Music", "Downloads", "Desktop")]


def library(refresh: bool = False) -> list[dict]:
    if not refresh:
        hit = cache.get("library", 600)
        if hit is not None:
            return hit
    items = []
    for root in media_dirs():
        if not root.exists():
            continue
        for p in root.rglob("*"):
            if len(items) >= 2000:
                break
            if p.suffix.lower() in MEDIA_EXT and len(p.relative_to(root).parts) <= 3:
                kind = mimetypes.guess_type(p.name)[0] or ""
                items.append({"path": str(p), "name": p.name,
                              "type": "video" if kind.startswith("video") else
                              "audio" if kind.startswith("audio") else "photo"})
    return cache.put("library", items)


def _allowed_media(path: str) -> bool:
    p = Path(path).resolve()
    if p.suffix.lower() not in MEDIA_EXT:
        return False
    roots = [d.resolve() for d in media_dirs()] + [capcut.drafts_dir().resolve()]
    if any(p.is_relative_to(r) for r in roots):
        return True
    for f in SCENES.glob("*.json"):  # files already used in a project
        if path in f.read_text(encoding="utf-8"):
            return True
    try:
        return any(path in json.dumps(capcut.load(d["name"])) for d in capcut.list_drafts())
    except Exception:
        return False


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, X-Bridge-Token, Range")
        self.send_header("Access-Control-Allow-Methods", "GET, PUT, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Private-Network", "true")

    def _json(self, obj, code=200):
        body = json.dumps(obj, ensure_ascii=False).encode()
        self.send_response(code)
        self._cors()
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):  # noqa: N802
        self.send_response(204)
        self._cors()
        self.end_headers()

    def _q(self):
        u = urllib.parse.urlparse(self.path)
        return u.path, dict(urllib.parse.parse_qsl(u.query))

    def _authed(self, q) -> bool:
        t = self.headers.get("X-Bridge-Token") or q.get("token", "")
        return secrets.compare_digest(t, token())

    def do_GET(self):  # noqa: N802
        path, q = self._q()
        if path in ("/", "/index.html"):
            return self._file(EDITOR_DIR / "index.html")
        if not self._authed(q):
            return self._json({"error": "bad token"}, 401)
        try:
            if path == "/api/drafts":
                return self._json(capcut.list_drafts())
            if path == "/api/scene":
                return self._json(get_scene(q["draft"]))
            if path == "/api/version":
                f = _scene_file(q["draft"])
                v = json.loads(f.read_text(encoding="utf-8")).get("version", 0) if f.exists() else 0
                return self._json({"version": v})
            if path == "/api/library":
                return self._json(library(q.get("refresh") == "1"))
            if path == "/media":
                if not _allowed_media(q.get("path", "")):
                    return self._json({"error": "not allowed"}, 403)
                return self._file(Path(q["path"]))
            self._json({"error": "not found"}, 404)
        except Exception as e:  # report to the editor instead of crashing
            self._json({"error": str(e)}, 500)

    def _body(self):
        n = int(self.headers.get("Content-Length", 0))
        return json.loads(self.rfile.read(n) or b"{}")

    def do_PUT(self):  # noqa: N802
        path, q = self._q()
        if not self._authed(q):
            return self._json({"error": "bad token"}, 401)
        if path == "/api/scene":
            return self._json(put_scene(self._body()))
        self._json({"error": "not found"}, 404)

    def do_POST(self):  # noqa: N802
        path, q = self._q()
        if not self._authed(q):
            return self._json({"error": "bad token"}, 401)
        try:
            if path == "/api/deploy":
                return self._json(deploy(q["draft"]))
            if path == "/api/discard":
                return self._json(discard(q["draft"]))
            self._json({"error": "not found"}, 404)
        except Exception as e:
            self._json({"error": str(e)}, 500)

    def _file(self, p: Path):
        if not p.exists():
            return self._json({"error": "missing file"}, 404)
        size = p.stat().st_size
        ctype = mimetypes.guess_type(p.name)[0] or "application/octet-stream"
        start, end = 0, size - 1
        rng = self.headers.get("Range")
        m = re.match(r"bytes=(\d*)-(\d*)", rng or "")
        if m and size:
            start = int(m.group(1) or 0)
            end = min(int(m.group(2)) if m.group(2) else size - 1, size - 1)
            self.send_response(206)
            self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
        else:
            self.send_response(200)
        self._cors()
        self.send_header("Content-Type", ctype)
        self.send_header("Accept-Ranges", "bytes")
        self.send_header("Content-Length", str(end - start + 1 if size else 0))
        self.end_headers()
        with p.open("rb") as f:
            f.seek(start)
            left = end - start + 1
            while left > 0:
                chunk = f.read(min(1 << 16, left))
                if not chunk:
                    break
                try:
                    self.wfile.write(chunk)
                except (BrokenPipeError, ConnectionResetError):
                    return
                left -= len(chunk)


def start() -> str:
    """Start the bridge once (idempotent); returns its base URL."""
    global _server
    if _server is None:
        _server = ThreadingHTTPServer(("127.0.0.1", port()), Handler)
        threading.Thread(target=_server.serve_forever, daemon=True).start()
    return f"http://127.0.0.1:{port()}"


def editor_url(draft: str) -> dict:
    base = start()
    frag = urllib.parse.urlencode({"bridge": base, "token": token(), "draft": draft})
    out = {"local": f"{base}/#{frag}"}
    hosted = os.getenv("CREATIVE_EDITOR_URL")  # e.g. https://my-editor.vercel.app
    if hosted:
        out["vercel"] = f"{hosted.rstrip('/')}/#{frag}"
    return out
