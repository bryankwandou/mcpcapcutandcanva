// Rakit Desain — panels, animation, presentation stage, canvas navigation and image tools.
// Loaded after the main editor script in design.html (shares its globals).
'use strict';

let previewT;
function queuePreviewRedraw() { clearTimeout(previewT); previewT = setTimeout(() => renderThumbs(), 120); }
const PRO = '<span class="tier pro">Pro di Canva</span>';

// ---------- presets for drag & drop ----------
const SHAPE_COLORS = ['#2F5D8A', '#36C5B1', '#E8B02A', '#D95D39', '#2F8F5B', '#F27BA6', '#7A4A2A', '#B48CFF'];
const shapeSize = k => ({halfcircle: [1, .5], quarter: [1, 1], arch: [.8, 1], parallelogram: [1.3, .7], trapezoid: [1.2, .8], arrow: [1.3, .7], chevron: [.8, 1], bubble: [1.1, .85], bubbleRound: [1.1, .9],
  arrowLine: [1.8, .2], dblArrow: [1.8, .2], slash: [.4, 1], cloud: [1.3, .8], tag: [1.2, .6], ticket: [1.5, .8], drop: [.8, 1], shield: [.9, 1]}[k] || [1, 1]);
Object.keys(SHP).forEach((k, i) => { PRESETS['shp_' + k] = () => { const [a, b] = shapeSize(k); return {type: k, w: Math.round(S() * .3 * a), h: Math.round(S() * .3 * b), fill: SHAPE_COLORS[i % SHAPE_COLORS.length]}; }; });
Object.keys(STK).forEach(k => { PRESETS['stk_' + k] = () => { const e = St(k, 0, 0, S() * .28); delete e.x; delete e.y; return e; }; });
const FRAMES = [['square', 'Kotak', null, 0], ['rounded', 'Sudut bulat', null, .08], ['circle', 'Lingkaran', 'circle', 0], ['arch', 'Lengkung', 'arch', 0], ['heart', 'Hati', 'heart', 0], ['blob', 'Blob', 'blob', 0],
  ['hexagon', 'Segi enam', 'hexagon', 0], ['starRound', 'Bintang', 'starRound', 0], ['drop', 'Tetes', 'drop', 0], ['squircle', 'Kotak lembut', 'squircle', 0], ['diamond', 'Belah ketupat', 'diamond', 0], ['ticket', 'Tiket', 'ticket', 0]];
FRAMES.forEach(([k, , mask, r]) => { PRESETS['frm_' + k] = () => ({type: 'rect', w: Math.round(S() * .45), h: Math.round(S() * .45 * (k === 'arch' ? 1.25 : 1)), fill: G('#D9DEE7', '#AEB6C4', 160), name: 'Foto (ganti)', radius: Math.round(S() * r), ...(mask === 'circle' ? {mask: 'circle'} : mask ? {mask} : {})}); });
SHP.circle = pEll(50, 50, 50, 50); SHP_NAMES.circle = 'Lingkaran';
const ANIMS = [['none', 'Tanpa'], ['fade', 'Pudar'], ['slide', 'Geser naik'], ['zoom', 'Zoom'], ['pop', 'Pop'], ['type', 'Ketik', true], ['bounce', 'Melompat', true], ['wipe', 'Sapu']];
const TRANS = [['none', 'Tanpa'], ['fade', 'Pudar'], ['slide', 'Geser'], ['zoom', 'Zoom'], ['wipe', 'Sapu', true]];

function addPreset(k) { const e = PRESETS[k](); return add(e); }
function tileFor(inner, preset, title, cls = '') { const t = tile(inner, {preset}, () => addPreset(preset), title); if (cls) t.classList.add(...cls.split(' ')); return named(t, title); }

// ---------- Desain (templates) panel ----------
let tplSize = null;
function panelTemplates(B) {
  const kinds = [...new Set(TEMPLATES.map(t => t.kind))];
  if (tplSize === null) tplSize = kinds.includes(D.kind) ? D.kind : 'all';
  B.insertAdjacentHTML('beforeend', `<div class="chips" role="tablist" aria-label="Ukuran template">${[['all', 'Semua'], ...kinds.map(k => [k, SIZES[k].label])].map(([k, l]) => `<button role="tab" data-k="${k}" class="${k === tplSize ? 'on' : ''}" aria-selected="${k === tplSize}">${l}${k === D.kind ? ' ·  ukuran ini' : ''}</button>`).join('')}</div><div id="tplWrap" style="display:grid;gap:12px"></div>
    <div class="label">Mulai desain baru</div><div class="tiles masonry" id="sz" data-sec data-lim="4"></div>`);
  B.querySelectorAll('.chips button').forEach(b => b.onclick = () => { tplSize = b.dataset.k; openRail('tpl'); });
  const wrap = B.querySelector('#tplWrap'), list = TEMPLATES.filter(t => tplSize === 'all' || t.kind === tplSize), cats = [...new Set(list.map(t => t.cat))];
  for (const c of cats) {
    wrap.insertAdjacentHTML('beforeend', `<div class="label">${esc(c)}</div><div class="tplgrid" data-sec data-lim="${tplSize === 'all' ? 4 : 6}"></div>`);
    const g = wrap.lastElementChild;
    for (const tp of list.filter(t => t.cat === c)) {
      const z = SIZES[tp.kind], pages = buildTemplate(tp, z.w, z.h), cv = document.createElement('canvas'); renderPageTo(cv, pages[0], 300 / Math.max(z.w, z.h * .8), {width: z.w, height: z.h});
      const b = document.createElement('button'); b.className = 'tplcard'; b.title = `${tp.name} — klik untuk memakai`; b.appendChild(cv);
      b.insertAdjacentHTML('beforeend', `${pages.length > 1 ? `<span class="pgs">${pages.length} halaman</span>` : ''}<small>${esc(z.label)}</small>`);
      b.dataset.name = tp.search; b.onclick = () => useTemplate(tp); g.appendChild(b);
    }
  }
  for (const [k, z] of Object.entries(SIZES)) {
    const m = 64 / Math.max(z.w, z.h), b = tile(`<i style="width:${Math.round(z.w * m)}px;height:${Math.round(z.h * m)}px"></i><span>${z.label}</span><small class="mono">${z.w}×${z.h}</small>`, null, () => newDesign(k), `Desain baru: ${z.label}`);
    b.classList.add('sizecard'); B.querySelector('#sz').appendChild(named(b, `${z.label} ukuran desain baru`));
  }
  searchBox(B, 'Cari template: kopi, lebaran, lowongan…');
}
function applyTemplatePages(tp) {
  snap(); const pages = buildTemplate(tp, D.width, D.height); D.pages.splice(cur, 1, ...pages); sel = []; commit();
  Studio.toast(pages.length > 1 ? `${pages.length} halaman template ditambahkan · Ctrl+Z untuk urungkan` : 'Template diterapkan · Ctrl+Z untuk urungkan');
}
async function templateAsNew(tp) {
  const z = SIZES[tp.kind], d = {id: uid(), title: tp.t.title.slice(0, 40), kind: tp.kind, palette: D.palette || 'kunyit', width: z.w, height: z.h, pages: buildTemplate(tp, z.w, z.h), fonts: [], updated: Date.now()};
  try { await Studio.saveDesign(d); Studio.go('index.html', {id: d.id}); } catch (err) { Studio.toast('Gagal membuat desain: ' + err.message, 5000); }
}
function useTemplate(tp) {
  const z = SIZES[tp.kind]; if (tp.kind === D.kind || (z.w === D.width && z.h === D.height)) return applyTemplatePages(tp);
  const m = Studio.modal(`<h3>Pakai template ${esc(z.label)}</h3><p>Desain Anda berukuran ${D.width}×${D.height}. Template ini dibuat untuk ${z.w}×${z.h}.</p>
    <div class="actions"><button class="btn" data-c>Batal</button><button class="btn" id="tuHere">Sesuaikan ke desain ini</button><button class="btn primary" id="tuNew">Buka sebagai desain baru</button></div>`);
  m.el.querySelector('[data-c]').onclick = () => m.close();
  m.el.querySelector('#tuHere').onclick = () => { m.close(); applyTemplatePages(tp); };
  m.el.querySelector('#tuNew').onclick = () => { m.close(); templateAsNew(tp); };
}

