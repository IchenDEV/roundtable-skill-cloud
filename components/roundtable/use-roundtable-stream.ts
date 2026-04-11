"use client";

import { useCallback, useState } from "react";
import type { RoundtableState, StreamEvent } from "@/lib/spec/schema";

type Finalize = { type: "finalize"; state: RoundtableState };

export function useRoundtableStream() {
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runStream = useCallback(
    async (
      state: RoundtableState,
      mode: "graph" | "deepagent",
      handlers: {
        onEvent: (e: StreamEvent) => void;
        onDone: (s: RoundtableState) => void;
        onError: (m: string) => void;
      }
    ) => {
      setStreaming(true);
      setError(null);
      try {
        const res = await fetch("/api/roundtable/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ state, mode }),
        });
        if (!res.ok) {
          const t = await res.text();
          let msg = "暂时无法开始，请稍后再试。";
          try {
            const j = JSON.parse(t) as { error?: unknown };
            if (typeof j.error === "string") msg = j.error;
          } catch {
            /* keep default */
          }
          throw new Error(msg);
        }
        const reader = res.body?.getReader();
        if (!reader) throw new Error("连接未能建立，请重试。");
        const dec = new TextDecoder();
        let carry = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          carry += dec.decode(value, { stream: true });
          const parts = carry.split("\n\n");
          carry = parts.pop() ?? "";
          for (const block of parts) {
            const line = block.trim();
            if (!line.startsWith("data:")) continue;
            const raw = line.slice(5).trim();
            try {
              const ev = JSON.parse(raw) as StreamEvent | Finalize | { type: string; message?: string };
              if (typeof ev === "object" && ev && "type" in ev && ev.type === "finalize") {
                handlers.onDone((ev as Finalize).state);
              } else if (typeof ev === "object" && ev && ev.type === "error" && typeof ev.message === "string") {
                setError(ev.message);
                handlers.onError(ev.message);
              } else {
                handlers.onEvent(ev as StreamEvent);
              }
            } catch {
              /* skip */
            }
          }
        }
      } catch (e) {
        const m = e instanceof Error ? e.message : "讨论中断，请重试。";
        setError(m);
        handlers.onError(m);
      } finally {
        setStreaming(false);
      }
    },
    []
  );

  const clearError = useCallback(() => setError(null), []);

  return { streaming, error, clearError, runStream };
}
