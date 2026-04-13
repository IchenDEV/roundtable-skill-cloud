import type { RepoCredit } from "@/lib/credits/credits-data";

export function CreditsRepoTable({ rows }: { rows: RepoCredit[] }) {
  return (
    <div className="mt-5 overflow-hidden rounded-xl ring-border">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-ink-200/40 bg-card">
          <tr>
            <th className="px-4 py-2 font-medium text-ink-900">视角</th>
            <th className="px-4 py-2 font-medium text-ink-900">来源</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-200/30">
          {rows.map((credit) => (
            <tr key={credit.skillId} className="transition-colors hover:bg-paper-100/40">
              <td className="px-4 py-2 text-ink-800">{credit.label}</td>
              <td className="px-4 py-2">
                <a
                  href={credit.repo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-cinnabar-700 underline underline-offset-2"
                >
                  {credit.source}/{credit.repo.split("/").pop()}
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
