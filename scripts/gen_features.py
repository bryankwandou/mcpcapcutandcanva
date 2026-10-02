"""Generate FEATURES.md from src/creative_mcp/editor/features.json (single source of truth)."""
import json
from pathlib import Path

root = Path(__file__).resolve().parent.parent
data = json.loads((root / "src/creative_mcp/editor/features.json").read_text(encoding="utf-8"))
TIER = {"free": "Gratis", "terbatas": "Gratis terbatas", "pro": "**Pro**"}
ST = {"ada": "✅ Ada", "sebagian": "🟡 Sebagian", "akun": "🔗 Lewat akun Anda", "tidak": "❌ Tidak"}
out = ["# Fitur Canva & CapCut: Free, Pro, dan di Rakit Studio", "",
       f"> {data['disclaimer']} Terakhir diperbarui {data['updated']}.", "",
       "Kolom **Paket** = paket yang dibutuhkan di aplikasi aslinya. Kolom **Rakit** = ketersediaan di Rakit Studio.", "",
       "| Status | Arti |", "|---|---|"] + [f"| {ST[k]} | {v} |" for k, v in data["legend"]["studio"].items()]
for app, title in (("canva", "Canva"), ("capcut", "CapCut")):
    rows = [f for f in data["features"] if f["app"] == app]
    n = {k: sum(f["studio"] == k for f in rows) for k in ST}
    out += ["", f"## {title} ({len(rows)} fitur)", "",
            " · ".join(f"{ST[k]}: {v}" for k, v in n.items()), "",
            "| Kategori | Fitur | Paket | Rakit | Catatan |", "|---|---|---|---|---|"]
    out += [f"| {f['cat']} | {f['name']} | {TIER[f['tier']]} | {ST[f['studio']]} | {f['note']} |" for f in rows]
out += ["", "## Sumber", ""] + [f"- [{s['title']}]({s['url']})" for s in data["sources"]]
(root / "FEATURES.md").write_text("\n".join(out) + "\n", encoding="utf-8")
print("FEATURES.md written")
