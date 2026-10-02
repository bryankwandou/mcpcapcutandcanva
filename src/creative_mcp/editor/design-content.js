// Rakit Desain — original built-in content: vector shapes, stickers, templates, text presets, styles.
// Everything here is drawn in code by the Rakit project (no external or third-party assets).
'use strict';

// ---------- vector shapes (100×100 unit paths using only M/L/C/Q/Z so they scale per axis) ----------
const KAPPA = 0.5523;
const pEll = (cx, cy, rx, ry) => `M${cx - rx} ${cy} C${cx - rx} ${cy - KAPPA * ry} ${cx - KAPPA * rx} ${cy - ry} ${cx} ${cy - ry} C${cx + KAPPA * rx} ${cy - ry} ${cx + rx} ${cy - KAPPA * ry} ${cx + rx} ${cy} C${cx + rx} ${cy + KAPPA * ry} ${cx + KAPPA * rx} ${cy + ry} ${cx} ${cy + ry} C${cx - KAPPA * rx} ${cy + ry} ${cx - rx} ${cy + KAPPA * ry} ${cx - rx} ${cy} Z`;
const pPoly = pts => 'M' + pts.map(p => p.map(v => +v.toFixed(2)).join(' ')).join(' L') + ' Z';
const pSmooth = pts => { const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2].map(v => +v.toFixed(2)), n = pts.length;
  let d = `M${mid(pts[n - 1], pts[0]).join(' ')}`; for (let i = 0; i < n; i++) d += ` Q${pts[i].map(v => +v.toFixed(2)).join(' ')} ${mid(pts[i], pts[(i + 1) % n]).join(' ')}`; return d + ' Z'; };
const pRadial = (n, r1, r2, rot = -90) => Array.from({length: n * 2}, (_, i) => { const r = i % 2 ? r2 : r1, a = (rot + i * 180 / n) * Math.PI / 180; return [50 + r * Math.cos(a), 50 + r * Math.sin(a)]; });
const pNgon = (n, rot = -90) => Array.from({length: n}, (_, i) => { const a = (rot + i * 360 / n) * Math.PI / 180; return [50 + 50 * Math.cos(a), 50 + 50 * Math.sin(a)]; });
const pRound = (x, y, w, h, r) => `M${x + r} ${y} L${x + w - r} ${y} Q${x + w} ${y} ${x + w} ${y + r} L${x + w} ${y + h - r} Q${x + w} ${y + h} ${x + w - r} ${y + h} L${x + r} ${y + h} Q${x} ${y + h} ${x} ${y + h - r} L${x} ${y + r} Q${x} ${y} ${x + r} ${y} Z`;
const blobPts = (rs) => rs.map((r, i) => { const a = (-90 + i * 360 / rs.length) * Math.PI / 180; return [50 + r * Math.cos(a), 50 + r * Math.sin(a)]; });
const SHP = {
  triangle: pPoly([[50, 0], [100, 100], [0, 100]]),
  star: pPoly(pRadial(5, 50, 20)),
  hexagon: pPoly([[25, 0], [75, 0], [100, 50], [75, 100], [25, 100], [0, 50]]),
  pentagon: pPoly(pNgon(5).map(([x, y]) => [x, (y - 2.45) * 100 / 90.45])),
  octagon: pPoly([[29.3, 0], [70.7, 0], [100, 29.3], [100, 70.7], [70.7, 100], [29.3, 100], [0, 70.7], [0, 29.3]]),
  diamond: pPoly([[50, 0], [100, 50], [50, 100], [0, 50]]),
  parallelogram: pPoly([[25, 0], [100, 0], [75, 100], [0, 100]]),
  trapezoid: pPoly([[22, 0], [78, 0], [100, 100], [0, 100]]),
  rtriangle: pPoly([[0, 0], [100, 100], [0, 100]]),
  arrow: pPoly([[0, 30], [58, 30], [58, 4], [100, 50], [58, 96], [58, 70], [0, 70]]),
  chevron: pPoly([[0, 0], [70, 0], [100, 50], [70, 100], [0, 100], [30, 50]]),
  cross: pPoly([[35, 0], [65, 0], [65, 35], [100, 35], [100, 65], [65, 65], [65, 100], [35, 100], [35, 65], [0, 65], [0, 35], [35, 35]]),
  heart: 'M50 96 C22 76 0 58 0 32 C0 14 13 2 29 2 C39 2 46 8 50 16 C54 8 61 2 71 2 C87 2 100 14 100 32 C100 58 78 76 50 96 Z',
  bubble: 'M14 0 L86 0 Q100 0 100 14 L100 62 Q100 76 86 76 L42 76 L20 100 L24 76 L14 76 Q0 76 0 62 L0 14 Q0 0 14 0 Z',
  bubbleRound: 'M50 0 C78 0 100 17 100 40 C100 63 78 80 50 80 C44 80 38 79 33 78 L12 98 L18 72 C7 65 0 53 0 40 C0 17 22 0 50 0 Z',
  star4: pPoly(pRadial(4, 50, 14, -90)),
  starRound: pSmooth(pRadial(5, 54, 30)),
  burst: pPoly(pRadial(14, 50, 40)),
  blob: pSmooth(blobPts([52, 44, 50, 40, 54, 46, 50, 42])),
  blob2: pSmooth(blobPts([46, 54, 40, 52, 44, 56, 42, 50, 48, 44])),
  ring: pEll(50, 50, 50, 50) + ' ' + pEll(50, 50, 30, 30),
  halfcircle: 'M0 100 C0 44.77 22.39 0 50 0 C77.61 0 100 44.77 100 100 Z',
  quarter: 'M0 0 C55.23 0 100 44.77 100 100 L0 100 Z',
  arch: 'M0 100 L0 50 C0 22.39 22.39 0 50 0 C77.61 0 100 22.39 100 50 L100 100 Z',
  shield: 'M50 0 L100 14 L100 46 C100 74 78 92 50 100 C22 92 0 74 0 46 L0 14 Z',
  drop: 'M50 0 C50 0 90 44 90 66 C90 88 72 100 50 100 C28 100 10 88 10 66 C10 44 50 0 50 0 Z',
  cloud: 'M24 90 C10 90 0 80 0 66 C0 53 9 44 21 43 C22 26 35 14 51 14 C64 14 75 22 79 34 C91 35 100 46 100 60 C100 77 89 90 74 90 Z',
  tag: 'M0 18 Q0 0 18 0 L70 0 L100 50 L70 100 L18 100 Q0 100 0 82 Z',
  arrowLine: pPoly([[0, 42], [82, 42], [82, 18], [100, 50], [82, 82], [82, 58], [0, 58]]),
  dblArrow: pPoly([[0, 50], [16, 18], [16, 42], [84, 42], [84, 18], [100, 50], [84, 82], [84, 58], [16, 58], [16, 82]]),
  slash: pPoly([[70, 0], [100, 0], [30, 100], [0, 100]]),
  squircle: pRound(0, 0, 100, 100, 32),
  ticket: 'M0 0 L100 0 L100 38 C92 38 88 44 88 50 C88 56 92 62 100 62 L100 100 L0 100 L0 62 C8 62 12 56 12 50 C12 44 8 38 0 38 Z',
};
const SHP_EVENODD = new Set(['ring']);
const SHP_NAMES = {triangle: 'Segitiga', star: 'Bintang', hexagon: 'Segi enam', pentagon: 'Segi lima', octagon: 'Segi delapan', diamond: 'Belah ketupat', parallelogram: 'Jajaran genjang',
  trapezoid: 'Trapesium', rtriangle: 'Segitiga siku', arrow: 'Panah blok', chevron: 'Chevron', cross: 'Tanda tambah', heart: 'Hati', bubble: 'Balon percakapan', bubbleRound: 'Balon percakapan bulat',
  star4: 'Bintang empat', starRound: 'Bintang bulat', burst: 'Ledakan', blob: 'Blob', blob2: 'Blob gelombang', ring: 'Cincin donat', halfcircle: 'Setengah lingkaran', quarter: 'Seperempat lingkaran',
  arch: 'Lengkung', shield: 'Perisai', drop: 'Tetes', cloud: 'Awan', tag: 'Label', arrowLine: 'Garis panah', dblArrow: 'Panah dua arah', slash: 'Garis miring', squircle: 'Kotak lembut', ticket: 'Tiket'};
const pathCache = new Map();
function shapePath(type, w, h) { // scale a unit path to w×h px
  const key = `${type}|${w}|${h}`; if (pathCache.has(key)) return pathCache.get(key);
  const d = SHP[type]; if (!d) return null; let i = 0;
  const out = d.replace(/-?\d*\.?\d+(?:e-?\d+)?/g, n => { const v = +n * (i++ % 2 ? h : w) / 100; return +v.toFixed(2); });
  if (pathCache.size > 4000) pathCache.clear(); pathCache.set(key, out); return out;
}
const cssShapeClip = (type, w, h) => `path(${SHP_EVENODD.has(type) ? 'evenodd, ' : ''}'${shapePath(type, w, h)}')`;

