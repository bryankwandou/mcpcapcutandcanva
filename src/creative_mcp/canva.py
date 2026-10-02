"""Thin async client for the official Canva Connect REST API.

Only official endpoints are used, so what you can access (premium elements,
brand templates, autofill) follows the plan of the authenticated Canva account.
"""
from __future__ import annotations

import asyncio
import base64
import json
import os
from pathlib import Path
from typing import Any

import httpx

API = "https://api.canva.com/rest/v1"


class CanvaError(RuntimeError):
    pass


class CanvaClient:
    def __init__(self) -> None:
        self.access_token = os.getenv("CANVA_ACCESS_TOKEN", "")
        self.refresh_token = os.getenv("CANVA_REFRESH_TOKEN", "")
        self.client_id = os.getenv("CANVA_CLIENT_ID", "")
        self.client_secret = os.getenv("CANVA_CLIENT_SECRET", "")
        self.http = httpx.AsyncClient(timeout=60)

    async def _refresh(self) -> None:
        if not (self.refresh_token and self.client_id and self.client_secret):
            raise CanvaError("Access token expired and no refresh credentials are configured.")
        basic = base64.b64encode(f"{self.client_id}:{self.client_secret}".encode()).decode()
        r = await self.http.post(
            f"{API}/oauth/token",
            headers={"Authorization": f"Basic {basic}"},
            data={"grant_type": "refresh_token", "refresh_token": self.refresh_token},
        )
        if r.status_code >= 400:
            raise CanvaError(f"Token refresh failed: {r.text}")
        body = r.json()
        self.access_token = body["access_token"]
        self.refresh_token = body.get("refresh_token", self.refresh_token)
        from .oauth import save_tokens  # refresh tokens are single-use: persist the new one
        save_tokens(self.access_token, self.refresh_token)

    async def request(self, method: str, path: str, **kw: Any) -> Any:
        if method != "GET":  # writes may add designs/assets: drop cached listings
            from . import cache
            cache.clear("canva:designs")
        if not self.access_token:
            await self._refresh()
        for attempt in range(2):
            headers = {"Authorization": f"Bearer {self.access_token}", **kw.pop("headers", {})}
            r = await self.http.request(method, f"{API}{path}", headers=headers, **kw)
            if r.status_code == 401 and attempt == 0 and self.refresh_token:
                await self._refresh()
                kw["headers"] = {k: v for k, v in headers.items() if k != "Authorization"}
                continue
            if r.status_code >= 400:
                try:
                    err = r.json()
                    msg = f"{err.get('code')}: {err.get('message')}"
                except ValueError:
                    msg = r.text
                raise CanvaError(f"{method} {path} -> HTTP {r.status_code} {msg}")
            return r.json() if r.content else {}
        raise CanvaError("unreachable")

    async def poll_job(self, path: str, key: str, timeout: float = 120) -> dict:
        """Poll an async Canva job with exponential backoff (as recommended by Canva)."""
        loop = asyncio.get_event_loop()
        deadline = loop.time() + timeout
        delay = 0.5
        while True:
            job = (await self.request("GET", path))[key]
            if job.get("status") in ("success", "failed") or loop.time() > deadline:
                return job
            await asyncio.sleep(delay)
            delay = min(delay * 2, 8)

    async def run_job(self, create_path: str, get_prefix: str, timeout: float = 120,
                      **kw: Any) -> dict:
        """Create an async job, poll it, and keep any trial_information (free-plan trial quota)."""
        created = await self.request("POST", create_path, **kw)
        job = await self.poll_job(f"{get_prefix}/{created['job']['id']}", "job", timeout)
        out = {"job": job}
        if "trial_information" in created:
            out["trial_information"] = created["trial_information"]
        return out

    # --- high level helpers -------------------------------------------------
    async def me(self) -> dict:
        profile = await self.request("GET", "/users/me/profile")
        caps = await self.request("GET", "/users/me/capabilities")
        return {"profile": profile, "capabilities": caps}

    async def list_designs(self, query: str | None, continuation: str | None) -> dict:
        params = {k: v for k, v in {"query": query, "continuation": continuation}.items() if v}
        return await self.request("GET", "/designs", params=params)

    async def create_design(self, title: str, preset: str | None, width: int | None,
                            height: int | None, asset_id: str | None) -> dict:
        if preset:
            design_type = {"type": "preset", "name": preset}
        else:
            design_type = {"type": "custom", "width": width or 1080, "height": height or 1080}
        body: dict[str, Any] = {"design_type": design_type, "title": title}
        if asset_id:
            body["asset_id"] = asset_id
        return await self.request("POST", "/designs", json=body)

    async def export(self, design_id: str, fmt: str, pages: list[int] | None) -> dict:
        f: dict[str, Any] = {"type": fmt}
        if pages:
            f["pages"] = pages
        return await self.run_job("/exports", "/exports",
                                  json={"design_id": design_id, "format": f})

    async def upload_asset(self, file_path: str, name: str | None) -> dict:
        p = Path(file_path).expanduser()
        meta = {"name_base64": base64.b64encode((name or p.name).encode()).decode()}
        return await self.run_job(
            "/asset-uploads", "/asset-uploads", content=p.read_bytes(),
            headers={"Content-Type": "application/octet-stream",
                     "Asset-Upload-Metadata": json.dumps(meta)})

    async def autofill(self, brand_template_id: str, data: dict, title: str | None) -> dict:
        body: dict[str, Any] = {"brand_template_id": brand_template_id, "data": data}
        if title:
            body["title"] = title
        return await self.run_job("/autofills", "/autofills", json=body)

    async def resize(self, design_id: str, preset: str | None, width: int | None,
                     height: int | None) -> dict:
        design_type = ({"type": "preset", "name": preset} if preset else
                       {"type": "custom", "width": width or 1080, "height": height or 1080})
        return await self.run_job("/resizes", "/resizes",
                                  json={"design_id": design_id, "design_type": design_type})

    async def import_file(self, file_path: str, title: str | None) -> dict:
        """Import a PDF/PPTX/AI/PSD/etc. file as a new editable Canva design."""
        p = Path(file_path).expanduser()
        meta = {"title_base64": base64.b64encode((title or p.stem).encode()).decode()}
        return await self.run_job(
            "/imports", "/imports", content=p.read_bytes(), timeout=300,
            headers={"Content-Type": "application/octet-stream",
                     "Import-Metadata": json.dumps(meta)})

    async def import_url(self, url: str, title: str, mime_type: str | None) -> dict:
        body = {"url": url, "title": title}
        if mime_type:
            body["mime_type"] = mime_type
        return await self.run_job("/url-imports", "/url-imports", json=body, timeout=300)
