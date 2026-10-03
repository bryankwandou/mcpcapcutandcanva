import "server-only";

const XAI_URL = "https://api.x.ai/v1/chat/completions";
const DEFAULT_MODELS = ["grok-4.5", "grok-4", "grok-3"];

/** Model fallback chain. Override with XAI_MODELS="grok-4,grok-3" (first = preferred). */
export function modelChain(): string[] {
  const fromEnv = (process.env.XAI_MODELS ?? process.env.XAI_MODEL ?? "")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);
  return fromEnv.length ? fromEnv : DEFAULT_MODELS;
}

export function engineReady(): boolean {
  return Boolean(process.env.XAI_API_KEY);
}

type Msg = { role: "system" | "user" | "assistant"; content: string };

/**
 * Opens a streaming completion, walking the model chain when a model is unknown (400/404).
 * Gives up waiting for response headers after `connectMs`; `signal` cancels upstream when the client leaves.
 */
export async function openStream(opts: {
  messages: Msg[];
  temperature: number;
  maxTokens: number;
  signal: AbortSignal;
  connectMs?: number;
}): Promise<{ res: Response; model: string }> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) throw new Error("XAI_API_KEY is not set.");
  const chain = modelChain();
  let last: { res: Response; model: string } | null = null;

  for (const model of chain) {
    const ctrl = new AbortController();
    const onAbort = () => ctrl.abort();
    opts.signal.addEventListener("abort", onAbort, { once: true });
    const timer = setTimeout(() => ctrl.abort(), opts.connectMs ?? 30_000);
    let res: Response;
    try {
      res = await fetch(XAI_URL, {
        method: "POST",
        signal: ctrl.signal,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model,
          stream: true,
          temperature: opts.temperature,
          max_tokens: opts.maxTokens,
          messages: opts.messages,
        }),
      });
    } catch (err) {
      if (opts.signal.aborted) throw err;
      throw new Error(ctrl.signal.aborted ? "Engine did not respond in time." : "Could not reach the engine.");
    } finally {
      clearTimeout(timer);
    }
    last = { res, model };
    if (res.ok) return last;
    if (res.status !== 404 && res.status !== 400) return last;
    await res.body?.cancel().catch(() => {});
  }
  return last ?? { res: new Response("no model configured", { status: 500 }), model: chain[0] ?? "none" };
}

/** Pulls `choices[0].delta.content` tokens out of an OpenAI-style SSE body. */
export async function* readTokens(body: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const t = line.trim();
        if (!t.startsWith("data:")) continue;
        const data = t.slice(5).trim();
        if (data === "[DONE]") return;
        try {
          const delta = (JSON.parse(data) as { choices?: { delta?: { content?: string } }[] }).choices?.[0]?.delta?.content;
          if (delta) yield delta;
        } catch {
          // ignore malformed SSE line
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
