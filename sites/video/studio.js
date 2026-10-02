// Rakit Studio — shared helpers: bridge connection, storage, navigation, dialogs, icons, templates.
function ls(k) { try { return localStorage.getItem(k); } catch { return null; } }
function lsSet(k, v) { try { localStorage.setItem(k, v); return true; } catch { return false; } }
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36)).toUpperCase();
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));

// Page parameters: from the URL hash (local bridge / Vercel) or from the last navigation (preview frames drop hashes).
const PARAMS = (() => {
  const h = new URLSearchParams(location.hash.slice(1)), out = {};
  for (const [k, v] of h) out[k] = v;
  if (!Object.keys(out).length) { try { Object.assign(out, JSON.parse(ls('nav') || '{}')); } catch {} }
  return out;
})();

const Studio = {
  bridge: PARAMS.bridge || ls('bridge') || (location.protocol === 'http:' && location.hostname === '127.0.0.1' ? location.origin : ''),
  token: PARAMS.token || ls('token') || '',
  connected: false,
  async connect() {
    if (!this.bridge || !this.token) return false;
    try { await this.api('/api/drafts'); this.connected = true; lsSet('bridge', this.bridge); lsSet('token', this.token); }
    catch { this.connected = false; }
    return this.connected;
  },
  async api(path, opt = {}) {
    const r = await fetch(this.bridge + path, {...opt, headers: {'X-Bridge-Token': this.token, 'Content-Type': 'application/json'}});
    const j = await r.json(); if (!r.ok) throw new Error(j.error || r.status); return j;
  },
  mediaUrl(p) {
    if (!p || /^(data:|blob:|https?:)/.test(p)) return p;
    return `${this.bridge}/media?token=${encodeURIComponent(this.token)}&path=${encodeURIComponent(p)}`;
  },
  go(page, extra = {}) {
    const params = {...(this.connected ? {bridge: this.bridge, token: this.token} : {}), ...extra};
    lsSet('nav', JSON.stringify(extra));
    const url = new URL(page + (Object.keys(params).length ? '#' + new URLSearchParams(params) : ''), location.href);
    if (url.pathname === location.pathname) { location.hash = url.hash; location.reload(); }  // a hash-only change would not reload
    else location.href = url.href;
  },
  // Designs live on the bridge when connected, otherwise in this browser.
  async listDesigns() {
    if (this.connected) return this.api('/api/designs');
    return Object.values(this._local()).map(({id, title, width, height, updated, thumb}) => ({id, title, width, height, updated, thumb}));
  },
  async getDesign(id) { return this.connected ? this.api('/api/design?id=' + encodeURIComponent(id)) : this._local()[id]; },
  async saveDesign(d) {
    d.updated = Date.now();
    if (this.connected) return this.api('/api/design', {method: 'PUT', body: JSON.stringify(d)});
    const all = this._local(); all[d.id] = d;
    if (!lsSet('designs', JSON.stringify(all))) throw new Error('Penyimpanan browser penuh. Hapus desain lama atau pakai foto yang lebih kecil.');
    return {ok: true};
  },
  async deleteDesign(id) {
    if (this.connected) return this.api('/api/design?id=' + encodeURIComponent(id), {method: 'DELETE'});
    const all = this._local(); delete all[id]; lsSet('designs', JSON.stringify(all));
  },
  _local() { try { return JSON.parse(ls('designs') || '{}'); } catch { return {}; } },

  toast(msg, ms = 2800) {
    document.querySelectorAll('.toast').forEach(t => t.remove());
    const t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg;
    document.body.appendChild(t); setTimeout(() => t.remove(), ms);
  },
  // In-page dialog (browser alert/confirm are not shown in every frame).
  modal(html, {onClose} = {}) {
    const back = document.createElement('div'); back.className = 'modal-back';
    back.innerHTML = `<div class="modal" role="dialog" aria-modal="true">${html}</div>`;
    const close = v => { back.remove(); onClose?.(v); };
    back.addEventListener('pointerdown', e => { if (e.target === back) close(null); });
    back.addEventListener('keydown', e => { if (e.key === 'Escape') close(null); });
    document.body.appendChild(back); back.querySelector('button, input, select')?.focus();
    return {el: back.firstElementChild, close};
  },
  confirm(title, msg, ok = 'Lanjutkan', danger = false) {
    return new Promise(res => {
      const m = this.modal(`<h3>${esc(title)}</h3><p>${esc(msg)}</p><div class="actions"><button class="btn" data-v="0">Batal</button><button class="btn primary" data-v="1"${danger ? ' style="background:var(--danger);border-color:var(--danger);color:#fff"' : ''}>${esc(ok)}</button></div>`, {onClose: v => res(!!v)});
      m.el.querySelectorAll('[data-v]').forEach(b => b.onclick = () => m.close(b.dataset.v === '1'));
    });
  },
};

