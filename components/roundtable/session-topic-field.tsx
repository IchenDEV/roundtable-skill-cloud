"use client";

type Props = {
  label: string;
  value: string;
  rows?: number;
  onChange: (value: string) => void;
};

export function SessionTopicField({ label, value, rows = 2, onChange }: Props) {
  return (
    <label className="block text-sm text-ink-700">
      <span className="mb-1 block text-ink-900">{label}</span>
      <textarea
        value={value}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-ink-200/60 bg-paper-50 px-3 py-2 text-ink-900 outline-none focus:ring-1 focus:ring-gold-500"
      />
    </label>
  );
}
