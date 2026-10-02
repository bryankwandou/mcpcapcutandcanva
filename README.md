# creative-mcp — MCP server untuk Canva + CapCut

Server MCP (Model Context Protocol) yang menghubungkan Claude/AI ke:

| Modul | Cara kerja | Tool |
|---|---|---|
| **Canva** | Canva Connect API resmi (OAuth) | `canva_*` — list/buat desain, upload aset, export (PNG/PDF/MP4…), brand template + autofill |
| **CapCut** | Mengedit file draft CapCut Desktop (`draft_content.json`) | `capcut_*` — buat project, tambah video/foto/audio/teks, geser/trim/transform segmen |
| **Live desktop** | Kontrol mouse/keyboard + screenshot di komputer Anda | `desktop_*` — screenshot, klik, **drag & drop**, ketik, hotkey, scroll |

Mode `desktop_*` adalah yang membuat AI bisa "mengedit seperti manusia" secara langsung di jendela
CapCut/Canva Anda (mirip remote control): AI melihat layar lewat screenshot lalu klik dan drag elemen.

## Batasan penting (jujur)
- **Elemen premium**: semua elemen yang tersedia di akun Anda bisa dipakai. Elemen Pro/berbayar
  **tidak bisa dibuka tanpa langganan** — server ini tidak (dan tidak akan) membobol paywall Canva/CapCut.
  Pada akun free, elemen premium tetap memberi watermark/kunci seperti biasa.
- **CapCut tidak punya API publik.** Edit draft bekerja di level file: tutup project di CapCut dulu,
  jalankan tool, lalu buka lagi project-nya. Beberapa versi CapCut terbaru **mengenkripsi** draft;
  untuk itu gunakan tool `desktop_*`. Gunakan opsi `template=<draft yang sudah ada>` saat membuat draft
  agar format file cocok dengan versi CapCut Anda. Backup otomatis disimpan sebagai `*.json.bak`.
- **Canva Connect API** tidak mengizinkan menggeser elemen satu-per-satu di dalam desain.
  Untuk edit elemen secara langsung, buka `edit_url` desain lalu pakai tool `desktop_*`.
- Tool desktop harus berjalan di **komputer Anda sendiri** (bukan server cloud), dan mati secara default.
  Fail-safe: gerakkan mouse ke pojok layar untuk menghentikan aksi.

## Instalasi
```bash
git clone https://github.com/bryankwandou/mcpcapcutandcanva && cd mcpcapcutandcanva
pip install -e ".[desktop]"
```

### Canva
1. Buat integrasi di https://www.canva.com/developers/integrations (scope: `design:content:read/write`,
   `design:meta:read`, `asset:read/write`, `brandtemplate:meta:read`, `brandtemplate:content:read`, `folder:read`, `profile:read`).
2. Lakukan OAuth (PKCE) untuk mendapatkan access & refresh token, lalu isi `CANVA_*` (lihat `.env.example`).
   Token diperbarui otomatis jika `CANVA_CLIENT_ID/SECRET/REFRESH_TOKEN` diisi.

### Claude Desktop config (`claude_desktop_config.json`)
```json
{
  "mcpServers": {
    "creative": {
      "command": "creative-mcp",
      "env": {
        "CANVA_CLIENT_ID": "...", "CANVA_CLIENT_SECRET": "...",
        "CANVA_ACCESS_TOKEN": "...", "CANVA_REFRESH_TOKEN": "...",
        "ENABLE_DESKTOP_CONTROL": "1"
      }
    }
  }
}
```
Claude Code: `claude mcp add creative -e ENABLE_DESKTOP_CONTROL=1 -- creative-mcp`

## Contoh perintah ke AI
- "Buat project CapCut `promo` 9:16, masukkan `C:\video\a.mp4` 0–5 detik, tambah teks 'DISKON 50%' di atas."
- "Screenshot layar, lalu drag stiker pertama di panel kiri CapCut ke tengah canvas."
- "Isi brand template Canva 'Poster Promo' dengan judul X dan export ke PNG."
