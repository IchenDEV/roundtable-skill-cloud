"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type LiveState = {
  role: "moderator" | "speaker";
  skillId?: string;
  text: string;
} | null;

/**
 * Buffers incoming tokens and flushes at regular intervals for smooth rendering.
 * Instead of re-rendering on every single token, batches them into ~50ms chunks.
 */
export function useTokenBuffer(flushIntervalMs = 50) {
  const [display, setDisplay] = useState<LiveState>(null);
  const bufferRef = useRef<{ role: "moderator" | "speaker"; skillId?: string; pending: string } | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const flush = useCallback(() => {
    const buf = bufferRef.current;
    if (!buf || !buf.pending) return;
    const text = buf.pending;
    buf.pending = "";
    setDisplay((prev) => {
      if (prev && prev.role === buf.role && prev.skillId === buf.skillId) {
        return { ...prev, text: prev.text + text };
      }
      return { role: buf.role, skillId: buf.skillId, text };
    });
  }, []);

  useEffect(() => {
    intervalRef.current = setInterval(flush, flushIntervalMs);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [flush, flushIntervalMs]);

  /** Push a token into the buffer */
  const pushToken = useCallback((role: "moderator" | "speaker", text: string, skillId?: string) => {
    const buf = bufferRef.current;
    if (buf && buf.role === role && buf.skillId === skillId) {
      buf.pending += text;
    } else {
      // New speaker — flush old buffer first
      if (buf && buf.pending) {
        setDisplay((prev) => {
          if (prev && prev.role === buf.role && prev.skillId === buf.skillId) {
            return { ...prev, text: prev.text + buf.pending };
          }
          return { role: buf.role, skillId: buf.skillId, text: buf.pending };
        });
      }
      bufferRef.current = { role, skillId, pending: text };
      setDisplay({ role, skillId, text: "" });
    }
  }, []);

  /** Clear buffer and display (call on turn_complete) */
  const clearBuffer = useCallback(() => {
    const buf = bufferRef.current;
    if (buf && buf.pending) {
      flush();
    }
    bufferRef.current = null;
    setDisplay(null);
  }, [flush]);

  return { live: display, pushToken, clearBuffer };
}
