"""MCP server exposing Canva, CapCut and live desktop-control tools."""
from __future__ import annotations

from typing import Any

from mcp.server.fastmcp import FastMCP, Image

from . import bridge, cache, capcut, capcut_library, desktop, templates
from .canva import CanvaClient
from .oauth import load_dotenv

load_dotenv()

mcp = FastMCP("creative-mcp")
_canva: CanvaClient | None = None


def canva() -> CanvaClient:
    global _canva
    if _canva is None:
        _canva = CanvaClient()
    return _canva


# -------------------------------------------------------------- Catalog ----
async def _canva_catalog(refresh: bool) -> dict:
    c = canva()
    out: dict[str, Any] = {}
    try:
        me = await cache.cached("canva:me", 86400, c.me, refresh)
        caps = set(me.get("capabilities", {}).get("capabilities", []))
        out["user"] = me.get("profile", {}).get("profile", {}).get("display_name")
        out["capabilities"] = sorted(caps)
        out["usable_tools"] = {
            "always": ["canva_list_designs", "canva_create_design", "canva_get_design", "canva_get_pages",
                       "canva_upload_asset", "canva_export", "canva_import_file", "canva_import_url",
                       "canva_list_folder"],
            "needs_paid_plan": {"canva_autofill / brand templates": "autofill" in caps,
                                "canva_resize": "resize" in caps or "trial quota (check trial_information)"},
        }
        designs = await cache.cached("canva:designs", 600, lambda: c.list_designs(None, None), refresh)
        out["recent_designs"] = [{"id": d["id"], "title": d.get("title"), "edit_url": d.get("urls", {}).get("edit_url")}
                                 for d in designs.get("items", [])[:20]]
        if "autofill" in caps:
            bt = await cache.cached("canva:brand_templates", 3600,
                                    lambda: c.request("GET", "/brand-templates"), refresh)
            out["brand_templates"] = [{"id": t["id"], "title": t.get("title")} for t in bt.get("items", [])]
    except Exception as e:
        out["error"] = str(e)
    return out


@mcp.tool()
async def catalog(refresh: bool = False) -> dict:
    """ONE call that shows everything usable right now: Canva account capabilities (what your plan
    allows), recent designs, brand templates, CapCut projects and local media. Results are cached
    (Canva profile 24h, designs 10m, media 10m) - pass refresh=True to re-fetch."""
    out: dict[str, Any] = {"canva": await _canva_catalog(refresh)}
    try:
        out["capcut_projects"] = capcut.list_drafts()
    except Exception as e:
        out["capcut_projects"] = {"error": str(e)}
    lib = bridge.library(refresh)
    out["local_media"] = {"count": len(lib), "sample": lib[:30]}
    return out


@mcp.tool()
def cache_clear(prefix: str = "") -> dict:
    """Clear cached data ('' = everything, 'canva:' = only Canva)."""
    return {"cleared": cache.clear(prefix)}


# ---------------------------------------------------------- Live editor ----
@mcp.tool()
def editor_open(draft: str) -> dict:
    """Start the live web editor for a CapCut project and return its link. In the editor every
    element can be dragged on the canvas (position, scale, rotate) and on the timeline (move, trim,
    change track). Changes stay a preview until editor_deploy (or the Deploy button)."""
    return bridge.editor_url(draft)


@mcp.tool()
def studio_open() -> dict:
    """Start the bridge and return the Creative Studio dashboard link (designs, video projects,
    templates, CapCut library, Canva)."""
    return bridge.studio_url()


@mcp.tool()
def editor_get_scene(draft: str) -> dict:
    """Read the current preview scene (including unsaved/undeployed edits)."""
    return bridge.get_scene(draft)