// ---------- stickers: original inline SVG illustrations ----------
const svgDoc = (body, w = 100, h = 100) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w * 4}" height="${h * 4}" viewBox="0 0 ${w} ${h}">${body}</svg>`;
const F = 'font-family="Arial, Helvetica, sans-serif" font-weight="900"';
const face = (bg, eyes, mouth) => `<circle cx="50" cy="50" r="46" fill="${bg}" stroke="#3a2a12" stroke-width="3"/>${eyes}${mouth}`;
const STK = {
  sun: ['Matahari', 'cerah siang musim panas', `<g stroke="#F59E0B" stroke-width="6" stroke-linecap="round">${Array.from({length: 12}, (_, i) => { const a = i * Math.PI / 6; return `<line x1="${50 + 34 * Math.cos(a)}" y1="${50 + 34 * Math.sin(a)}" x2="${50 + 46 * Math.cos(a)}" y2="${50 + 46 * Math.sin(a)}"/>`; }).join('')}</g><circle cx="50" cy="50" r="26" fill="#FBBF24"/><circle cx="42" cy="44" r="7" fill="#FDE68A"/>`],
  cloud: ['Awan', 'langit cuaca', `<path d="${SHP.cloud}" fill="#fff" stroke="#9DB7D5" stroke-width="3" transform="translate(4 8) scale(.92 .8)"/><path d="M22 70 Q40 62 58 70" stroke="#D6E4F2" stroke-width="4" fill="none" stroke-linecap="round"/>`],
  coffee: ['Cangkir kopi', 'kopi minum kafe cafe', `<path d="M18 38 L74 38 L68 84 Q66 92 58 92 L34 92 Q26 92 24 84 Z" fill="#fff" stroke="#5B3A1E" stroke-width="4"/><path d="M73 48 Q90 48 88 62 Q86 74 70 72" fill="none" stroke="#5B3A1E" stroke-width="4"/><path d="M22 46 L71 46 L69 60 L24 60 Z" fill="#8B5A2B"/><path d="M36 10 Q30 18 36 26 M50 6 Q44 16 50 26 M62 12 Q56 20 62 28" stroke="#C9A27A" stroke-width="3.5" fill="none" stroke-linecap="round"/>`],
  sparkle: ['Kilau', 'bintang kilap bersinar', `<path d="${SHP.star4}" fill="#FFD43B"/><path d="M80 6 L83 15 L92 18 L83 21 L80 30 L77 21 L68 18 L77 15 Z" fill="#FFE98A"/><path d="M16 70 L18 76 L24 78 L18 80 L16 86 L14 80 L8 78 L14 76 Z" fill="#FFE98A"/>`],
  leaf: ['Daun', 'tanaman alam hijau', `<path d="M14 88 C8 44 40 10 90 10 C92 58 62 92 14 88 Z" fill="#40A86B"/><path d="M14 88 C36 64 56 44 82 20" stroke="#E8F7EE" stroke-width="3.5" fill="none" stroke-linecap="round"/><path d="M38 64 L36 46 M54 48 L56 32 M48 56 L66 56" stroke="#E8F7EE" stroke-width="2.5" stroke-linecap="round"/>`],
  flower: ['Bunga', 'bunga taman cantik', `${Array.from({length: 6}, (_, i) => `<ellipse cx="50" cy="26" rx="14" ry="22" fill="#F783AC" transform="rotate(${i * 60} 50 50)"/>`).join('')}<circle cx="50" cy="50" r="14" fill="#FFD43B"/><circle cx="46" cy="46" r="4" fill="#FFF3BF"/>`],
  promo: ['Lencana PROMO', 'promo diskon label badge', `<path d="${SHP.burst}" fill="#E03131" transform="translate(2 2) scale(.96)"/><circle cx="50" cy="50" r="33" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="3 3"/><text x="50" y="58" text-anchor="middle" font-size="20" fill="#fff" ${F}>PROMO</text>`],
  ribbon: ['Pita', 'banner pita judul', `<path d="M0 22 L16 22 L16 42 L0 42 L8 32 Z M100 22 L84 22 L84 42 L100 42 L92 32 Z" fill="#A61E4D"/><path d="M10 12 L90 12 L90 36 L10 36 Z" fill="#D6336C"/><path d="M10 36 L16 42 L16 36 Z M90 36 L84 42 L84 36 Z" fill="#5C0F2B"/><text x="50" y="30" text-anchor="middle" font-size="13" fill="#fff" ${F}>SPESIAL</text>`, 100, 50],
  pricetag: ['Label harga', 'harga diskon toko', `<path d="M8 40 L40 8 L88 8 Q92 8 92 12 L92 60 L60 92 Q56 96 52 92 L8 48 Q4 44 8 40 Z" fill="#FAB005" transform="rotate(-8 50 50)"/><circle cx="76" cy="24" r="6" fill="#fff"/><text x="50" y="62" text-anchor="middle" font-size="18" fill="#3B2600" ${F} transform="rotate(-48 50 56)">HEMAT</text>`],
  pin: ['Pin lokasi', 'lokasi alamat peta map', `<path d="M50 96 C50 96 16 60 16 38 C16 18 31 4 50 4 C69 4 84 18 84 38 C84 60 50 96 50 96 Z" fill="#E8590C"/><circle cx="50" cy="38" r="14" fill="#fff"/>`],
  phone: ['Ponsel', 'telepon hp kontak whatsapp', `<rect x="26" y="4" width="48" height="92" rx="9" fill="#343A40"/><rect x="31" y="14" width="38" height="68" rx="3" fill="#74C0FC"/><circle cx="50" cy="89" r="3.5" fill="#868E96"/><rect x="43" y="8" width="14" height="2.5" rx="1" fill="#868E96"/><path d="M38 30 L62 30 M38 40 L56 40 M38 50 L60 50" stroke="#fff" stroke-width="4" stroke-linecap="round"/>`],
  chat: ['Obrolan', 'chat pesan percakapan', `<path d="${SHP.bubbleRound}" fill="#4DABF7" transform="translate(4 6) scale(.92)"/><circle cx="32" cy="42" r="6" fill="#fff"/><circle cx="50" cy="42" r="6" fill="#fff"/><circle cx="68" cy="42" r="6" fill="#fff"/>`],
  burst50: ['Ledakan 50%', 'diskon 50 persen sale', `<path d="${SHP.burst}" fill="#FFD43B"/><path d="${SHP.burst}" fill="#F03E3E" transform="translate(9 9) scale(.82)"/><text x="50" y="50" text-anchor="middle" font-size="25" fill="#fff" ${F}>50%</text><text x="50" y="66" text-anchor="middle" font-size="11" fill="#fff" ${F}>DISKON</text>`],
  calendar: ['Kalender', 'tanggal jadwal acara event', `<rect x="10" y="16" width="80" height="76" rx="10" fill="#fff" stroke="#364FC7" stroke-width="4"/><path d="M10 26 Q10 16 20 16 L80 16 Q90 16 90 26 L90 38 L10 38 Z" fill="#4263EB"/><rect x="26" y="6" width="7" height="18" rx="3" fill="#364FC7"/><rect x="67" y="6" width="7" height="18" rx="3" fill="#364FC7"/><text x="50" y="80" text-anchor="middle" font-size="32" fill="#364FC7" ${F}>14</text>`],
  heart: ['Hati', 'cinta love sayang', `<path d="${SHP.heart}" fill="#F03E3E" transform="translate(5 5) scale(.9)"/><path d="M24 26 Q28 16 38 18" stroke="#FFC9C9" stroke-width="5" fill="none" stroke-linecap="round"/>`],
  gift: ['Kado', 'hadiah hampers ulang tahun', `<rect x="12" y="42" width="76" height="52" rx="4" fill="#7950F2"/><rect x="8" y="30" width="84" height="16" rx="4" fill="#9775FA"/><rect x="44" y="30" width="12" height="64" fill="#FFD43B"/><path d="M50 30 C40 12 22 14 28 26 C32 32 44 30 50 30 C56 30 68 32 72 26 C78 14 60 12 50 30 Z" fill="none" stroke="#FFD43B" stroke-width="5"/>`],
  cart: ['Keranjang', 'belanja toko online shop', `<path d="M4 14 L18 14 L28 64 L82 64 L92 28 L22 28" fill="none" stroke="#1C7ED6" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"/><path d="M24 30 L90 30 L82 60 L30 60 Z" fill="#A5D8FF"/><circle cx="34" cy="80" r="7" fill="#1C7ED6"/><circle cx="76" cy="80" r="7" fill="#1C7ED6"/>`],
  check: ['Centang', 'ceklis benar selesai ok', `<circle cx="50" cy="50" r="46" fill="#37B24D"/><path d="M28 52 L44 68 L74 34" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>`],
  doodleArrow: ['Panah coretan', 'panah doodle tunjuk', `<path d="M8 76 C24 40 52 24 86 26" fill="none" stroke="#212529" stroke-width="5" stroke-linecap="round"/><path d="M70 12 L88 26 L72 42" fill="none" stroke="#212529" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`],
  doodleLoop: ['Panah melingkar', 'panah doodle putar', `<path d="M8 80 C26 80 40 64 34 50 C28 36 10 44 18 56 C26 68 58 66 72 40 L80 22" fill="none" stroke="#212529" stroke-width="5" stroke-linecap="round"/><path d="M66 28 L81 18 L88 36" fill="none" stroke="#212529" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`],
  smile: ['Wajah senyum', 'emoji senang wajah', face('#FFD43B', '<circle cx="35" cy="40" r="6" fill="#3a2a12"/><circle cx="65" cy="40" r="6" fill="#3a2a12"/>', '<path d="M30 60 Q50 80 70 60" fill="none" stroke="#3a2a12" stroke-width="5" stroke-linecap="round"/><circle cx="24" cy="58" r="6" fill="#FF8787" opacity=".6"/><circle cx="76" cy="58" r="6" fill="#FF8787" opacity=".6"/>')],
  laugh: ['Wajah tertawa', 'emoji ketawa lucu', face('#FFD43B', '<path d="M26 42 Q34 32 42 42 M58 42 Q66 32 74 42" fill="none" stroke="#3a2a12" stroke-width="5" stroke-linecap="round"/>', '<path d="M28 56 L72 56 Q70 82 50 82 Q30 82 28 56 Z" fill="#3a2a12"/><path d="M38 72 Q50 66 62 72 Q58 80 50 80 Q42 80 38 72 Z" fill="#FF6B6B"/>')],
  loveFace: ['Wajah jatuh cinta', 'emoji suka hati', face('#FFD43B', `<path d="${SHP.heart}" fill="#F03E3E" transform="translate(22 28) scale(.18)"/><path d="${SHP.heart}" fill="#F03E3E" transform="translate(60 28) scale(.18)"/>`, '<path d="M32 62 Q50 78 68 62" fill="none" stroke="#3a2a12" stroke-width="5" stroke-linecap="round"/>')],
  wink: ['Wajah berkedip', 'emoji kedip genit', face('#FFD43B', '<circle cx="35" cy="40" r="6" fill="#3a2a12"/><path d="M58 42 Q66 36 74 42" fill="none" stroke="#3a2a12" stroke-width="5" stroke-linecap="round"/>', '<path d="M34 62 Q52 74 68 58" fill="none" stroke="#3a2a12" stroke-width="5" stroke-linecap="round"/><path d="M60 64 Q64 76 70 70" fill="#FF6B6B"/>')],
  wow: ['Wajah kaget', 'emoji wow terkejut', face('#FFD43B', '<circle cx="35" cy="40" r="7" fill="#fff" stroke="#3a2a12" stroke-width="3"/><circle cx="65" cy="40" r="7" fill="#fff" stroke="#3a2a12" stroke-width="3"/><circle cx="35" cy="41" r="3" fill="#3a2a12"/><circle cx="65" cy="41" r="3" fill="#3a2a12"/>', '<ellipse cx="50" cy="68" rx="9" ry="12" fill="#3a2a12"/>')],
  rainbow: ['Pelangi', 'pelangi warna ceria', `${['#FF6B6B', '#FFA94D', '#FFD43B', '#69DB7C', '#4DABF7', '#9775FA'].map((c, i) => `<path d="M${6 + i * 6} 80 A${44 - i * 6} ${44 - i * 6} 0 0 1 ${94 - i * 6} 80" fill="none" stroke="${c}" stroke-width="6"/>`).join('')}<path d="${SHP.cloud}" fill="#fff" transform="translate(-2 62) scale(.3 .3)"/><path d="${SHP.cloud}" fill="#fff" transform="translate(72 62) scale(.3 .3)"/>`, 100, 92],
  bolt: ['Petir', 'kilat cepat flash sale', `<path d="M58 2 L18 58 L46 58 L38 98 L84 36 L54 36 Z" fill="#FFD43B" stroke="#E67700" stroke-width="3" stroke-linejoin="round"/>`],
  fire: ['Api', 'hot pedas panas populer', `<path d="M50 98 C24 98 12 80 14 62 C16 44 30 36 32 18 C42 28 46 40 44 50 C52 44 56 32 54 4 C76 20 88 44 86 66 C84 86 70 98 50 98 Z" fill="#FF6B1A"/><path d="M50 96 C36 96 30 86 32 76 C34 66 42 62 44 52 C50 60 52 66 50 72 C56 70 60 64 60 56 C68 66 70 76 66 86 C62 94 56 96 50 96 Z" fill="#FFD43B"/>`],
  crown: ['Mahkota', 'raja juara premium terbaik', `<path d="M8 78 L14 28 L34 50 L50 16 L66 50 L86 28 L92 78 Z" fill="#FCC419" stroke="#E67700" stroke-width="3" stroke-linejoin="round"/><rect x="8" y="78" width="84" height="12" rx="3" fill="#E67700"/><circle cx="50" cy="60" r="7" fill="#F03E3E"/><circle cx="28" cy="64" r="5" fill="#4DABF7"/><circle cx="72" cy="64" r="5" fill="#4DABF7"/>`],
  megaphone: ['Megafon', 'pengumuman info toa', `<path d="M14 40 L40 40 L80 14 L80 86 L40 60 L14 60 Z" fill="#F76707"/><rect x="6" y="38" width="14" height="24" rx="4" fill="#D9480F"/><path d="M24 60 L34 88 L46 88 L40 62" fill="#D9480F"/><path d="M88 36 Q96 50 88 64" stroke="#F76707" stroke-width="4" fill="none" stroke-linecap="round"/>`],
  ketupat: ['Ketupat', 'lebaran hari raya idulfitri', `<path d="M50 14 L86 50 L50 86 L14 50 Z" fill="#2F9E44"/><path d="M32 32 L68 68 M41 23 L77 59 M23 41 L59 77 M68 32 L32 68 M59 23 L23 59 M77 41 L41 77" stroke="#B2F2BB" stroke-width="3.5"/><path d="M50 14 Q44 6 50 2 Q58 6 50 14 Z M50 14 C60 4 66 10 62 2" fill="#2F9E44" stroke="#2F9E44" stroke-width="2"/>`],
  crescent: ['Bulan bintang', 'ramadan malam bulan sabit', `<path d="M60 8 C34 10 16 30 16 54 C16 78 36 96 60 96 C70 96 78 93 84 88 C62 86 44 70 44 50 C44 30 58 14 76 10 C71 8 66 8 60 8 Z" fill="#FCC419"/><path d="M78 30 L80.5 37 L88 37.5 L82 42 L84 49 L78 45 L72 49 L74 42 L68 37.5 L75.5 37 Z" fill="#FCC419"/>`],
  lantern: ['Lentera', 'lampion lebaran malam', `<rect x="42" y="4" width="16" height="8" rx="2" fill="#B08900"/><path d="M50 12 L50 18" stroke="#B08900" stroke-width="3"/><path d="M30 26 Q50 14 70 26 L74 72 Q50 86 26 72 Z" fill="#E8590C"/><path d="M38 26 L36 74 M50 20 L50 80 M62 26 L64 74" stroke="#FFD8A8" stroke-width="2.5"/><ellipse cx="50" cy="50" rx="10" ry="16" fill="#FFE066" opacity=".85"/><path d="M40 82 L60 82 L56 92 L44 92 Z" fill="#B08900"/>`],
  balloons: ['Balon', 'ulang tahun pesta perayaan', `<path d="M32 62 Q36 80 46 96 M66 56 Q60 78 48 96" stroke="#868E96" stroke-width="2" fill="none"/><ellipse cx="32" cy="38" rx="20" ry="25" fill="#FF6B6B"/><ellipse cx="66" cy="32" rx="20" ry="25" fill="#4DABF7"/><ellipse cx="26" cy="30" rx="5" ry="8" fill="#fff" opacity=".5"/><ellipse cx="60" cy="24" rx="5" ry="8" fill="#fff" opacity=".5"/><path d="M29 62 L35 62 L32 67 Z M63 56 L69 56 L66 61 Z" fill="#495057"/>`],
  cake: ['Kue ulang tahun', 'kue tart pesta lilin', `<rect x="14" y="52" width="72" height="40" rx="6" fill="#F783AC"/><path d="M14 62 Q23 72 32 62 Q41 72 50 62 Q59 72 68 62 Q77 72 86 62 L86 56 Q86 50 80 50 L20 50 Q14 50 14 56 Z" fill="#FFF0F6"/><rect x="10" y="88" width="80" height="6" rx="3" fill="#C2255C"/>${[30, 50, 70].map(x => `<rect x="${x - 3}" y="30" width="6" height="20" rx="2" fill="#74C0FC"/><path d="M${x} 18 Q${x + 6} 26 ${x} 30 Q${x - 6} 26 ${x} 18 Z" fill="#FFA94D"/>`).join('')}`],
  graduation: ['Topi toga', 'edukasi sekolah kuliah belajar', `<path d="M50 18 L96 38 L50 58 L4 38 Z" fill="#343A40"/><path d="M24 48 L24 70 Q50 86 76 70 L76 48 L50 60 Z" fill="#495057"/><path d="M90 40 L90 66" stroke="#FAB005" stroke-width="3"/><circle cx="90" cy="70" r="5" fill="#FAB005"/>`],
  house: ['Rumah', 'properti rumah hunian real estate', `<path d="M10 50 L50 14 L90 50" fill="none" stroke="#C92A2A" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><path d="M20 46 L50 20 L80 46 L80 92 L20 92 Z" fill="#FFF4E6"/><path d="M20 46 L50 20 L80 46 L80 92 L20 92 Z" fill="none" stroke="#862E2E" stroke-width="3"/><rect x="42" y="62" width="16" height="30" fill="#862E2E"/><rect x="26" y="54" width="12" height="12" fill="#74C0FC"/><rect x="62" y="54" width="12" height="12" fill="#74C0FC"/>`],
  briefcase: ['Koper kerja', 'lowongan kerja karier kantor', `<rect x="8" y="30" width="84" height="60" rx="8" fill="#7048E8"/><path d="M36 30 L36 20 Q36 14 42 14 L58 14 Q64 14 64 20 L64 30" fill="none" stroke="#5F3DC4" stroke-width="6"/><rect x="8" y="52" width="84" height="6" fill="#5F3DC4"/><rect x="42" y="48" width="16" height="14" rx="3" fill="#FFD43B"/>`],
  bulb: ['Bola lampu', 'ide tips kreatif', `<path d="M50 6 C30 6 18 22 18 38 C18 52 28 58 32 68 L68 68 C72 58 82 52 82 38 C82 22 70 6 50 6 Z" fill="#FFE066" stroke="#F59F00" stroke-width="3"/><rect x="34" y="70" width="32" height="8" rx="3" fill="#868E96"/><rect x="36" y="80" width="28" height="8" rx="3" fill="#868E96"/><path d="M42 90 L58 90 L54 96 L46 96 Z" fill="#495057"/><path d="M42 58 L42 44 L50 50 L58 44 L58 58" fill="none" stroke="#F59F00" stroke-width="3"/>`],
  scribble: ['Coretan garis bawah', 'garis bawah stabilo highlight', `<path d="M4 30 C20 18 34 36 50 24 C64 14 80 34 96 20 M10 40 C30 30 50 44 92 30" fill="none" stroke="#F03E3E" stroke-width="5" stroke-linecap="round"/>`, 100, 50],
  newBadge: ['Lencana BARU', 'baru new label', `<circle cx="50" cy="50" r="46" fill="#12B886"/><circle cx="50" cy="50" r="38" fill="none" stroke="#fff" stroke-width="2.5"/><text x="50" y="58" text-anchor="middle" font-size="24" fill="#fff" ${F}>BARU</text>`],
  hot: ['Label HOT', 'hot terlaris best seller', `<path d="${SHP.tag}" fill="#212529" transform="translate(0 25) scale(1 .5)"/><circle cx="84" cy="50" r="4" fill="#fff"/><text x="40" y="60" text-anchor="middle" font-size="26" fill="#FFD43B" ${F}>HOT</text>`],
  ongkir: ['Gratis ongkir', 'pengiriman kirim truk antar', `<rect x="4" y="30" width="56" height="40" rx="4" fill="#1C7ED6"/><path d="M60 42 L80 42 L94 56 L94 70 L60 70 Z" fill="#339AF0"/><rect x="66" y="46" width="12" height="10" fill="#D0EBFF"/><circle cx="24" cy="74" r="9" fill="#212529"/><circle cx="76" cy="74" r="9" fill="#212529"/><circle cx="24" cy="74" r="4" fill="#ADB5BD"/><circle cx="76" cy="74" r="4" fill="#ADB5BD"/><text x="32" y="55" text-anchor="middle" font-size="13" fill="#fff" ${F}>GRATIS</text>`],
  confetti: ['Konfeti', 'pesta perayaan meriah', `${[[12, 14, '#FF6B6B', 20], [70, 10, '#4DABF7', -30], [40, 30, '#FFD43B', 50], [84, 44, '#69DB7C', 10], [20, 60, '#9775FA', -40], [58, 70, '#FF922B', 70], [80, 84, '#F783AC', 0], [34, 86, '#4DABF7', 30]].map(([x, y, c, r]) => `<rect x="${x}" y="${y}" width="10" height="5" rx="1.5" fill="${c}" transform="rotate(${r} ${x + 5} ${y + 2.5})"/>`).join('')}<circle cx="52" cy="50" r="3.5" fill="#FF6B6B"/><circle cx="26" cy="40" r="3" fill="#69DB7C"/><circle cx="64" cy="36" r="3" fill="#9775FA"/>`],
  plant: ['Tanaman pot', 'tanaman hias rumah', `<path d="M30 64 L70 64 L64 94 L36 94 Z" fill="#E8590C"/><rect x="26" y="58" width="48" height="10" rx="3" fill="#D9480F"/><path d="M50 58 C50 40 50 30 50 22" stroke="#2B8A3E" stroke-width="4"/><path d="M50 40 C30 40 22 26 24 14 C38 14 50 24 50 40 Z" fill="#40C057"/><path d="M50 34 C68 34 78 20 76 8 C62 8 50 18 50 34 Z" fill="#69DB7C"/><path d="M50 52 C36 54 26 46 26 38 C38 36 48 42 50 52 Z" fill="#2F9E44"/>`],
  mug: ['Gelas es', 'minuman es teh jus segar', `<path d="M24 22 L76 22 L68 94 L32 94 Z" fill="#E7F5FF" stroke="#4DABF7" stroke-width="3"/><path d="M27 44 L73 44 L68 92 L32 92 Z" fill="#FF922B"/><rect x="34" y="50" width="12" height="12" rx="2" fill="#fff" opacity=".7" transform="rotate(14 40 56)"/><rect x="52" y="60" width="12" height="12" rx="2" fill="#fff" opacity=".7" transform="rotate(-10 58 66)"/><path d="M58 4 L52 50" stroke="#F03E3E" stroke-width="5" stroke-linecap="round"/>`],
};
const stickerCache = {};
function stickerSrc(k) { if (stickerCache[k]) return stickerCache[k]; const s = STK[k]; return stickerCache[k] = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgDoc(s[2], s[3] || 100, s[4] || 100)); }
const stickerAr = k => (STK[k][3] || 100) / (STK[k][4] || 100);
// synchronous image cache so canvas previews (template thumbnails, page strip) can draw SVG stickers
const imgReady = {};
function readyImg(src, onload) {
  let r = imgReady[src]; if (r) return r.complete && r.naturalWidth ? r : null;
  r = imgReady[src] = new Image(); r.decoding = 'async'; if (!src.startsWith('data:')) r.crossOrigin = 'anonymous'; r.onload = () => onload?.(); r.src = src; return null;
}
const preloadStickers = () => Promise.all(Object.keys(STK).map(k => new Promise(res => { const s = stickerSrc(k); if (readyImg(s, res)) res(); else imgReady[s].onerror = res; setTimeout(res, 1500); })));