// ---------- Elemen panel ----------
function panelElements(B) {
  B.insertAdjacentHTML('beforeend', `<div class="label">Bentuk</div><div class="tiles three" id="sh" data-sec data-lim="9"></div>
    <div class="label">Garis & panah</div><div class="tiles three" id="ln" data-sec data-lim="6"></div>
    <div class="label">Bingkai foto</div><div class="tiles three" id="fr" data-sec data-lim="6"></div>
    <div class="label">Stiker & ilustrasi</div><div class="tiles three" id="stk" data-sec data-lim="9"></div>
    <div class="label">Grafik</div><div class="tiles three" id="ch" data-sec></div>
    <div class="label">Gradien</div><div class="tiles three" id="gr" data-sec data-lim="3"></div>
    <div class="label">Palet warna</div><div id="pl" style="display:grid;gap:6px" data-sec data-lim="4"></div>
    <p class="note">Semua bentuk, stiker dan ilustrasi di sini dibuat oleh Rakit dan bebas dipakai.</p>`);
  const basic = {rect: ['Kotak persegi', 'background:#2F5D8A;width:60%;height:60%'], round: ['Kotak sudut bulat', 'background:#36C5B1;width:70%;height:46%;border-radius:10px'], pill: ['Pil tombol', 'background:#E8B02A;width:76%;height:30%;border-radius:99px'],
    ellipse: ['Lingkaran', 'background:#D95D39;width:60%;height:60%;border-radius:50%'], frame: ['Bingkai garis tepi', 'border:3px solid #3a3d46;width:60%;height:60%']};
  for (const [k, [n, st]] of Object.entries(basic)) B.querySelector('#sh').appendChild(tileFor(`<i style="display:block;${st}"></i>`, k, n + ' bentuk dasar'));
  const lines = ['arrowLine', 'dblArrow', 'slash'];
  Object.keys(SHP).filter(k => !lines.includes(k) && k !== 'circle').forEach((k, i) => B.querySelector('#sh').appendChild(tileFor(`<svg viewBox="0 0 100 100" preserveAspectRatio="none" style="width:${62 * Math.min(1, shapeSize(k)[0] / shapeSize(k)[1])}%;height:${62 * Math.min(1, shapeSize(k)[1] / shapeSize(k)[0])}%"><path d="${SHP[k]}" fill="${SHAPE_COLORS[(i + 3) % SHAPE_COLORS.length]}" fill-rule="${SHP_EVENODD.has(k) ? 'evenodd' : 'nonzero'}"/></svg>`, 'shp_' + k, `${SHP_NAMES[k]} bentuk`)));
  B.querySelector('#ln').appendChild(tileFor(`<i style="display:block;background:#3a3d46;width:72%;height:4px;border-radius:2px"></i>`, 'line', 'Garis lurus'));
  for (const k of lines) B.querySelector('#ln').appendChild(tileFor(`<svg viewBox="0 0 100 100" preserveAspectRatio="none" style="width:72%;height:${k === 'slash' ? 60 : 14}%"><path d="${SHP[k]}" fill="#3a3d46"/></svg>`, 'shp_' + k, SHP_NAMES[k] + ' garis panah'));
  for (const k of ['doodleArrow', 'doodleLoop', 'scribble']) B.querySelector('#ln').appendChild(tileFor(`<img src="${stickerSrc(k)}" alt="">`, 'stk_' + k, STK[k][0] + ' garis panah coretan', 'stk'));
  for (const [k, n, mask, r] of FRAMES) {
    const style = mask ? '' : `border-radius:${r ? 8 : 2}px`;
    B.querySelector('#fr').appendChild(tileFor(mask ? `<svg viewBox="0 0 100 100" style="width:64%;height:64%"><path d="${SHP[mask] || SHP.circle}" fill="#C3CAD6"/></svg>` : `<i style="display:block;background:#C3CAD6;width:64%;height:64%;${style}"></i>`, 'frm_' + k, `Bingkai ${n} foto`));
  }
  const pol = tile(`<i style="display:block;width:58%;height:68%;background:#fff;box-shadow:0 2px 6px #0003;padding:5px 5px 14px"><i style="display:block;width:100%;height:100%;background:#C3CAD6"></i></i>`, null, addPolaroid, 'Bingkai polaroid');
  B.querySelector('#fr').appendChild(named(pol, 'Bingkai polaroid foto kenangan'));
  for (const k of Object.keys(STK)) B.querySelector('#stk').appendChild(tileFor(`<img src="${stickerSrc(k)}" alt="${esc(STK[k][0])}">`, 'stk_' + k, `${STK[k][0]} stiker ${STK[k][1]}`, 'stk'));
  for (const [kind, n] of [['bar', 'Grafik batang'], ['pie', 'Grafik lingkaran'], ['donut', 'Grafik donat']]) {
    const c = {kind, rows: [['A', 30], ['B', 45], ['C', 25], ['D', 38]]};
    B.querySelector('#ch').appendChild(named(tile(`<img src="${chartSrc(c)}" alt="" style="object-fit:contain;padding:10%">`, null, () => addChart(kind), n), n + ' chart data'));
  }
  for (const g of GRADS) B.querySelector('#gr').appendChild(named(tile(`<i style="display:block;width:70%;height:70%;border-radius:8px;background:linear-gradient(135deg,${g[0]},${g[1]})"></i>`, null, () => add({...PRESETS.rect(), fill: {g: 'linear', a: 135, c: [...g]}}), 'Gradien'), 'Gradien warna'));
  for (const [n, cols] of STYLES) {
    const row = document.createElement('div'); row.className = 'layer'; row.dataset.name = `palet warna ${n}`;
    row.innerHTML = `<span class="nm">${esc(n)}</span>${cols.map(c => `<button title="${c}" aria-label="Warna ${c}" style="width:22px;height:22px;border-radius:50%;background:${c};border:1px solid #0002;padding:0"></button>`).join('')}`;
    row.querySelectorAll('button').forEach(b => b.onclick = () => applyColor(b.title)); B.querySelector('#pl').appendChild(row);
  }
  searchBox(B, 'Cari bentuk, stiker, bingkai…');
}
function addPolaroid() {
  snap(); const s = S(), w = Math.round(s * .42), g = uid(), x = Math.round((D.width - w) / 2), y = Math.round((D.height - w * 1.22) / 2), els = [
    R(x, y, w, Math.round(w * 1.22), '#FFFFFF', {group: g, shadow: {on: true, x: 0, y: 10, blur: 26, color: '#00000040'}, name: 'Kertas polaroid'}),
    Ph(x + w * .06, y + w * .06, w * .88, w * .88, G('#D9DEE7', '#AEB6C4', 160), {group: g}),
    Tx('kenangan manis', x, y + w * 1.0, w, Math.round(w * .075), '#333333', {font: 'Dancing Script', bold: true, align: 'center', group: g})];
  page().elements.push(...els); sel = els.map(e => e.id); commit();
}
function addChart(kind) { const c = {kind, rows: [['Jan', 12], ['Feb', 19], ['Mar', 15], ['Apr', 26]], ink: '#2b2d33'}, ar = kind === 'bar' ? 1.6 : 1, w = Math.round(S() * .55);
  add({type: 'image', src: chartSrc(c), ar, w, h: Math.round(w / ar), radius: 0, crop: {zoom: 1, ox: 0, oy: 0}, chart: c, name: 'Grafik'}); openCtx('chart'); }
