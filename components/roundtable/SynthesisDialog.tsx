"use client";

import { useState, useMemo } from "react";
import { MarkdownContent } from "./MarkdownContent";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

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

export function SynthesisDialog({ content }: { content: string }) {
  const [open, setOpen] = useState(false);
  const sections = useMemo(() => splitSections(content), [content]);

  return (
    <>
      {/* Collapsed summary bar */}
      <div className="rounded-xl bg-card p-3 ring-accent">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-cinnabar-700">结案提要</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setOpen(true)}
            className="rounded-xl border-cinnabar-600/40 text-cinnabar-700 hover:bg-cinnabar-600/10"
          >
            展开查看
          </Button>
        </div>
        {sections.length > 0 && (
          <p className="mt-1 line-clamp-2 text-xs text-ink-600">{sections.map((s) => s.heading).join(" · ")}</p>
        )}
      </div>

      {/* Full-screen modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm">
          <div className="relative my-8 w-full max-w-3xl rounded-2xl bg-paper-50 card-elevated">
            <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-2xl border-b border-ink-200/30 bg-paper-50 px-6 py-4">
              <h2 className="text-lg font-semibold text-cinnabar-700">结案提要</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-900"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="space-y-6 p-6">
              {sections.map((s, i) => (
                <section key={i}>
                  <h3 className="mb-2 border-b border-cinnabar-600/15 pb-1 text-base font-semibold text-cinnabar-700">
                    {s.heading}
                  </h3>
                  <div className="prose-roundtable">
                    <MarkdownContent content={s.body.trim()} />
                  </div>
                </section>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
