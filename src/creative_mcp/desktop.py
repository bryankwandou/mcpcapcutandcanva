"""Live desktop control (screenshot, click, drag & drop, typing).

This lets the AI operate the real CapCut / Canva window on your computer, the
same way you would with a mouse, so it works with every element your own
account has access to. Disabled unless ENABLE_DESKTOP_CONTROL=1.
Move the mouse to a screen corner to trigger pyautogui's fail-safe abort.
"""
from __future__ import annotations

import base64
import io
import os


def enabled() -> bool:
    return os.getenv("ENABLE_DESKTOP_CONTROL") == "1"


def _gui():
    if not enabled():
        raise PermissionError("Desktop control is disabled. Set ENABLE_DESKTOP_CONTROL=1.")
    import pyautogui  # imported lazily: needs a display

    pyautogui.FAILSAFE = True
    pyautogui.PAUSE = 0.05
    return pyautogui


def screenshot(max_width: int = 1600) -> tuple[bytes, dict]:
    g = _gui()
    img = g.screenshot()
    w, h = img.size
    scale = min(1.0, max_width / w)
    if scale < 1:
        img = img.resize((int(w * scale), int(h * scale)))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue(), {"screen": [w, h], "image": list(img.size), "scale": scale}


def click(x: int, y: int, button: str = "left", clicks: int = 1) -> str:
    _gui().click(x, y, clicks=clicks, button=button)
    return f"clicked {button} x{clicks} at ({x},{y})"


def drag(x1: int, y1: int, x2: int, y2: int, duration: float = 0.6) -> str:
    g = _gui()
    g.moveTo(x1, y1)
    g.mouseDown()
    g.moveTo(x2, y2, duration=duration)
    g.mouseUp()
    return f"dragged ({x1},{y1}) -> ({x2},{y2})"


def type_text(text: str) -> str:
    _gui().write(text, interval=0.01)
    return f"typed {len(text)} chars"


def hotkey(keys: list[str]) -> str:
    _gui().hotkey(*keys)
    return "pressed " + "+".join(keys)


def scroll(amount: int, x: int | None = None, y: int | None = None) -> str:
    _gui().scroll(amount, x=x, y=y)
    return f"scrolled {amount}"


def b64(png: bytes) -> str:
    return base64.b64encode(png).decode()
