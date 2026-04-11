"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { SessionListItem } from "@/lib/roundtable/session-types";
import { phaseInWords } from "@/lib/roundtable/phase-label";

export function JiuxiListClient({ sessions: initial }: { sessions: SessionListItem[] }) {
  const [sessions, setSessions] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    setSessions(initial);
  }, [initial]);

  async function remove(id: string) {
    if (!confirm("确定撤去这一席记录？不可恢复。")) return;
    setBusy(id);
    const res = await fetch(`/api/roundtable/sessions/${id}`, { method: "DELETE" });
    setBusy(null);
    if (res.ok) {
      setSessions((s) => s.filter((x) => x.id !== id));
      router.refresh();
    } else {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      alert(j.error ?? "撤席失败");
    }
  }

  if (sessions.length === 0) {
    return <p className="text-sm text-ink-600">尚无已钤印入库的圆桌。完成一场讨论并保持登入后，记录会出现在此。</p>;
  }

  return (
    <ul className="space-y-3">
      {sessions.map((s) => (
        <li
          key={s.id}
          className="scroll-paper flex flex-col gap-2 border border-ink-200/50 bg-paper-100/40 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <Link href={`/roundtable/jiuxi/${s.id}`} className="font-medium text-ink-900 hover:text-cinnabar-700">
              {s.topic.length > 120 ? `${s.topic.slice(0, 120)}…` : s.topic}
            </Link>
            <p className="mt-1 text-xs text-ink-600">
              第 {s.currentRound}/{s.maxRounds} 轮 · {phaseInWords(s.phase)} · 更新于{" "}
              {new Date(s.updatedAt).toLocaleString("zh-CN", { dateStyle: "medium", timeStyle: "short" })}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/roundtable/jiuxi/${s.id}`}
              className="rounded-sm border border-ink-200/60 px-3 py-1.5 text-sm text-ink-800 hover:border-gold-500"
            >
              展卷
            </Link>
            <Link
              href={`/roundtable?resume=${s.id}`}
              className="rounded-sm bg-ink-900 px-3 py-1.5 text-sm text-paper-50 hover:bg-ink-700"
            >
              回到此席
            </Link>
            <button
              type="button"
              disabled={busy === s.id}
              onClick={() => void remove(s.id)}
              className="rounded-sm border border-cinnabar-600/50 px-3 py-1.5 text-sm text-cinnabar-800 hover:bg-cinnabar-600/10 disabled:opacity-40"
            >
              撤席
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
