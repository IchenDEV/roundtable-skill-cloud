export function CreditsSkillPills({ labels }: { labels: string[] }) {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {labels.map((label) => (
        <span key={label} className="rounded-xl bg-card px-3 py-1.5 text-sm text-ink-800 ring-border">
          {label}
        </span>
      ))}
    </div>
  );
}
