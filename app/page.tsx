import Link from "next/link";

const features = [
  { t: "Streaming real-time", d: "Jawaban muncul kata per kata, tanpa menunggu." },
  { t: "Pilih model", d: "Ganti model Grok langsung dari antarmuka chat." },
  { t: "API key aman", d: "Kunci hanya hidup di server Vercel, tak pernah ke browser." },
  { t: "Markdown & kode", d: "Tabel, daftar, dan code block dirender rapi." },
  { t: "Riwayat lokal", d: "Percakapan tersimpan di perangkat Anda sendiri." },
  { t: "Mode demo", d: "Tetap jalan untuk presentasi walau tanpa API key." },
];

export default function Home() {
  return (
    <main className="landing">
      <nav className="nav">
        <span className="logo">◆ Nova</span>
        <Link href="/chat" className="btn ghost">Buka chat</Link>
      </nav>
      <section className="hero">
        <p className="eyebrow">AI assistant · web edition</p>
        <h1>Bertanya apa saja.<br /><span className="grad">Dapat jawaban seketika.</span></h1>
        <p className="sub">Nova adalah versi web dari asisten AI berbasis xAI API, cepat, tajam, dan sedikit jenaka. Dibangun dengan Next.js, siap di Vercel.</p>
        <div className="cta">
          <Link href="/chat" className="btn primary">Mulai chat →</Link>
          <a href="#fitur" className="btn ghost">Lihat fitur</a>
        </div>
      </section>
      <section id="fitur" className="grid">
        {features.map((f) => (
          <div key={f.t} className="card">
            <h3>{f.t}</h3>
            <p>{f.d}</p>
          </div>
        ))}
      </section>
      <footer className="foot">Nova · proyek independen, bukan produk resmi xAI.</footer>
    </main>
  );
}
