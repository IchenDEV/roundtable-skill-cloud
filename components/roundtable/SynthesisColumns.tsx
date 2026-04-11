"use client";

import { useMemo } from "react";
import { MarkdownContent } from "./MarkdownContent";

type Section = { heading: string; body: string };

function splitSections(raw: string): Section[] {
  const lines = raw.split("\n");
  const sections: Section[] = [];
  let cur: Section | null = null;

  for (const line of lines) {
    const m = line.match(/^##\s+(.+)/);
    if (m) {
      if (cur) sections.push(cur);
      cur = { heading: m[1].trim(), body: "" };
    } else if (cur) {
      cur.body += line + "\n";
    }
  }
  if (cur) sections.push(cur);

  if (sections.length === 0 && raw.trim()) {
    sections.push({ heading: "结案提要", body: raw });
  }
  return sections;
}

export function SynthesisColumns({ content }: { content: string }) {
  const sections = useMemo(() => splitSections(content), [content]);

  if (sections.length <= 1) {
    return (
      <section className="scroll-paper border border-cinnabar-600/30 bg-paper-100/50 p-4">
        <h2 className="mb-2 text-lg font-semibold text-cinnabar-700">结案提要</h2>
        <MarkdownContent content={content} />
      </section>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-cinnabar-700">结案提要</h2>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {sections.map((s, i) => (
          <section key={i} className="scroll-paper border border-cinnabar-600/20 bg-paper-100/50 p-3 shadow-sm">
            <h3 className="mb-2 border-b border-cinnabar-600/15 pb-1 text-sm font-semibold text-cinnabar-700">
              {s.heading}
            </h3>
            <div className="max-h-[28rem] overflow-y-auto text-sm">
              <MarkdownContent content={s.body.trim()} />
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