function panelChart(B, T, e) {
  T('Grafik'); const c = e.chart;
  B.innerHTML = `<label class="field"><span>Jenis</span><select id="chK"><option value="bar">Batang</option><option value="pie">Lingkaran</option><option value="donut">Donat</option></select></label>
    <label class="field"><span>Data (satu baris: label, angka)</span><textarea id="chD" rows="7" style="font:13px var(--f-mono);padding:8px;border:1px solid var(--line);border-radius:8px">${esc(c.rows.map(r => r.join(', ')).join('\n'))}</textarea></label>
    <div class="grid2"><label class="field"><span>Warna 1</span><input type="color" id="chC1" value="${hex(c.colors?.[0] || '#1F6FB2')}"></label><label class="field"><span>Warna 2</span><input type="color" id="chC2" value="${hex(c.colors?.[1] || '#E8B02A')}"></label></div>
    <label class="field"><span>Warna teks</span><input type="color" id="chI" value="${hex(c.ink || '#2b2d33')}"></label><p class="note">Grafik digambar ulang otomatis dan ikut terekspor ke PNG/PDF.</p>`;
  B.querySelector('#chK').value = c.kind;
  const upd = () => { const rows = B.querySelector('#chD').value.split('\n').map(l => l.split(/[,;\t]/)).filter(r => r[0]?.trim()).map(r => [r[0].trim(), +(r[1] || '0').replace(/[^\d.-]/g, '') || 0]).slice(0, 12);
    const kind = B.querySelector('#chK').value, ar = kind === 'bar' ? 1.6 : 1;
    e.chart = {kind, rows, colors: [B.querySelector('#chC1').value, B.querySelector('#chC2').value, '#D95D39', '#2F8F5B', '#7A4A2A', '#B48CFF'], ink: B.querySelector('#chI').value};
    e.src = chartSrc(e.chart); if (Math.abs((e.ar || 1) - ar) > .01) { e.ar = ar; e.h = Math.round(e.w / ar); } };
  for (const id of ['chK', 'chD', 'chC1', 'chC2', 'chI']) { const el = B.querySelector('#' + id); el.addEventListener('input', () => { snap(); upd(); renderLite(); }); el.addEventListener('change', () => commit()); }
}
function renderLite() { // re-render the canvas without rebuilding the side panel (keeps focus in inputs)
  const c = ctx; ctx = null; const keep = rail; rail = '__'; render(); ctx = c; rail = keep;
}

