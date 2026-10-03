export const runtime = "edge";

type Msg = { role: "user" | "assistant" | "system"; content: string };

const SYSTEM =
  "You are Nova, a sharp, witty and maximally helpful assistant. Answer clearly, use markdown when it helps, and keep a touch of humor.";

const MODELS = ["grok-4", "grok-3", "grok-3-mini"];

function demoStream(question: string) {
  const text =
    `**Mode demo aktif** — \`XAI_API_KEY\` belum diatur, jadi ini jawaban contoh.\n\n` +
    `Anda bertanya: _"${question.slice(0, 200)}"_\n\n` +
    `Begitu API key ditambahkan di Vercel, Nova akan menjawab langsung dari model Grok lewat xAI API dengan streaming real-time. 🚀`;
  const enc = new TextEncoder();
  const words = text.split(/(\s+)/);
  return new ReadableStream({
    async start(c) {
      for (const w of words) {
        c.enqueue(enc.encode(w));
        await new Promise((r) => setTimeout(r, 18));
      }
      c.close();
    },
  });
}

export async function POST(req: Request) {
  let body: { messages?: Msg[]; model?: string };
  try {
    body = await req.json();
  } catch {
    return new Response("Bad JSON", { status: 400 });
  }
  const messages = (body.messages ?? [])
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-30)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 20000) }));
  if (!messages.length) return new Response("No messages", { status: 400 });

  const headers = { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache" };
  const key = process.env.XAI_API_KEY;
  if (!key) return new Response(demoStream(messages[messages.length - 1].content), { headers });

  const model = MODELS.includes(body.model ?? "") ? body.model! : process.env.XAI_MODEL || "grok-4";
  const upstream = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, stream: true, messages: [{ role: "system", content: SYSTEM }, ...messages] }),
  });
  if (!upstream.ok || !upstream.body) {
    const err = await upstream.text().catch(() => "");
    return new Response(`⚠️ xAI API error ${upstream.status}: ${err.slice(0, 300)}`, { status: 502, headers });
  }

  // Convert OpenAI-style SSE into a plain text stream of content deltas.
  const dec = new TextDecoder();
  const enc = new TextEncoder();
  let buf = "";
  const stream = upstream.body.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, c) {
        buf += dec.decode(chunk, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          const t = line.trim();
          if (!t.startsWith("data:")) continue;
          const data = t.slice(5).trim();
          if (data === "[DONE]") continue;
          try {
            const delta = JSON.parse(data).choices?.[0]?.delta?.content;
            if (delta) c.enqueue(enc.encode(delta));
          } catch {}
        }
      },
    })
  );
  return new Response(stream, { headers });
}
