"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Msg = { role: "user" | "assistant"; content: string };
const STORE = "nova-chat-v1";
const SUGGESTIONS = [
  "Jelaskan roket reusable seperti ke anak 10 tahun",
  "Rencana 3 langkah untuk koloni di Mars",
  "Tulis fungsi Python untuk cek bilangan prima",
  "Apa ide startup paling gila tapi masuk akal?",
];

export default function Chat() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [model, setModel] = useState("grok-4");
  const [busy, setBusy] = useState(false);
  const abort = useRef<AbortController | null>(null);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem(STORE) || "null");
      if (s?.msgs) setMsgs(s.msgs);
      if (s?.model) setModel(s.model);
    } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem(STORE, JSON.stringify({ msgs, model })); } catch {}
    end.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, model]);

  async function send(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    const next: Msg[] = [...msgs, { role: "user", content: q }];
    setMsgs([...next, { role: "assistant", content: "" }]);
    setInput("");
    setBusy(true);
    abort.current = new AbortController();
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, model }),
        signal: abort.current.signal,
      });
      if (!res.body) throw new Error(`HTTP ${res.status}`);
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += dec.decode(value, { stream: true });
        setMsgs([...next, { role: "assistant", content: acc }]);
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError")
        setMsgs([...next, { role: "assistant", content: `⚠️ Gagal terhubung: ${(e as Error).message}` }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="chat">
      <header className="bar">
        <Link href="/" className="logo">◆ Nova</Link>
        <div className="bar-r">
          <select value={model} onChange={(e) => setModel(e.target.value)} aria-label="Model">
            <option value="grok-4">grok-4</option>
            <option value="grok-3">grok-3</option>
            <option value="grok-3-mini">grok-3-mini</option>
          </select>
          <button className="btn ghost sm" onClick={() => { abort.current?.abort(); setMsgs([]); }}>Chat baru</button>
        </div>
      </header>

      <div className="log">
        {msgs.length === 0 ? (
          <div className="empty">
            <h2>Apa yang ingin Anda ketahui?</h2>
            <div className="sugs">
              {SUGGESTIONS.map((s) => (
                <button key={s} className="sug" onClick={() => send(s)}>{s}</button>
              ))}
            </div>
          </div>
        ) : (
          msgs.map((m, i) => (
            <div key={i} className={`msg ${m.role}`}>
              {m.role === "assistant" ? (
                m.content ? <div className="md"><ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown></div>
                          : <span className="dots"><i /><i /><i /></span>
              ) : (
                <p>{m.content}</p>
              )}
            </div>
          ))
        )}
        <div ref={end} />
      </div>

      <form className="composer" onSubmit={(e) => { e.preventDefault(); send(input); }}>
        <textarea
          value={input}
          rows={1}
          placeholder="Tanya apa saja…"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
        />
        {busy ? (
          <button type="button" className="btn primary" onClick={() => abort.current?.abort()}>Stop</button>
        ) : (
          <button type="submit" className="btn primary" disabled={!input.trim()}>Kirim</button>
        )}
      </form>
    </div>
  );
}