// ---------- Teks panel ----------
function panelText(B) {
  B.insertAdjacentHTML('beforeend', `<button class="btn primary bigbtn" id="addBox" data-name="tambah kotak teks">${icon('text')} Tambah kotak teks</button><div class="label">Gaya teks default</div><div id="dt" style="display:grid;gap:8px" data-sec></div>
    <div class="label">Gaya teks siap pakai</div><div class="tiles" id="tp" data-sec data-lim="8"></div><div class="label">Kombinasi font</div><div class="tiles" id="fc" data-sec data-lim="4"></div>`);
  B.querySelector('#addBox').onclick = () => startEdit(add({...PRESETS.body(), text: 'Teks Anda'}));
  for (const [k, l, st] of [['heading', 'Tambahkan judul', 'font:800 24px var(--f-display)'], ['sub', 'Tambahkan subjudul', 'font:700 17px var(--f-body)'], ['body', 'Tambahkan sedikit teks isi', 'font:400 13px var(--f-body)']]) {
    const b = document.createElement('button'); b.className = 'addtext'; b.innerHTML = `<span style="${st}">${l}</span>`; b.draggable = true;
    b.ondragstart = ev => ev.dataTransfer.setData('text/plain', JSON.stringify({preset: k})); b.onclick = () => startEdit(add(PRESETS[k]())); b.dataset.name = l + ' teks'; B.querySelector('#dt').appendChild(b);
  }
  for (const [n, txt, o, bg] of TEXT_PRESETS) {
    const b = document.createElement('button'); b.className = 'txtp'; b.style.background = bg; b.title = n; b.dataset.name = `${n} ${txt} ${o.font} gaya teks`;
    const sp = document.createElement('span'); sp.textContent = txt;
    const fake = {fontSize: 20, spacing: 0, ...o, fx: {...o.fx, size: Math.min(6, (o.fx?.size || 8) / 2)}};
    Object.assign(sp.style, {fontFamily: `"${o.font}"`, color: o.color, fontWeight: o.bold ? 700 : 400, fontStyle: o.italic ? 'italic' : 'normal', letterSpacing: (o.spacing || 0) / 2 + 'px', textTransform: o.upper ? 'uppercase' : 'none'}, textFx(fake));
    b.appendChild(sp); b.onclick = () => add({...PRESETS.heading(), ...o, text: txt}); B.querySelector('#tp').appendChild(b);
  }
  for (const [a, b2, c] of [['Bebas Neue', 'Roboto', '#2F5D8A'], ['Playfair Display', 'Montserrat', '#7A4A2A'], ['Bricolage Grotesque', 'Plus Jakarta Sans', '#1D1604'], ['Pacifico', 'Poppins', '#D95D39'], ['DM Serif Display', 'Lora', '#2A1B3D'], ['Oswald', 'Lora', '#13301F'], ['Archivo Black', 'Montserrat', '#111111'], ['Dancing Script', 'Poppins', '#E64980']]) {
    const x = document.createElement('button'); x.className = 'fcard'; x.title = `${a} + ${b2}`;
    x.dataset.name = `${a} ${b2} kombinasi font`; x.innerHTML = `<div style="font-family:'${a}';font-size:22px;line-height:1.1;color:${c}">${a.split(' ')[0]}</div><div style="font-family:'${b2}';font-size:11px;color:var(--muted)">dengan ${b2}</div>`;
    x.onclick = () => { const g = uid(); snap(); const h = {...PRESETS.heading(), font: a, group: g}; h.x = Math.round((D.width - h.w) / 2); h.y = Math.round(D.height * .38);
      const s2 = {...PRESETS.body(), font: b2, group: g}; s2.x = Math.round((D.width - s2.w) / 2); s2.y = h.y + h.fontSize * 1.5;
      for (const e of [h, s2]) { e.id = uid(); e.rot = 0; e.opacity = 1; page().elements.push(e); } sel = [h.id, s2.id]; commit(); };
    B.querySelector('#fc').appendChild(x);
  }
  searchBox(B, 'Cari teks atau font');
}

