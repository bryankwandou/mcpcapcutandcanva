// Shared helpers for the Studio pages: bridge connection, API calls, local storage.
const hp = new URLSearchParams(location.hash.slice(1));
const Studio = {
  bridge: hp.get('bridge') || ls('bridge') || (location.protocol === 'http:' && location.hostname === '127.0.0.1' ? location.origin : ''),
  token: hp.get('token') || ls('token') || '',
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
  mediaUrl(p) { return `${this.bridge}/media?token=${encodeURIComponent(this.token)}&path=${encodeURIComponent(p)}`; },
  link(page, extra = {}) {
    const q = new URLSearchParams({...(this.connected ? {bridge: this.bridge, token: this.token} : {}), ...extra});
    return `${page}#${q}`;
  },
  // Designs: stored on the bridge when connected, otherwise in this browser.
  async listDesigns() {
    if (this.connected) return this.api('/api/designs');
    return Object.values(JSON.parse(ls('designs') || '{}')).map(({id, title, width, height, updated, thumb}) => ({id, title, width, height, updated, thumb}));
  },
  async getDesign(id) {
    if (this.connected) return this.api('/api/design?id=' + encodeURIComponent(id));
    return JSON.parse(ls('designs') || '{}')[id];
  },
  async saveDesign(d) {
    d.updated = Date.now();
    if (this.connected) return this.api('/api/design', {method: 'PUT', body: JSON.stringify(d)});
    const all = JSON.parse(ls('designs') || '{}'); all[d.id] = d; lsSet('designs', JSON.stringify(all)); return {ok: true};
  },
  async deleteDesign(id) {
    if (this.connected) return this.api('/api/design?id=' + encodeURIComponent(id), {method: 'DELETE'});
    const all = JSON.parse(ls('designs') || '{}'); delete all[id]; lsSet('designs', JSON.stringify(all));
  },
};
function ls(k) { try { return localStorage.getItem(k); } catch { return null; } }
function lsSet(k, v) { try { localStorage.setItem(k, v); } catch {} }
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now()).toUpperCase();

// ---- design templates (original) ----
const PALETTES = {
  bold: {bg: '#111111', primary: '#FFD400', text: '#FFFFFF', accent: '#FF3B30'},
  fresh: {bg: '#E8F7F0', primary: '#0E9F6E', text: '#0B2E22', accent: '#FF8A3D'},
  elegant: {bg: '#F6F1EA', primary: '#8C6A43', text: '#2B2420', accent: '#C9A66B'},
  neon: {bg: '#0B0B1E', primary: '#00E5FF', text: '#FFFFFF', accent: '#FF2BD6'},
  pastel: {bg: '#FFF4F7', primary: '#F27BA6', text: '#3A2A33', accent: '#7CC4F2'},
};
const SIZES = {
  instagram_post: {w: 1080, h: 1350, label: 'Post Instagram'},
  story: {w: 1080, h: 1920, label: 'Story / Reels'},
  youtube_thumbnail: {w: 1280, h: 720, label: 'Thumbnail YouTube'},
  presentation: {w: 1920, h: 1080, label: 'Presentasi'},
  a4: {w: 1240, h: 1754, label: 'Poster A4'},
  square: {w: 1080, h: 1080, label: 'Persegi'},
};
const T = (text, x, y, w, h, fontSize, color, o = {}) => ({id: uid(), type: 'text', text, x, y, w, h, fontSize, color, bold: false, align: 'left', font: 'Montserrat', rot: 0, opacity: 1, ...o});
const R = (x, y, w, h, fill, o = {}) => ({id: uid(), type: 'rect', x, y, w, h, fill, radius: 0, rot: 0, opacity: 1, ...o});
function makeDesign(kind, palette = 'bold', title = 'Desain tanpa judul') {
  const s = SIZES[kind] || SIZES.square, p = PALETTES[palette] || PALETTES.bold, W = s.w, H = s.h, m = Math.round(Math.min(W, H) * 0.06);
  const page = els => ({id: uid(), bg: p.bg, elements: els});
  let pages;
  if (kind === 'instagram_post' || kind === 'story' || kind === 'square' || kind === 'a4') {
    const ph = H * 0.56;
    pages = [page([R(0, 0, W, ph, p.primary, {name: 'Foto (ganti)'}), R(m, ph - 40, W * 0.35, 18, p.accent),
      T('JUDUL BESAR', m, ph + m * 0.6, W - 2 * m, H * 0.14, W * 0.075, p.text, {bold: true}),
      T('Subjudul singkat yang menjelaskan', m, ph + H * 0.17, W - 2 * m, H * 0.07, W * 0.035, p.text),
      R(m, H - m - H * 0.065, W * 0.5, H * 0.065, p.primary, {radius: 24}),
      T('Pesan Sekarang', m, H - m - H * 0.065 + H * 0.016, W * 0.5, H * 0.05, W * 0.035, p.bg, {bold: true, align: 'center'})])];
  } else if (kind === 'youtube_thumbnail') {
    pages = [page([R(W * 0.45, 0, W * 0.55, H, p.accent, {name: 'Foto (ganti)'}), R(0, 0, W * 0.5, H, p.bg), R(W * 0.5 - 12, 0, 24, H, p.primary),
      T('JUDUL VIDEO YANG MENARIK', m, m, W * 0.44, H * 0.6, W * 0.07, p.text, {bold: true}),
      R(m, H - m - 80, W * 0.3, 80, p.accent, {radius: 16}), T('BARU!', m, H - m - 66, W * 0.3, 60, 40, '#FFFFFF', {bold: true, align: 'center'})])];
  } else {
    pages = [page([R(m, H * 0.3, 14, H * 0.4, p.primary), T('Judul Presentasi', m + 50, H * 0.32, W * 0.5, 200, 88, p.text, {bold: true}),
      T('Subjudul / nama presenter', m + 50, H * 0.56, W * 0.5, 80, 36, p.text), R(W * 0.55, 0, W * 0.45, H, p.primary, {name: 'Foto (ganti)'})]),
      page([R(0, 0, W, 16, p.primary), T('01', m, m * 1.5, 200, 100, 72, p.accent, {bold: true}), T('Poin pertama', m, m * 1.5 + 120, W * 0.5, 100, 64, p.text, {bold: true}),
        T('Jelaskan detail poin di sini.', m, m * 1.5 + 260, W * 0.45, 200, 34, p.text), R(W * 0.55, m * 1.5, W * 0.45 - m, H - 3 * m, p.primary, {radius: 24})]),
      page([T('Terima kasih!', 0, H * 0.4, W, 140, 96, p.primary, {bold: true, align: 'center'})])];
  }
  return {id: uid(), title, kind, palette, width: W, height: H, pages, updated: Date.now()};
}