// ---------- charts (rendered as SVG images so they export everywhere) ----------
function chartSrc(c) {
  const rows = c.rows.filter(r => r[0] !== '' && isFinite(r[1])), cols = c.colors?.length ? c.colors : ['#1F6FB2', '#E8B02A', '#D95D39', '#2F8F5B', '#7A4A2A', '#B48CFF'];
  const max = Math.max(1, ...rows.map(r => +r[1])), ink = c.ink || '#2b2d33'; let b = '';
  if (c.kind === 'pie' || c.kind === 'donut') {
    const sum = rows.reduce((s, r) => s + Math.max(0, +r[1]), 0) || 1; let a = -Math.PI / 2;
    rows.forEach((r, i) => { const da = Math.max(0, +r[1]) / sum * Math.PI * 2, a2 = a + da, x1 = 50 + 34 * Math.cos(a), y1 = 44 + 34 * Math.sin(a), x2 = 50 + 34 * Math.cos(a2), y2 = 44 + 34 * Math.sin(a2);
      b += da >= Math.PI * 2 - 1e-6 ? `<circle cx="50" cy="44" r="34" fill="${cols[i % cols.length]}"/>` : `<path d="M50 44 L${x1.toFixed(2)} ${y1.toFixed(2)} A34 34 0 ${da > Math.PI ? 1 : 0} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z" fill="${cols[i % cols.length]}" stroke="#fff" stroke-width=".8"/>`; a = a2; });
    if (c.kind === 'donut') b += `<circle cx="50" cy="44" r="18" fill="#fff"/>`;
    b += rows.slice(0, 6).map((r, i) => `<rect x="${4 + (i % 3) * 32}" y="${84 + Math.floor(i / 3) * 7}" width="4" height="4" rx="1" fill="${cols[i % cols.length]}"/><text x="${10 + (i % 3) * 32}" y="${87.6 + Math.floor(i / 3) * 7}" font-size="4.4" fill="${ink}" font-family="Arial, sans-serif">${escXml(String(r[0])).slice(0, 14)}</text>`).join('');
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 100 100">${b}</svg>`);
  }
  const n = rows.length || 1, bw = 136 / n;
  b += `<line x1="6" y1="84" x2="154" y2="84" stroke="${ink}" stroke-width=".6" opacity=".5"/>`;
  rows.forEach((r, i) => { const h = Math.max(0, +r[1]) / max * 66, x = 12 + i * bw;
    b += `<rect x="${(x + bw * .12).toFixed(2)}" y="${(84 - h).toFixed(2)}" width="${(bw * .76).toFixed(2)}" height="${h.toFixed(2)}" rx="1.6" fill="${cols[i % cols.length]}"/>`
      + `<text x="${(x + bw / 2).toFixed(2)}" y="${(80 - h).toFixed(2)}" text-anchor="middle" font-size="5.4" font-weight="700" fill="${ink}" font-family="Arial, sans-serif">${escXml(String(r[1]))}</text>`
      + `<text x="${(x + bw / 2).toFixed(2)}" y="92" text-anchor="middle" font-size="5" fill="${ink}" font-family="Arial, sans-serif">${escXml(String(r[0])).slice(0, 12)}</text>`; });
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 160 100">${b}</svg>`);
}
const escXml = s => s.replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));

