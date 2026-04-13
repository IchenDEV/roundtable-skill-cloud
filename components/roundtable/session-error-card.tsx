"use client";

import { Button } from "@/components/ui/button";

type Props = {
  error: string | null;
  canResume: boolean;
  resumeLabel: string;
  onResume: () => void;
  onRefresh: () => void;
};

export function SessionErrorCard({ error, canResume, resumeLabel, onResume, onRefresh }: Props) {
  if (!error) return null;
  return (
    <div className="rounded-xl bg-destructive/5 p-3 ring-destructive" role="alert">
      <p className="text-sm text-cinnabar-800">{error}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {canResume ? (
          <Button
            type="button"
            size="sm"
            onClick={onResume}
            className="bg-ink-900 text-primary-foreground active:scale-[0.99]"
          >
            {resumeLabel}
          </Button>
        ) : null}
        <Button type="button" variant="link" size="sm" className="h-auto p-0 text-cinnabar-700" onClick={onRefresh}>
          刷新就绪状态
        </Button>
      </div>
    </div>
  );
}
