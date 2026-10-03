"use client";

import { cn } from "@/lib/cn";

type Seg =
  | { t: "p"; text: string }
  | { t: "h"; level: number; text: string }
  | { t: "code"; lang: string; text: string }
  | { t: "ul"; items: string[] }
  | { t: "ol"; items: string[] }
  | { t: "quote"; text: string };

export function Markdown({ text, className }: { text: string; className?: string }) {
  const blocks = parseBlocks(text);
  return (
    <div className={cn("space-y-3 text-[15px] leading-relaxed text-pretty", className)}>
      {blocks.map((b, i) => {
        if (b.t === "h") {
          const cls =
            b.level <= 2
              ? "font-display text-lg font-semibold tracking-tight text-fg"
              : "text-sm font-medium uppercase tracking-[0.14em] text-muted";
          return (
            <p key={i} className={cls}>
              {b.text}
            </p>
          );
        }
        if (b.t === "code") {
          return (
            <pre
              key={i}
              className="overflow-x-auto rounded-lg border border-line bg-inset px-3 py-3 font-mono text-[12.5px] leading-relaxed text-accent"
            >
              <code>{b.text}</code>
            </pre>
          );
        }
        if (b.t === "ul") {
          return (
            <ul key={i} className="space-y-1 pl-4 text-fg">
              {b.items.map((it, j) => (
                <li key={j} className="list-disc marker:text-subtle">
                  <Inline text={it} />
                </li>
              ))}
            </ul>
          );
        }
        if (b.t === "ol") {
          return (
            <ol key={i} className="space-y-1 pl-4 text-fg">
              {b.items.map((it, j) => (
                <li key={j} className="list-decimal marker:text-subtle">
                  <Inline text={it} />
                </li>
              ))}
            </ol>
          );
        }
        if (b.t === "quote") {
          return (
            <blockquote key={i} className="border-l-2 border-signal/50 pl-3 text-muted">
              <Inline text={b.text} />
            </blockquote>
          );
        }
        return (
          <p key={i} className="text-fg">
            <Inline text={b.text} />
          </p>
        );
      })}
    </div>
  );
}

function Inline({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).filter(Boolean);
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith("`") && p.endsWith("`")) {
          return (
            <code
              key={i}
              className="rounded-sm bg-elevated px-1 py-px font-mono text-[0.86em] text-accent"
            >
              {p.slice(1, -1)}
            </code>
          );
        }
        if (p.startsWith("**") && p.endsWith("**")) {
          return (
            <strong key={i} className="font-medium text-fg">
              {p.slice(2, -2)}
            </strong>
          );
        }
        return <span key={i}>{p}</span>;
      })}
    </>
  );
}

function parseBlocks(src: string): Seg[] {
  const lines = src.replace(/\r\n/g, "\n").split("\n");
  const out: Seg[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i] ?? "";
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const buf: string[] = [];
      i += 1;
      while (i < lines.length && !lines[i]?.startsWith("```")) {
        buf.push(lines[i] ?? "");
        i += 1;
      }
      i += 1;
      out.push({ t: "code", lang, text: buf.join("\n") });
      continue;
    }
    if (/^#{1,3} /.test(line)) {
      const level = line.startsWith("###") ? 3 : line.startsWith("##") ? 2 : 1;
      out.push({ t: "h", level, text: line.replace(/^#{1,3} /, "") });
      i += 1;
      continue;
    }
    if (line.startsWith("> ")) {
      out.push({ t: "quote", text: line.slice(2) });
      i += 1;
      continue;
    }
    if (/^\s*[-*] /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*] /.test(lines[i] ?? "")) {
        items.push((lines[i] ?? "").replace(/^\s*[-*] /, ""));
        i += 1;
      }
      out.push({ t: "ul", items });
      continue;
    }
    if (/^\s*\d+\. /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\. /.test(lines[i] ?? "")) {
        items.push((lines[i] ?? "").replace(/^\s*\d+\. /, ""));
        i += 1;
      }
      out.push({ t: "ol", items });
      continue;
    }
    if (!line.trim()) {
      i += 1;
      continue;
    }
    const buf: string[] = [line];
    i += 1;
    while (
      i < lines.length &&
      (lines[i] ?? "").trim() &&
      !/^(```|#{1,3} |\s*[-*] |\s*\d+\. |> )/.test(lines[i] ?? "")
    ) {
      buf.push(lines[i] ?? "");
      i += 1;
    }
    out.push({ t: "p", text: buf.join(" ") });
  }
  return out;
}