// ---- icons (24px line icons) ----
const ICONS = {
  home: 'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z', folder: 'M3 6a1 1 0 0 1 1-1h5l2 2h9a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z',
  layout: 'M4 4h16v16H4zM4 10h16M10 10v10', palette: 'M12 3a9 9 0 1 0 0 18c1.1 0 1.5-.8 1.5-1.5 0-.9-.6-1.3-.6-2.1 0-.8.7-1.4 1.6-1.4H17a4 4 0 0 0 4-4c0-5-4-9-9-9zM7.5 11.5h.01M10 7.5h.01M15 7.5h.01',
  sparkles: 'M12 3l1.8 4.7 4.7 1.8-4.7 1.8L12 16l-1.8-4.7-4.7-1.8 4.7-1.8zM19 15l.8 2.2 2.2.8-2.2.8L19 21l-.8-2.2-2.2-.8 2.2-.8z',
  list: 'M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01', link: 'M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1',
  plus: 'M12 5v14M5 12h14', search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4', text: 'M5 6V4h14v2M12 4v16M9 20h6',
  shapes: 'M4 13h7v7H4zM17.5 4a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7zM7.5 3l4 7h-8z', upload: 'M12 16V4M7 9l5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3',
  image: 'M4 5h16v14H4zM4 16l5-5 4 4 2-2 5 5M15 9.5h.01', fill: 'M5 12l7-7 7 7-7 7zM19 16s2 2.2 2 3.5a2 2 0 0 1-4 0c0-1.3 2-3.5 2-3.5z',
  layers: 'M12 3l9 5-9 5-9-5zM3 13l9 5 9-5', undo: 'M9 14L4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3', redo: 'M15 14l5-5-5-5M20 9H10a6 6 0 0 0 0 12h3',
  download: 'M12 4v12M7 11l5 5 5-5M4 20h16', send: 'M4 12l16-8-6 16-3-7z', trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13',
  copy: 'M8 8h12v12H8zM16 8V4H4v12h4', lock: 'M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3', unlock: 'M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 6.8-1',
  eye: 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z', eyeoff: 'M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4M6.6 6.6C3.9 8.4 2 12 2 12s3.6 7 10 7a9.6 9.6 0 0 0 5.4-1.6',
  group: 'M4 4h7v7H4zM13 13h7v7h-7zM8 15v3h3M16 9V6h-3', alignL: 'M4 3v18M8 7h10v4H8zM8 14h6v4H8z', alignC: 'M12 3v18M7 7h10v4H7zM9 14h6v4H9z',
  alignR: 'M20 3v18M6 7h10v4H6zM10 14h6v4h-6z', alignT: 'M3 4h18M7 8h4v10H7zM14 8h4v6h-4z', alignM: 'M3 12h18M7 7h4v10H7zM14 9h4v6h-4z',
  alignB: 'M3 20h18M7 6h4v10H7zM14 10h4v6h-4z', distH: 'M4 3v18M20 3v18M10 8h4v8h-4z', distV: 'M3 4h18M3 20h18M8 10h8v4H8z',
  crop: 'M6 2v16h16M2 6h16v16', flipH: 'M12 3v18M8 7l-5 5 5 5zM16 7l5 5-5 5z', flipV: 'M3 12h18M7 8l5-5 5 5zM7 16l5 5 5-5z',
  play: 'M7 4l13 8-13 8z', pause: 'M7 4h3v16H7zM14 4h3v16h-3z', scissors: 'M6 4a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM6 14a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM8.6 8.6L20 20M8.6 15.4L20 4',
  gauge: 'M4 17a8 8 0 1 1 16 0M12 17l4-6', diamond: 'M12 4l8 8-8 8-8-8z', music: 'M9 18V5l11-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM20 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z',
  film: 'M4 4h16v16H4zM8 4v16M16 4v16M4 9h4M4 15h4M16 9h4M16 15h4', star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z',
  wand: 'M4 20L15 9M14 3v3M19 8h3M18 4l1.5-1.5M17.5 12.5L19 14M10 3.5l1 1', filter: 'M9 4a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM15 10a5 5 0 1 0 0 10 5 5 0 0 0 0-10z',
  transition: 'M4 8h13l-3-3M20 16H7l3 3', zoomIn: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4M8 11h6M11 8v6', zoomOut: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4M8 11h6',
  back: 'M15 5l-7 7 7 7', resize: 'M4 9V4h5M20 15v5h-5M4 4l7 7M20 20l-7-7', adjust: 'M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M16 4v4M10 10v4M16 16v4',
  position: 'M12 3v18M3 12h18M8 8l-4 4 4 4M16 8l4 4-4 4', check: 'M5 12l5 5 9-10', x: 'M6 6l12 12M18 6L6 18', computer: 'M3 5h18v11H3zM8 20h8M12 16v4',
  video: 'M3 6h13v12H3zM16 10l5-3v10l-5-3z', grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z', font: 'M4 20l6-16h1l6 16M6.5 14h8M17 20h4',
  shadow: 'M5 5h11v11H5zM9 19h10V9', volume: 'M4 9h4l5-4v14l-5-4H4zM16.5 8.5a5 5 0 0 1 0 7', mute: 'M4 9h4l5-4v14l-5-4H4zM17 9l4 6M21 9l-4 6',
  pen: 'M4 20h4L19 9l-4-4L4 16z', more: 'M5 12h.01M12 12h.01M19 12h.01', bolt: 'M13 3L5 13h6l-1 8 8-10h-6z',
};
const icon = (n, cls = '') => `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${ICONS[n] || ICONS.more}"/></svg>`;

