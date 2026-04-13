"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShareLinkControls } from "@/components/roundtable/share-link-controls";
import { triggerMarkdownDownload } from "@/lib/roundtable/export-markdown";
import { cn } from "@/lib/utils";
import type { RoundtableState } from "@/lib/spec/schema";

type Props = {
  state: RoundtableState | null;
  exportMd: string;
  streaming: boolean;
  canStart: boolean;
  canSeal: boolean;
  startLabel: string;
  sealLabel: string;
  startClassName?: string;
  sealClassName?: string;
  utilityClassName?: string;
  homeHref?: string;
  homeLabel?: string;
  skillNameRecord: Record<string, string>;
  onStart: () => void;
  onSeal: () => void;
};

const defaultPrimaryClass =
  "rounded-xl bg-cinnabar-600 text-card shadow-sm transition-[transform,box-shadow] duration-150 hover:bg-cinnabar-700 active:scale-[0.99] disabled:active:scale-100";
const defaultOutlineClass =
  "rounded-xl border-cinnabar-600/60 text-cinnabar-800 hover:bg-cinnabar-600/10 active:scale-[0.99]";

export function SessionActionToolbar({
  state,
  exportMd,
  streaming,
  canStart,
  canSeal,
  startLabel,
  sealLabel,
  startClassName,
  sealClassName,
  utilityClassName = "rounded-xl active:scale-[0.99]",
  homeHref,
  homeLabel,
  skillNameRecord,
  onStart,
  onSeal,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2 font-sans">
      <Button
        type="button"
        onClick={onStart}
        disabled={streaming || !canStart}
        className={cn(defaultPrimaryClass, startClassName)}
      >
        {startLabel}
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={onSeal}
        disabled={streaming || !canSeal}
        className={cn(defaultOutlineClass, sealClassName)}
      >
        {sealLabel}
      </Button>
      {state ? (
        <>
          <span className="mx-0.5 hidden h-4 w-px bg-ink-200/60 sm:inline-block" />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => navigator.clipboard.writeText(exportMd)}
            className={utilityClassName}
          >
            抄录全文
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => triggerMarkdownDownload(state.topic, exportMd)}
            className={utilityClassName}
          >
            下载 MD
          </Button>
          {homeHref && homeLabel ? (
            <Link
              href={homeHref}
              className="inline-flex h-7 min-w-[96px] items-center justify-center rounded-xl border border-ink-200/60 bg-card px-3 py-1 text-[0.8rem] text-ink-800 transition-[transform,border-color,background-color] hover:border-cinnabar-600/40 hover:bg-paper-50 active:scale-[0.99]"
            >
              {homeLabel}
            </Link>
          ) : null}
          <ShareLinkControls state={state} skillNames={skillNameRecord} disabled={streaming} inline />
        </>
      ) : null}
    </div>
  );
}
