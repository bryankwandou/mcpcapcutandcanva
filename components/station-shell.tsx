"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Command,
  MessageSquare,
  Plus,
  ScrollText,
  Settings2,
  SquareTerminal,
} from "lucide-react";
import { getEngineStatus } from "@/lib/engine-status";
import { compileKernel, megapromptStats } from "@/lib/megaprompt";
import { PERSONAS, type ViewId } from "@/lib/catalog";
import { cn } from "@/lib/cn";
import { useStation } from "@/lib/store";
import { ChatPanel } from "./chat-panel";
import { Inspector } from "./inspector";
import { PlaybooksPanel } from "./playbooks-panel";
import { StudioPanel } from "./studio-panel";
import { VaultPanel } from "./vault-panel";

const NAV: { id: ViewId; label: string; labelId: string; icon: typeof MessageSquare }[] = [
  { id: "chat", label: "Chat", labelId: "Chat", icon: MessageSquare },
  { id: "studio", label: "Studio", labelId: "Studio", icon: ScrollText },
  { id: "vault", label: "Vault", labelId: "Vault", icon: BookOpen },
  { id: "playbooks", label: "Playbooks", labelId: "Playbook", icon: SquareTerminal },
];

export function StationShell() {
  const hydrated = useStation((s) => s.hydrated);
  const setHydrated = useStation((s) => s.setHydrated);
  const view = useStation((s) => s.view);
  const setView = useStation((s) => s.setView);
  const language = useStation((s) => s.language);
  const setLanguage = useStation((s) => s.setLanguage);
  const inspectorOpen = useStation((s) => s.inspectorOpen);
  const setInspectorOpen = useStation((s) => s.setInspectorOpen);
  const sessions = useStation((s) => s.sessions);
  const activeSessionId = useStation((s) => s.activeSessionId);
  const selectSession = useStation((s) => s.selectSession);
  const newChat = useStation((s) => s.newChat);
  const compileMode = useStation((s) => s.compileMode);
  const enabledModules = useStation((s) => s.enabledModules);
  const addendum = useStation((s) => s.addendum);
  const vault = useStation((s) => s.vault);
  const [engine, setEngine] = useState<boolean | null>(null);
  const [railOpen, setRailOpen] = useState(false);

  useEffect(() => {
    void Promise.resolve(useStation.persist.rehydrate()).then(() => setHydrated(true));
  }, [setHydrated]);

  useEffect(() => {
    void getEngineStatus().then((r) => setEngine(r.ready));
  }, []);

  const stats = useMemo(() => megapromptStats(), []);
  const session = sessions.find((s) => s.id === activeSessionId) ?? sessions[0];
  const kernel = useMemo(
    () =>
      compileKernel({
        mode: compileMode,
        enabledIds: enabledModules,
        persona: session?.persona ?? "operator",
        language,
        vault: vault.map((v) => v.text),
        addendum,
      }),
    [compileMode, enabledModules, session?.persona, language, vault, addendum],
  );

  const id = language === "en" ? false : true;

  if (!hydrated) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg">
        <p className="font-display text-sm tracking-[0.22em] text-muted">AXIOM</p>
      </div>
    );
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-bg text-fg">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex w-[17.5rem] flex-col border-r border-line bg-surface transition-transform duration-200 md:static md:translate-x-0",
          railOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        <div className="flex items-center gap-3 px-4 pt-5 pb-4">
          <div className="flex size-9 items-center justify-center rounded-lg border border-line-strong bg-elevated">
            <span className="font-display text-sm font-semibold tracking-tight">A</span>
          </div>
          <div className="min-w-0">
            <p className="font-display text-[15px] font-semibold leading-none tracking-tight">AXIOM</p>
            <p className="mt-1 font-mono text-[10px] tracking-[0.18em] text-muted uppercase">
              Operator station
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={newChat}
          className="mx-3 mb-3 flex h-11 items-center justify-center gap-2 rounded-lg bg-accent text-sm font-medium text-accent-fg"
        >
          <Plus className="size-4" strokeWidth={1.75} />
          {id ? "Sesi baru" : "New session"}
        </button>

        <nav className="grid grid-cols-4 gap-1 px-3">
          {NAV.map((item) => {
            const Icon = item.icon;
            const on = view === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setView(item.id);
                  setRailOpen(false);
                }}
                className={cn(
                  "flex h-14 flex-col items-center justify-center gap-1 rounded-md text-[10px] tracking-wide uppercase",
                  on ? "bg-elevated text-fg" : "text-muted hover:text-fg",
                )}
              >
                <Icon className="size-4" strokeWidth={1.6} />
                {id ? item.labelId : item.label}
              </button>
            );
          })}
        </nav>

        <p className="mt-5 px-4 font-mono text-[10px] tracking-[0.16em] text-subtle uppercase">
          {id ? "Sesi" : "Sessions"}
        </p>
        <div className="mt-2 min-h-0 flex-1 overflow-y-auto px-2 pb-4">
          {sessions.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                selectSession(s.id);
                setRailOpen(false);
              }}
              className={cn(
                "mb-0.5 flex w-full flex-col rounded-md px-2.5 py-2 text-left",
                s.id === activeSessionId ? "bg-elevated" : "hover:bg-elevated/60",
              )}
            >
              <span className="truncate text-[13px] text-fg">{s.title}</span>
              <span className="mt-0.5 font-mono text-[10px] text-subtle">
                {PERSONAS.find((p) => p.id === s.persona)?.name} · {s.messages.length}
              </span>
            </button>
          ))}
        </div>

        <div className="border-t border-line px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 font-mono text-[10px] tracking-[0.14em] text-muted uppercase">
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  engine ? "bg-signal" : engine === false ? "bg-warn" : "bg-subtle",
                )}
              />
              {engine ? "Engine live" : engine === false ? "Demo mode" : "…"}
            </span>
            <span className="font-mono text-[10px] text-subtle tabular-nums">
              {stats.lines.toLocaleString()} ln
            </span>
          </div>
        </div>
      </aside>

      {railOpen ? (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-20 bg-bg/60 md:hidden"
          onClick={() => setRailOpen(false)}
        />
      ) : null}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center gap-2 border-b border-line px-3 md:px-5">
          <button
            type="button"
            className="flex size-10 items-center justify-center rounded-md text-muted md:hidden"
            onClick={() => setRailOpen(true)}
            aria-label="Menu"
          >
            <Command className="size-5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-sm font-semibold tracking-tight">
              {view === "chat"
                ? session?.title
                : view === "studio"
                  ? id
                    ? "Studio megaprompt"
                    : "Megaprompt studio"
                  : view === "vault"
                    ? id
                      ? "Vault memori"
                      : "Memory vault"
                    : id
                      ? "Playbook"
                      : "Playbooks"}
            </p>
            <p className="truncate font-mono text-[10px] text-subtle">
              kernel {kernel.chars.toLocaleString()}c
              {kernel.truncated ? " · truncated" : ""} · {compileMode}
            </p>
          </div>
          <div className="flex items-center gap-1">
            {(["auto", "id", "en"] as const).map((pin) => (
              <button
                key={pin}
                type="button"
                onClick={() => setLanguage(pin)}
                className={cn(
                  "h-8 rounded-md px-2 font-mono text-[10px] tracking-wider uppercase",
                  language === pin ? "bg-elevated text-fg" : "text-muted",
                )}
              >
                {pin}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setInspectorOpen(!inspectorOpen)}
              className="ml-1 hidden size-10 items-center justify-center rounded-md text-muted lg:flex"
              aria-label="Inspector"
            >
              <Settings2 className="size-4" />
            </button>
          </div>
        </header>

        <div className="flex min-h-0 flex-1">
          <main className="min-h-0 min-w-0 flex-1">
            {view === "chat" ? <ChatPanel engineReady={engine} /> : null}
            {view === "studio" ? <StudioPanel /> : null}
            {view === "vault" ? <VaultPanel /> : null}
            {view === "playbooks" ? <PlaybooksPanel /> : null}
          </main>
          {inspectorOpen ? (
            <div className="hidden min-h-0 w-[20rem] shrink-0 border-l border-line lg:block">
              <Inspector engineReady={engine} kernel={kernel} stats={stats} />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
