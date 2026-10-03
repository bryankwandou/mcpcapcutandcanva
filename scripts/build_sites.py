"""Build two standalone static sites for Vercel: sites/desain (Canva-style) and sites/video (CapCut-style)."""
import json
import shutil
from pathlib import Path

root = Path(__file__).resolve().parent.parent
src = root / "src/creative_mcp/editor"
SITES = {"desain": "design.html", "video": "video.html"}
for name, page in SITES.items():
    out = root / "sites" / name
    shutil.rmtree(out, ignore_errors=True)
    out.mkdir(parents=True)
    for f in ("studio.css", "studio.js", "features.html", "features.json"):
        shutil.copy(src / f, out / f)
    for f in src.glob(f"{page.split('.')[0]}-*.js"):  # page-specific helper scripts (e.g. video-rich.js)
        (out / f.name).write_text(f.read_text(encoding="utf-8").replace(f"'{page}'", "'index.html'"), encoding="utf-8")
    # the editor itself is the site's home page
    (out / "index.html").write_text((src / page).read_text(encoding="utf-8").replace(f"'{page}'", "'index.html'"), encoding="utf-8")
    (out / "vercel.json").write_text(json.dumps({"$schema": "https://openapi.vercel.sh/vercel.json", "framework": None,
                                                 "buildCommand": "", "installCommand": "", "outputDirectory": "."}, indent=2) + "\n")
    print("built", out)
