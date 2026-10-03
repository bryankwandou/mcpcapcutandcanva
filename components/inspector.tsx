"use client";

import { MODULES, type CompileMode } from "@/lib/catalog";
import { cn } from "@/lib/cn";
import type { CompiledKernel, MegapromptStats } from "@/lib/megaprompt";
import { useStation } from "@/lib/store";

const GROUPS: { id: "constitution" | "mind" | "craft" | "library"; label: string; labelId: string }[] = [
  { id: "constitution", label: "Constitution", labelId: "Konstitusi" },
  { id: "mind", label: "Mind", labelId: "Mind" },
  { id: "craft", label: "Craft", labelId: "Craft" },
  { id: "library", label: "Library", labelId: "Pustaka" },
];

export function Inspector({
  engineReady,
  kernel,
  stats,
}: {
  engineReady: boolean | null;
  kernel: CompiledKernel;
  stats: MegapromptStats;
}) {
  const language = useStation((s) => s.language);
  const compileMode = useStation((s) => s.compileMode);
  const setCompileMode = useStation((s) => s.setCompileMode);
  const enabledModules = useStation((s) => s.enabledModules);
  const toggleModule = useStation((s) => s.toggleModule);
  const temperature = useStation((s) => s.temperature);
  const setTemperature = useStation((s) => s.setTemperature);
  const maxTokens = useStation((s) => s.maxTokens);
  const setMaxTokens = useStation((s) => s.setMaxTokens);
  const idUi = language !== "en";

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="border-b border-line px-4 py-4">
        <p className="font-mono text-[10px] tracking-[0.16em] text-subtle uppercase">
          {idUi ? "Compiler" : "Compiler"}
        </p>
        <div className="mt-2 grid grid-cols-3 gap-1">
          {(["lite", "core", "full"] as CompileMode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setCompileMode(m)}
              className={cn(
                "h-9 rounded-md font-mono text-[10px] tracking-wider uppercase",
                compileMode === m ? "bg-accent text-accent-fg" : "bg-elevated text-muted",
              )}
            >
              {m}
            </button>
          ))}
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 font-mono text-[11px] text-muted">
          <dt>{idUi ? "Megaprompt" : "Megaprompt"}</dt>
          <dd className="text-right text-fg tabular-nums">{stats.lines.toLocaleString()} ln</dd>
          <dt>{idUi ? "Kernel" : "Kernel"}</dt>
          <dd className="text-right text-fg tabular-nums">{kernel.chars.toLocaleString()} c</dd>
          <dt>{idUi ? "Seksi" : "Sections"}</dt>
          <dd className="text-right text-fg tabular-nums">{kernel.used.length}</dd>
          <dt>Engine</dt>
          <dd className="text-right text-fg">
            {engineReady ? "live" : engineReady === false ? "demo" : "…"}
          </dd>
        </dl>
        {kernel.truncated ? (
          <p className="mt-3 text-[11px] leading-relaxed text-warn">
            {idUi
              ? "Kernel terpotong oleh anggaran. Naikkan ke full atau matikan pustaka."
              : "Kernel truncated by budget. Switch to full or drop library modules."}
          </p>
        ) : null}
      </div>

      <div className="border-b border-line px-4 py-4">
        <label className="flex items-center justify-between font-mono text-[10px] tracking-[0.14em] text-subtle uppercase">
          temp
          <span className="text-fg tabular-nums">{temperature.toFixed(1)}</span>
        </label>
        <input
          type="range"
          min={0}
          max={1.2}
          step={0.1}
          value={temperature}
          onChange={(e) => setTemperature(Number(e.target.value))}
          className="mt-2 w-full accent-accent"
        />
        <label className="mt-3 flex items-center justify-between font-mono text-[10px] tracking-[0.14em] text-subtle uppercase">
          max tok
          <span className="text-fg tabular-nums">{maxTokens}</span>
        </label>
        <input
          type="range"
          min={256}
          max={4096}
          step={128}
          value={maxTokens}
          onChange={(e) => setMaxTokens(Number(e.target.value))}
          className="mt-2 w-full accent-accent"
        />
      </div>

      <div className="px-4 py-4">
        <p className="font-mono text-[10px] tracking-[0.16em] text-subtle uppercase">
          {idUi ? "Modul" : "Modules"}
        </p>
        {GROUPS.map((g) => (
          <div key={g.id} className="mt-4">
            <p className="text-[11px] font-medium text-muted">{idUi ? g.labelId : g.label}</p>
            <ul className="mt-2 space-y-1">
              {MODULES.filter((m) => m.group === g.id).map((m) => {
                const on = m.locked || enabledModules.includes(m.id) || compileMode === "full";
                return (
                  <li key={m.id}>
                    <button
                      type="button"
                      disabled={m.locked || compileMode === "full"}
                      onClick={() => toggleModule(m.id)}
                      className="flex w-full items-center gap-2 rounded-md px-1 py-1.5 text-left disabled:opacity-80"
                    >
                      <span
                        className={cn(
                          "flex size-4 items-center justify-center rounded-sm border",
                          on ? "border-signal bg-signal/20" : "border-line-strong",
                        )}
                      >
                        {on ? <span className="size-1.5 rounded-full bg-signal" /> : null}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[12px] text-fg">{m.label}</span>
                      <span className="font-mono text-[10px] text-subtle">{m.id}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