// ---------- Gaya (one-click restyle) ----------
const lum = c => { const h = hex(c), r = parseInt(h.slice(1, 3), 16), g = parseInt(h.slice(3, 5), 16), b = parseInt(h.slice(5, 7), 16); return .299 * r + .587 * g + .114 * b; };
function panelStyles(B) {
  B.insertAdjacentHTML('beforeend', `<p class="note">Satu klik mengganti warna dan pasangan font di <b>semua halaman</b>. Warna gelap tetap gelap dan terang tetap terang supaya teks tetap terbaca. Bisa diurungkan (Ctrl+Z).</p><div id="sty" style="display:grid;gap:10px" data-sec></div>`);
  for (const st of STYLES) {
    const [n, cols, hf, bf] = st, b = document.createElement('button'); b.className = 'stylecard'; b.dataset.name = `gaya ${n} ${hf} ${bf}`;
    b.innerHTML = `<div class="sw">${cols.map(c => `<i style="background:${c}"></i>`).join('')}</div><b style="font-family:'${hf}'">${esc(n)}</b><span style="font-family:'${bf}'">${esc(hf)} + ${esc(bf)}</span>`;
    b.onclick = () => applyStyle(st); B.querySelector('#sty').appendChild(b);
  }
  searchBox(B, 'Cari gaya');
}
function applyStyle([n, cols, hf, bf]) {
  snap(); const all = new Set(), addc = c => { if (typeof c === 'string' && /^#[0-9a-f]{6}/i.test(c)) all.add(c.slice(0, 7).toUpperCase()); else if (c?.c) c.c.forEach(addc); };
  for (const p of D.pages) { addc(p.bg); for (const e of p.elements) { addc(e.fill); addc(e.color); addc(e.stroke); addc(e.fx?.color); } }
  const src = [...all].sort((a, b) => lum(a) - lum(b)), pal = [...cols].sort((a, b) => lum(a) - lum(b));
  const map = Object.fromEntries(src.map((c, i) => [c, pal[src.length > 1 ? Math.round(i / (src.length - 1) * (pal.length - 1)) : 0]]));
  const sw = c => typeof c === 'string' && /^#[0-9a-f]{6}/i.test(c) ? map[c.slice(0, 7).toUpperCase()] + (c.length === 9 ? c.slice(7) : '') : c?.c ? {...c, c: c.c.map(sw)} : c;
  for (const p of D.pages) { p.bg = sw(p.bg); for (const e of p.elements) { for (const k of ['fill', 'color', 'stroke']) if (e[k]) e[k] = sw(e[k]); if (e.fx?.color) e.fx = {...e.fx, color: sw(e.fx.color)};
    if (e.type === 'text') e.font = e.fontSize >= S() * .055 || (e.bold && e.fontSize >= S() * .04) ? hf : bf; } }
  commit(); Studio.toast(`Gaya "${n}" diterapkan ke ${D.pages.length} halaman · Ctrl+Z untuk urungkan`);
}

// ---------- Foto panel (generated sample images) ----------
const sceneCache = {};
function sceneImage(kind, w, h, seed) {
  const key = `${kind}${w}${h}${seed}`; if (sceneCache[key]) return sceneCache[key];
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'), rnd = (i => () => (i = (i * 9301 + 49297) % 233280) / 233280)(seed * 97 + 13);
  const lg = (y0, y1, stops) => { const g = x.createLinearGradient(0, y0, 0, y1); stops.forEach((s, i) => g.addColorStop(i / (stops.length - 1), s)); return g; };
  if (kind === 'senja' || kind === 'gunung') {
    x.fillStyle = lg(0, h, kind === 'senja' ? ['#2A1B3D', '#B44D6E', '#FF9E5E', '#FFD58A'] : ['#BFE3F5', '#E9F6FB']); x.fillRect(0, 0, w, h);
    x.fillStyle = kind === 'senja' ? '#FFE6A8' : '#FFF6D8'; x.beginPath(); x.arc(w * .65, h * .55, Math.min(w, h) * .12, 0, 7); x.fill();
    const layers = kind === 'senja' ? ['#5B2A4E', '#3E1F3F', '#26142C'] : ['#8FB8A6', '#5E8F7A', '#2F5D4E'];
    layers.forEach((col, li) => { x.fillStyle = col; x.beginPath(); x.moveTo(0, h); for (let i = 0; i <= 8; i++) x.lineTo(i * w / 8, h * (.55 + li * .12) - rnd() * h * .18); x.lineTo(w, h); x.fill(); });
  } else if (kind === 'laut') {
    x.fillStyle = lg(0, h, ['#7FD1F2', '#D8F3FF']); x.fillRect(0, 0, w, h * .55); x.fillStyle = lg(h * .5, h, ['#1F8FBF', '#0E4F7A']); x.fillRect(0, h * .5, w, h * .5);
    x.fillStyle = '#F5E2B8'; x.beginPath(); x.moveTo(0, h); x.quadraticCurveTo(w * .4, h * .75, w, h * .92); x.lineTo(w, h); x.fill();
    x.strokeStyle = '#ffffff80'; x.lineWidth = Math.max(2, h * .006); for (let i = 0; i < 6; i++) { x.beginPath(); const y = h * (.58 + i * .05); x.moveTo(0, y); for (let j = 0; j <= 10; j++) x.quadraticCurveTo(j * w / 10 - w / 20, y - 6, j * w / 10, y); x.stroke(); }
  } else if (kind === 'kota') {
    x.fillStyle = lg(0, h, ['#1C2340', '#3B3F7A', '#7B6FB0']); x.fillRect(0, 0, w, h);
    for (let i = 0; i < 14; i++) { const bw = w / 10 * (.6 + rnd() * .6), bx = rnd() * w, bh = h * (.25 + rnd() * .45); x.fillStyle = ['#151A33', '#222A4D', '#2C3560'][i % 3]; x.fillRect(bx, h - bh, bw, bh);
      x.fillStyle = '#FFD86B'; for (let wy = h - bh + 10; wy < h - 10; wy += 18) for (let wx = bx + 6; wx < bx + bw - 8; wx += 14) if (rnd() > .55) x.fillRect(wx, wy, 6, 8); }
  } else if (kind === 'daun') {
    x.fillStyle = '#E9F4E4'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 18; i++) { x.save(); x.translate(rnd() * w, rnd() * h); x.rotate(rnd() * 6.3); const s = Math.min(w, h) * (.12 + rnd() * .16); x.fillStyle = ['#3F8F5B', '#5DB075', '#2E6B45', '#86C79A'][i % 4];
      x.beginPath(); x.moveTo(0, 0); x.quadraticCurveTo(s * .6, -s * .4, s * 1.4, 0); x.quadraticCurveTo(s * .6, s * .4, 0, 0); x.fill(); x.restore(); }
  } else if (kind === 'meja') {
    x.fillStyle = '#C89B6D'; x.fillRect(0, 0, w, h); x.strokeStyle = '#B38559'; x.lineWidth = 3; for (let i = 0; i < 12; i++) { x.beginPath(); x.moveTo(0, i * h / 12 + rnd() * 10); x.bezierCurveTo(w * .3, i * h / 12 + 20, w * .6, i * h / 12 - 10, w, i * h / 12 + rnd() * 10); x.stroke(); }
    const r = Math.min(w, h) * .2; x.fillStyle = '#FFFFFF'; x.beginPath(); x.arc(w * .4, h * .5, r * 1.3, 0, 7); x.fill(); x.fillStyle = '#EDE6DA'; x.beginPath(); x.arc(w * .4, h * .5, r, 0, 7); x.fill();
    x.fillStyle = '#6B3E1F'; x.beginPath(); x.arc(w * .4, h * .5, r * .82, 0, 7); x.fill(); x.fillStyle = '#E8C9A0'; x.beginPath(); x.arc(w * .38, h * .48, r * .35, 0, 7); x.fill();
    x.fillStyle = '#2F8F5B'; x.beginPath(); x.ellipse(w * .78, h * .3, r * .5, r * .22, .6, 0, 7); x.fill();
  } else if (kind === 'bokeh') {
    x.fillStyle = lg(0, h, ['#1B1A2F', '#3A2350']); x.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) { const r = Math.min(w, h) * (.02 + rnd() * .08); x.fillStyle = `hsla(${30 + rnd() * 30},90%,${60 + rnd() * 20}%,${.15 + rnd() * .35})`; x.beginPath(); x.arc(rnd() * w, rnd() * h, r, 0, 7); x.fill(); }
  } else if (kind === 'abstrak') {
    x.fillStyle = '#F6EFE6'; x.fillRect(0, 0, w, h); const cols = ['#E8B02A', '#D95D39', '#2F5D8A', '#36C5B1', '#2A1B3D'];
    for (let i = 0; i < 7; i++) { x.fillStyle = cols[i % cols.length]; x.globalAlpha = .9; const s = Math.min(w, h) * (.18 + rnd() * .25); if (i % 2) { x.beginPath(); x.arc(rnd() * w, rnd() * h, s / 2, 0, 7); x.fill(); } else { x.save(); x.translate(rnd() * w, rnd() * h); x.rotate(rnd() * 3); x.fillRect(-s / 2, -s / 4, s, s / 2); x.restore(); } }
    x.globalAlpha = 1;
  } else { // studio: soft backdrop with product-like pill
    x.fillStyle = lg(0, h, ['#F4E9FF', '#FFE6EF']); x.fillRect(0, 0, w, h); x.fillStyle = '#00000014'; x.beginPath(); x.ellipse(w / 2, h * .8, w * .22, h * .04, 0, 0, 7); x.fill();
    x.fillStyle = lg(h * .3, h * .78, ['#B48CFF', '#7048E8']); x.beginPath(); x.roundRect(w / 2 - w * .12, h * .3, w * .24, h * .48, w * .06); x.fill(); x.fillStyle = '#ffffff55'; x.fillRect(w / 2 - w * .08, h * .34, w * .03, h * .38);
  }
  x.font = `600 ${Math.max(12, Math.round(Math.min(w, h) * .045))}px Arial, sans-serif`; x.fillStyle = '#ffffffd0'; x.textAlign = 'right'; x.textBaseline = 'bottom';
  x.shadowColor = '#0006'; x.shadowBlur = 4; x.fillText('Contoh', w - 12, h - 10);
  return sceneCache[key] = c.toDataURL('image/jpeg', .86);
}
const SCENES = [['Senja di bukit', 'senja', 720, 540], ['Pantai siang', 'laut', 540, 720], ['Kota malam', 'kota', 720, 480], ['Daun tropis', 'daun', 600, 600], ['Kopi di meja', 'meja', 720, 540], ['Lampu bokeh', 'bokeh', 540, 720],
  ['Bentuk abstrak', 'abstrak', 600, 600], ['Studio produk', 'studio', 540, 720], ['Gunung pagi', 'gunung', 720, 405], ['Senja lebar', 'senja', 800, 450], ['Pantai lebar', 'laut', 800, 450], ['Kota tinggi', 'kota', 480, 760],
  ['Daun panjang', 'daun', 480, 760], ['Sarapan', 'meja', 600, 600], ['Bokeh hangat', 'bokeh', 720, 540], ['Abstrak tinggi', 'abstrak', 500, 760]];
