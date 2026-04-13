"use client";

import { MAX_ROUND_ROUNDS } from "@/lib/spec/constants";

type Props = {
  label: string;
  value: number;
  onChange: (value: number) => void;
};

export function SessionRoundsField({ label, value, onChange }: Props) {
  return (
    <label className="flex items-center gap-2 text-ink-700">
      {label}
      <input
        type="number"
        min={1}
        max={MAX_ROUND_ROUNDS}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-14 rounded-lg border border-ink-200/60 bg-paper-50 px-2 py-1 text-ink-900"
      />
    </label>
  );
}