// ---------- element factories used by templates ----------
const Sh = (type, x, y, w, h, fill, o = {}) => ({id: uid(), type, x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h), fill, rot: 0, opacity: 1, ...o});
const Ph = (x, y, w, h, fill, o = {}) => ({id: uid(), type: 'rect', x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h), fill, radius: 0, rot: 0, opacity: 1, name: 'Foto (ganti)', ...o});
const St = (k, x, y, w, o = {}) => { const ar = stickerAr(k); return {id: uid(), type: 'image', src: stickerSrc(k), ar, x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(w / ar), radius: 0, rot: 0, opacity: 1, crop: {zoom: 1, ox: 0, oy: 0}, name: 'Stiker ' + STK[k][0], ...o}; };
const Tx = (text, x, y, w, fs, color, o = {}) => ({...T(text, Math.round(x), Math.round(y), Math.round(w), Math.round(fs * (o.lh || 1.2) * Math.max(1, text.split('\n').length)), Math.round(fs), color), ...o});
// pick a font size so `text` fits in `lines` lines of width w (rough glyph-width estimate)
const fitFs = (text, w, max, lines = 2, k = .56) => { const longest = Math.max(...text.split('\n').map(s => s.length)); return Math.max(10, Math.min(max, Math.floor(w * lines / Math.max(1, longest) / k), Math.floor(w / Math.max(...text.split(/\s|\n/).map(s => s.length)) / k))); };
const estLines = (text, w, fs, k = .58) => text.split('\n').reduce((n, para) => { let lines = 1, cur = 0; for (const word of para.split(' ')) { const ww = (word.length + 1) * fs * k; if (cur + ww > w * 1.02 && cur > 0) { lines++; cur = ww; } else cur += ww; } return n + lines; }, 0);
const tH = (text, w, fs, lh = 1.2, k) => estLines(text, w, fs, k) * fs * lh;
const G = (a, b, ang = 135) => ({g: 'linear', a: ang, c: [a, b]});