function panelPhotos(B) {
  B.insertAdjacentHTML('beforeend', `<div class="label">${Studio.connected ? 'Foto di komputer' : 'Gambar contoh'}</div><div class="tiles masonry" id="pc" data-sec data-lim="${Studio.connected ? 6 : 10}"></div>`);
  if (!Studio.connected) {
    B.insertAdjacentHTML('afterbegin', `<p class="note">Foto di komputer Anda muncul di sini setelah Studio terhubung (jalankan <span class="mono">creative-mcp studio</span>). Di bawah ini gambar contoh yang digambar oleh Rakit, bukan foto stok.</p>`);
    SCENES.forEach(([n, k, w, h], i) => { const src = sceneImage(k, w, h, i + 1), t = tile(`<img src="${src}" alt="${n}"><span class="cap">Contoh · ${n}</span>`, {src, ar: w / h}, () => placeImage(src, w / h), n);
      t.style.aspectRatio = `${w}/${h}`; B.querySelector('#pc').appendChild(named(t, `${n} ${k} foto contoh`)); });
  } else Studio.api('/api/library').then(lib => { lib.filter(i => i.type === 'photo').slice(0, 150).forEach(i => {
    const src = 'path:' + i.path; B.querySelector('#pc')?.appendChild(named(tile(`<img loading="lazy" src="${Studio.mediaUrl(i.path)}" alt="">`, {src, ar: 1}, () => placeImage(src, 1), i.name), i.name || 'foto'));
  }); if (rail === 'pc' && !ctx) sections(B); }).catch(err => Studio.toast(err.message));
  searchBox(B, 'Cari foto');
}

// ---------- Bingkai (image masks) + chroma key ----------
const MASKS = [['', 'Tanpa'], ['circle', 'Lingkaran'], ['squircle', 'Sudut bulat'], ['heart', 'Hati'], ['arch', 'Lengkung'], ['blob', 'Blob'], ['hexagon', 'Segi enam'], ['starRound', 'Bintang'], ['drop', 'Tetes'], ['diamond', 'Belah ketupat'], ['ticket', 'Tiket'], ['shield', 'Perisai']];
function maskTiles(e) {
  return `<div class="tiles three" id="mk">${MASKS.map(([k, n]) => `<button class="tile${(e.mask || '') === k ? ' on' : ''}" data-m="${k}" title="${n}" style="${(e.mask || '') === k ? 'border-color:var(--select);box-shadow:0 0 0 1px var(--select)' : ''}">${k ? `<svg viewBox="0 0 100 100" style="width:58%;height:58%"><path d="${SHP[k]}" fill="#9AA3B2"/></svg>` : '<i style="display:block;width:58%;height:58%;background:#9AA3B2"></i>'}<span class="cap">${n}</span></button>`).join('')}</div>`;
}
function bindMasks(B) { B.querySelectorAll('[data-m]').forEach(b => b.onclick = () => setAll(x => { if (b.dataset.m) { x.mask = b.dataset.m; if (x.type === 'rect' || x.type === 'image') { const s = Math.min(x.w, x.h); if (['circle', 'heart', 'starRound', 'hexagon', 'squircle', 'blob'].includes(b.dataset.m) && Math.abs(x.w - x.h) > 2) { x.w = x.h = s; } } } else delete x.mask; })); }
function panelMask(B, T, e) { T('Bingkai'); B.innerHTML = `<p class="note">Potong foto atau bingkai foto ke dalam bentuk. Foto bisa diganti tanpa kehilangan bentuknya.</p>${maskTiles(e)}`; bindMasks(B); }
function photoExtras(B, e) {
  B.insertAdjacentHTML('beforeend', `<div class="label">Bingkai bentuk</div>${maskTiles(e)}
    <div class="label">Hapus latar warna <span class="tier note">dasar</span></div>
    <p class="note">Untuk gambar berlatar <b>satu warna rata</b> (mis. logo di latar putih). Hapus latar otomatis berbasis AI untuk foto biasa adalah fitur ${PRO} dan tidak tersedia di sini.</p>
    <div class="row"><input type="color" id="ckC" value="#ffffff" title="Warna latar"><button class="btn" id="ckPick">Ambil dari sudut</button></div>
    <label class="field"><span>Toleransi <b class="mono" id="ckV">40</b></span><input type="range" id="ckT" min="5" max="160" value="40"></label>
    <button class="btn" id="ckGo">${icon('wand')} Hapus latar warna</button>`);
  bindMasks(B);
  const t = B.querySelector('#ckT'); t.oninput = () => B.querySelector('#ckV').textContent = t.value;
  B.querySelector('#ckPick').onclick = async () => { try { const c = await cornerColor(e); B.querySelector('#ckC').value = c; } catch { Studio.toast('Warna gambar tidak bisa dibaca.'); } };
  B.querySelector('#ckGo').onclick = async () => { try { await chromaKey(e, B.querySelector('#ckC').value, +t.value); Studio.toast('Latar warna dihapus · Ctrl+Z untuk urungkan'); } catch (err) { Studio.toast('Gagal memproses gambar: ' + err.message, 5000); } };
  cornerColor(e).then(c => { const i = B.querySelector('#ckC'); if (i) i.value = c; }).catch(() => {});
}
async function imgPixels(e) {
  const img = await loadImg(imgSrc(e.src)), k = Math.min(1, 1600 / Math.max(img.naturalWidth || img.width, img.naturalHeight || img.height));
  const c = document.createElement('canvas'); c.width = Math.max(1, Math.round((img.naturalWidth || img.width) * k)); c.height = Math.max(1, Math.round((img.naturalHeight || img.height) * k));
  const x = c.getContext('2d', {willReadFrequently: true}); x.drawImage(img, 0, 0, c.width, c.height); return [c, x, x.getImageData(0, 0, c.width, c.height)];
}
async function cornerColor(e) { const [, , d] = await imgPixels(e), p = d.data; return '#' + [0, 1, 2].map(i => p[i].toString(16).padStart(2, '0')).join(''); }
async function chromaKey(e, col, tol) {
  const [c, x, d] = await imgPixels(e), p = d.data, r0 = parseInt(col.slice(1, 3), 16), g0 = parseInt(col.slice(3, 5), 16), b0 = parseInt(col.slice(5, 7), 16), soft = tol * .5;
  for (let i = 0; i < p.length; i += 4) { const dist = Math.hypot(p[i] - r0, p[i + 1] - g0, p[i + 2] - b0); if (dist < tol) p[i + 3] = 0; else if (dist < tol + soft) p[i + 3] = Math.round(p[i + 3] * (dist - tol) / soft); }
  x.putImageData(d, 0, 0); snap(); e.src = c.toDataURL('image/png'); e.ar = c.width / c.height; commit();
}

