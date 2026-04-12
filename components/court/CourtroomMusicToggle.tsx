"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Tone = {
  frequency: number;
  start: number;
  duration: number;
  gain: number;
  type?: OscillatorType;
};

const PATTERN: Tone[] = [
  { frequency: 196, start: 0, duration: 0.11, gain: 0.055, type: "square" },
  { frequency: 294, start: 0.18, duration: 0.08, gain: 0.035, type: "triangle" },
  { frequency: 220, start: 0.36, duration: 0.1, gain: 0.045, type: "square" },
  { frequency: 392, start: 0.62, duration: 0.08, gain: 0.032, type: "triangle" },
  { frequency: 247, start: 0.92, duration: 0.12, gain: 0.05, type: "square" },
  { frequency: 330, start: 1.22, duration: 0.1, gain: 0.035, type: "triangle" },
  { frequency: 185, start: 1.52, duration: 0.16, gain: 0.045, type: "sawtooth" },
];

function scheduleTone(ctx: AudioContext, tone: Tone) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const start = ctx.currentTime + tone.start;
  const end = start + tone.duration;

  osc.type = tone.type ?? "square";
  osc.frequency.setValueAtTime(tone.frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(tone.gain, start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, end);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(end + 0.02);
}

export function CourtroomMusicToggle({ className }: { className?: string }) {
  const [playing, setPlaying] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number | null>(null);

  const stop = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    const ctx = ctxRef.current;
    ctxRef.current = null;
    if (ctx) void ctx.close().catch(() => {});
    setPlaying(false);
  }, []);

  const start = useCallback(async () => {
    if (playing || typeof window === "undefined") return;
    const ctx = new AudioContext();
    ctxRef.current = ctx;
    await ctx.resume();
    const playLoop = () => PATTERN.forEach((tone) => scheduleTone(ctx, tone));
    playLoop();
    timerRef.current = window.setInterval(playLoop, 1850);
    setPlaying(true);
  }, [playing]);

  useEffect(() => stop, [stop]);

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={playing ? stop : () => void start()}
      className={cn(
        "border-gold-500/70 bg-ink-900/70 font-sans text-paper-50 hover:bg-cinnabar-700 hover:text-paper-50",
        className
      )}
      aria-pressed={playing}
    >
      {playing ? "止鼓" : "鸣鼓"}
    </Button>
  );
}