@mcp.tool()
def editor_update_elements(draft: str, updates: list[dict[str, Any]]) -> dict:
    """Edit elements live; the open editor refreshes within a second. Each update is
    {"id": <element id>, ...fields} with fields among start, duration, x, y, scale, rotation,
    alpha, volume, text, color, font_size, track. Use {"id": ..., "delete": true} to remove,
    or {"new": {"type": "text"|"video"|"photo"|"audio", "src"?, "text"?, "start", "duration", ...}} to add."""
    s = bridge.get_scene(draft)
    by_id = {e["id"]: e for e in s["elements"]}
    for u in updates:
        if "new" in u:
            el = {"id": capcut._uid(), "x": 0.0, "y": 0.0, "scale": 1.0, "rotation": 0.0, "alpha": 1.0,
                  "volume": 1.0, **u["new"]}
            kind = "video" if el["type"] == "photo" else el["type"]
            tk = next((t for t in s["tracks"] if t["type"] == kind), None)
            if tk is None:
                tk = {"id": capcut._uid(), "type": kind}
                s["tracks"].append(tk)
            el.setdefault("track", tk["id"])
            s["elements"].append(el)
        elif u.get("delete"):
            s["elements"] = [e for e in s["elements"] if e["id"] != u["id"]]
        else:
            by_id[u["id"]].update({k: v for k, v in u.items() if k != "id"})
    return bridge.put_scene(s)


@mcp.tool()
def editor_deploy(draft: str) -> dict:
    """Write the previewed edits into the CapCut project (backup kept as .json.bak).
    Close the project in CapCut first, reopen it afterwards."""
    return bridge.deploy(draft)


@mcp.tool()
def editor_discard(draft: str) -> dict:
    """Throw away the preview edits and go back to the CapCut project as saved."""
    return bridge.discard(draft)


# ------------------------------------------------------ CapCut library ----
@mcp.tool()
def capcut_library_scan(drafts: list[str] | None = None) -> dict:
    """Scan your CapCut projects (all by default) and collect every sticker, effect, filter,
    adjustment, transition, animation and font you have used into a personal library."""
    return capcut_library.scan(drafts)


@mcp.tool()
def capcut_library_list(kind: str | None = None, query: str | None = None,
                        free_only: bool = False) -> list[dict]:
    """List library elements. kind: sticker|effect|filter|adjust|transition|animation|font.
    vip=True means CapCut marked it as paid; free_only hides those."""
    return capcut_library.list_items(kind, query, free_only)


@mcp.tool()
def capcut_library_apply(draft: str, key: str, start: float | None = None,
                         duration: float | None = None, segment_id: str | None = None,
                         x: float = 0.0, y: float = 0.0, scale: float = 1.0) -> dict:
    """Apply a library element to a project. sticker/effect/filter/adjust need start+duration
    (sticker also x/y/scale); transition/animation/font need segment_id (transition goes after
    that clip; font needs a text segment). Close the project in CapCut first."""
    bridge.discard(draft)  # the draft changed: drop any stale editor preview
    return capcut_library.apply(draft, key, start, duration, segment_id, x, y, scale)


# ------------------------------------------------------------ Templates ----
@mcp.tool()
def template_list() -> dict:
    """List the built-in ORIGINAL templates (CapCut + Canva) and color palettes."""
    return templates.list_templates()


@mcp.tool()
def capcut_make_from_template(template: str, name: str, media: list[str], title: str = "",
                              captions: list[str] | None = None, cta: str = "",
                              music: str | None = None, palette: str = "bold",
                              clip_seconds: float = 2.5, base_draft: str | None = None,
                              style: dict[str, str] | None = None) -> dict:
    """Build a complete CapCut project from your own media and text using an original template
    (promo | slideshow | quotes | youtube_intro). Returns the draft plus an editor link to fine-tune.
    base_draft: optional existing project to clone the file format from (recommended).
    style: optional library keys from capcut_library_list, e.g. {"transition": "transition:123",
    "filter": "...", "font": "...", "text_animation": "...", "clip_animation": "...",
    "sticker": "...", "effect": "..."}."""
    res = templates.build_capcut(template, name, media, title, captions, cta, music, palette,
                                 clip_seconds, base_draft, style)
    res["editor"] = bridge.editor_url(name)
    return res