// ---------- animation ----------
function animFrames(type, box) { // box: {ox, oy} transform-origin and clip insets for full-page layers (presentation); null for editor nodes
  const big = !box, mv = big ? '40%' : '6%';
  switch (type) {
    case 'fade': return [[{opacity: 0}, {opacity: 1}], 'ease-out'];
    case 'slide': return [[{opacity: 0, translate: `0 ${mv}`}, {opacity: 1, translate: '0 0'}], 'cubic-bezier(.2,.8,.2,1)'];
    case 'zoom': return [[{opacity: 0, scale: '.5'}, {opacity: 1, scale: '1'}], 'cubic-bezier(.2,.8,.2,1)'];
    case 'pop': return [[{opacity: 0, scale: '0', offset: 0}, {opacity: 1, scale: '1.12', offset: .7}, {opacity: 1, scale: '1', offset: 1}], 'ease-out'];
    case 'bounce': return [[{opacity: 0, translate: `0 -${big ? '60%' : '10%'}`, offset: 0}, {opacity: 1, translate: '0 0', offset: .45}, {translate: `0 -${big ? '18%' : '3%'}`, offset: .68}, {translate: '0 0', offset: .85}, {translate: '0 0', offset: 1}], 'ease-out'];
    case 'type': case 'wipe': {
      const [a, b] = box ? [`inset(${box.t}% ${100 - box.l}% ${box.b}% ${box.l}%)`, `inset(${box.t}% ${box.r}% ${box.b}% ${box.l}%)`] : ['inset(0 100% 0 0)', 'inset(0 0 0 0)'];
      return [[{clipPath: a}, {clipPath: b}], type === 'type' ? `steps(${box?.n || 14}, end)` : 'ease-in-out'];
    }
    default: return [[{opacity: 1}, {opacity: 1}], 'linear'];
  }
}
function runAnim(node, e, i, box) {
  const a = e.anim; if (!a?.type || a.type === 'none') return null;
  const [frames, easing] = animFrames(a.type, box ? {...box, n: Math.max(4, Math.min(40, (e.text || '').length || 14))} : null), dur = (a.dur || .8) * 1000;
  if (box) node.style.transformOrigin = `${box.ox}% ${box.oy}%`;
  return node.animate(frames, {duration: dur, delay: (a.delay ?? i * .18) * 1000 + 150, easing, fill: 'backwards'});
}
function playEditor() { // preview animations of the current page on the canvas
  stopEdit(); sel = []; render(); const p = page(), anims = p.elements.filter(e => e.anim?.type && e.anim.type !== 'none' && !e.hidden);
  const pg = $(`.page[data-pi="${cur}"]`); if (!pg) return;
  if (!anims.length && (!p.trans || p.trans === 'none')) return Studio.toast('Belum ada animasi di halaman ini. Pilih elemen lalu klik Animasi.');
  if (p.trans && p.trans !== 'none') transitionAnim(pg, p.trans, 1);
  anims.forEach((e, i) => { const n = pg.querySelector(`[data-id="${e.id}"]`); if (n) runAnim(n, e, i); });
}
function transitionAnim(node, t, dir) {
  const d = dir < 0 ? -1 : 1, f = {fade: [{opacity: 0}, {opacity: 1}], slide: [{translate: `${d * 100}% 0`}, {translate: '0 0'}], zoom: [{scale: '.85', opacity: 0}, {scale: '1', opacity: 1}], wipe: [{clipPath: 'inset(0 0 0 100%)'}, {clipPath: 'inset(0 0 0 0)'}]}[t];
  if (f && !REDUCED) node.animate(f, {duration: 520, easing: 'cubic-bezier(.2,.8,.2,1)'});
}
function panelAnim(B, T) {
  const e = one(), p = page();
  T('Animasi');
  let h = '';
  if (e) {
    const a = e.anim || {type: 'none', dur: .8};
    h += `<div class="label">Animasi elemen (masuk)</div><div class="animgrid" id="ag">${ANIMS.map(([k, n, pro]) => `<button data-a="${k}" class="${a.type === k ? 'on' : ''}" style="--demo:d-${k}"><i></i>${n}${pro ? PRO.replace('Pro di Canva', 'Pro') : ''}</button>`).join('')}</div>
      <label class="field"><span>Durasi <b class="mono" id="adV">${(a.dur || .8).toFixed(1)} dtk</b></span><input type="range" id="aDur" min="0.3" max="3" step="0.1" value="${a.dur || .8}"></label>
      <label class="field"><span>Mulai setelah <b class="mono" id="alV">${a.delay == null ? 'otomatis' : a.delay.toFixed(1) + ' dtk'}</b></span><input type="range" id="aDel" min="-0.1" max="5" step="0.1" value="${a.delay ?? -0.1}"></label>
      <p class="note">Animasi dengan label Pro adalah fitur berbayar di Canva; di Rakit gratis. Animasi diputar saat presentasi dan tombol Putar.</p>`;
  } else if (sel.length > 1) h += `<p class="note">Pilih satu elemen untuk mengatur animasinya.</p>`;
  h += `<div class="label">Transisi halaman ${cur + 1}</div><div class="animgrid" id="tg">${TRANS.map(([k, n, pro]) => `<button data-t="${k}" class="${(p.trans || 'none') === k ? 'on' : ''}" style="--demo:d-${k === 'slide' ? 'slide' : k}"><i></i>${n}${pro ? PRO.replace('Pro di Canva', 'Pro') : ''}</button>`).join('')}</div>
    <button class="btn" id="tAll">Terapkan transisi ke semua halaman</button>
    <div class="grid2"><button class="btn primary" id="aPlay">${icon('play')} Putar</button><button class="btn" id="aPres">${icon('expand')} Presentasi</button></div>`;
  B.innerHTML = h;
  B.querySelectorAll('[data-a]').forEach(b => b.onclick = () => { setAll(x => { x.anim = {dur: .8, ...x.anim, type: b.dataset.a}; if (b.dataset.a === 'none') delete x.anim; }); requestAnimationFrame(() => { const id = e.id; const n = $(`.el[data-id="${id}"]`); const [ee] = findEl(id); if (n && ee?.anim) runAnim(n, {...ee, anim: {...ee.anim, delay: 0}}, 0); }); });
  const dur = B.querySelector('#aDur'); if (dur) bindInput(dur, v => { for (const x of selected()) x.anim = {type: 'fade', ...x.anim, dur: v}; B.querySelector('#adV').textContent = v.toFixed(1) + ' dtk'; });
  const del = B.querySelector('#aDel'); if (del) bindInput(del, v => { for (const x of selected()) { x.anim = {type: 'fade', ...x.anim}; if (v < 0) delete x.anim.delay; else x.anim.delay = v; } B.querySelector('#alV').textContent = v < 0 ? 'otomatis' : v.toFixed(1) + ' dtk'; });
  B.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { snap(); page().trans = b.dataset.t; commit(); const pg = $(`.page[data-pi="${cur}"]`); if (pg) transitionAnim(pg, b.dataset.t, 1); });
  B.querySelector('#tAll').onclick = () => { snap(); const t = page().trans || 'none'; D.pages.forEach(q => q.trans = t); commit(); Studio.toast('Transisi diterapkan ke semua halaman'); };
  B.querySelector('#aPlay').onclick = playEditor; B.querySelector('#aPres').onclick = present;
}

