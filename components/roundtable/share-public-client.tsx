"use client";

import Link from "next/link";
import { Timeline } from "@/components/roundtable/timeline";
import { SynthesisDialog } from "@/components/roundtable/synthesis-dialog";
import type { SharePayload } from "@/lib/spec/share-payload";
import { buildRoundtableMarkdown, triggerMarkdownDownload } from "@/lib/roundtable/export-markdown";
import { phaseInWords } from "@/lib/roundtable/phase-label";

export function SharePublicClient({ token, payload }: { token: string; payload: SharePayload }) {
  const { state, skillNames } = payload;
  const title = (id: string | undefined) => (id && skillNames[id]) || (id ? `列席（${id}）` : "列席");

  const md = buildRoundtableMarkdown(state, title);

  const freshParams = new URLSearchParams();
  freshParams.set("topic", state.topic);
  if (state.participantSkillIds.length) {
    freshParams.set("skills", state.participantSkillIds.join(","));
  }
  freshParams.set("maxRounds", String(state.maxRounds));
  const freshHref = `/roundtable?${freshParams.toString()}`;
  const forkHref = `/roundtable?fromShare=${token}`;
  const courtFreshHref = `/court?${freshParams.toString()}`;
  const courtForkHref = `/court?fromShare=${token}`;

  return (
    <>
      <header className="mb-8 pb-6 divider-b">
        <p className="text-xs tracking-widest text-ink-600">展卷（只读）</p>
        <h1 className="mt-2 font-serif text-2xl text-ink-900">{state.topic}</h1>
        <p className="mt-2 text-sm text-ink-600">
          第 {state.round} / {state.maxRounds} 轮 · {phaseInWords(state.phase)}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => triggerMarkdownDownload(state.topic, md)}
            className="rounded-xl border border-ink-200/60 px-4 py-2 text-sm text-ink-800 hover:border-gold-500"
          >
            下载 Markdown
          </button>
          <button
            type="button"
            onClick={() => void navigator.clipboard.writeText(md)}
            className="rounded-xl border border-ink-200/60 px-4 py-2 text-sm text-ink-800 hover:border-gold-500"
          >
            抄录全文
          </button>
          {typeof navigator !== "undefined" && "share" in navigator && (
            <button
              type="button"
              onClick={() => {
                void navigator
                  .share({
                    title: "圆桌展卷",
                    text: state.topic.slice(0, 200),
                    url: typeof window !== "undefined" ? window.location.href : "",
                  })
                  .catch(() => {});
              }}
              className="rounded-xl border border-ink-200/60 px-4 py-2 text-sm text-ink-800 hover:border-gold-500"
            >
              系统分享
            </button>
          )}
        </div>
        <div className="mt-4 flex flex-wrap gap-2 pt-4 divider-t">
          <Link
            href={forkHref}
            className="rounded-xl bg-cinnabar-600 px-4 py-2 text-sm text-card hover:bg-cinnabar-700"
          >
            携卷复刻（同记录续议）
          </Link>
          <Link
            href={courtForkHref}
            className="rounded-xl bg-cinnabar-600/90 px-4 py-2 text-sm text-card hover:bg-cinnabar-700"
          >
            入公堂复辩
          </Link>
          <Link
            href={freshHref}
            className="rounded-xl border border-cinnabar-600/50 px-4 py-2 text-sm text-cinnabar-800 hover:bg-cinnabar-600/10"
          >
            同席重论（仅议题与列席）
          </Link>
          <Link
            href={courtFreshHref}
            className="rounded-xl border border-ink-200/60 px-4 py-2 text-sm text-ink-800 hover:border-gold-500"
          >
            公堂重论
          </Link>
          <Link href="/roundtable" className="rounded-xl border border-ink-200/60 px-4 py-2 text-sm text-ink-800">
            回开席页
          </Link>
        </div>
      </header>

      {state.moderatorMemory ? (
        <p className="mb-4 border-l-2 border-gold-500 pl-3 text-xs text-ink-600">主持手记：{state.moderatorMemory}</p>
      ) : null}

      <Timeline
        transcript={state.transcript}
        participantIds={state.participantSkillIds}
        skillTitle={title}
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
