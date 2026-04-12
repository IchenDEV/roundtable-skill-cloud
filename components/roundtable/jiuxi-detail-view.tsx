"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { ShareLinkControls } from "@/components/roundtable/share-link-controls";
import { SynthesisDialog } from "@/components/roundtable/synthesis-dialog";
import { Timeline } from "@/components/roundtable/timeline";
import { buildRoundtableMarkdown, triggerMarkdownDownload } from "@/lib/roundtable/export-markdown";
import { getSkillDisplay } from "@/lib/skills/skill-display";
import type { RoundtableState } from "@/lib/spec/schema";
import { phaseInWords } from "@/lib/roundtable/phase-label";

type Skill = { skillId: string; name: string; description: string };

export function JiuxiDetailView({ state, skills }: { state: RoundtableState; skills: Skill[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const id = state.sessionId;
  const skillNameRecord = useMemo(
    () =>
      Object.fromEntries(
        skills.map((s) => [s.skillId, s.name && s.name !== s.skillId ? s.name : getSkillDisplay(s.skillId).label])
      ),
    [skills]
  );
  const resolveSkillName = useCallback(
    (skillId: string | undefined) => {
      if (!skillId) return "列席";
      return skillNameRecord[skillId] ?? getSkillDisplay(skillId).label;
    },
    [skillNameRecord]
  );
  const md = useMemo(() => buildRoundtableMarkdown(state, resolveSkillName), [state, resolveSkillName]);

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
      <header className="mb-6 pb-4 divider-b">
        <h1 className="font-serif text-xl text-ink-900">{state.topic}</h1>
        <p className="mt-2 text-sm text-ink-600">
          第 {state.round}/{state.maxRounds} 轮 · {phaseInWords(state.phase)}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
          <Link
            href={id ? `/roundtable?resume=${id}` : "/roundtable"}
            className="rounded-xl bg-cinnabar-600 px-3 py-1.5 text-card hover:bg-cinnabar-700"
          >
            回到此席继续
          </Link>
          <Link
            href={id ? `/court?resume=${id}` : "/court"}
            className="rounded-xl border border-cinnabar-600/50 px-3 py-1.5 text-cinnabar-800 hover:bg-cinnabar-600/10"
          >
            入公堂复辩
          </Link>
          <Link
            href="/roundtable/jiuxi"
            className="rounded-xl border border-ink-200/60 px-3 py-1.5 text-ink-800 hover:border-gold-500"
          >
            返回旧席录
          </Link>

          <span className="mx-1 hidden h-4 w-px bg-ink-200/60 sm:inline-block" />

          <button
            type="button"
            onClick={() => void navigator.clipboard.writeText(md)}
            className="rounded-xl border border-ink-200/60 px-3 py-1.5 text-ink-800 hover:border-gold-500"
          >
            抄录全文
          </button>
          <button
            type="button"
            onClick={() => triggerMarkdownDownload(state.topic, md)}
            className="rounded-xl border border-ink-200/60 px-3 py-1.5 text-ink-800 hover:border-gold-500"
          >
            下载 MD
          </button>

          <ShareLinkControls state={state} skillNames={skillNameRecord} disabled={false} inline />

          <span className="mx-1 hidden h-4 w-px bg-ink-200/60 sm:inline-block" />

          <button
            type="button"
            disabled={busy || !id}
            onClick={() => void remove()}
            className="rounded-xl border border-cinnabar-600/40 px-3 py-1.5 text-cinnabar-700 hover:bg-cinnabar-600/10 disabled:opacity-40"
          >
            撤席
          </button>
        </div>
      </header>

      {state.moderatorMemory ? (
        <p className="mb-4 rounded-xl border-l-2 border-gold-500 pl-3 text-xs text-ink-600 ring-border  py-2 pr-3">
          主持手记：{state.moderatorMemory}
        </p>
      ) : null}

      <Timeline
        transcript={state.transcript}
        participantIds={state.participantSkillIds}
        skillTitle={(i) => resolveSkillName(i)}
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
