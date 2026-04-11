"use client";

import { useCallback, useState } from "react";
import type { RoundtableState } from "@/lib/spec/schema";

type Props = {
  state: RoundtableState;
  skillNames: Record<string, string>;
  disabled?: boolean;
};

export function ShareLinkControls({ state, skillNames, disabled }: Props) {
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const createLink = useCallback(async () => {
    setErr(null);
    setBusy(true);
    try {
      const res = await fetch("/api/roundtable/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state, skillNames }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok) {
        setErr(data.error ?? "生成失败");
        return;
      }
      if (data.url) setUrl(data.url);
    } finally {
      setBusy(false);
    }
  }, [state, skillNames]);

  const copy = useCallback(async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      setErr("复制失败，请手动全选复制。");
    }
  }, [url]);

  const nativeShare = useCallback(async () => {
    if (!url || !navigator.share) return;
    try {
      await navigator.share({ title: "圆桌展卷", text: state.topic.slice(0, 200), url });
    } catch {
      /* 用户取消 */
    }
  }, [url, state.topic]);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void createLink()}
          disabled={disabled || busy}
          className="rounded-sm border border-gold-600/50 bg-gold-600/10 px-4 py-2 text-sm text-ink-900 hover:bg-gold-600/15 disabled:opacity-40"
        >
          {busy ? "钤印中…" : "生成分享链接"}
        </button>
        {url && (
          <>
            <button
              type="button"
              onClick={() => void copy()}
              className="rounded-sm border border-ink-200/60 px-4 py-2 text-sm text-ink-800 hover:border-gold-500"
            >
              复制链接
            </button>
            {typeof navigator !== "undefined" && "share" in navigator && (
              <button
                type="button"
                onClick={() => void nativeShare()}
                className="rounded-sm border border-ink-200/60 px-4 py-2 text-sm text-ink-800 hover:border-gold-500"
              >
                系统分享
              </button>
            )}
          </>
        )}
      </div>
      {url && (
        <p className="break-all rounded-sm border border-ink-200/40 bg-paper-50 px-3 py-2 font-mono text-xs text-ink-700">
          {url}
        </p>
      )}
      {err && <p className="text-xs text-cinnabar-800">{err}</p>}
      <p className="text-xs text-ink-600">展卷为只读；他人可「携卷复刻」到你方圆桌页继续讨论（须自备砚台与钤印）。</p>
    </div>
  );
}