@mcp.tool()
async def canva_make_from_template(template: str, title: str, subtitle: str = "",
                                   body: list[str] | None = None, images: list[str] | None = None,
                                   cta: str = "", palette: str = "bold", font: str = "Montserrat",
                                   out_path: str = "~/creative-mcp-designs",
                                   import_to_canva: bool = True) -> dict:
    """Generate a full original design (instagram_post | story | youtube_thumbnail | presentation)
    with separate, editable elements, and import it into Canva as a normal editable design.
    For presentation, body items become slides ("Judul: detail")."""
    path = templates.build_pptx(template, out_path, title, subtitle, body, images, cta, palette, font)
    out: dict[str, Any] = {"pptx": path}
    if import_to_canva:
        out["canva"] = await canva().import_file(path, title)
    return out


# ---------------------------------------------------------------- Canva ----
@mcp.tool()
async def canva_whoami() -> dict:
    """Show the connected Canva user and the plan capabilities (e.g. autofill, brand templates)."""
    return await canva().me()


@mcp.tool()
async def canva_list_designs(query: str | None = None, continuation: str | None = None,
                             refresh: bool = False) -> dict:
    """Search/list designs in the connected Canva account (cached 10 minutes)."""
    key = f"canva:designs:{query}:{continuation}"
    return await cache.cached(key, 600, lambda: canva().list_designs(query, continuation), refresh)


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
    return await cache.cached(f"canva:brand_templates:{query}", 3600, lambda: canva().request(
        "GET", "/brand-templates", params={"query": query} if query else None))


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
async def canva_resize(design_id: str, preset: str | None = None, width: int | None = None,
                       height: int | None = None) -> dict:
    """Copy a design into a new size (premium; free plans get a small trial quota,
    reported in trial_information)."""
    return await canva().resize(design_id, preset, width, height)


@mcp.tool()
async def canva_import_file(file_path: str, title: str | None = None) -> dict:
    """Import a local PDF/PPTX/AI/PSD/Keynote file as a new editable Canva design."""
    return await canva().import_file(file_path, title)


@mcp.tool()
async def canva_import_url(url: str, title: str, mime_type: str | None = None) -> dict:
    """Import a file from a public URL as a new editable Canva design."""
    return await canva().import_url(url, title, mime_type)


@mcp.tool()
async def canva_list_folder(folder_id: str = "root") -> dict:
    """List items in a Canva folder ('root' for the top level)."""
    return await canva().request("GET", f"/folders/{folder_id}/items")


# --------------------------------------------------------------- CapCut ----
@mcp.tool()
def capcut_list_drafts() -> list[dict]:
    """List CapCut desktop projects (drafts), newest first."""
    return capcut.list_drafts()  # cheap local scan, always fresh


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
async def canva_open_editor(design_id: str) -> dict:
    """Open a Canva design in the browser on this computer, ready for desktop_* control.
    Workflow to use ANY element your account has (free or paid plan): desktop_screenshot ->
    click 'Elements' in the left panel -> desktop_type the search term -> desktop_drag the
    result onto the page -> desktop_screenshot to verify. Elements marked with a crown are Pro."""
    import webbrowser

    d = await canva().request("GET", f"/designs/{design_id}")
    url = d["design"]["urls"]["edit_url"]
    webbrowser.open(url)
    return {"opened": url, "next": "desktop_screenshot"}


@mcp.tool()
def desktop_open_url(url: str) -> str:
    """Open a URL in the default browser on this computer (e.g. a Canva or CapCut web editor)."""
    import webbrowser

    if not url.startswith(("https://", "http://127.0.0.1", "http://localhost")):
        raise ValueError("Hanya URL https atau localhost")
    webbrowser.open(url)
    return f"opened {url}"


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
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == "login":
        from .oauth import login
        login()
        return
    if len(sys.argv) > 1 and sys.argv[1] in ("editor", "studio"):
        import time
        args = [a for a in sys.argv[2:] if not a.startswith("--")]
        urls = bridge.editor_url(args[0]) if args else bridge.studio_url()
        for k, v in urls.items():
            print(f"{k}: {v}")
        if "--no-open" not in sys.argv:
            import webbrowser
            webbrowser.open(urls.get("vercel", urls["local"]))
        print("Bridge berjalan. Ctrl+C untuk berhenti.")
        while True:
            time.sleep(3600)
    mcp.run()


if __name__ == "__main__":
    main()
