"use client";

import { useEffect, useRef } from "react";
import type { RoundtableActiveTurn } from "@/lib/roundtable/active-turn";

export function useCourtStrikeEffect(activeTurn: RoundtableActiveTurn, stageRef: React.RefObject<HTMLElement | null>) {
  const audioRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      const context = audioRef.current;
      audioRef.current = null;
      if (context) void context.close().catch(() => {});
    };
  }, []);

  useEffect(() => {
    const shouldStrike = !!activeTurn && (activeTurn.role === "moderator" || activeTurn.role === "speaker");
    if (!shouldStrike || typeof window === "undefined") return;

    stageRef.current?.classList.add("court-stage-strike");
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => stageRef.current?.classList.remove("court-stage-strike"), 240);

    const AudioCtor =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) return;
    const context = audioRef.current ?? new AudioCtor();
    audioRef.current = context;
    void context.resume().catch(() => {});

    const now = context.currentTime;
    const tone = context.createOscillator();
    const toneGain = context.createGain();
    tone.type = "triangle";
    tone.frequency.setValueAtTime(188, now);
    tone.frequency.exponentialRampToValueAtTime(108, now + 0.14);
    toneGain.gain.setValueAtTime(0.0001, now);
    toneGain.gain.exponentialRampToValueAtTime(0.22, now + 0.01);
    toneGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
    tone.connect(toneGain);
    toneGain.connect(context.destination);
    tone.start(now);
    tone.stop(now + 0.24);

    const noiseFrames = 2400;
    const buffer = context.createBuffer(1, noiseFrames, context.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let index = 0; index < noiseFrames; index += 1)
      samples[index] = (Math.random() * 2 - 1) * (1 - index / noiseFrames);
    const noise = context.createBufferSource();
    const noiseGain = context.createGain();
    noise.buffer = buffer;
    noiseGain.gain.setValueAtTime(0.11, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
    noise.connect(noiseGain);
    noiseGain.connect(context.destination);
    noise.start(now);
    noise.stop(now + 0.18);
  }, [activeTurn, stageRef]);
}
