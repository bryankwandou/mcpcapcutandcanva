"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUp, Square } from "lucide-react";
import { Markdown } from "@/components/markdown";
import { PERSONAS, SLASH_COMMANDS } from "@/lib/catalog";
import { cn } from "@/lib/cn";
import { compileKernel } from "@/lib/megaprompt";
import { useStation } from "@/lib/store";

export function ChatPanel({ engineReady }: { engineReady: boolean | null }) {
  const sessions = useStation((s) => s.sessions);
  const activeSessionId = useStation((s) => s.activeSessionId);
  const language = useStation((s) => s.language);
  const compileMode = useStation((s) => s.compileMode);
  const enabledModules = useStation((s) => s.enabledModules);
  const addendum = useStation((s) => s.addendum);
  const vault = useStation((s) => s.vault);
  const temperature = useStation((s) => s.temperature);
  const maxTokens = useStation((s) => s.maxTokens);
  const setPersona = useStation((s) => s.setPersona);
  const appendMessage = useStation((s) => s.appendMessage);
  const patchLastAssistant = useStation((s) => s.patchLastAssistant);
  const session = sessions.find((s) => s.id === activeSessionId) ?? sessions[0];
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const idUi = language !== "en";
  const pendingDraft = useStation((s) => s.pendingDraft);
  const setPendingDraft = useStation((s) => s.setPendingDraft);

  useEffect(() => {
    if (pendingDraft) {
      setDraft(pendingDraft);
      setPendingDraft("");
    }
  }, [pendingDraft, setPendingDraft]);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [session?.messages, busy]);

  const slashHint = useMemo(() => {
    const t = draft.trim();
    if (!t.startsWith("/")) return [];
    const q = t.split(/\s/)[0]?.toLowerCase() ?? "";
    return SLASH_COMMANDS.filter((c) => c.cmd.startsWith(q)).slice(0, 6);
  }, [draft]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || busy) return;
    setError(null);
    setDraft("");
    appendMessage({ id: crypto.randomUUID(), role: "user", content, createdAt: Date.now() });
    appendMessage({ id: crypto.randomUUID(), role: "assistant", content: "", createdAt: Date.now() });
    setBusy(true);
    const controller = new AbortController();
    abortRef.current = controller;

    const latest = useStation.getState();
    const sess = latest.sessions.find((s) => s.id === latest.activeSessionId);
    const history = (sess?.messages ?? [])
      .filter((m) => m.content.length > 0 || m.role === "user")
      .slice(0, -1)
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          messages: [...history, { role: "user", content }],
          persona: sess?.persona ?? "operator",
          language: latest.language,
          compileMode: latest.compileMode,
          enabledModules: latest.enabledModules,
          vault: latest.vault.map((v) => v.text),
          addendum: latest.addendum,
          temperature: latest.temperature,
          maxTokens: latest.maxTokens,
        }),
      });
      if (!res.ok || !res.body) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(j?.error ?? `HTTP ${res.status}`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const parts = buf.split("\n");
        buf = parts.pop() ?? "";
        for (const line of parts) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const data = trimmed.slice(5).trim();
          if (!data) continue;
          try {
            const json = JSON.parse(data) as { token?: string; error?: string; done?: boolean };
            if (json.error) throw new Error(json.error);
            if (json.token) {
              acc += json.token;
              patchLastAssistant(acc);
            }
          } catch (parseErr) {
            if (parseErr instanceof SyntaxError) continue;
            throw parseErr;
          }
        }
      }
      if (!acc) {
        patchLastAssistant(
          idUi
            ? "Engine tidak mengembalikan teks. Coba lagi dengan job yang lebih kecil."
            : "Engine returned no text. Try again with a smaller job.",
        );
      }
    } catch (err) {
      if ((err as { name?: string }).name === "AbortError") {
        const cur = useStation
          .getState()
          .sessions.find((s) => s.id === useStation.getState().activeSessionId);
        const last = [...(cur?.messages ?? [])].reverse().find((m) => m.role === "assistant");
        if (last && !last.content) patchLastAssistant(idUi ? "(dihentikan)" : "(stopped)");
      } else {
        const msg = err instanceof Error ? err.message : "Engine failed.";
        setError(msg);
        patchLastAssistant(msg);
      }
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  }

  const empty = (session?.messages.length ?? 0) === 0;
  const kernelChars = compileKernel({
    mode: compileMode,
    enabledIds: enabledModules,
    persona: session?.persona ?? "operator",
    language,
    vault: vault.map((v) => v.text),
    addendum,
  }).chars;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex gap-1 overflow-x-auto border-b border-line px-3 py-2 md:px-5">
        {PERSONAS.map((p) => {
          const on = session?.persona === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setPersona(p.id)}
              className={cn(
                "h-9 shrink-0 rounded-full px-3 text-xs",
                on ? "bg-accent text-accent-fg" : "text-muted hover:text-fg",
              )}
            >
              {idUi ? p.nameId : p.name}
            </button>
          );
        })}
      </div>

      <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto px-3 py-6 md:px-8">
        {empty ? (
          <div className="mx-auto max-w-2xl">
            <p className="font-display text-3xl font-semibold tracking-tight text-balance">
              {idUi ? "Stasiun siap." : "Station ready."}
            </p>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted text-pretty">
              {idUi
                ? "AXIOM adalah mind Grok-class milikmu. Kernel dikompilasi dari megaprompt, bukan slogan. Tulis job, atau pakai slash."
                : "AXIOM is your Grok-class mind. The kernel is compiled from the megaprompt, not a slogan. Write a job, or use a slash."}
            </p>
            <p className="mt-6 font-mono text-[10px] tracking-[0.16em] text-subtle uppercase">
              {idUi ? "Coba" : "Try"} · kernel {kernelChars.toLocaleString()}c · temp {temperature} · {maxTokens} tok
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {SLASH_COMMANDS.slice(0, 6).map((c) => (
                <button
                  key={c.cmd}
                  type="button"
                  onClick={() => setDraft(`${c.cmd} `)}
                  className="rounded-lg border border-line bg-surface px-3 py-3 text-left hover:border-line-strong"
                >
                  <span className="font-mono text-xs text-accent">{c.cmd}</span>
                  <span className="mt-1 block text-xs text-muted">{idUi ? c.hintId : c.hint}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-2xl space-y-7">
            {session?.messages.map((m) => (
              <article key={m.id}>
                <p className="font-mono text-[10px] tracking-[0.18em] text-subtle uppercase">
                  {m.role === "user" ? "Operator" : "Axiom"}
                </p>
                <div className="mt-2">
                  {m.role === "assistant" ? (
                    m.content ? (
                      <Markdown text={m.content} />
                    ) : (
                      <p className="font-mono text-xs text-muted">{idUi ? "menyusun…" : "composing…"}</p>
                    )
                  ) : (
                    <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-fg text-pretty">{m.content}</p>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-line px-3 py-3 md:px-5">
        {error ? <p className="mb-2 text-xs text-danger">{error}</p> : null}
        {slashHint.length > 0 ? (
          <div className="mb-2 flex flex-wrap gap-1">
            {slashHint.map((s) => (
              <button
                key={s.cmd}
                type="button"
                onClick={() => setDraft(`${s.cmd} `)}
                className="rounded-md bg-elevated px-2 py-1 font-mono text-[11px] text-accent"
              >
                {s.cmd}
              </button>
            ))}
          </div>
        ) : null}
        <form
          className="mx-auto flex max-w-2xl items-end gap-2 rounded-xl border border-line bg-surface p-2"
          onSubmit={(e) => {
            e.preventDefault();
            void send(draft);
          }}
        >
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send(draft);
              }
            }}
            rows={1}
            placeholder={idUi ? "Tulis job. /brief /decide /build…" : "Write a job. /brief /decide /build…"}
            className="max-h-40 min-h-11 flex-1 resize-none bg-transparent px-2 py-2.5 text-sm text-fg outline-none placeholder:text-subtle"
          />
          {busy ? (
            <button
              type="button"
              onClick={() => abortRef.current?.abort()}
              className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-elevated text-fg"
              aria-label={idUi ? "Stop" : "Stop"}
            >
              <Square className="size-3.5 fill-current" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!draft.trim()}
              className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-fg disabled:opacity-40"
              aria-label={idUi ? "Kirim" : "Send"}
            >
              <ArrowUp className="size-4" strokeWidth={2} />
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
