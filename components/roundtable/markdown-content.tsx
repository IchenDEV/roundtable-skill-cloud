"use client";

import { useMemo } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

type Block = { kind: "think" | "text"; content: string };

function parseThinkBlocks(raw: string): Block[] {
  const out: Block[] = [];
  const matches = [...raw.matchAll(/<think>([\s\S]*?)<\/think>/g)];
  let last = 0;

  for (const m of matches) {
    const idx = m.index ?? 0;
    if (idx > last) {
      const t = raw.slice(last, idx).trim();
      if (t) out.push({ kind: "text", content: t });
    }
    out.push({ kind: "think", content: (m[1] ?? "").trim() });
    last = idx + m[0].length;
  }

  const rest = raw.slice(last);
  const open = rest.indexOf("<think>");
  if (open !== -1) {
    const before = rest.slice(0, open).trim();
    if (before) out.push({ kind: "text", content: before });
    const inner = rest.slice(open + 7).trim();
    if (inner) out.push({ kind: "think", content: inner });
  } else {
    const t = rest.trim();
    if (t) out.push({ kind: "text", content: t });
  }
  return out;
}

export function MarkdownContent({ content, streaming }: { content: string; streaming?: boolean }) {
  const blocks = useMemo(() => parseThinkBlocks(content), [content]);
  const markdownComponents: Components = {
    table(props) {
      return (
        <div className="prose-roundtable-table-wrap">
          <table {...props} />
        </div>
      );
    },
  };

  if (!blocks.length && !streaming) return null;

  return (
    <div className="prose-roundtable">
      {blocks.map((b, i) =>
        b.kind === "think" ? (
          <details key={i} className="think-block">
            <summary>思考过程{streaming && i === blocks.length - 1 ? "…" : ""}</summary>
            <div className="mt-1 whitespace-pre-wrap">{b.content}</div>
          </details>
        ) : (
          <ReactMarkdown key={i} remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {b.content}
          </ReactMarkdown>
        )
      )}
      {streaming && <span className="inline-block w-1 animate-pulse text-ink-700">▍</span>}
    </div>
  );
}
