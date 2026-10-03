import { compileKernel } from "@/lib/megaprompt";
import type { CompileMode, LanguagePin, PersonaId } from "@/lib/catalog";

type InMessage = { role: "user" | "assistant"; content: string };

type Body = {
  messages: InMessage[];
  persona: PersonaId;
  language: LanguagePin;
  compileMode: CompileMode;
  enabledModules: string[];
  vault: string[];
  addendum: string;
  temperature: number;
  maxTokens: number;
};

const MODELS = ["grok-4.5", "grok-4", "grok-3"] as const;

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
        const apiKey = process.env.XAI_API_KEY;

        let body: Body;
        try {
          body = (await request.json()) as Body;
        } catch {
          return Response.json({ error: "Invalid request." }, { status: 400 });
        }

        const messages = Array.isArray(body.messages) ? body.messages.slice(-16) : [];
        if (!messages.length) {
          return Response.json({ error: "Empty thread." }, { status: 400 });
        }

        const maxTokens = clamp(Number(body.maxTokens) || 1800, 256, 4096);
        const temperature = clamp(Number(body.temperature) || 0.6, 0, 1.2);
        const kernel = compileKernel({
          mode: body.compileMode ?? "core",
          enabledIds: Array.isArray(body.enabledModules) ? body.enabledModules.slice(0, 80) : [],
          persona: body.persona ?? "operator",
          language: body.language ?? "auto",
          vault: Array.isArray(body.vault) ? body.vault.slice(0, 40).map((v) => String(v).slice(0, 500)) : [],
          addendum: String(body.addendum ?? "").slice(0, 4000),
        });

        const payloadMessages = [
          { role: "system" as const, content: kernel.text.slice(0, 100_000) },
          ...messages.map((m) => ({
            role: m.role,
            content: String(m.content ?? "").slice(0, 12_000),
          })),
        ];

        if (!apiKey) return demoResponse(messages[messages.length - 1]?.content ?? "", kernel);

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          async start(controller) {
            const send = (obj: unknown) => {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
            };
            try {
              const { res, model } = await completeWithFallback({
                apiKey,
                payloadMessages,
                temperature,
                maxTokens,
              });
              if (!res.ok || !res.body) {
                const errText = await res.text().catch(() => "");
                send({
                  error: `xAI error ${res.status}${errText ? `: ${errText.slice(0, 280)}` : ""}`,
                });
                controller.close();
                return;
              }
              send({ meta: { model, kernelChars: kernel.chars, truncated: kernel.truncated } });
              const reader = res.body.getReader();
              const decoder = new TextDecoder();
              let buffer = "";
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const chunks = buffer.split("\n");
                buffer = chunks.pop() ?? "";
                for (const line of chunks) {
                  const trimmed = line.trim();
                  if (!trimmed.startsWith("data:")) continue;
                  const data = trimmed.slice(5).trim();
                  if (data === "[DONE]") {
                    send({ done: true });
                    controller.close();
                    return;
                  }
                  try {
                    const json = JSON.parse(data) as {
                      choices?: { delta?: { content?: string } }[];
                    };
                    const delta = json.choices?.[0]?.delta?.content;
                    if (delta) send({ token: delta });
                  } catch {
                    // ignore malformed sse line
                  }
                }
              }
              send({ done: true });
              controller.close();
            } catch (err) {
              send({ error: err instanceof Error ? err.message : "Engine failed." });
              controller.close();
            }
          },
        });

        return new Response(stream, {
          headers: {
            "Content-Type": "text/event-stream; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
          },
        });

}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

async function completeWithFallback(opts: {
  apiKey: string;
  payloadMessages: { role: string; content: string }[];
  temperature: number;
  maxTokens: number;
}) {
  let last: Response | null = null;
  let used: string = MODELS[0];
  for (const model of MODELS) {
    used = model;
    last = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${opts.apiKey}`,
      },
      body: JSON.stringify({
        model,
        stream: true,
        temperature: opts.temperature,
        max_tokens: opts.maxTokens,
        messages: opts.payloadMessages,
      }),
    });
    if (last.ok) return { res: last, model };
    if (last.status !== 404 && last.status !== 400) return { res: last, model };
  }
  return { res: last ?? new Response("no model", { status: 500 }), model: used };
}

function demoResponse(question: string, kernel: { chars: number; used: string[]; truncated: boolean }) {
  const q = question.replace(/\s+/g, " ").slice(0, 160);
  const text = [
    "**Demo mode.** `XAI_API_KEY` is not set on this deployment, so AXIOM is answering with a scripted reply.",
    "",
    `Job received: "${q}"`,
    "",
    "What would have been sent to the engine:",
    `- Kernel: **${kernel.chars.toLocaleString()}** chars compiled from **${kernel.used.length}** megaprompt sections${kernel.truncated ? " (truncated by budget)" : ""}`,
    `- Sections: ${kernel.used.slice(0, 6).join(" · ")}${kernel.used.length > 6 ? " …" : ""}`,
    "",
    "Add `XAI_API_KEY` in Vercel → Project → Settings → Environment Variables and redeploy to go live.",
  ].join("\n");
  const encoder = new TextEncoder();
  const tokens = text.split(/(\s+)/);
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      send({ meta: { model: "demo", kernelChars: kernel.chars, truncated: kernel.truncated } });
      for (const t of tokens) {
        send({ token: t });
        await new Promise((r) => setTimeout(r, 14));
      }
      send({ done: true });
      controller.close();
    },
  });
  return new Response(stream, { headers: { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-cache, no-transform" } });
}