// ---------- presentation stage (layers so each animated element moves on its own) ----------
async function buildStage(p, k) {
  await document.fonts.ready;
  const imgs = {}; for (const e of p.elements) if (e.type === 'image' && !e.hidden) { try { imgs[e.id] = await loadImg(imgSrc(e.src)); } catch {} }
  const st = document.createElement('div'); st.className = 'stage'; st.style.setProperty('--ar', D.width / D.height);
  const mk = () => { const c = document.createElement('canvas'); c.width = Math.round(D.width * k); c.height = Math.round(D.height * k); const x = c.getContext('2d'); x.scale(k, k); st.appendChild(c); return x; };
  let x = mk(); x.fillStyle = canvasFill(x, p.bg, D.width, D.height); x.fillRect(0, 0, D.width, D.height);
  for (const e of p.elements) {
    if (e.hidden) continue;
    if (e.anim?.type && e.anim.type !== 'none') { const ax = mk(); drawEl(ax, e, k, imgs[e.id]); ax.canvas.dataset.eid = e.id; x = null; }
    else { x ??= mk(); drawEl(x, e, k, imgs[e.id]); }
  }
  return st;
}
function playTransition(st, t, dir) { if (dir && t && t !== 'none') transitionAnim(st, t, dir); }
function playStage(st, p) {
  if (REDUCED) return; let i = 0;
  for (const c of st.querySelectorAll('canvas[data-eid]')) { const e = p.elements.find(x => x.id === c.dataset.eid); if (!e) continue;
    const box = {l: e.x / D.width * 100, r: 100 - (e.x + e.w) / D.width * 100, t: Math.max(0, e.y / D.height * 100 - 1), b: Math.max(0, 100 - (e.y + e.h) / D.height * 100 - 1), ox: (e.x + e.w / 2) / D.width * 100, oy: (e.y + e.h / 2) / D.height * 100};
    runAnim(c, e, i++, box); }
}

// ---------- canvas navigation: zoom around the cursor, space + drag to pan ----------
let wheelAcc = 0, wheelRaf = 0, wheelAt = null;
function wheelZoom(ev) {
  wheelAcc += ev.deltaMode === 1 ? ev.deltaY * 16 : ev.deltaY; wheelAt = {x: ev.clientX, y: ev.clientY};
  if (wheelRaf) return;
  wheelRaf = requestAnimationFrame(() => { wheelRaf = 0; const f = Math.exp(-Math.max(-300, Math.min(300, wheelAcc)) * .0022); wheelAcc = 0; zoomAt(zoom * f, wheelAt.x, wheelAt.y); });
}
function zoomAt(nz, cx, cy) {
  nz = Math.max(.05, Math.min(3, nz)); if (Math.abs(nz - zoom) < 1e-4) return;
  const W = $('#work'), pgs = $$('.page'); if (!pgs.length) return setZoom(nz);
  const target = pgs.find(p => { const r = p.getBoundingClientRect(); return cy >= r.top - 13 && cy <= r.bottom + 13; }) || pgs[cur] || pgs[0];
  const pi = target.dataset.pi, r = target.getBoundingClientRect(), fx = (cx - r.left) / r.width, fy = (cy - r.top) / r.height;
  zoom = nz; render();
  const r2 = $(`.page[data-pi="${pi}"]`).getBoundingClientRect();
  W.scrollLeft += r2.left + fx * r2.width - cx; W.scrollTop += r2.top + fy * r2.height - cy; placeMini();
}
let spaceDown = false;
addEventListener('keydown', ev => {
  if (ev.code !== 'Space' || presenting || editing || ev.target.matches?.('input,select,textarea,[contenteditable=true]')) return;
  ev.preventDefault(); if (!spaceDown) { spaceDown = true; document.body.classList.add('panning'); }
});
addEventListener('keyup', ev => { if (ev.code === 'Space' && spaceDown) { ev.preventDefault(); spaceDown = false; document.body.classList.remove('panning'); } });
addEventListener('blur', () => { spaceDown = false; document.body.classList.remove('panning', 'dragging'); });
$('#work').addEventListener('pointerdown', ev => {
  if (!(spaceDown || ev.button === 1)) return;
  ev.preventDefault(); ev.stopPropagation(); const W = $('#work'), sx = ev.clientX, sy = ev.clientY, l0 = W.scrollLeft, t0 = W.scrollTop; document.body.classList.add('dragging');
  const mv = m => { W.scrollLeft = l0 - (m.clientX - sx); W.scrollTop = t0 - (m.clientY - sy); };
  const up = () => { removeEventListener('pointermove', mv); removeEventListener('pointerup', up); document.body.classList.remove('dragging'); };
  addEventListener('pointermove', mv); addEventListener('pointerup', up);
}, true);

// ---------- footer play button ----------
{ const b = document.createElement('button'); b.className = 'btn ghost'; b.id = 'playBtn'; b.title = 'Putar animasi halaman ini'; b.innerHTML = `${icon('play')}<span class="lbl"> Putar</span>`; b.onclick = playEditor; $('#presentBtn').before(b); }

preloadStickers().then(boot);
