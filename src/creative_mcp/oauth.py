"""`creative-mcp login`: Canva OAuth (authorization code + PKCE) in your browser.

Opens the Canva consent page, catches the redirect on a local port, exchanges
the code for tokens and writes them to `.env` in the current directory.
"""
from __future__ import annotations

import base64
import hashlib
import http.server
import os
import secrets
import urllib.parse
import webbrowser
from pathlib import Path

import httpx

AUTHORIZE = "https://www.canva.com/api/oauth/authorize"
TOKEN = "https://api.canva.com/rest/v1/oauth/token"
SCOPES = ("design:content:read design:content:write design:meta:read asset:read asset:write "
          "brandtemplate:meta:read brandtemplate:content:read folder:read profile:read")


def _load_env(path: Path) -> dict[str, str]:
    env: dict[str, str] = {}
    if path.exists():
        for line in path.read_text().splitlines():
            if "=" in line and not line.lstrip().startswith("#"):
                k, v = line.split("=", 1)
                env[k.strip()] = v.strip()
    return env


def save_tokens(access: str, refresh: str, path: Path = Path(".env")) -> None:
    """Persist tokens; Canva refresh tokens are single-use so the new one must be kept."""
    env = _load_env(path)
    env.update(CANVA_ACCESS_TOKEN=access, CANVA_REFRESH_TOKEN=refresh)
    path.write_text("".join(f"{k}={v}\n" for k, v in env.items()))


def load_dotenv(path: Path = Path(".env")) -> None:
    for k, v in _load_env(path).items():
        os.environ.setdefault(k, v)


def login() -> None:
    env_file = Path(".env")
    env = _load_env(env_file)
    client_id = os.getenv("CANVA_CLIENT_ID") or env.get("CANVA_CLIENT_ID") or input("Canva Client ID: ").strip()
    client_secret = (os.getenv("CANVA_CLIENT_SECRET") or env.get("CANVA_CLIENT_SECRET")
                     or input("Canva Client Secret: ").strip())
    redirect = os.getenv("CANVA_REDIRECT_URI", "http://127.0.0.1:3001/oauth/redirect")
    port = urllib.parse.urlparse(redirect).port or 3001

    verifier = secrets.token_urlsafe(96)[:128]  # 43-128 chars, URL-safe
    challenge = base64.urlsafe_b64encode(hashlib.sha256(verifier.encode()).digest()).rstrip(b"=").decode()
    state = secrets.token_urlsafe(16)
    url = AUTHORIZE + "?" + urllib.parse.urlencode({
        "code_challenge": challenge, "code_challenge_method": "S256", "scope": SCOPES,
        "response_type": "code", "client_id": client_id, "state": state, "redirect_uri": redirect})

    result: dict[str, str] = {}

    class Handler(http.server.BaseHTTPRequestHandler):
        def do_GET(self):  # noqa: N802
            q = dict(urllib.parse.parse_qsl(urllib.parse.urlparse(self.path).query))
            result.update(q)
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.end_headers()
            ok = "code" in q and q.get("state") == state
            self.wfile.write(("<h2>Login Canva berhasil, silakan tutup tab ini.</h2>" if ok else
                              f"<h2>Login gagal: {q.get('error', 'state mismatch')}</h2>").encode())

        def log_message(self, *a):
            pass

    server = http.server.HTTPServer(("127.0.0.1", port), Handler)
    print(f"Membuka browser...\nJika tidak terbuka, buka link ini:\n{url}\n")
    webbrowser.open(url)
    while "code" not in result and "error" not in result:
        server.handle_request()
    server.server_close()
    if "error" in result or result.get("state") != state:
        raise SystemExit(f"Login gagal: {result}")

    basic = base64.b64encode(f"{client_id}:{client_secret}".encode()).decode()
    r = httpx.post(TOKEN, headers={"Authorization": f"Basic {basic}"}, data={
        "grant_type": "authorization_code", "code_verifier": verifier,
        "code": result["code"], "redirect_uri": redirect})
    if r.status_code >= 400:
        raise SystemExit(f"Gagal menukar token: {r.text}")
    tok = r.json()
    env.update(CANVA_CLIENT_ID=client_id, CANVA_CLIENT_SECRET=client_secret,
               CANVA_ACCESS_TOKEN=tok["access_token"], CANVA_REFRESH_TOKEN=tok.get("refresh_token", ""))
    env_file.write_text("".join(f"{k}={v}\n" for k, v in env.items()))
    print(f"Token tersimpan di {env_file.resolve()}")