// ---------- template themes: original Indonesian copy ----------
const THEMES = {
  makanan: {cat: 'Promo makanan', tags: 'kuliner resto makan ayam promo', pal: {bg: '#FFF4E6', primary: '#D9480F', text: '#3B1F0E', accent: '#FFB703', soft: '#FFE3C2'}, hf: 'Archivo Black', bf: 'Poppins',
    kicker: 'MENU BARU', title: 'Ayam Geprek Sambal Matah', sub: 'Pedasnya pas, porsinya puas', body: 'Mulai Rp18.000 · Gratis es teh untuk setiap pembelian 2 porsi', cta: 'Pesan sekarang', info: 'Jl. Melati No. 12, Yogyakarta', st: ['fire', 'burst50', 'mug'],
    items: ['Ayam geprek original — 18K', 'Geprek keju leleh — 24K', 'Nasi telur sambal bawang — 15K', 'Es teh jumbo — 5K']},
  kopi: {cat: 'Kopi & kafe', tags: 'kopi kafe cafe minuman coffee', pal: {bg: '#F3E9DC', primary: '#5B3A1E', text: '#2B1A0E', accent: '#C08552', soft: '#E6D3BC'}, hf: 'DM Serif Display', bf: 'Plus Jakarta Sans',
    kicker: 'KEDAI KITA', title: 'Kopi Susu Gula Aren', sub: 'Diseduh pelan, dinikmati perlahan', body: 'Beli 2 gratis 1 setiap Senin–Kamis, pukul 14.00–17.00', cta: 'Mampir hari ini', info: '@kedaikita.kopi · Buka 07.00–22.00', st: ['coffee', 'leaf', 'sparkle'],
    items: ['Kopi susu gula aren — 22K', 'Americano dingin — 18K', 'Latte pandan — 26K', 'Roti bakar cokelat — 15K']},
  fashion: {cat: 'Fashion sale', tags: 'fashion baju diskon sale belanja', pal: {bg: '#111111', primary: '#F5F0E6', text: '#FFFFFF', accent: '#FF4D6D', soft: '#2B2B2B'}, hf: 'Bebas Neue', bf: 'Montserrat',
    kicker: 'KOLEKSI AKHIR TAHUN', title: 'MIDNIGHT SALE', sub: 'Diskon hingga 70%', body: 'Hanya 3 hari: 12–14 Desember. Stok terbatas, gaya tanpa batas.', cta: 'Belanja sekarang', info: 'www.tokoanda.id', st: ['bolt', 'pricetag', 'hot'],
    items: ['Kemeja linen — 129K', 'Celana kulot — 149K', 'Tas anyam — 99K', 'Sneakers putih — 249K']},
  webinar: {cat: 'Event & webinar', tags: 'acara event webinar seminar kelas online', pal: {bg: '#EEF2FF', primary: '#3B5BDB', text: '#14213D', accent: '#FCC419', soft: '#DBE4FF'}, hf: 'Bricolage Grotesque', bf: 'Plus Jakarta Sans',
    kicker: 'WEBINAR GRATIS', title: 'Bisnis Online dari Nol', sub: 'Strategi jualan konsisten untuk UMKM', body: 'Sabtu, 14 Desember 2026 · 19.00 WIB · via Zoom', cta: 'Daftar sekarang', info: 'Pembicara: Rina Kartika, Pendiri Toko Lokal', st: ['calendar', 'megaphone', 'chat'],
    items: ['Menentukan produk unggulan', 'Foto produk pakai ponsel', 'Menulis caption yang menjual', 'Mengatur jadwal konten']},
  quotes: {cat: 'Kutipan', tags: 'quote kutipan motivasi kata bijak', pal: {bg: '#FDF6EC', primary: '#E07A5F', text: '#3D405B', accent: '#81B29A', soft: '#F4E1D2'}, hf: 'Playfair Display', bf: 'Lora',
    kicker: 'PENGINGAT HARI INI', title: 'Mulai dari yang kecil, lakukan dengan konsisten.', sub: '— Catatan Rakit', body: 'Simpan & bagikan ke teman yang butuh semangat.', cta: 'Bagikan', info: '@akunanda', st: ['sparkle', 'flower', 'leaf'],
    items: []},
  edukasi: {cat: 'Edukasi', tags: 'edukasi tips belajar sekolah infografis', pal: {bg: '#E6FCF5', primary: '#0CA678', text: '#0B3B2E', accent: '#FF922B', soft: '#C3FAE8'}, hf: 'Poppins', bf: 'Plus Jakarta Sans',
    kicker: 'TIPS BELAJAR', title: '5 Cara Belajar Lebih Efektif', sub: 'Sedikit tapi rutin lebih baik', body: 'Geser untuk lihat penjelasan lengkap tiap langkah.', cta: 'Simpan postingan ini', info: '@kelaspintar.id', st: ['bulb', 'graduation', 'check'],
    items: ['Belajar 25 menit, istirahat 5 menit', 'Tulis ulang dengan kata sendiri', 'Ajarkan ke teman', 'Uji diri dengan soal latihan', 'Tidur cukup sebelum ujian']},
  properti: {cat: 'Properti', tags: 'rumah properti hunian jual kpr', pal: {bg: '#F8F9FA', primary: '#1B4332', text: '#1B1B1B', accent: '#D4A373', soft: '#E9ECEF'}, hf: 'Montserrat', bf: 'Roboto',
    kicker: 'DIJUAL', title: 'Rumah Minimalis Siap Huni', sub: 'Cicilan mulai 3 jutaan/bulan', body: '3 kamar tidur · 2 kamar mandi · Carport · 10 menit ke tol', cta: 'Jadwalkan kunjungan', info: 'Hubungi 0812-0000-1234', st: ['house', 'pin', 'plant'],
    items: ['Luas tanah 120 m²', 'Luas bangunan 90 m²', 'Sertifikat SHM', 'Bebas banjir']},
  loker: {cat: 'Lowongan kerja', tags: 'lowongan kerja loker hiring karier rekrut', pal: {bg: '#FFF9DB', primary: '#5F3DC4', text: '#1F1147', accent: '#FAB005', soft: '#F3F0FF'}, hf: 'Archivo Black', bf: 'Poppins',
    kicker: 'KAMI MEMBUKA LOWONGAN', title: 'Dicari: Barista', sub: 'Penuh waktu · Yogyakarta', body: 'Kirim CV ke karier@kedaikita.id paling lambat 30 November 2026', cta: 'Lamar sekarang', info: 'Kedai Kita Group', st: ['briefcase', 'megaphone', 'check'],
    items: ['Usia 19–28 tahun', 'Ramah & suka melayani', 'Bersedia kerja shift', 'Pengalaman jadi nilai plus']},
  lebaran: {cat: 'Ucapan hari raya', tags: 'lebaran idulfitri hari raya ramadan ucapan', pal: {bg: '#0B3D2E', primary: '#F2C94C', text: '#FFFBEA', accent: '#2F9E44', soft: '#145A43'}, hf: 'DM Serif Display', bf: 'Lora',
    kicker: '1 SYAWAL 1448 H', title: 'Selamat Hari Raya Idulfitri', sub: 'Mohon maaf lahir dan batin', body: 'Semoga kebaikan dan keberkahan menyertai kita semua.', cta: 'Keluarga Besar Anda', info: 'Dari kami sekeluarga', st: ['ketupat', 'crescent', 'lantern'],
    items: []},
  ultah: {cat: 'Ulang tahun', tags: 'ulang tahun ultah birthday pesta undangan', pal: {bg: '#FFF0F6', primary: '#E64980', text: '#4A1430', accent: '#4DABF7', soft: '#FFDEEB'}, hf: 'Pacifico', bf: 'Poppins',
    kicker: 'HARI SPESIAL', title: 'Selamat Ulang Tahun, Sinta!', sub: 'Semoga semua mimpimu tercapai', body: 'Pesta kecil: Minggu, 8 Maret · 16.00 · Rumah Nenek', cta: 'Datang ya!', info: 'Konfirmasi ke Ibu Wati', st: ['balloons', 'cake', 'confetti'],
    items: []},
  portofolio: {cat: 'Portofolio', tags: 'portofolio cv karya desainer profil', pal: {bg: '#FFFFFF', primary: '#212529', text: '#212529', accent: '#FF6B35', soft: '#F1F3F5'}, hf: 'Bricolage Grotesque', bf: 'Plus Jakarta Sans',
    kicker: 'PORTOFOLIO 2026', title: 'Dimas Pratama', sub: 'Desainer grafis & ilustrator', body: 'Membantu brand lokal tampil percaya diri sejak 2019.', cta: 'Lihat karya', info: 'dimas@email.id · Bandung', st: ['sparkle', 'doodleArrow', 'bulb'],
    items: ['Identitas merek', 'Kemasan produk', 'Ilustrasi editorial', 'Konten media sosial']},
  menu: {cat: 'Menu', tags: 'menu daftar harga restoran warung', pal: {bg: '#1E2A23', primary: '#E9C46A', text: '#F7F3E8', accent: '#E76F51', soft: '#2B3A31'}, hf: 'Oswald', bf: 'Lora',
    kicker: 'WARUNG NUSANTARA', title: 'Daftar Menu', sub: 'Masakan rumahan setiap hari', body: 'Harga sudah termasuk pajak · Bisa pesan antar', cta: 'Pesan via WhatsApp', info: '0812-3456-7890', st: ['fire', 'leaf', 'mug'],
    items: ['Nasi goreng kampung — 20K', 'Soto ayam lamongan — 18K', 'Gado-gado — 17K', 'Sate ayam (10 tusuk) — 25K', 'Es jeruk — 7K', 'Teh poci — 6K']},
};

