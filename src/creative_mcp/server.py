"""MCP server exposing Canva, CapCut and live desktop-control tools."""
from __future__ import annotations

from typing import Any

from mcp.server.fastmcp import FastMCP, Image

from . import capcut, desktop
from .canva import CanvaClient

mcp = FastMCP("creative-mcp")
_canva: CanvaClient | None = None


def canva() -> CanvaClient:
    global _canva
    if _canva is None:
        _canva = CanvaClient()
    return _canva


# ---------------------------------------------------------------- Canva ----
@mcp.tool()
async def canva_whoami() -> dict:
    """Show the connected Canva user and the plan capabilities (e.g. autofill, brand templates)."""
    return await canva().me()


@mcp.tool()
async def canva_list_designs(query: str | None = None, continuation: str | None = None) -> dict:
    """Search/list designs in the connected Canva account."""
    return await canva().list_designs(query, continuation)


@mcp.tool()
async def canva_create_design(title: str, preset: str | None = None, width: int | None = None,
                              height: int | None = None, asset_id: str | None = None) -> dict:
    """Create a design. preset: 'doc', 'whiteboard' or 'presentation'; or give width/height in px.
    Optionally insert an uploaded asset. Returns edit_url to open in the Canva editor."""
    return await canva().create_design(title, preset, width, height, asset_id)


@mcp.tool()
async def canva_get_design(design_id: str) -> dict:
    """Get design metadata including edit/view URLs and thumbnail."""
    return await canva().request("GET", f"/designs/{design_id}")


@mcp.tool()
async def canva_get_pages(design_id: str) -> dict:
    """List the pages of a design with thumbnails."""
    return await canva().request("GET", f"/designs/{design_id}/pages")


@mcp.tool()
async def canva_upload_asset(file_path: str, name: str | None = None) -> dict:
    """Upload a local image/video/audio file to the Canva media library."""
    return await canva().upload_asset(file_path, name)


@mcp.tool()
async def canva_export(design_id: str, format: str = "png", pages: list[int] | None = None) -> dict:
    """Export a design (png, jpg, pdf, mp4, gif, pptx). Returns download URLs."""
    return await canva().export(design_id, format, pages)


@mcp.tool()
async def canva_list_brand_templates(query: str | None = None) -> dict:
    """List brand templates (Canva Pro/Teams/Enterprise)."""
    return await canva().request("GET", "/brand-templates", params={"query": query} if query else None)


@mcp.tool()
async def canva_brand_template_fields(brand_template_id: str) -> dict:
    """Show the autofillable fields (text/image/chart) of a brand template."""
    return await canva().request("GET", f"/brand-templates/{brand_template_id}/dataset")


@mcp.tool()
async def canva_autofill(brand_template_id: str, data: dict[str, Any], title: str | None = None) -> dict:
    """Generate a new design from a brand template. data example:
    {"headline": {"type": "text", "text": "Promo"}, "photo": {"type": "image", "asset_id": "..."}}"""
    return await canva().autofill(brand_template_id, data, title)


@mcp.tool()
async def canva_list_folder(folder_id: str = "root") -> dict:
    """List items in a Canva folder ('root' for the top level)."""
    return await canva().request("GET", f"/folders/{folder_id}/items")


# --------------------------------------------------------------- CapCut ----
@mcp.tool()
def capcut_list_drafts() -> list[dict]:
    """List CapCut desktop projects (drafts), newest first."""
    return capcut.list_drafts()


@mcp.tool()
def capcut_create_draft(name: str, width: int = 1080, height: int = 1920, fps: float = 30.0,
                        template: str | None = None) -> dict:
    """Create a new CapCut project. Pass template=<existing draft name> to clone its file format."""
    return capcut.create_draft(name, width, height, fps, template)


@mcp.tool()
def capcut_get_timeline(name: str) -> dict:
    """Read the tracks and segments (with ids, times in seconds and transforms) of a draft."""
    return capcut.timeline(name)


@mcp.tool()
def capcut_add_media(name: str, file_path: str, start: float, duration: float,
                     kind: str = "video", source_start: float = 0.0, track_index: int | None = None,
                     x: float = 0.0, y: float = 0.0, scale: float = 1.0, volume: float = 1.0) -> dict:
    """Place a video/photo/audio file on the timeline. kind: video|photo|audio.
    x/y: -1..1 canvas position. track_index: existing track of that type, or new track."""
    return capcut.add_media(name, file_path, start, duration, kind, source_start, track_index,
                            x=x, y=y, scale=scale, volume=volume)


@mcp.tool()
def capcut_add_text(name: str, text: str, start: float, duration: float, font_size: float = 8.0,
                    color: str = "#FFFFFF", x: float = 0.0, y: float = 0.0) -> dict:
    """Add a text/caption segment."""
    return capcut.add_text(name, text, start, duration, font_size, color, x, y)


@mcp.tool()
def capcut_update_segment(name: str, segment_id: str, start: float | None = None,
                          duration: float | None = None, x: float | None = None,
                          y: float | None = None, scale: float | None = None,
                          rotation: float | None = None, alpha: float | None = None,
                          volume: float | None = None) -> dict:
    """Move, trim or transform a segment on the timeline."""
    clip = {k: v for k, v in dict(x=x, y=y, scale=scale, rotation=rotation, alpha=alpha,
                                  volume=volume).items() if v is not None}
    return capcut.update_segment(name, segment_id, start, duration, **clip)


@mcp.tool()
def capcut_delete_segment(name: str, segment_id: str) -> dict:
    """Remove a segment from the timeline."""
    return capcut.delete_segment(name, segment_id)


# ------------------------------------------------- Live desktop control ----
@mcp.tool()
def desktop_screenshot(max_width: int = 1600) -> list:
    """Take a screenshot of your screen (to see the CapCut/Canva editor). Coordinates for the
    other desktop tools are in real screen pixels: divide image coordinates by 'scale'."""
    png, info = desktop.screenshot(max_width)
    return [Image(data=png, format="png"), info]


@mcp.tool()
def desktop_click(x: int, y: int, button: str = "left", clicks: int = 1) -> str:
    """Click at screen coordinates."""
    return desktop.click(x, y, button, clicks)


@mcp.tool()
def desktop_drag(x1: int, y1: int, x2: int, y2: int, duration: float = 0.6) -> str:
    """Drag and drop from (x1,y1) to (x2,y2) - e.g. an element/clip onto the canvas or timeline."""
    return desktop.drag(x1, y1, x2, y2, duration)


@mcp.tool()
def desktop_type(text: str) -> str:
    """Type text into the focused field."""
    return desktop.type_text(text)


@mcp.tool()
def desktop_hotkey(keys: list[str]) -> str:
    """Press a key combination, e.g. ["ctrl","z"] or ["space"]."""
    return desktop.hotkey(keys)


@mcp.tool()
def desktop_scroll(amount: int, x: int | None = None, y: int | None = None) -> str:
    """Scroll (positive = up)."""
    return desktop.scroll(amount, x, y)


def main() -> None:
    mcp.run()


if __name__ == "__main__":
    main()
