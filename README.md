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

## Rakit Studio (dashboard + editor)
```
creative-mcp studio        # jalankan bridge + buka Studio di browser
```
Tata letak dibuat akrab bagi pengguna Canva/CapCut (rail kiri, panel, toolbar kontekstual, timeline),
tapi dengan nama & desain sendiri. Bukan tiruan merek.

| Halaman | Isi |
|---|---|
| `index.html`: Beranda | Buat desain per ukuran (8 preset), buat video, desain terakhir, Proyek, Template, Merek, Library CapCut, Akun Canva |
| `design.html`: Editor desain | Template orisinal, bentuk (kotak, bulat, pil, lingkaran, segitiga, bintang, garis, bingkai), bingkai foto, gradien, teks + gaya + kombinasi font, upload gambar (klik/seret/tempel), foto komputer, latar, palet merek, **upload font**, layer (sembunyikan/kunci). Multi-select (Shift/kotak seleksi), group, rata & sebar, snap ke tengah/tepi/elemen lain, resize 8 arah, rotasi, kunci, crop/zoom/flip, edit foto (8 filter + 7 penyesuaian), bayangan, efek teks (bayangan, terangkat, hollow, outline, neon, latar), spasi huruf/baris, multi-halaman, **Ubah ukuran**, ekspor **PNG (transparan) / JPG / PDF** dengan skala, Kirim ke Canva |
| `video.html`: Editor video | Panel Media/Audio/Teks/Stiker/Efek/Transisi/Filter, player dengan timecode, inspector (posisi, skala, rotasi, opacity, **keyframe** per properti, **kecepatan**, volume, **fade in/out**, transisi), timeline multi-track dengan **potong**, trim kiri/kanan, snap, pindah track, auto-track saat tumpang tindih, zoom, duplikat. Mode demo tanpa komputer |
| `features.html`: Fitur Free & Pro | Daftar fitur Canva & CapCut: paket Free/Pro di aplikasi asli dan status di Rakit (lihat [FEATURES.md](FEATURES.md)) |

Tanpa bridge (misalnya dibuka di Vercel saja) editor desain tetap jalan dan menyimpan di browser; editor video
membuka contoh project. Dengan bridge, desain disimpan di `~/.creative-mcp/designs` dan semua fitur komputer aktif.

Daftar fitur diperbarui lewat `src/creative_mcp/editor/features.json`, lalu `python scripts/gen_features.py`.

## Live Editor video (preview sampai puas, lalu deploy)
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

### Dua situs Vercel terpisah (Canva-style & CapCut-style)
`python scripts/build_sites.py` menghasilkan dua situs statis siap deploy:

| Situs | Folder (Root Directory di Vercel) | Isi |
|---|---|---|
| Rakit Desain (ala Canva) | `sites/desain` | Editor desain + halaman Fitur |
| Rakit Video (ala CapCut) | `sites/video` | Editor video + halaman Fitur |

Di https://vercel.com/new import repo ini **dua kali**. Untuk tiap project, isi *Root Directory* dengan
`sites/desain` atau `sites/video`, lalu Deploy (tanpa build). Jalankan ulang skrip setiap kali editor berubah.

### Hosting editor di Vercel (satu situs gabungan)
Repo ini sudah berisi `vercel.json` (static, tanpa build). Di https://vercel.com/new → import repo ini → Deploy. Dashboard ada di `/`, editor desain di `/design.html`, editor video di `/video.html`.
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

## Library elemen CapCut pribadi
- `capcut_library_scan` — scan semua project CapCut Anda dan kumpulkan stiker, efek, filter, adjustment,
  transisi, animasi & font yang pernah Anda pakai (tanda `vip` bila CapCut menandainya berbayar).
- `capcut_library_list` / `capcut_library_apply` — pasang elemen itu ke project lain.
- `capcut_make_from_template(..., style={"transition": key, "filter": key, "font": key, ...})` — template + gaya
  dari library Anda. Elemen dari library tampil di Live Editor (stiker bisa di-drag; efek/filter tampil sebagai label,
  hasil visualnya dirender CapCut).
- Elemen Canva: `canva_open_editor` membuka desain di browser, lalu AI memakai `desktop_*` untuk mencari &
  drag elemen apa pun yang tersedia di akun Anda.

## Bukti koneksi (jalankan di komputer Anda)
```
python scripts/verify_connection.py           # cek: handshake MCP, akun Canva, project CapCut
python scripts/verify_connection.py --write   # + buat desain tes di Canva & project tes di CapCut
```
Skrip menjalankan `creative-mcp` sebagai server MCP sungguhan (stdio) dan memanggil tool persis seperti Claude.
Hasil `[OK ] Canva: akun terhubung  nama=<nama Anda>` dan project `tes-mcp-…` yang muncul di CapCut adalah buktinya.

## Contoh perintah ke AI
- "Buat project CapCut `promo` 9:16, masukkan `C:\video\a.mp4` 0–5 detik, tambah teks 'DISKON 50%' di atas."
- "Screenshot layar, lalu drag stiker pertama di panel kiri CapCut ke tengah canvas."
- "Buat video promo dari foto di folder Pictures/produk, judul 'SALE 50%', CTA 'Order sekarang', palet neon."
- "Buatkan presentasi Canva 5 slide tentang bisnis kopi saya, palet elegant."
- "Lihat catalog, lalu buka editor untuk project `promo` dan geser judul ke atas."
- "Isi brand template Canva 'Poster Promo' dengan judul X dan export ke PNG."