// ---------- layouts: (W, H, t) => pages[]  (all adapt to any canvas size) ----------
const LAYOUTS = {
  hero(W, H, t) { // photo on top, copy below
    const p = t.pal, S = Math.min(W, H), m = S * .07, wide = W / H > 1.3;
    if (wide) return LAYOUTS.split(W, H, t);
    const ph = H * .5, tw = W - 2 * m, fs = fitFs(t.title, tw, S * .11, 2, .62);
    return [{bg: p.bg, elements: [Ph(0, 0, W, ph, G(p.soft, p.accent, 160), {mask: 'arch' === t.mask ? 'arch' : undefined}),
      St(t.st[0], W / 2 - S * .2, ph / 2 - S * .2, S * .4),
      Sh('halfcircle', W - m - S * .26, ph - S * .13, S * .26, S * .13, p.primary, {rot: 180}),
      Tx(t.kicker, m, ph + m * .7, tw * .8, S * .03, p.primary, {bold: true, spacing: 4, font: t.bf}),
      Tx(t.title, m, ph + m * .7 + S * .06, tw, fs, p.text, {bold: true, font: t.hf, lh: 1.05}),
      Tx(t.body, m, H - m - S * .1 - S * .1, tw, S * .032, p.text, {opacity: .8, font: t.bf}),
      R(m, H - m - S * .085, S * .42, S * .085, p.primary, {radius: 999}),
      Tx(t.cta, m, H - m - S * .085 + S * .022, S * .42, S * .034, p.bg, {bold: true, align: 'center', font: t.bf}),
      St(t.st[1], W - m - S * .2, H - m - S * .22, S * .2, {rot: 8})]}];
  },
  poster(W, H, t) { // gradient background, centred bold type with decorative shapes
    const p = t.pal, S = Math.min(W, H), m = S * .08, tw = W - 2 * m, fs = fitFs(t.title.toUpperCase(), tw, S * .16, W / H > 1.6 ? 1 : 2, .7);
    const cy = H * (W / H > 1.6 ? .22 : .3);
    return [{bg: G(p.primary, p.accent, 160), elements: [
      Sh('ring', -S * .18, -S * .18, S * .6, S * .6, '#FFFFFF', {opacity: .14}), Sh('blob', W - S * .38, H - S * .42, S * .55, S * .55, p.bg, {opacity: .16}),
      Sh('star4', W * .82, H * .1, S * .08, S * .08, '#FFFFFF', {opacity: .8}), Sh('star4', W * .12, H * .78, S * .05, S * .05, '#FFFFFF', {opacity: .7}),
      R(W / 2 - S * .22, cy - S * .08, S * .44, S * .06, p.text === '#FFFFFF' ? '#00000040' : '#FFFFFF', {radius: 999, opacity: .95}),
      Tx(t.kicker, W / 2 - S * .22, cy - S * .07, S * .44, S * .028, p.text === '#FFFFFF' ? '#FFFFFF' : p.primary, {bold: true, align: 'center', spacing: 2, font: t.bf}),
      Tx(t.title.toUpperCase(), m, cy + S * .02, tw, fs, '#FFFFFF', {bold: true, align: 'center', font: t.hf, lh: 1, effect: 'lift', fx: {size: 10, color: '#000000'}}),
      Tx(t.sub, m, cy + S * .05 + tH(t.title.toUpperCase(), tw, fs, 1, .7), tw, S * .05, '#FFFFFF', {align: 'center', font: t.bf, bold: true}),
      St(t.st[1], W - m - S * .22, H - m - S * .36, S * .22, {rot: -8}),
      R(W / 2 - S * .23, H - m - S * .1, S * .46, S * .09, '#FFFFFF', {radius: 999, shadow: {on: true, x: 0, y: 10, blur: 24, color: '#00000040'}}),
      Tx(t.cta, W / 2 - S * .23, H - m - S * .1 + S * .024, S * .46, S * .036, p.primary, {bold: true, align: 'center', font: t.bf})]}];
  },
  split(W, H, t) { // colour block + round photo frame
    const p = t.pal, S = Math.min(W, H), wide = W / H > 1.15, m = S * .08;
    if (!wide) { // stacked variant for tall canvases
      const tw = W - 2 * m, fs = fitFs(t.title, tw, S * .1, 3, .6);
      return [{bg: p.soft, elements: [R(0, H * .52, W, H * .48, p.primary), Ph(W / 2 - S * .32, H * .16, S * .64, S * .64, G(p.accent, p.primary), {mask: 'circle'}),
        St(t.st[0], W / 2 - S * .18, H * .16 + S * .14, S * .36), Sh('ring', W / 2 - S * .37, H * .16 - S * .05, S * .74, S * .74, p.accent, {opacity: .5}),
        Tx(t.kicker, m, H * .07, tw, S * .032, p.primary, {bold: true, align: 'center', spacing: 4, font: t.bf}),
        Tx(t.title, m, H * .16 + S * .74, tw, fs, '#FFFFFF', {bold: true, align: 'center', font: t.hf, lh: 1.05}),
        Tx(t.body, m, H - m - S * .14, tw, S * .032, '#FFFFFF', {align: 'center', opacity: .9, font: t.bf}),
        Tx(t.info, m, H - m - S * .04, tw, S * .026, p.accent, {align: 'center', bold: true, font: t.bf})]}];
    }
    const lw = W * .55, tw = lw - 2 * m, fs = fitFs(t.title, tw, H * .16, 2, .6);
    return [{bg: p.bg, elements: [R(0, 0, lw, H, p.primary), Sh('quarter', lw - H * .3, H * .7, H * .3, H * .3, p.accent, {opacity: .9}),
      Ph(lw + (W - lw) / 2 - H * .36, H * .14, H * .72, H * .72, G(p.soft, p.accent), {mask: 'circle'}), St(t.st[0], lw + (W - lw) / 2 - H * .2, H * .3, H * .4),
      Sh('ring', lw + (W - lw) / 2 - H * .42, H * .08, H * .84, H * .84, p.primary, {opacity: .25}),
      Tx(t.kicker, m, H * .14, tw, H * .045, p.accent, {bold: true, spacing: 3, font: t.bf}),
      Tx(t.title, m, H * .24, tw, fs, '#FFFFFF', {bold: true, font: t.hf, lh: 1.05}),
      Tx(t.sub, m, H * .26 + tH(t.title, tw, fs, 1.05, .6), tw, H * .05, '#FFFFFF', {opacity: .9, font: t.bf}),
      R(m, H - m - H * .12, Math.min(tw, H * .6), H * .12, p.accent, {radius: 999}),
      Tx(t.cta, m, H - m - H * .12 + H * .03, Math.min(tw, H * .6), H * .05, p.text === '#FFFFFF' ? '#111111' : p.text, {bold: true, align: 'center', font: t.bf})]}];
  },
  card(W, H, t) { // soft background, white card with shadow
    const p = t.pal, S = Math.min(W, H), m = S * .08, cw = W - 2 * m, ch = H - 2 * m, tw = cw - 2 * m, fs = fitFs(t.title, tw, S * .1, 3, .6), dark = p.text === '#FFFFFF' || p.bg === '#0B3D2E' || p.bg === '#1E2A23';
    const els = [];
    for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) if ((i + j) % 2 === 0) els.push(Sh('ellipse', W * (i + .5) / 6 - S * .008, H * (j + .5) / 6 - S * .008, S * .016, S * .016, dark ? p.primary : p.primary, {opacity: .18}));
    els.push(R(m, m, cw, ch, dark ? p.soft : '#FFFFFF', {radius: S * .04, shadow: {on: true, x: 0, y: 18, blur: 40, color: '#00000026'}}),
      St(t.st[0], W / 2 - S * .12, m + S * .06, S * .24),
      Tx(t.kicker, m + m, m + S * .33, tw, S * .03, p.primary === '#F5F0E6' ? p.accent : p.primary, {bold: true, align: 'center', spacing: 4, font: t.bf}),
      Tx(t.title, m + m, m + S * .39, tw, fs, dark ? p.text : p.text, {bold: true, align: 'center', font: t.hf, lh: 1.08}),
      R(W / 2 - S * .06, m + S * .42 + tH(t.title, tw, fs, 1.08, .6), S * .12, S * .012, p.accent, {radius: 99}),
      Tx(t.body, m + m, m + S * .46 + tH(t.title, tw, fs, 1.08, .6), tw, S * .032, dark ? p.text : p.text, {align: 'center', opacity: .8, font: t.bf}),
      Tx(t.info, m + m, H - m - m - S * .03, tw, S * .028, p.primary === '#F5F0E6' ? p.accent : p.primary, {bold: true, align: 'center', font: t.bf}),
      St(t.st[2], W - m - S * .16, H - m - S * .2, S * .2, {rot: 10}));
    return [{bg: p.bg, elements: els}];
  },
  list(W, H, t) { // title + numbered/checked items
    const p = t.pal, S = Math.min(W, H), m = S * .08, tw = W - 2 * m, items = (t.items.length ? t.items : ['Poin pertama', 'Poin kedua', 'Poin ketiga']).slice(0, W / H > 1.4 ? 4 : 6);
    const fs = fitFs(t.title, tw * .8, S * .085, 2, .6), top = m + S * .06 + fs * 2.4, rowH = Math.min(S * .13, (H - top - m - S * .12) / items.length);
    const els = [Sh('blob2', W - S * .5, -S * .2, S * .7, S * .7, p.soft), Tx(t.kicker, m, m, tw, S * .03, p.primary, {bold: true, spacing: 4, font: t.bf}),
      Tx(t.title, m, m + S * .05, tw * .8, fs, p.text, {bold: true, font: t.hf, lh: 1.05}), St(t.st[0], W - m - S * .2, m, S * .2)];
    items.forEach((it, i) => { const y = top + i * rowH;
      els.push(Sh('squircle', m, y, rowH * .7, rowH * .7, i % 2 ? p.accent : p.primary), Tx(String(i + 1), m, y + rowH * .14, rowH * .7, rowH * .34, '#FFFFFF', {bold: true, align: 'center', font: t.hf}),
        Tx(it, m + rowH * .9, y + rowH * .17, tw - rowH, Math.min(rowH * .3, S * .04), p.text, {font: t.bf, bold: i === 0})); });
    els.push(R(0, H - S * .1, W, S * .1, p.primary), Tx(t.info, m, H - S * .1 + S * .03, tw, S * .032, '#FFFFFF', {bold: true, font: t.bf}));
    return [{bg: p.bg, elements: els}];
  },
  quote(W, H, t) {
    const p = t.pal, S = Math.min(W, H), m = S * .1, tw = W - 2 * m, q = t.quote || t.title, fs = fitFs(q, tw, S * .085, 4, .52);
    return [{bg: p.bg, elements: [Sh('blob', -S * .2, H - S * .45, S * .6, S * .6, p.soft), Sh('ellipse', W - S * .25, -S * .1, S * .38, S * .38, p.accent, {opacity: .35}),
      Tx('“', m, m * .6, S * .3, S * .3, p.primary, {font: 'Playfair Display', bold: true, lh: 1}),
      Tx(q, m, H / 2 - tH(q, tw, fs, 1.2, .52) / 2 - S * .04, tw, fs, p.text, {font: t.hf, italic: t.hf === 'Playfair Display', lh: 1.2}),
      R(m, H / 2 + tH(q, tw, fs, 1.2, .52) / 2, S * .1, S * .01, p.primary), Tx(t.sub, m, H / 2 + tH(q, tw, fs, 1.2, .52) / 2 + S * .03, tw, S * .036, p.text, {font: t.bf, bold: true}),
      St(t.st[0], W - m - S * .14, H - m - S * .14, S * .14), Tx(t.info, m, H - m * .9, tw * .6, S * .026, p.text, {opacity: .6, font: t.bf})]}];
  },
  greet(W, H, t) { // centred greeting with symmetric ornaments
    const p = t.pal, S = Math.min(W, H), m = S * .08, tw = W - 2 * m, fs = fitFs(t.title, tw, S * .11, W / H > 1.6 ? 1 : 3, t.hf === 'Pacifico' ? .55 : .5);
    const th = tH(t.title, tw, fs, 1.15, t.hf === 'Pacifico' ? .55 : .5), cy = H / 2 - th / 2 - S * .06;
    return [{bg: G(p.bg, p.soft, 180), elements: [
      Sh('arch', W / 2 - S * .36, H / 2 - S * .42, S * .72, S * .84, '#FFFFFF', {opacity: .08}),
      St(t.st[2], m * .5, m * .3, S * .2, {rot: -10}), St(t.st[2], W - m * .5 - S * .2, m * .3, S * .2, {rot: 10, flipX: true}),
      St(t.st[0], W / 2 - S * .09, cy - S * .24, S * .18),
      Tx(t.kicker, m, cy - S * .05, tw, S * .03, p.primary, {bold: true, align: 'center', spacing: 5, font: t.bf}),
      Tx(t.title, m, cy, tw, fs, p.primary, {align: 'center', font: t.hf, lh: 1.15, effect: 'shadow', fx: {color: '#00000040', size: 6}}),
      Tx(t.sub, m, cy + th + S * .03, tw, S * .045, p.text, {align: 'center', font: t.bf, italic: true}),
      Tx(t.body, m * 1.5, cy + th + S * .11, tw - m, S * .03, p.text, {align: 'center', font: t.bf, opacity: .85}),
      St(t.st[1], W / 2 - S * .1, H - m - S * .2, S * .2), Sh('line', m * 2, H - m - S * .1, W / 2 - S * .14 - m * 2, 3, p.primary, {opacity: .6}),
      Sh('line', W / 2 + S * .14, H - m - S * .1, W / 2 - S * .14 - m * 2, 3, p.primary, {opacity: .6})]}];
  },
  menu(W, H, t) {
    const p = t.pal, S = Math.min(W, H), m = S * .08, tw = W - 2 * m, items = t.items.slice(0, W / H > 1.4 ? 4 : 6), top = m + S * .3, rowH = (H - top - m - S * .12) / items.length;
    const els = [R(m * .5, m * .5, W - m, H - m, null, {stroke: p.primary, strokeW: Math.max(2, S * .006), radius: S * .02}),
      Tx(t.kicker, m, m + S * .02, tw, S * .03, p.primary, {bold: true, align: 'center', spacing: 5, font: t.bf}),
      Tx(t.title.toUpperCase(), m, m + S * .07, tw, S * .11, p.text, {bold: true, align: 'center', font: t.hf}), St(t.st[1], m * .9, m * .9, S * .12, {rot: -20}),
      Sh('diamond', W / 2 - S * .02, m + S * .22, S * .04, S * .04, p.accent)];
    items.forEach((it, i) => { const [nm, pr] = it.split(' — '), y = top + i * rowH;
      els.push(Tx(nm, m * 1.4, y, tw * .7, Math.min(S * .042, rowH * .4), p.text, {font: t.bf, bold: true}), Tx(pr || '', W - m * 1.4 - tw * .25, y, tw * .25, Math.min(S * .042, rowH * .4), p.primary, {font: t.hf, bold: true, align: 'right'}),
        Sh('line', m * 1.4, y + rowH * .62, tw - m * .8, 2, p.text, {opacity: .15})); });
    els.push(Tx(t.body + ' · ' + t.info, m, H - m - S * .07, tw, S * .026, p.text, {align: 'center', opacity: .75, font: t.bf}));
    return [{bg: p.bg, elements: els}];
  },
  logo(W, H, t) {
    const p = t.pal, S = Math.min(W, H), words = t.brand || t.kicker, init = words.split(' ').map(w => w[0]).join('').slice(0, 2);
    const shape = t.logoShape || 'hexagon';
    return [{bg: p.bg, elements: [Sh(shape, W / 2 - S * .26, S * .1, S * .52, S * .52, G(p.primary, p.accent)), Sh('ring', W / 2 - S * .2, S * .16, S * .4, S * .4, '#FFFFFF', {opacity: .25}),
      Tx(init, W / 2 - S * .26, S * .2, S * .52, S * .22, '#FFFFFF', {bold: true, align: 'center', font: t.hf}),
      Tx(words, S * .05, S * .68, W - S * .1, fitFs(words, W - S * .1, S * .09, 1, .7), p.text, {bold: true, align: 'center', font: t.hf, spacing: 2}),
      Tx(t.tagline || t.sub, S * .05, S * .82, W - S * .1, S * .04, p.text, {align: 'center', opacity: .7, font: t.bf, spacing: 1})]}];
  },
  deck(W, H, t) { // multi-page presentation
    const p = t.pal, S = Math.min(W, H), m = S * .09, fs = fitFs(t.title, W * .5, S * .13, 2, .6), items = (t.items.length ? t.items : ['Latar belakang', 'Ide utama', 'Langkah berikutnya']).slice(0, 4);
    const dark = p.text === '#FFFFFF' || p.bg === '#0B3D2E' || p.bg === '#1E2A23', ink = dark ? p.text : p.text;
    const cover = {bg: p.bg, title: 'Sampul', elements: [Ph(W * .55, 0, W * .45, H, G(p.soft, p.accent, 160), {mask: 'arch'}), St(t.st[0], W * .775 - S * .2, H * .4, S * .4),
      Sh('ring', W * .5, H * .7, S * .3, S * .3, p.primary, {opacity: .3}), R(m, H * .28, S * .012, H * .34, p.primary),
      Tx(t.kicker, m + S * .05, H * .28, W * .42, S * .035, p.primary, {bold: true, spacing: 4, font: t.bf}),
      Tx(t.title, m + S * .05, H * .34, W * .42, fs, ink, {bold: true, font: t.hf, lh: 1.05}),
      Tx(t.info, m + S * .05, H * .36 + tH(t.title, W * .42, fs, 1.05, .6), W * .4, S * .035, ink, {opacity: .8, font: t.bf})]};
    const agenda = {bg: p.soft, title: 'Agenda', elements: [Tx('Agenda', m, m, W * .4, S * .1, ink, {bold: true, font: t.hf}), St(t.st[1], W - m - S * .2, m, S * .2),
      ...items.flatMap((it, i) => { const x = m + i * (W - 2 * m) / items.length, w = (W - 2 * m) / items.length - S * .04;
        return [R(x, H * .38, w, H * .45, dark ? p.bg : '#FFFFFF', {radius: S * .03, shadow: {on: true, x: 0, y: 12, blur: 30, color: '#0000001f'}}),
          Tx('0' + (i + 1), x + S * .04, H * .38 + S * .04, w - S * .08, S * .1, i % 2 ? p.accent : p.primary, {bold: true, font: t.hf}),
          Tx(it, x + S * .04, H * .38 + S * .18, w - S * .08, S * .04, ink, {font: t.bf, bold: true})]; })]};
    const content = {bg: p.bg, title: 'Isi', elements: [R(0, 0, W, S * .02, p.primary), Tx('01', m, m * 1.4, S * .3, S * .12, p.accent, {bold: true, font: t.hf}),
      Tx(t.sub, m, m * 1.4 + S * .16, W * .45, S * .07, ink, {bold: true, font: t.hf, lh: 1.1}),
      Tx(t.body, m, m * 1.4 + S * .2 + tH(t.sub, W * .45, S * .07, 1.1, .6), W * .4, S * .035, ink, {font: t.bf, opacity: .85, lh: 1.5}),
      Ph(W * .55, m * 1.4, W * .45 - m, H - m * 2.8, G(p.primary, p.accent), {radius: S * .04}), St(t.st[2], W * .55 + (W * .45 - m) / 2 - S * .16, H / 2 - S * .16, S * .32)]};
    const chart = {bg: p.soft, title: 'Data', elements: [Tx('Pertumbuhan', m, m, W * .5, S * .08, ink, {bold: true, font: t.hf}),
      Tx('Angka contoh — klik grafik lalu ubah datanya di panel.', m, m + S * .11, W * .5, S * .032, ink, {font: t.bf, opacity: .75}),
      {id: uid(), type: 'image', x: Math.round(m), y: Math.round(H * .32), w: Math.round(W * .5), h: Math.round(W * .5 / 1.6), ar: 1.6, rot: 0, opacity: 1, radius: 0, crop: {zoom: 1, ox: 0, oy: 0}, name: 'Grafik',
        chart: {kind: 'bar', rows: [['Jan', 12], ['Feb', 19], ['Mar', 15], ['Apr', 26], ['Mei', 31]], colors: [p.primary, p.accent], ink}, src: ''},
      R(W * .62, H * .32, W * .38 - m, H * .5, dark ? p.bg : '#FFFFFF', {radius: S * .03}), Tx('+158%', W * .62 + S * .05, H * .32 + S * .06, W * .3, S * .13, p.primary, {bold: true, font: t.hf}),
      Tx('kenaikan pengunjung dalam lima bulan', W * .62 + S * .05, H * .32 + S * .24, W * .38 - m - S * .1, S * .035, ink, {font: t.bf})]};
    chart.elements[2].src = chartSrc(chart.elements[2].chart);
    const end = {bg: G(p.primary, p.accent, 135), title: 'Penutup', elements: [Sh('blob', -S * .2, -S * .2, S * .7, S * .7, '#FFFFFF', {opacity: .12}), Sh('ring', W - S * .5, H - S * .5, S * .7, S * .7, '#FFFFFF', {opacity: .15}),
      Tx('Terima kasih', m, H * .36, W - 2 * m, fitFs('Terima kasih', W - 2 * m, S * .15, 1, .6), '#FFFFFF', {bold: true, align: 'center', font: t.hf}), Tx(t.info, m, H * .58, W - 2 * m, S * .04, '#FFFFFF', {align: 'center', font: t.bf})]};
    return [cover, agenda, content, chart, end];
  },
};
const tplTheme = (k, extra = {}) => ({...THEMES[k], key: k, ...extra});
// [theme, size kind, layout, extra]
const TEMPLATE_DEFS = [
  ['makanan', 'instagram_post', 'hero'], ['makanan', 'story', 'poster'], ['makanan', 'square', 'card'], ['makanan', 'youtube_thumbnail', 'split'], ['makanan', 'banner', 'split'],
  ['kopi', 'instagram_post', 'split'], ['kopi', 'story', 'hero', {mask: 'arch'}], ['kopi', 'square', 'poster'], ['kopi', 'a4', 'menu', {items: THEMES.kopi.items}], ['kopi', 'logo', 'logo', {brand: 'Kedai Kita', tagline: 'KOPI & ROTI', logoShape: 'blob'}],
  ['fashion', 'instagram_post', 'poster'], ['fashion', 'story', 'poster'], ['fashion', 'square', 'split'], ['fashion', 'banner', 'poster'], ['fashion', 'youtube_thumbnail', 'poster'],
  ['webinar', 'instagram_post', 'card'], ['webinar', 'story', 'split'], ['webinar', 'presentation', 'deck'], ['webinar', 'a4', 'list'], ['webinar', 'youtube_thumbnail', 'split'],
  ['quotes', 'instagram_post', 'quote'], ['quotes', 'square', 'quote', {pal: {bg: '#1D3557', primary: '#F1C453', text: '#F1FAEE', accent: '#E63946', soft: '#264673'}, quote: 'Pelan-pelan saja, yang penting tidak berhenti.'}], ['quotes', 'story', 'quote', {quote: 'Hari yang biasa pun layak dirayakan.'}],
  ['edukasi', 'instagram_post', 'list'], ['edukasi', 'square', 'list'], ['edukasi', 'presentation', 'deck'], ['edukasi', 'story', 'card'], ['edukasi', 'youtube_thumbnail', 'poster'],
  ['properti', 'instagram_post', 'hero'], ['properti', 'a4', 'hero'], ['properti', 'square', 'list'], ['properti', 'banner', 'split'],
  ['loker', 'instagram_post', 'list'], ['loker', 'story', 'poster'], ['loker', 'a4', 'list'], ['loker', 'square', 'card'],
  ['lebaran', 'instagram_post', 'greet'], ['lebaran', 'story', 'greet'], ['lebaran', 'square', 'greet'], ['lebaran', 'banner', 'greet'],
  ['ultah', 'instagram_post', 'greet'], ['ultah', 'story', 'greet'], ['ultah', 'square', 'card'], ['ultah', 'a4', 'greet'],
  ['portofolio', 'presentation', 'deck'], ['portofolio', 'instagram_post', 'split'], ['portofolio', 'a4', 'list'], ['portofolio', 'logo', 'logo', {brand: 'Dimas Studio', tagline: 'DESAIN & ILUSTRASI', logoShape: 'squircle'}],
  ['menu', 'a4', 'menu'], ['menu', 'instagram_post', 'menu'], ['menu', 'story', 'menu'], ['menu', 'square', 'hero'],
  ['makanan', 'logo', 'logo', {brand: 'Geprek Juara', tagline: 'PEDAS · GURIH · MURAH', logoShape: 'burst'}], ['properti', 'logo', 'logo', {brand: 'Griya Asri', tagline: 'PROPERTI KELUARGA', logoShape: 'shield'}],
  ['kopi', 'presentation', 'deck'], ['makanan', 'a4', 'poster'],
];
const TEMPLATES = TEMPLATE_DEFS.map(([th, kind, layout, extra], i) => { const t = tplTheme(th, extra);
  return {id: `t${i}`, theme: th, kind, layout, cat: t.cat, name: `${t.cat} · ${(SIZES[kind] || {}).label || kind}`, search: `${t.cat} ${t.tags} ${t.title} ${(SIZES[kind] || {}).label} ${layout}`.toLowerCase(), t}; });
