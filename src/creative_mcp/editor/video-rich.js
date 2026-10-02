// Rakit Video — original preview content made in code: synthesised music & sound effects,
// text styles, SVG stickers, effects, filters, transitions and animation presets.
// Everything here is preview-only ("demo:" library keys); CapCut never receives these items.
'use strict';
const RAKIT = (() => {
  // ---------------- audio synthesis ----------------
  const SR = 22050;
  const mf = m => 440 * Math.pow(2, (m - 69) / 12);
  function wavDataUrl(buf) {
    const d = buf.getChannelData(0), n = d.length, b = new Uint8Array(44 + n * 2), v = new DataView(b.buffer);
    const w = (o, s) => [...s].forEach((c, i) => b[o + i] = c.charCodeAt(0));
    w(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); w(8, 'WAVEfmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, buf.sampleRate, true); v.setUint32(28, buf.sampleRate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, n * 2, true);
    let mx = 0; for (let i = 0; i < n; i++) mx = Math.max(mx, Math.abs(d[i]));
    const g = mx > 0 ? .89 / mx : 1;
    for (let i = 0; i < n; i++) v.setInt16(44 + i * 2, Math.max(-32767, Math.min(32767, Math.round(d[i] * g * 32767))), true);
    let bin = ''; for (let i = 0; i < b.length; i += 8192) bin += String.fromCharCode(...b.subarray(i, i + 8192));
    return 'data:audio/wav;base64,' + btoa(bin);
  }
  function kit(ctx, out) {
    const nb = ctx.createBuffer(1, SR, SR), nd = nb.getChannelData(0); let seed = 7;
    for (let i = 0; i < nd.length; i++) { seed = (seed * 16807) % 2147483647; nd[i] = seed / 1073741823.5 - 1; }
    const noise = (t, len, type, freq, gain, q = 1, dest = out) => {
      const s = ctx.createBufferSource(); s.buffer = nb; s.loop = true; const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
      const g = ctx.createGain(); g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(.001, t + len);
      s.connect(f); f.connect(g); g.connect(dest); s.start(t, Math.random() * .5); s.stop(t + len + .02); return {f, g};
    };
    const tone = (t, f, len, {type = 'sine', gain = .2, a = .005, cut = 0, dest = out, f2 = 0, det = 0} = {}) => {
      const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + len); o.detune.value = det;
      const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + a); g.gain.exponentialRampToValueAtTime(.001, t + len);
      let n = o; if (cut) { const lp = ctx.createBiquadFilter(); lp.frequency.value = cut; o.connect(lp); n = lp; }
      n.connect(g); g.connect(dest); o.start(t); o.stop(t + len + .02);
    };
    const pad = (t, notes, len, {type = 'sawtooth', gain = .05, cut = 1200, a = .4, dest = out} = {}) => {
      const lp = ctx.createBiquadFilter(); lp.frequency.value = cut; const g = ctx.createGain();
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + a); g.gain.setValueAtTime(gain, t + Math.max(a, len - .35)); g.gain.linearRampToValueAtTime(0, t + len);
      lp.connect(g); g.connect(dest);
      for (const m of notes) for (const dt of [-7, 7]) { const o = ctx.createOscillator(); o.type = type; o.frequency.value = mf(m); o.detune.value = dt; o.connect(lp); o.start(t); o.stop(t + len + .05); }
    };
    const kick = (t, gain = .9) => tone(t, 130, .32, {gain, f2: 42, a: .002});
    const snare = (t, gain = .35) => { noise(t, .18, 'highpass', 1400, gain); tone(t, 190, .1, {gain: gain * .5, type: 'triangle'}); };
    const hat = (t, gain = .12, len = .05) => noise(t, len, 'highpass', 7500, gain);
    const clap = (t, gain = .3) => { for (const d of [0, .012, .026]) noise(t + d, .09, 'bandpass', 1500, gain, 2); };
    const delayBus = (time = .3, fb = .35, mix = .3) => {
      const inp = ctx.createGain(), d = ctx.createDelay(2), f = ctx.createGain(), w = ctx.createGain(); d.delayTime.value = time; f.gain.value = fb; w.gain.value = mix;
      inp.connect(out); inp.connect(d); d.connect(f); f.connect(d); d.connect(w); w.connect(out); return inp;
    };
    return {noise, tone, pad, kick, snare, hat, clap, delayBus};
  }
  const P = (root, ...ch) => ch.map(c => c.map(x => x + root));
  const MUSIC = [
    {id: 'ceria', name: 'Pagi Cerah', mood: 'Ceria', bpm: 118, color: '#F4C95D', bars: 8,
      prog: P(60, [0, 4, 7], [7, 11, 14], [9, 12, 16], [5, 9, 12]), play(k, t, b, ch, beat, bar) {
        k.pad(t, ch, beat * 4, {gain: .035, cut: 1800}); k.tone(t, mf(ch[0] - 24), beat * 2, {type: 'triangle', gain: .28}); k.tone(t + beat * 2, mf(ch[0] - 24), beat * 2, {type: 'triangle', gain: .25});
        for (let i = 0; i < 8; i++) k.tone(t + i * beat / 2, mf(ch[i % 3] + 12 + (i > 5 ? 12 : 0)), beat * .45, {type: 'triangle', gain: .09, dest: k.dly});
        for (let i = 0; i < 4; i++) { k.kick(t + i * beat, .7); k.hat(t + i * beat + beat / 2); } if (bar % 2) k.clap(t + beat * 3, .2); }},
    {id: 'santai', name: 'Sore Santai', mood: 'Santai', bpm: 84, color: '#7FD1AE', bars: 5,
      prog: P(53, [0, 4, 7, 11], [9, 12, 16, 19], [2, 5, 9, 12], [7, 11, 14, 17]), play(k, t, b, ch, beat) {
        k.pad(t, ch, beat * 4, {type: 'triangle', gain: .07, cut: 1400, a: .6}); k.tone(t, mf(ch[0] - 12), beat * 3, {gain: .3});
        [0, 1.5, 2.5, 3].forEach((p, i) => k.tone(t + p * beat, mf(ch[(i + 1) % 4] + 12), beat * 1.2, {gain: .08, dest: k.dly}));
        k.kick(t, .5); k.kick(t + beat * 2.5, .35); k.hat(t + beat, .06); k.hat(t + beat * 3, .06); }},
    {id: 'dramatis', name: 'Gerbang Badai', mood: 'Dramatis', bpm: 70, color: '#C0504D', bars: 5,
      prog: P(50, [0, 3, 7], [-4, 0, 3], [3, 7, 10], [-2, 2, 5]), play(k, t, b, ch, beat) {
        k.pad(t, [...ch, ch[0] - 12], beat * 4, {gain: .05, cut: 900, a: 1}); k.tone(t, mf(ch[0] - 24), beat * 4, {type: 'sawtooth', gain: .12, cut: 300, a: .3});
        k.kick(t, 1); k.noise(t, 1.2, 'lowpass', 160, .5); k.kick(t + beat * 2.5, .6); k.kick(t + beat * 3, .7);
        for (let i = 0; i < 8; i++) k.tone(t + i * beat / 2, mf(ch[0] + 12), beat * .3, {type: 'sawtooth', gain: .03, cut: 1600}); }},
    {id: 'lofi', name: 'Kamar Hujan', mood: 'Lo-fi', bpm: 78, color: '#9C8CD9', bars: 5,
      prog: P(51, [0, 4, 7, 11, 14], [5, 9, 12, 16], [2, 5, 9, 12], [7, 10, 14, 17]), play(k, t, b, ch, beat) {
        ch.forEach((m, i) => k.tone(t + i * .025, mf(m), beat * 3.6, {type: 'triangle', gain: .07, cut: 1500, a: .02}));
        k.tone(t, mf(ch[0] - 24), beat * 1.8, {gain: .35}); k.tone(t + beat * 2.5, mf(ch[2] - 24), beat * 1.2, {gain: .28});
        k.kick(t, .6); k.kick(t + beat * 1.75, .4); k.snare(t + beat, .18); k.snare(t + beat * 3, .18);
        for (let i = 0; i < 8; i++) k.hat(t + i * beat / 2 + (i % 2 ? beat * .08 : 0), .05); k.noise(t, beat * 4, 'bandpass', 3000, .015, .5); }},
    {id: 'epik', name: 'Puncak Gunung', mood: 'Epik', bpm: 96, color: '#E2863B', bars: 6,
      prog: P(48, [0, 3, 7], [-4, 0, 3], [3, 7, 10], [-2, 2, 5]), play(k, t, b, ch, beat) {
        k.pad(t, [...ch, ch[0] + 12], beat * 4, {gain: .055, cut: 2400, a: .2}); k.tone(t, mf(ch[0] - 24), beat * 4, {type: 'sawtooth', gain: .14, cut: 400});
        k.kick(t, 1); k.kick(t + beat * .75, .5); k.kick(t + beat * 2, 1); k.snare(t + beat * 1, .4); k.snare(t + beat * 3, .45); k.noise(t + beat * 2, .8, 'lowpass', 200, .35);
        for (let i = 0; i < 4; i++) k.tone(t + i * beat, mf(ch[2] + 12), beat * .8, {type: 'square', gain: .025, cut: 2000}); }},
    {id: 'romantis', name: 'Surat Untukmu', mood: 'Romantis', bpm: 72, color: '#E87A9A', bars: 5,
      prog: P(57, [0, 4, 7], [-3, 0, 4], [-7, -3, 0], [-5, -1, 2]), play(k, t, b, ch, beat) {
        k.pad(t, ch, beat * 4, {type: 'sine', gain: .09, cut: 2000, a: .8}); k.tone(t, mf(ch[0] - 12), beat * 4, {gain: .25, a: .1});
        for (let i = 0; i < 8; i++) k.tone(t + i * beat / 2, mf([ch[0], ch[1], ch[2], ch[1]][i % 4] + 12), beat * 1.4, {type: 'triangle', gain: .07, dest: k.dly}); }},
    {id: 'upbeat', name: 'Lari Malam', mood: 'Upbeat', bpm: 128, color: '#46C2FF', bars: 8,
      prog: P(55, [9, 12, 16], [5, 9, 12], [0, 4, 7], [7, 11, 14]), play(k, t, b, ch, beat) {
        for (let i = 0; i < 4; i++) { k.kick(t + i * beat, .9); k.tone(t + i * beat + beat / 2, mf(ch[0] - 24), beat * .4, {type: 'sawtooth', gain: .16, cut: 700}); k.hat(t + i * beat + beat / 2, .14); }
        k.clap(t + beat, .3); k.clap(t + beat * 3, .3);
        [0, 1.5, 3].forEach(p => ch.forEach(m => k.tone(t + p * beat, mf(m + 12), beat * .35, {type: 'sawtooth', gain: .03, cut: 3000}))); }},
    {id: 'misteri', name: 'Lorong Sunyi', mood: 'Misteri', bpm: 64, color: '#5F8A8B', bars: 4,
      prog: P(40, [0, 7], [1, 8], [0, 7], [-1, 6]), play(k, t, b, ch, beat) {
        k.pad(t, [ch[0], ch[1], ch[0] + 12], beat * 4, {gain: .05, cut: 600, a: 1.2}); k.kick(t, .45); k.kick(t + beat * 2, .3);
        const mel = [12, 15, 13, 19, 18, 12]; for (let i = 0; i < 3; i++) k.tone(t + (i * 1.3 + .5) * beat, mf(ch[0] + 24 + mel[(b * 3 + i) % mel.length]), beat * 1.5, {type: 'sine', gain: .08, dest: k.dly});
        k.noise(t, beat * 4, 'bandpass', 400, .03, 4); }},
  ];
  const SFX = [
    {id: 'whoosh', name: 'Whoosh', dur: 1, make(k, ctx) { const {f} = k.noise(0, .9, 'bandpass', 300, .9, 1.5); f.frequency.exponentialRampToValueAtTime(3000, .45); f.frequency.exponentialRampToValueAtTime(500, .9); }},
    {id: 'pop', name: 'Pop', dur: .4, make(k) { k.tone(0, 900, .12, {gain: .8, f2: 180}); k.noise(0, .03, 'highpass', 3000, .3); }},
    {id: 'klik', name: 'Klik', dur: .2, make(k) { k.noise(0, .02, 'highpass', 4000, .9); k.tone(0, 2200, .03, {gain: .4, type: 'square'}); }},
    {id: 'ding', name: 'Ding', dur: 2, make(k) { [1, 2.76, 5.4].forEach((m, i) => k.tone(0, 880 * m, 1.8 / (i + 1), {gain: .5 / (i + 1)})); }},
    {id: 'swoosh-naik', name: 'Swoosh naik', dur: 1.1, make(k) { const {f} = k.noise(0, 1, 'bandpass', 250, .8, 3); f.frequency.exponentialRampToValueAtTime(5000, 1); k.tone(0, 200, 1, {gain: .15, f2: 1600, type: 'triangle'}); }},
    {id: 'swoosh-turun', name: 'Swoosh turun', dur: 1.1, make(k) { const {f} = k.noise(0, 1, 'bandpass', 5000, .8, 3); f.frequency.exponentialRampToValueAtTime(200, 1); k.tone(0, 1600, 1, {gain: .15, f2: 160, type: 'triangle'}); }},
    {id: 'tepuk', name: 'Tepuk tangan', dur: 2.5, make(k) { for (let i = 0; i < 70; i++) { const t = Math.random() * 2; k.noise(t, .06 + Math.random() * .05, 'bandpass', 900 + Math.random() * 1800, .25 + Math.random() * .3, 1.5); } }},
    {id: 'ketukan', name: 'Ketukan', dur: .9, make(k) { [0, .22, .44].forEach(t => { k.noise(t, .06, 'bandpass', 900, .9, 6); k.tone(t, 180, .1, {gain: .5}); }); }},
    {id: 'notifikasi', name: 'Notifikasi', dur: 1.2, make(k) { k.tone(0, mf(76), .5, {gain: .4, type: 'triangle'}); k.tone(.14, mf(83), .9, {gain: .4, type: 'triangle'}); }},
    {id: 'glitch', name: 'Glitch', dur: 1, make(k) { for (let i = 0; i < 16; i++) { const t = i * .055; k.tone(t, 80 + Math.random() * 1600, .045, {type: 'square', gain: .25}); if (i % 3 === 0) k.noise(t, .04, 'highpass', 2000, .4); } }},
    {id: 'riser', name: 'Riser', dur: 3.2, make(k, ctx) { const {f, g} = k.noise(0, 3, 'bandpass', 300, .05, 2); g.gain.cancelScheduledValues(0); g.gain.setValueAtTime(.05, 0); g.gain.linearRampToValueAtTime(.8, 2.9); g.gain.linearRampToValueAtTime(0, 3.05); f.frequency.exponentialRampToValueAtTime(6000, 3);
      const o = ctx.createOscillator(), og = ctx.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(110, 0); o.frequency.exponentialRampToValueAtTime(880, 3); og.gain.setValueAtTime(0, 0); og.gain.linearRampToValueAtTime(.12, 2.9); og.gain.linearRampToValueAtTime(0, 3.05); o.connect(og); og.connect(k.out); o.start(0); o.stop(3.1); }},
    {id: 'impact', name: 'Impact', dur: 2.2, make(k) { k.tone(0, 90, 1.8, {gain: 1, f2: 28, a: .002}); k.noise(0, .5, 'lowpass', 900, .9); k.noise(0, 1.6, 'lowpass', 220, .5); }},
    {id: 'ketik', name: 'Ketik', dur: 2, make(k) { let t = 0; while (t < 1.8) { k.noise(t, .025, 'bandpass', 2500 + Math.random() * 2500, .6, 3); k.tone(t, 300 + Math.random() * 200, .02, {gain: .2}); t += .07 + Math.random() * .12; } k.tone(1.85, 1800, .25, {gain: .2}); }},
  ];
  const cache = {}, pending = {};
  async function render(id) {
    const [kind, key] = id.split(':');
    const C = window.OfflineAudioContext || window.webkitOfflineAudioContext; if (!C) throw new Error('WebAudio tidak tersedia');
    if (kind === 'music') {
      const m = MUSIC.find(x => x.id === key); if (!m) throw new Error('unknown'); const beat = 60 / m.bpm, len = m.bars * 4 * beat;
      const ctx = new C(1, Math.ceil(SR * (len + 1)), SR), master = ctx.createGain(), comp = ctx.createDynamicsCompressor(); master.gain.value = .6;
      master.gain.setValueAtTime(.6, Math.max(0, len - 1.4)); master.gain.linearRampToValueAtTime(0, len + .4); master.connect(comp); comp.connect(ctx.destination);
      const k = kit(ctx, master); k.out = master; k.dly = k.delayBus(beat * .75, .35, .35);
      for (let b = 0; b < m.bars; b++) m.play(k, b * 4 * beat, b, m.prog[b % m.prog.length], beat, b);
      return wavDataUrl(await ctx.startRendering());
    }
    const s = SFX.find(x => x.id === key); if (!s) throw new Error('unknown');
    const ctx = new C(1, Math.ceil(SR * s.dur), SR), master = ctx.createGain(); master.connect(ctx.destination);
    const k = kit(ctx, master); k.out = master; s.make(k, ctx); return wavDataUrl(await ctx.startRendering());
  }
  const audio = {
    music: MUSIC.map(m => ({id: 'music:' + m.id, name: m.name, mood: m.mood, bpm: m.bpm, color: m.color, dur: +(m.bars * 4 * 60 / m.bpm + .4).toFixed(2)})),
    sfx: SFX.map(s => ({id: 'sfx:' + s.id, name: s.name, dur: s.dur})),
    url: id => cache[id] || null,
    ensure(id) { if (cache[id]) return Promise.resolve(cache[id]); return pending[id] ||= render(id).then(u => (cache[id] = u)).finally(() => delete pending[id]); },
  };

  // ---------------- stickers (hand-drawn inline SVG) ----------------
  const svg = (body, vb = '0 0 100 100') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}">${body}</svg>`;
  const face = (bg, mouth, eyes = '<circle cx="36" cy="42" r="6" fill="#2a1a0a"/><circle cx="64" cy="42" r="6" fill="#2a1a0a"/>', extra = '') => svg(`<circle cx="50" cy="52" r="42" fill="${bg}" stroke="#2a1a0a" stroke-width="4"/>${eyes}${mouth}${extra}`);
  const badge = (txt, c1, c2, fs = 22) => svg(`<g transform="rotate(-8 50 50)"><path d="M50 6l9 8 12-3 3 12 12 4-4 12 8 9-8 9 4 12-12 4-3 12-12-3-9 8-9-8-12 3-3-12-12-4 4-12-8-9 8-9-4-12 12-4 3-12 12 3z" fill="${c1}" stroke="#fff" stroke-width="3"/><text x="50" y="${50 + fs * .36}" text-anchor="middle" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="${fs}" fill="${c2}">${txt}</text></g>`);
  const STICKERS = [
    ['panah-kanan', 'Panah kanan', svg('<path d="M10 40h50V22l32 28-32 28V60H10z" fill="#FF7A45" stroke="#fff" stroke-width="4" stroke-linejoin="round"/>'), 'shake'],
    ['panah-lengkung', 'Panah lengkung', svg('<path d="M18 78C20 40 46 24 72 30" fill="none" stroke="#FFD23F" stroke-width="9" stroke-linecap="round"/><path d="M62 14l22 18-26 10z" fill="#FFD23F"/>'), 'float'],
    ['panah-bawah', 'Lihat ke sini', svg('<path d="M38 8h24v46h18L50 92 20 54h18z" fill="#46C2FF" stroke="#0a2a3a" stroke-width="4" stroke-linejoin="round"/>'), 'bounce'],
    ['kilau', 'Kilau', svg('<path d="M50 6c4 26 18 40 44 44-26 4-40 18-44 44-4-26-18-40-44-44 26-4 40-18 44-44z" fill="#FFE66D"/><path d="M80 10c1.5 8 5 11.5 13 13-8 1.5-11.5 5-13 13-1.5-8-5-11.5-13-13 8-1.5 11.5-5 13-13z" fill="#fff"/>'), 'pulse'],
    ['kilau-tiga', 'Tiga kilau', svg('<g fill="#C9A7FF"><path d="M30 20c3 16 10 23 26 26-16 3-23 10-26 26-3-16-10-23-26-26 16-3 23-10 26-26z"/><path d="M72 46c2 10 7 15 17 17-10 2-15 7-17 17-2-10-7-15-17-17 10-2 15-7 17-17z" fill="#46C2FF"/><path d="M74 8c1.5 6 4 8.5 10 10-6 1.5-8.5 4-10 10-1.5-6-4-8.5-10-10 6-1.5 8.5-4 10-10z" fill="#FFE66D"/></g>'), 'flicker'],
    ['senyum', 'Senyum', face('#FFD23F', '<path d="M30 60q20 22 40 0" fill="none" stroke="#2a1a0a" stroke-width="5" stroke-linecap="round"/>'), 'bounce'],
    ['tertawa', 'Tertawa', face('#FFC145', '<path d="M28 56h44q-4 26-22 26T28 56z" fill="#2a1a0a"/><path d="M36 70q14 8 28 0v6q-14 8-28 0z" fill="#ff6b6b"/>', '<path d="M28 44q8-8 16 0M56 44q8-8 16 0" fill="none" stroke="#2a1a0a" stroke-width="5" stroke-linecap="round"/>'), 'shake'],
    ['kaget', 'Kaget', face('#FFE66D', '<ellipse cx="50" cy="70" rx="9" ry="12" fill="#2a1a0a"/>', '<circle cx="36" cy="42" r="9" fill="#fff" stroke="#2a1a0a" stroke-width="3"/><circle cx="64" cy="42" r="9" fill="#fff" stroke="#2a1a0a" stroke-width="3"/><circle cx="36" cy="43" r="4"/><circle cx="64" cy="43" r="4"/>'), 'pulse'],
    ['cinta', 'Mata cinta', face('#FFC145', '<path d="M32 62q18 18 36 0" fill="none" stroke="#2a1a0a" stroke-width="5" stroke-linecap="round"/>', '<path d="M36 50l-9-9a5.5 5.5 0 0 1 9-6 5.5 5.5 0 0 1 9 6z" fill="#FF4D6D"/><path d="M64 50l-9-9a5.5 5.5 0 0 1 9-6 5.5 5.5 0 0 1 9 6z" fill="#FF4D6D"/>'), 'pulse'],
    ['keren', 'Kacamata', face('#FFD23F', '<path d="M36 66q14 10 28 0" fill="none" stroke="#2a1a0a" stroke-width="5" stroke-linecap="round"/>', '<path d="M18 38h64v4l-4 12q-12 4-18-4l-4-6h-4l-4 6q-6 8-18 4l-4-12h-4z" fill="#111"/>'), 'swing'],
    ['berpikir', 'Berpikir', face('#FFE08A', '<path d="M38 68h22" stroke="#2a1a0a" stroke-width="5" stroke-linecap="round"/>', '<circle cx="36" cy="42" r="5" fill="#2a1a0a"/><path d="M58 40q6-6 12 0" fill="none" stroke="#2a1a0a" stroke-width="5" stroke-linecap="round"/><circle cx="84" cy="16" r="5" fill="#fff"/><circle cx="92" cy="6" r="3" fill="#fff"/>'), 'float'],
    ['hati', 'Hati', svg('<path d="M50 88L14 52A20 20 0 0 1 50 24a20 20 0 0 1 36 28z" fill="#FF4D6D" stroke="#fff" stroke-width="4"/><path d="M28 40q4-8 12-8" fill="none" stroke="#fff9" stroke-width="5" stroke-linecap="round"/>'), 'pulse'],
    ['hati-banyak', 'Hati beterbangan', svg('<g stroke="#fff" stroke-width="2"><path d="M30 70L12 52a10 10 0 0 1 18-14 10 10 0 0 1 18 14z" fill="#FF8FA3"/><path d="M68 54L52 38a9 9 0 0 1 16-12 9 9 0 0 1 16 12z" fill="#FF4D6D"/><path d="M60 92L48 80a7 7 0 0 1 12-9 7 7 0 0 1 12 9z" fill="#C9184A"/></g>'), 'float'],
    ['api', 'Api', svg('<path d="M50 94c-22 0-34-14-32-32 2-14 12-20 14-34 8 6 12 14 12 22 4-8 6-18 4-30 18 10 32 30 30 50-2 14-12 24-28 24z" fill="#FF6B1A"/><path d="M50 94c-10 0-17-7-16-16 1-8 7-12 9-20 5 4 7 9 7 14 3-3 5-8 5-13 9 7 13 16 11 23-2 8-8 12-16 12z" fill="#FFD23F"/>'), 'swing'],
    ['ledakan', 'Ledakan bintang', svg('<path d="M50 4l8 22 22-12-8 24 24 4-20 14 16 18-24-2 4 24-18-16-8 22-6-22-18 16 4-24-24 2 16-18L2 62l24-4-8-24 22 12z" fill="#FF4D6D" stroke="#FFE66D" stroke-width="3"/><text x="50" y="60" text-anchor="middle" font-family="Arial Black,Arial" font-weight="900" font-size="20" fill="#FFE66D">WOW</text>'), 'pulse'],
    ['bintang', 'Bintang ceria', svg('<path d="M50 6l13 28 30 4-22 21 6 31-27-15-27 15 6-31L7 38l30-4z" fill="#FFD23F" stroke="#E2863B" stroke-width="4" stroke-linejoin="round"/><circle cx="40" cy="50" r="4" fill="#2a1a0a"/><circle cx="60" cy="50" r="4" fill="#2a1a0a"/><path d="M42 62q8 7 16 0" fill="none" stroke="#2a1a0a" stroke-width="3.5" stroke-linecap="round"/>'), 'spin'],
    ['baru', 'Label BARU', badge('BARU', '#FF4D6D', '#fff', 21), 'pulse'],
    ['promo', 'Label PROMO', badge('PROMO', '#FFD23F', '#C9184A', 17), 'shake'],
    ['diskon', 'Diskon 50%', badge('-50%', '#2EC4B6', '#fff', 23), 'spin'],
    ['lonceng', 'Lonceng notifikasi', svg('<path d="M50 12c-16 0-26 12-26 28v18l-8 12h68l-8-12V40c0-16-10-28-26-28z" fill="#FFD23F" stroke="#2a1a0a" stroke-width="4" stroke-linejoin="round"/><circle cx="50" cy="80" r="8" fill="#2a1a0a"/><circle cx="76" cy="20" r="11" fill="#FF4D6D" stroke="#fff" stroke-width="3"/><text x="76" y="25" text-anchor="middle" font-family="Arial" font-weight="700" font-size="13" fill="#fff">1</text>'), 'swing'],
    ['jempol', 'Jempol', svg('<rect x="10" y="44" width="18" height="42" rx="4" fill="#46C2FF" stroke="#0a2a3a" stroke-width="4"/><path d="M30 46l14-28c8-2 12 4 10 12l-4 12h26c6 0 10 6 8 12l-8 28c-2 4-5 6-9 6H30z" fill="#fff" stroke="#0a2a3a" stroke-width="4" stroke-linejoin="round"/>'), 'bounce'],
    ['ikuti', 'Tombol ikuti', svg('<rect x="4" y="30" width="92" height="40" rx="20" fill="#FF3355"/><path d="M18 40l14 10-14 10z" fill="#fff"/><text x="60" y="56" text-anchor="middle" font-family="Arial Black,Arial" font-weight="900" font-size="16" fill="#fff">IKUTI</text>', '0 0 100 100'), 'pulse'],
    ['gelembung', 'Gelembung chat', svg('<path d="M12 18h76a8 8 0 0 1 8 8v40a8 8 0 0 1-8 8H40L22 90V74H12a8 8 0 0 1-8-8V26a8 8 0 0 1 8-8z" fill="#fff" stroke="#2a1a0a" stroke-width="4" stroke-linejoin="round"/><circle cx="30" cy="46" r="6" fill="#2a1a0a"/><circle cx="50" cy="46" r="6" fill="#2a1a0a"/><circle cx="70" cy="46" r="6" fill="#2a1a0a"/>'), 'float'],
    ['petir', 'Petir', svg('<path d="M58 4L18 56h26l-8 40 46-56H54z" fill="#FFE66D" stroke="#E2863B" stroke-width="4" stroke-linejoin="round"/>'), 'flicker'],
    ['matahari', 'Matahari', svg('<g stroke="#FFB703" stroke-width="7" stroke-linecap="round"><path d="M50 4v12M50 84v12M4 50h12M84 50h12M17 17l8 8M75 75l8 8M17 83l8-8M75 25l8-8"/></g><circle cx="50" cy="50" r="24" fill="#FFD23F"/>'), 'spin'],
    ['awan', 'Awan', svg('<path d="M26 74a16 16 0 0 1-2-32 22 22 0 0 1 42-6 16 16 0 0 1 12 38z" fill="#fff" stroke="#9ec9ff" stroke-width="4"/>'), 'float'],
    ['centang', 'Centang', svg('<circle cx="50" cy="50" r="42" fill="#2EC4B6" stroke="#fff" stroke-width="4"/><path d="M30 52l14 14 28-30" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>'), 'pulse'],
    ['silang', 'Silang', svg('<circle cx="50" cy="50" r="42" fill="#FF4D6D" stroke="#fff" stroke-width="4"/><path d="M34 34l32 32M66 34L34 66" stroke="#fff" stroke-width="10" stroke-linecap="round"/>'), 'shake'],
    ['musik', 'Not musik', svg('<path d="M38 74V22l44-10v50" fill="none" stroke="#C9A7FF" stroke-width="7" stroke-linejoin="round"/><ellipse cx="28" cy="76" rx="13" ry="10" fill="#C9A7FF"/><ellipse cx="72" cy="64" rx="13" ry="10" fill="#C9A7FF"/>'), 'swing'],
    ['lokasi', 'Pin lokasi', svg('<path d="M50 94S18 58 18 38a32 32 0 0 1 64 0c0 20-32 56-32 56z" fill="#FF4D6D" stroke="#fff" stroke-width="4"/><circle cx="50" cy="38" r="12" fill="#fff"/>'), 'bounce'],
  ].map(([id, name, s, loop]) => ({key: 'demo:sticker:' + id, kind: 'sticker', name, vip: false, orig: true, preview: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s), anim: {loop: {id: loop, d: 1.2}}}));

  // ---------------- text styles & templates ----------------
  const TS = {
    plain: {}, bold: {font: 'display', weight: 800, shadow: '0 .06em .18em #000c'},
    title: {font: 'display', weight: 800, upper: true, ls: .02, shadow: '0 .05em 0 #0006, 0 .1em .3em #0008'},
    box: {bg: '#000000b3', pad: .25, radius: .18, shadow: 'none'},
    lower: {bg: '#FFD23F', color: '#151515', pad: .28, radius: .08, weight: 800, shadow: 'none', bar: '#FF4D6D'},
    neon: {glow: '#46C2FF', color: '#E9FBFF', font: 'display', weight: 700},
    neonpink: {glow: '#FF4D9A', color: '#FFE9F4', font: 'display', weight: 700},
    outline: {stroke: '#111', strokeW: .07, font: 'display', weight: 800, shadow: 'none'},
    outlinehollow: {stroke: '#fff', strokeW: .04, color: 'transparent', font: 'display', weight: 800, shadow: 'none', upper: true},
    highlight: {bg: '#FF4D6D', color: '#fff', pad: .18, radius: .4, weight: 800, shadow: 'none', italic: false},
    marker: {mark: '#FFE66D', color: '#151515', weight: 800, shadow: 'none'},
    sub: {bg: '#000000a6', pad: .18, radius: .12, weight: 600, shadow: 'none'},
    retro: {font: 'display', weight: 800, color: '#FFD23F', shadow: '.06em .06em 0 #FF4D6D, .12em .12em 0 #46C2FF', upper: true},
    count: {font: 'display', weight: 800, color: '#fff', shadow: '0 0 .3em #FF4D6D, 0 .05em 0 #0008'},
    quote: {font: 'display', italic: true, weight: 700, color: '#FFE9C7', shadow: '0 .05em .2em #000a'},
    gradient: {grad: 'linear-gradient(90deg,#FFD23F,#FF4D6D 50%,#C9A7FF)', font: 'display', weight: 800, shadow: 'none', upper: true},
  };
  const T = (name, text, style, o = {}) => ({name, text, tstyle: TS[style], font_size: 8, ...o});
  const TEXTS = [
    T('Judul besar', 'JUDUL VIDEO', 'title', {font_size: 15, y: .35, anim: {in: {id: 'pop', d: .5}, out: {id: 'fade', d: .4}}}),
    T('Judul retro', 'AKHIR PEKAN', 'retro', {font_size: 14, y: .3, anim: {in: {id: 'slideUp', d: .6}}}),
    T('Judul gradasi', 'RILIS BARU', 'gradient', {font_size: 14, y: .3, anim: {in: {id: 'zoomIn', d: .6}, out: {id: 'zoomOut', d: .4}}}),
    T('Kartu judul', 'Bab 1\nPerjalanan dimulai', 'box', {font_size: 10, anim: {in: {id: 'fade', d: .6}, out: {id: 'fade', d: .6}}}),
    T('Lower third', 'Rani Pratiwi\nPembuat konten', 'lower', {font_size: 6.5, x: -.45, y: -.62, text_align: 'left', anim: {in: {id: 'slideRight', d: .5}, out: {id: 'slideLeft', d: .4}}}),
    T('Lower third gelap', 'LIVE · Jakarta', 'sub', {font_size: 6.5, x: -.5, y: -.7, text_align: 'left', anim: {in: {id: 'wipe', d: .5}}}),
    T('Kotak subtitle', 'Tulis subtitle di sini', 'sub', {font_size: 6.5, y: -.62, anim: {in: {id: 'fade', d: .2}, out: {id: 'fade', d: .2}}}),
    T('Neon biru', 'NEON', 'neon', {font_size: 16, anim: {loop: {id: 'flicker', d: 1.6}}}),
    T('Neon merah muda', 'Malam ini', 'neonpink', {font_size: 12, anim: {in: {id: 'blur', d: .6}}}),
    T('Garis tepi', 'TEKS TEBAL', 'outline', {font_size: 12, anim: {in: {id: 'bounce', d: .6}}}),
    T('Garis kosong', 'GAYA', 'outlinehollow', {font_size: 18, anim: {in: {id: 'zoomOut', d: .6}}}),
    T('Label sorot', 'PENTING!', 'highlight', {font_size: 9, anim: {in: {id: 'pop', d: .4}, loop: null}}),
    T('Stabilo', 'kata kunci', 'marker', {font_size: 10, anim: {in: {id: 'wipe', d: .5}}}),
    T('Mesin ketik', 'Halo, selamat datang…', 'bold', {font_size: 8, anim: {in: {id: 'typewriter', d: 1.6}}}),
    T('Hitung mundur', '3', 'count', {font_size: 30, countdown: true, duration: 3, anim: {loop: {id: 'pulse', d: 1}}}),
    T('Kutipan', '“Mulai saja dulu.”', 'quote', {font_size: 11, anim: {in: {id: 'slideUp', d: .7}, out: {id: 'fade', d: .5}}}),
    T('Ajakan ikuti', 'Ikuti untuk part 2 →', 'highlight', {font_size: 8, y: -.5, anim: {loop: {id: 'bounce', d: 1}}}),
    T('Teks polos', 'Teks biasa', 'plain', {font_size: 8}),
  ];
  function textCss(ts = {}, fsPx = 16) {
    const c = [];
    if (ts.font === 'display') c.push('font-family:var(--f-display)'); if (ts.weight) c.push('font-weight:' + ts.weight); if (ts.italic) c.push('font-style:italic');
    if (ts.upper) c.push('text-transform:uppercase'); if (ts.ls) c.push(`letter-spacing:${ts.ls}em`); if (ts.color === 'transparent') c.push('color:transparent');
    if (ts.shadow) c.push('text-shadow:' + ts.shadow);
    if (ts.glow) c.push(`text-shadow:0 0 .08em #fff,0 0 .25em ${ts.glow},0 0 .6em ${ts.glow},0 0 1.1em ${ts.glow}`);
    if (ts.bg) c.push(`background:${ts.bg};padding:${ts.pad || .2}em ${(ts.pad || .2) * 1.6}em;border-radius:${ts.radius || 0}em`);
    if (ts.bar) c.push(`box-shadow:inset .22em 0 0 ${ts.bar}`);
    if (ts.stroke) c.push(`-webkit-text-stroke:${Math.max(1, (ts.strokeW || .05) * fsPx)}px ${ts.stroke};paint-order:stroke fill`);
    if (ts.mark) c.push(`background:linear-gradient(transparent 55%,${ts.mark} 55% 92%,transparent 92%);padding:0 .15em`);
    if (ts.grad) c.push(`background:${ts.grad};-webkit-background-clip:text;background-clip:text;color:transparent`);
    return c.join(';');
  }

  // ---------------- animation presets ----------------
  const eo = q => 1 - Math.pow(1 - q, 3), back = q => { const c = 1.7; return 1 + (c + 1) * Math.pow(q - 1, 3) + c * Math.pow(q - 1, 2); };
  // q: 0 = hidden/start of "in" (or end of "out"), 1 = at rest
  const IO = {
    fade: ['Pudar', q => ({a: q})],
    slideUp: ['Geser naik', q => ({a: q, dy: (1 - eo(q)) * .25})],
    slideDown: ['Geser turun', q => ({a: q, dy: -(1 - eo(q)) * .25})],
    slideLeft: ['Geser kiri', q => ({a: q, dx: (1 - eo(q)) * .4})],
    slideRight: ['Geser kanan', q => ({a: q, dx: -(1 - eo(q)) * .4})],
    pop: ['Pop', q => ({a: Math.min(1, q * 3), s: back(q)})],
    zoomIn: ['Perbesar', q => ({a: q, s: .3 + .7 * eo(q)})],
    zoomOut: ['Perkecil', q => ({a: q, s: 1 + 1.2 * (1 - eo(q))})],
    spin: ['Putar', q => ({a: q, r: -(1 - eo(q)) * 270, s: .4 + .6 * eo(q)})],
    blur: ['Kabur', q => ({a: q, blur: (1 - q) * 14})],
    bounce: ['Pantul', q => ({a: Math.min(1, q * 4), dy: q < 1 ? -Math.abs(Math.cos(q * Math.PI * 2.5)) * (1 - q) * .3 : 0})],
    wipe: ['Sapu', q => ({clip: q})],
    typewriter: ['Mesin ketik', q => ({chars: q}), 'text'],
  };
  const LOOP = {
    bounce: ['Lompat', p => ({dy: -Math.abs(Math.sin(p * Math.PI)) * .05})],
    spin: ['Berputar', p => ({r: p * 360})],
    pulse: ['Denyut', p => ({s: 1 + .1 * Math.sin(p * Math.PI * 2)})],
    shake: ['Goyang', p => ({r: Math.sin(p * Math.PI * 6) * 6})],
    float: ['Melayang', p => ({dy: Math.sin(p * Math.PI * 2) * .025, dx: Math.cos(p * Math.PI * 2) * .01})],
    swing: ['Ayun', p => ({r: Math.sin(p * Math.PI * 2) * 14})],
    flicker: ['Kedip', p => ({a: (Math.sin(p * 37) > -.2 && (p % .5) > .06) ? 1 : .35})],
  };
  function animState(e, tl) { // combined offsets for an element at local time tl
    const out = {dx: 0, dy: 0, s: 1, r: 0, a: 1, blur: 0, chars: 1, clip: 1}, A = e.anim || {};
    const mix = o => { if (!o) return; out.dx += o.dx || 0; out.dy += o.dy || 0; out.s *= o.s ?? 1; out.r += o.r || 0; out.a *= o.a ?? 1; out.blur += o.blur || 0; out.chars = Math.min(out.chars, o.chars ?? 1); out.clip = Math.min(out.clip, o.clip ?? 1); };
    if (A.in && IO[A.in.id] && tl < A.in.d) mix(IO[A.in.id][1](Math.max(0, tl / A.in.d)));
    if (A.out && IO[A.out.id] && e.duration - tl < A.out.d) { const o = IO[A.out.id][1](Math.max(0, (e.duration - tl) / A.out.d)); if (o.dx) o.dx = -o.dx; if (o.dy) o.dy = -o.dy; if (o.r) o.r = -o.r; mix(o); }
    if (A.loop && LOOP[A.loop.id]) mix(LOOP[A.loop.id][1]((tl / (A.loop.d || 1)) % 1));
    out.a = Math.max(0, Math.min(1, out.a)); return out;
  }

  // ---------------- filters, adjustments, effects, transitions ----------------
  const FILTERS = [
    ['hangat', 'Hangat', 'sepia(.25) saturate(1.25) hue-rotate(-8deg) brightness(1.04)'], ['dingin', 'Dingin', 'saturate(1.05) hue-rotate(12deg) brightness(1.02) contrast(1.05)'],
    ['bw', 'Hitam putih', 'grayscale(1) contrast(1.15)'], ['vintage', 'Vintage', 'sepia(.45) contrast(.9) brightness(1.05) saturate(.85)'],
    ['pudar', 'Pudar', 'contrast(.78) brightness(1.12) saturate(.7)'], ['kontras', 'Kontras', 'contrast(1.4) saturate(1.15)'],
    ['tealorange', 'Teal & Orange', 'contrast(1.15) saturate(1.35) sepia(.15) hue-rotate(-12deg)'], ['sinematik', 'Sinematik', 'contrast(1.2) saturate(.85) brightness(.92) sepia(.12)'],
    ['pastel', 'Pastel', 'saturate(.6) brightness(1.15) contrast(.85)'], ['sepia', 'Sepia', 'sepia(.85) contrast(1.05)'],
    ['neon', 'Neon', 'saturate(2) contrast(1.2) hue-rotate(-20deg)'], ['malam', 'Malam', 'brightness(.65) saturate(.6) hue-rotate(20deg) contrast(1.15)'],
    ['film', 'Film klasik', 'sepia(.3) contrast(1.1) saturate(.8) brightness(.96)', true],
  ].map(([id, name, css, vip]) => ({key: 'demo:filter:' + id, kind: 'filter', name, css, vip: !!vip, orig: true}));
  const ADJUSTS = [
    ['terang', 'Kecerahan +', {b: .2}], ['kontras', 'Kontras lembut', {c: .15}], ['jenuh', 'Warna hidup', {s: .4}], ['hangat', 'Suhu hangat', {temp: .5}],
    ['sejuk', 'Suhu sejuk', {temp: -.5}], ['redup', 'Redup', {b: -.2, s: -.2}], ['kustom', 'Penyesuaian kustom', {}],
  ].map(([id, name, adj]) => ({key: 'demo:adjust:' + id, kind: 'adjust', name, adj, vip: false, orig: true}));
  function adjCss(a = {}) { const p = []; if (a.b) p.push(`brightness(${1 + a.b})`); if (a.c) p.push(`contrast(${1 + a.c})`); if (a.s) p.push(`saturate(${1 + a.s})`); return p.join(' '); }
  function tintCss(a = {}) { return a.temp ? (a.temp > 0 ? `rgba(255,140,30,${a.temp * .35})` : `rgba(40,130,255,${-a.temp * .35})`) : ''; }
  let noiseImgs = null;
  const noise = i => { if (!noiseImgs) noiseImgs = [0, 1, 2].map(() => { const k = document.createElement('canvas'); k.width = k.height = 128; const x = k.getContext('2d'), d = x.createImageData(128, 128);
    for (let j = 0; j < d.data.length; j += 4) { const v = Math.random() * 255; d.data[j] = d.data[j + 1] = d.data[j + 2] = v; d.data[j + 3] = 255; } x.putImageData(d, 0, 0); return k.toDataURL(); }); return noiseImgs[i % 3]; };
  const rnd = s => { const x = Math.sin(s * 127.1) * 43758.5453; return x - Math.floor(x); };
  // fx(tl, dur) -> {transform, filter, overlay}
  const EFFECTS = [
    ['shake', 'Getar', tl => { const f = Math.floor(tl * 24); return {transform: `translate(${(rnd(f) - .5) * 3}%, ${(rnd(f + 9) - .5) * 3}%) rotate(${(rnd(f + 3) - .5) * 2}deg)`}; }],
    ['zoompulse', 'Zoom denyut', tl => ({transform: `scale(${1 + .06 * Math.pow(Math.abs(Math.sin(tl * Math.PI * 2)), 3)})`})],
    ['blurin', 'Kabur masuk', (tl) => ({filter: `blur(${Math.max(0, 1 - tl / 1) * 14}px)`})],
    ['glitch', 'Glitch RGB', tl => { const f = Math.floor(tl * 15), on = rnd(f) > .45, o = on ? 3 + rnd(f + 1) * 6 : 1.5;
      return {filter: `drop-shadow(${o}px 0 0 rgba(255,0,60,.75)) drop-shadow(${-o}px 0 0 rgba(0,240,255,.75))`, transform: on ? `translateX(${(rnd(f + 2) - .5) * 4}%) skewX(${(rnd(f + 4) - .5) * 6}deg)` : '',
        overlay: on ? `<div class="fxo" style="background:linear-gradient(transparent ${rnd(f + 5) * 80}%, #ffffff30 0 ${rnd(f + 5) * 80 + 4}%, transparent 0)"></div>` : ''}; }],
    ['flash', 'Kilat', tl => ({overlay: `<div class="fxo" style="background:#fff;opacity:${Math.max(0, 1 - (tl % 1.2) / .35).toFixed(3)}"></div>`})],
    ['vignette', 'Vinyet', () => ({overlay: '<div class="fxo" style="background:radial-gradient(ellipse at center, transparent 45%, #000c 100%)"></div>'})],
    ['grain', 'Butiran film', tl => ({filter: 'contrast(1.05)', overlay: `<div class="fxo" style="background-image:url(${noise(Math.floor(tl * 24))});background-size:128px;mix-blend-mode:overlay;opacity:.35"></div>`})],
    ['vhs', 'VHS', tl => ({filter: 'saturate(1.3) contrast(1.1) drop-shadow(2px 0 0 #ff004c88) drop-shadow(-2px 0 0 #00e0ff88)', overlay: `<div class="fxo" style="background:repeating-linear-gradient(0deg,#0000 0 2px,#0005 2px 4px)"></div><div class="fxo" style="background:linear-gradient(transparent ${(tl * 35) % 120 - 20}%, #ffffff22 0 ${(tl * 35) % 120 - 12}%, transparent 0)"></div><div class="fxo vhs-tc">▶ PLAY  ${String(Math.floor(tl / 60)).padStart(2, '0')}:${String(Math.floor(tl % 60)).padStart(2, '0')}</div>`})],
    ['bokeh', 'Bokeh', tl => ({overlay: `<div class="fxo" style="mix-blend-mode:screen;background:${[0, 1, 2, 3, 4, 5, 6].map(i => { const x = (rnd(i) * 100 + Math.sin(tl * .5 + i) * 6), y = (rnd(i + 20) * 100 - tl * (4 + i) % 120 + 120) % 120 - 10, r = 6 + rnd(i + 40) * 10, c = ['#ffd27a', '#ff9ec7', '#9ad8ff'][i % 3]; return `radial-gradient(circle at ${x}% ${y}%, ${c}aa 0, ${c}55 ${r * .6}%, transparent ${r}%)`; }).join(',')}"></div>`})],
    ['lightleak', 'Bocor cahaya', tl => ({overlay: `<div class="fxo" style="mix-blend-mode:screen;opacity:.85;background:radial-gradient(ellipse 60% 80% at ${-10 + (Math.sin(tl * .8) + 1) * 40}% ${30 + Math.cos(tl * .6) * 20}%, #ff7a2fcc, transparent 70%), radial-gradient(ellipse 40% 60% at ${110 - (Math.sin(tl * .5) + 1) * 30}% 80%, #ff3d7f99, transparent 70%)"></div>`})],
    ['kabut', 'Mimpi', tl => ({filter: `blur(1.5px) brightness(1.1) saturate(1.2)`, overlay: `<div class="fxo" style="background:radial-gradient(circle at 50% ${50 + Math.sin(tl) * 10}%, transparent 30%, #ffffff40 100%)"></div>`})],
  ].map(([id, name, fn]) => ({key: 'demo:effect:' + id, kind: 'effect', name, fn, vip: id === 'kabut', orig: true}));
  // transitions: state(p, role) for outgoing ('out') / incoming ('in') clip, p 0..1 across the window
  const TRANS = [
    ['fade', 'Larut', (p, r) => r === 'in' ? {a: p} : {}],
    ['fadeblack', 'Pudar hitam', (p, r) => r === 'out' ? {a: p < .5 ? 1 - p * 2 : 0} : {a: p < .5 ? 0 : p * 2 - 1}],
    ['flash', 'Kilat putih', (p, r) => ({a: r === 'in' ? (p >= .5 ? 1 : 0) : 1, flash: 1 - Math.abs(p * 2 - 1)})],
    ['slideleft', 'Geser kiri', (p, r) => ({dx: r === 'out' ? -eo(p) : 1 - eo(p)})],
    ['slideright', 'Geser kanan', (p, r) => ({dx: r === 'out' ? eo(p) : -(1 - eo(p))})],
    ['slideup', 'Geser atas', (p, r) => ({dy: r === 'out' ? -eo(p) : 1 - eo(p)})],
    ['zoomin', 'Zoom masuk', (p, r) => r === 'out' ? {s: 1 + p * .8, a: 1 - p} : {s: .6 + .4 * eo(p), a: p}],
    ['zoomout', 'Zoom keluar', (p, r) => r === 'out' ? {s: 1 - p * .5, a: 1 - p} : {s: 1.5 - .5 * eo(p), a: p}],
    ['zoom', 'Zoom putar', (p, r) => r === 'out' ? {r: p * 180, s: 1 - p * .6, a: 1 - p} : {r: -(1 - p) * 180, s: .4 + .6 * p, a: p}, true],
    ['spin', 'Putar', (p, r) => r === 'out' ? {r: p * 90, a: 1 - p} : {r: -(1 - p) * 90, a: p}],
    ['wipe', 'Sapu', (p, r) => r === 'in' ? {wipe: p} : {}],
    ['blur', 'Kabur', (p, r) => r === 'out' ? {blur: p * 16, a: 1 - p * .6} : {blur: (1 - p) * 16, a: p}],
  ].map(([id, name, fn, vip]) => ({key: 'demo:transition:' + id, kind: 'transition', name, fn, vip: !!vip, orig: true}));

  // a small original sample frame used for card thumbnails
  let sample = null;
  function sampleImg() {
    if (sample) return sample; const k = document.createElement('canvas'); k.width = 160; k.height = 100; const x = k.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, 100); g.addColorStop(0, '#5aa0ff'); g.addColorStop(.55, '#ffb36b'); g.addColorStop(1, '#ff7a59'); x.fillStyle = g; x.fillRect(0, 0, 160, 100);
    x.fillStyle = '#fff3c4'; x.beginPath(); x.arc(110, 52, 14, 0, 7); x.fill();
    x.fillStyle = '#1f3b4d'; x.beginPath(); x.moveTo(0, 100); x.lineTo(0, 70); x.lineTo(40, 48); x.lineTo(80, 72); x.lineTo(120, 56); x.lineTo(160, 76); x.lineTo(160, 100); x.fill();
    x.fillStyle = '#0f2230'; x.beginPath(); x.moveTo(0, 100); x.lineTo(0, 86); x.lineTo(60, 74); x.lineTo(160, 90); x.lineTo(160, 100); x.fill();
    return (sample = k.toDataURL('image/jpeg', .85));
  }
  return {audio, STICKERS, TEXTS, TS, textCss, IO, LOOP, animState, FILTERS, ADJUSTS, adjCss, tintCss, EFFECTS, TRANS, sampleImg};
})();