// ---- original templates ----
const PALETTES = {
  kunyit: {bg: '#1B1A17', primary: '#E8B02A', text: '#F7F3E8', accent: '#D95D39'},
  pandan: {bg: '#EAF5EC', primary: '#2F8F5B', text: '#13301F', accent: '#F2A541'},
  batik: {bg: '#F4EDE1', primary: '#7A4A2A', text: '#2A1E16', accent: '#2F5D8A'},
  senja: {bg: '#2A1B3D', primary: '#FF8C5A', text: '#FFF4EC', accent: '#F4C95D'},
  laut: {bg: '#F2F7FB', primary: '#1F6FB2', text: '#0E2236', accent: '#36C5B1'},
};
const SIZES = {
  instagram_post: {w: 1080, h: 1350, label: 'Post Instagram'},
  story: {w: 1080, h: 1920, label: 'Story / Reels'},
  square: {w: 1080, h: 1080, label: 'Post persegi'},
  youtube_thumbnail: {w: 1280, h: 720, label: 'Thumbnail YouTube'},
  presentation: {w: 1920, h: 1080, label: 'Presentasi 16:9'},
  a4: {w: 1240, h: 1754, label: 'Poster A4'},
  banner: {w: 1500, h: 500, label: 'Banner'},
  logo: {w: 500, h: 500, label: 'Logo'},
};
const VIDEO_SIZES = {portrait: {w: 1080, h: 1920, label: 'Video 9:16'}, landscape: {w: 1920, h: 1080, label: 'Video 16:9'}, square: {w: 1080, h: 1080, label: 'Video 1:1'}};
const T = (text, x, y, w, h, fontSize, color, o = {}) => ({id: uid(), type: 'text', text, x, y, w, h, fontSize, color, bold: false, italic: false, align: 'left', font: 'Plus Jakarta Sans', rot: 0, opacity: 1, effect: 'none', ...o});
const R = (x, y, w, h, fill, o = {}) => ({id: uid(), type: 'rect', x, y, w, h, fill, radius: 0, rot: 0, opacity: 1, ...o});
function makeDesign(kind, palette = 'kunyit', title) {
  const s = SIZES[kind] || SIZES.square, p = PALETTES[palette] || PALETTES.kunyit, W = s.w, H = s.h, m = Math.round(Math.min(W, H) * 0.06);
  const page = els => ({id: uid(), bg: p.bg, elements: els});
  const head = 'Bricolage Grotesque';
  let pages;
  if (kind === 'youtube_thumbnail' || kind === 'banner') {
    pages = [page([R(W * 0.45, 0, W * 0.55, H, p.accent, {name: 'Foto (ganti)'}), R(0, 0, W * 0.5, H, p.bg), R(W * 0.5 - 10, 0, 20, H, p.primary),
      T('JUDUL YANG BIKIN PENASARAN', m, m, W * 0.44, H * 0.62, Math.round(Math.min(W * 0.065, H * 0.15)), p.text, {bold: true, font: head}),
      R(m, H - m - H * 0.14, W * 0.26, H * 0.14, p.primary, {radius: 14}),
      T('BARU', m, H - m - H * 0.12, W * 0.26, H * 0.1, Math.round(H * 0.07), p.bg, {bold: true, align: 'center', font: head})])];
  } else if (kind === 'presentation') {
    pages = [page([R(m, H * 0.3, 14, H * 0.4, p.primary), T('Judul Presentasi', m + 50, H * 0.3, W * 0.48, 220, 92, p.text, {bold: true, font: head}),
      T('Nama presenter · Tanggal', m + 50, H * 0.58, W * 0.48, 70, 34, p.text, {opacity: .8}), R(W * 0.56, 0, W * 0.44, H, p.primary, {name: 'Foto (ganti)'})]),
      page([R(0, 0, W, 14, p.primary), T('01', m, m * 1.6, 220, 110, 80, p.accent, {bold: true, font: head}), T('Poin pertama', m, m * 1.6 + 130, W * 0.48, 100, 64, p.text, {bold: true, font: head}),
        T('Tulis penjelasan singkat poin ini. Satu gagasan per slide membuat audiens tetap fokus.', m, m * 1.6 + 260, W * 0.42, 260, 32, p.text), R(W * 0.55, m * 1.6, W * 0.45 - m, H - 3.2 * m, p.primary, {radius: 24, name: 'Foto (ganti)'})]),
      page([T('Terima kasih', 0, H * 0.4, W, 140, 104, p.primary, {bold: true, align: 'center', font: head}), T('email@bisnisanda.id', 0, H * 0.58, W, 60, 32, p.text, {align: 'center'})])];
  } else if (kind === 'logo') {
    pages = [page([{id: uid(), type: 'ellipse', x: W * 0.2, y: W * 0.12, w: W * 0.6, h: W * 0.6, fill: p.primary, rot: 0, opacity: 1},
      T('R', W * 0.2, W * 0.2, W * 0.6, W * 0.4, Math.round(W * 0.34), p.bg, {bold: true, align: 'center', font: head}),
      T('NAMA USAHA', 0, W * 0.78, W, W * 0.1, Math.round(W * 0.07), p.text, {bold: true, align: 'center', spacing: 6})])];
  } else {
    const ph = H * (kind === 'a4' ? 0.5 : 0.56);
    pages = [page([R(0, 0, W, ph, p.primary, {name: 'Foto (ganti)'}), R(m, ph - 34, W * 0.32, 16, p.accent),
      T('Diskon Akhir Pekan', m, ph + m * 0.7, W - 2 * m, H * 0.13, Math.round(W * 0.08), p.text, {bold: true, font: head}),
      T('Semua menu kopi susu potongan 30% setiap Sabtu & Minggu.', m, ph + H * 0.17, W - 2 * m, H * 0.1, Math.round(W * 0.034), p.text, {opacity: .85}),
      R(m, H - m - H * 0.07, W * 0.46, H * 0.07, p.primary, {radius: 999}),
      T('Pesan sekarang', m, H - m - H * 0.07 + H * 0.017, W * 0.46, H * 0.05, Math.round(W * 0.034), p.bg, {bold: true, align: 'center'})])];
  }
  return {id: uid(), title: title || (s.label + ' baru'), kind, palette, width: W, height: H, pages, fonts: [], updated: Date.now()};
}

// Example images drawn locally (used by the offline demo; no stock content).
function demoImage(label, c1, c2, w = 960, h = 540) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, c1); g.addColorStop(1, c2); x.fillStyle = g; x.fillRect(0, 0, w, h);
  x.globalAlpha = .18; x.fillStyle = '#fff';
  for (let i = 0; i < 7; i++) { x.beginPath(); x.arc((i * 173) % w, (i * 97 + 60) % h, 40 + i * 18, 0, 7); x.fill(); }
  x.globalAlpha = 1; x.fillStyle = 'rgba(255,255,255,.92)'; x.textAlign = 'center'; x.textBaseline = 'middle';
  let fs = Math.round(h * 0.11); x.font = `700 ${fs}px "Bricolage Grotesque", sans-serif`;
  const tw = x.measureText(label).width; if (tw > w * .84) { fs = Math.floor(fs * w * .84 / tw); x.font = `700 ${fs}px "Bricolage Grotesque", sans-serif`; }
  x.fillText(label, w / 2, h / 2);
  return c.toDataURL('image/jpeg', 0.85);
}