function buildTemplate(tp, W, H) { // returns pages with fresh ids
  return JSON.parse(JSON.stringify(LAYOUTS[tp.layout](W, H, tp.t))).map(pg => ({id: uid(), bg: pg.bg, title: pg.title, elements: pg.elements.map(e => ({...e, id: uid()}))}));
}

// ---------- text presets (font + effect combinations) ----------
const TEXT_PRESETS = [
  ['Judul tebal', 'JUALAN LARIS', {font: 'Archivo Black', color: '#111111', bold: true}, '#FFFFFF'],
  ['Neon malam', 'BUKA 24 JAM', {font: 'Bebas Neue', color: '#FFFFFF', effect: 'neon', fx: {color: '#FF4FD8', size: 10}}, '#1A1033'],
  ['Outline pop', 'PROMO!', {font: 'Archivo Black', color: '#FFD43B', effect: 'outline', fx: {color: '#111111', size: 12}, bold: true}, '#4DABF7'],
  ['Label kunyit', 'Terlaris minggu ini', {font: 'Plus Jakarta Sans', color: '#1D1604', effect: 'background', fx: {color: '#E8B02A', size: 16}, bold: true}, '#FFFFFF'],
  ['Hollow modern', 'KOLEKSI BARU', {font: 'Bricolage Grotesque', color: '#FFFFFF', effect: 'hollow', fx: {size: 6}, bold: true}, '#222222'],
  ['Serif elegan', 'Sederhana & Indah', {font: 'Playfair Display', color: '#3D2B1F', italic: true}, '#F5EEE4'],
  ['Script manis', 'Terima kasih', {font: 'Pacifico', color: '#E64980'}, '#FFF0F6'],
  ['Tulisan tangan', 'Selamat pagi!', {font: 'Dancing Script', color: '#2F5D8A', bold: true}, '#EAF2FA'],
  ['Bayangan retro', 'RETRO 90AN', {font: 'Bebas Neue', color: '#FF8C5A', effect: 'shadow', fx: {color: '#2A1B3D', size: 10}}, '#FFF4EC'],
  ['Terangkat', 'Ide Brilian', {font: 'Poppins', color: '#FFFFFF', effect: 'lift', fx: {size: 10}, bold: true}, '#36C5B1'],
  ['Kondensasi', 'BERITA HARI INI', {font: 'Oswald', color: '#C92A2A', bold: true, spacing: 2}, '#FFFFFF'],
  ['Editorial', 'Cerita dari Dapur', {font: 'DM Serif Display', color: '#13301F'}, '#EAF5EC'],
  ['Mono teknis', 'v2.0 // rilis', {font: 'JetBrains Mono', color: '#2F8F5B', bold: true}, '#0F1A14'],
  ['Spasi lebar', 'M I N I M A L I S', {font: 'Montserrat', color: '#212529', spacing: 6, bold: true}, '#F1F3F5'],
  ['Label gelap', 'Mulai Rp9.900', {font: 'Poppins', color: '#FFFFFF', effect: 'background', fx: {color: '#111111', size: 14}, bold: true}, '#FFD43B'],
  ['Neon hijau', 'GAME ON', {font: 'Archivo Black', color: '#E6FFE9', effect: 'neon', fx: {color: '#40C057', size: 9}}, '#0B1A10'],
  ['Kapital lembut', 'kelas akhir pekan', {font: 'Roboto', color: '#5F3DC4', upper: true, bold: true, spacing: 3}, '#F3F0FF'],
  ['Serif besar', 'Sabtu Ceria', {font: 'Lora', color: '#7A4A2A', bold: true, italic: true}, '#FDF6EC'],
];

