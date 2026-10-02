"""Small on-disk TTL cache so menus/catalogs are fetched once and reused."""
from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Any, Awaitable, Callable

HOME = Path.home() / ".creative-mcp"
FILE = HOME / "cache.json"


def _read() -> dict:
    try:
        return json.loads(FILE.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {}


def _write(data: dict) -> None:
    HOME.mkdir(parents=True, exist_ok=True)
    FILE.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")


def get(key: str, ttl: float) -> Any | None:
    e = _read().get(key)
    if e and time.time() - e["t"] < ttl:
        return e["v"]
    return None


def put(key: str, value: Any) -> Any:
    data = _read()
    data[key] = {"t": time.time(), "v": value}
    _write(data)
    return value


def clear(prefix: str = "") -> int:
    data = _read()
    keys = [k for k in data if k.startswith(prefix)]
    for k in keys:
        del data[k]
    _write(data)
    return len(keys)


async def cached(key: str, ttl: float, fn: Callable[[], Awaitable[Any]], refresh: bool = False) -> Any:
    if not refresh:
        hit = get(key, ttl)
        if hit is not None:
            return hit
    return put(key, await fn())
