# creative-mcp — MCP server untuk Canva + CapCut

Server MCP (Model Context Protocol) yang menghubungkan Claude/AI ke:

| Modul | Cara kerja | Tool |
|---|---|---|
| **Canva** | Canva Connect API resmi (OAuth) | `canva_*` — list/buat desain, upload aset, export (PNG/PDF/MP4…), brand template + autofill |
| **CapCut** | Mengedit file draft CapCut Desktop (`draft_content.json`) | `capcut_*` — buat project, tambah video/foto/audio/teks, geser/trim/transform segmen |
| **Live desktop** | Kontrol mouse/keyboard + screenshot di komputer Anda | `desktop_*` — screenshot, klik, **drag & drop**, ketik, hotkey, scroll |

| **Live Editor (web)** | Editor browser (lokal atau Vercel) + bridge lokal 127.0.0.1 | `editor_*` — live preview, semua elemen drag & drop, deploy ke CapCut |
| **Cache katalog** | Cache di `~/.creative-mcp/cache.json` | `catalog` — sekali panggil langsung tahu fitur, desain, template, project & media yang bisa dipakai |

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
1. Buat app di https://www.canva.com/developers/apps → **Outside Canva**. Generate client secret, tambahkan
   Redirect URL `http://127.0.0.1:3001/oauth/redirect`, dan pilih scope ( `design:content:read/write`,
   `design:meta:read`, `asset:read/write`, `brandtemplate:meta:read`, `brandtemplate:content:read`, `folder:read`, `profile:read`).
2. Jalankan `creative-mcp login` di folder project: browser terbuka ke halaman izin Canva, klik **Allow**,
   lalu token (OAuth PKCE S256) otomatis tersimpan di `.env`. Token diperbarui otomatis, dan refresh token
   baru (sekali pakai) disimpan kembali ke `.env`.
3. Akun free: API premium (mis. `canva_resize`) punya *trial quota*; sisa kuota muncul di `trial_information`.

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

## Live Editor (preview sampai puas, lalu deploy)
```
creative-mcp editor [nama_project]     # jalankan bridge + buka editor di browser
```
- **Canvas**: drag elemen untuk pindah posisi, bulatan kanan-bawah = skala, bulatan atas = rotasi.
- **Timeline**: drag klip untuk geser waktu / pindah track, tarik tepi kanan = trim durasi.
- Drag file dari panel kiri (media di Videos/Pictures/Music/Downloads/Desktop, atau `CREATIVE_MEDIA_DIRS`)
  ke canvas/timeline; drag "Teks baru" untuk teks. Undo/Redo (Ctrl+Z/Y), Space = play, Delete = hapus.
- Semua perubahan disimpan sebagai **preview** (`~/.creative-mcp/scenes/`). Project CapCut asli baru diubah
  saat klik **🚀 Deploy ke CapCut** (atau tool `editor_deploy`); tutup project di CapCut sebelum deploy.
- AI juga bisa mengedit via `editor_update_elements` — perubahan muncul di browser dalam ±1 detik.

### Hosting editor di Vercel
Repo ini sudah berisi `vercel.json`. Di https://vercel.com/new → import repo ini → Deploy (tanpa build).
Lalu set `CREATIVE_EDITOR_URL=https://<nama>.vercel.app` agar `editor_open` memberi link Vercel.
Editor di Vercel hanya berisi tampilan; file & project tetap di komputer Anda dan diakses lewat bridge
`127.0.0.1` dengan token rahasia (di bagian `#` link, tidak dikirim ke server Vercel).
Gunakan Chrome/Edge/Firefox (Safari memblokir akses https → http://127.0.0.1).

> CapCut **tidak punya API key publik**. "Deploy" menulis langsung ke file project CapCut di komputer Anda
> (backup `.json.bak` dibuat otomatis).

## Template orisinal (tanpa premium)
Buat desain lengkap dari foto/video/teks Anda sendiri — bukan template premium orang lain.
- `template_list` — daftar template & palet warna (`bold`, `fresh`, `elegant`, `neon`, `pastel`).
- `capcut_make_from_template` — `promo`, `slideshow`, `quotes`, `youtube_intro`: project CapCut jadi
  (klip, caption, judul, CTA, musik), lalu langsung dapat link Live Editor untuk dirapikan.
- `canva_make_from_template` — `instagram_post`, `story`, `youtube_thumbnail`, `presentation`:
  dibuat sebagai PPTX berisi elemen terpisah (teks, bentuk, foto) lalu di-import ke Canva, jadi
  **setiap elemen bisa diedit & dipindah** di Canva. File PPTX juga disimpan di `~/creative-mcp-designs`.

Catatan: transisi/efek/animasi bawaan CapCut dan elemen Pro Canva tidak dipakai (itu konten berlisensi);
template ini memakai font umum (default Montserrat — tersedia gratis di Canva) dan aset milik Anda.

## Contoh perintah ke AI
- "Buat project CapCut `promo` 9:16, masukkan `C:\video\a.mp4` 0–5 detik, tambah teks 'DISKON 50%' di atas."
- "Screenshot layar, lalu drag stiker pertama di panel kiri CapCut ke tengah canvas."
- "Buat video promo dari foto di folder Pictures/produk, judul 'SALE 50%', CTA 'Order sekarang', palet neon."
- "Buatkan presentasi Canva 5 slide tentang bisnis kopi saya, palet elegant."
- "Lihat catalog, lalu buka editor untuk project `promo` dan geser judul ke atas."
- "Isi brand template Canva 'Poster Promo' dengan judul X dan export ke PNG."