// ---------- one-click styles: palette + font pair ----------
const STYLES = [
  ['Pagi Kunyit', ['#FFF8E7', '#E8B02A', '#1D1604', '#D95D39', '#F6E3B4'], 'Bricolage Grotesque', 'Plus Jakarta Sans'],
  ['Hutan Pinus', ['#EAF5EC', '#2F8F5B', '#13301F', '#F2A541', '#C7E6D0'], 'DM Serif Display', 'Lora'],
  ['Laut Teduh', ['#F2F7FB', '#1F6FB2', '#0E2236', '#36C5B1', '#D4E6F5'], 'Montserrat', 'Roboto'],
  ['Senja Kota', ['#2A1B3D', '#FF8C5A', '#FFF4EC', '#F4C95D', '#45305F'], 'Bebas Neue', 'Poppins'],
  ['Batik Sogan', ['#F4EDE1', '#7A4A2A', '#2A1E16', '#2F5D8A', '#E4D3BC'], 'Playfair Display', 'Lora'],
  ['Permen Kapas', ['#FFF0F6', '#E64980', '#4A1430', '#4DABF7', '#FFDEEB'], 'Pacifico', 'Poppins'],
  ['Monokrom', ['#FFFFFF', '#111111', '#111111', '#FF4D6D', '#F1F3F5'], 'Archivo Black', 'Montserrat'],
  ['Malam Neon', ['#0F0F1A', '#7CFFCB', '#F5F5FF', '#FF4FD8', '#1F1F33'], 'Oswald', 'JetBrains Mono'],
  ['Teh Hijau', ['#F3F7E9', '#6A8D3A', '#26301A', '#C9A227', '#DDE8C6'], 'Lora', 'Plus Jakarta Sans'],
  ['Terakota', ['#FBEFE6', '#C2552D', '#3A1C10', '#2E6F6A', '#F1D3C0'], 'DM Serif Display', 'Montserrat'],
  ['Langit Ungu', ['#F3F0FF', '#5F3DC4', '#1F1147', '#FAB005', '#E0D8FF'], 'Poppins', 'Roboto'],
  ['Kertas Kraft', ['#E9DCC6', '#3B2F2F', '#2A2222', '#B5651D', '#D8C6A8'], 'Oswald', 'Lora'],
];
