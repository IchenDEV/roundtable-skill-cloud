"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ShareLinkControls } from "@/components/roundtable/ShareLinkControls";
import { SynthesisDialog } from "@/components/roundtable/SynthesisDialog";
import { Timeline } from "@/components/roundtable/Timeline";
import { buildRoundtableMarkdown, triggerMarkdownDownload } from "@/lib/roundtable/export-markdown";
import type { RoundtableState } from "@/lib/spec/schema";
import { phaseInWords } from "@/lib/roundtable/phase-label";

type Skill = { skillId: string; name: string; description: string };

export function JiuxiDetailView({ state, skills }: { state: RoundtableState; skills: Skill[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const id = state.sessionId;
  const skillNameRecord = useMemo(() => Object.fromEntries(skills.map((s) => [s.skillId, s.name])), [skills]);
  const md = useMemo(
    () => buildRoundtableMarkdown(state, (i) => skills.find((x) => x.skillId === i)?.name ?? "列席"),
    [state, skills]
  );

  async function remove() {
    if (!id) return;
    if (!confirm("确定撤去这一席？不可恢复。")) return;
    setBusy(true);
    const res = await fetch(`/api/roundtable/sessions/${id}`, { method: "DELETE" });
    setBusy(false);
    if (res.ok) {
      router.push("/roundtable/jiuxi");
      return;
    }
    const j = (await res.json().catch(() => ({}))) as { error?: string };
    alert(j.error ?? "撤席失败");
  }

  return (
    <>
      <header className="mb-6 border-b border-ink-200/40 pb-4">
        <h1 className="font-serif text-xl text-ink-900">{state.topic}</h1>
        <p className="mt-2 text-sm text-ink-600">
          第 {state.round}/{state.maxRounds} 轮 · {phaseInWords(state.phase)}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
          <Link
            href={id ? `/roundtable?resume=${id}` : "/roundtable"}
            className="rounded-sm bg-ink-900 px-3 py-1.5 text-paper-50 hover:bg-ink-700"
          >
            回到此席继续
          </Link>
          <Link
            href="/roundtable/jiuxi"
            className="rounded-sm border border-ink-200/60 px-3 py-1.5 text-ink-800 hover:border-gold-500"
          >
            返回旧席录
          </Link>

          <span className="mx-1 hidden h-4 w-px bg-ink-200/60 sm:inline-block" />

          <button
            type="button"
            onClick={() => void navigator.clipboard.writeText(md)}
            className="rounded-sm border border-ink-200/60 px-3 py-1.5 text-ink-800 hover:border-gold-500"
          >
            抄录全文
          </button>
          <button
            type="button"
            onClick={() => triggerMarkdownDownload(state.topic, md)}
            className="rounded-sm border border-ink-200/60 px-3 py-1.5 text-ink-800 hover:border-gold-500"
          >
            下载 MD
          </button>

          <span className="mx-1 hidden h-4 w-px bg-ink-200/60 sm:inline-block" />

          <button
            type="button"
            disabled={busy || !id}
            onClick={() => void remove()}
            className="rounded-sm border border-cinnabar-600/40 px-3 py-1.5 text-cinnabar-700 hover:bg-cinnabar-600/10 disabled:opacity-40"
          >
            撤席
          </button>
        </div>
        <div className="mt-3">
          <ShareLinkControls state={state} skillNames={skillNameRecord} disabled={false} />
        </div>
      </header>

      {state.moderatorMemory ? (
        <p className="mb-4 border-l-2 border-gold-500 pl-3 text-xs text-ink-600">主持手记：{state.moderatorMemory}</p>
      ) : null}

      <Timeline
        transcript={state.transcript}
        participantIds={state.participantSkillIds}
        skillTitle={(i) => skills.find((x) => x.skillId === i)?.name ?? "列席"}
        liveTokens={null}
        round={state.round}
        maxRounds={state.maxRounds}
      />

      {state.synthesis ? (
        <div className="mt-8">
          <SynthesisDialog content={state.synthesis} />
        </div>
      ) : null}
    </>
  );
}
