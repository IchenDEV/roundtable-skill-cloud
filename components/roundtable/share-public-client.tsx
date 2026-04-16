"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Timeline } from "@/components/roundtable/timeline";
import { SynthesisDialog } from "@/components/roundtable/synthesis-dialog";
import type { SharePayload } from "@/lib/spec/share-payload";
import { buildRoundtableMarkdown, triggerMarkdownDownload } from "@/lib/roundtable/export-markdown";
import { phaseInWords } from "@/lib/roundtable/phase-label";
import { trackShareEvent } from "@/lib/roundtable/share-events";

type AuthState = "loading" | "guest" | "authed";

function pickKeyDisagreements(texts: string[]) {
  const marks = ["但是", "然而", "不过", "反对", "质疑", "分歧", "争议"];
  const hits = texts.filter((text) => marks.some((mark) => text.includes(mark)));
  return (hits.length ? hits : texts).slice(0, 3).map((text) => text.slice(0, 72));
}

export function SharePublicClient({ token, payload }: { token: string; payload: SharePayload }) {
  const { state, skillNames } = payload;
  const title = (id: string | undefined) => (id && skillNames[id]) || (id ? `列席（${id}）` : "列席");
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [promptLogin, setPromptLogin] = useState(false);

  const md = buildRoundtableMarkdown(state, title);

  const freshParams = new URLSearchParams();
  freshParams.set("topic", state.topic);
  if (state.participantSkillIds.length) freshParams.set("skills", state.participantSkillIds.join(","));
  freshParams.set("maxRounds", String(state.maxRounds));
  const freshHref = `/roundtable?${freshParams.toString()}`;
  const forkHref = `/roundtable?fromShare=${token}`;

  const speakerTexts = state.transcript.filter((item) => item.role === "speaker").map((item) => item.content);
  const keyDisagreements = pickKeyDisagreements(speakerTexts);
  const threeSecondRead = [
    `议题：${state.topic}`,
    `席位：${state.participantSkillIds.map((id) => title(id)).join("、") || "未设置"}`,
    `进度：第 ${state.round}/${state.maxRounds} 轮，当前${phaseInWords(state.phase)}`,
  ];

  useEffect(() => {
    void trackShareEvent(token, "browse", { phase: state.phase, round: state.round });
    void fetch("/api/credentials")
      .then((res) => res.json() as Promise<{ authenticated?: boolean }>)
      .then((data) => setAuthState(data.authenticated ? "authed" : "guest"))
      .catch(() => setAuthState("guest"));
  }, [state.phase, state.round, token]);

  const handleFork = async () => {
    await trackShareEvent(token, "fork_initiated", { destination: "roundtable" });
    if (authState !== "authed") {
      setPromptLogin(true);
      return;
    }
    router.push(forkHref);
  };

  return (
    <>
      <header className="mb-8 pb-6 divider-b">
        <p className="text-xs tracking-widest text-ink-600">展卷（只读）</p>
        <h1 className="mt-2 font-serif text-2xl text-ink-900">{state.topic}</h1>
        <p className="mt-2 text-sm text-ink-600">
          第 {state.round} / {state.maxRounds} 轮 · {phaseInWords(state.phase)}
        </p>

        <section className="mt-4 rounded-2xl bg-paper-100/70 p-4 ring-border">
          <p className="text-xs tracking-widest text-ink-500">3 秒读懂</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-700">
            {threeSecondRead.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>

        <section className="mt-4 rounded-2xl bg-card p-4 card-elevated">
          <p className="text-xs tracking-widest text-ink-500">本局摘要卡</p>
          <div className="mt-3 grid gap-3 text-sm text-ink-700 md:grid-cols-2">
            <p>
              <span className="text-ink-500">议题：</span>
              {state.topic}
            </p>
            <p>
              <span className="text-ink-500">席位配置：</span>
              {state.participantSkillIds.map((id) => title(id)).join("、") || "未设置"}
            </p>
            <div className="md:col-span-2">
              <p className="text-ink-500">关键分歧：</p>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                {keyDisagreements.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <p className="md:col-span-2">
              <span className="text-ink-500">结案：</span>
              {state.synthesis?.trim() || "本局尚未结案，可复刻后继续推演。"}
            </p>
          </div>
        </section>

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
            onClick={() => {
              void navigator.clipboard.writeText(typeof window !== "undefined" ? window.location.href : "");
              void trackShareEvent(token, "copy_link");
            }}
            className="rounded-xl border border-ink-200/60 px-4 py-2 text-sm text-ink-800 hover:border-gold-500"
          >
            复制链接
          </button>
          <button
            type="button"
            onClick={() => void navigator.clipboard.writeText(md)}
            className="rounded-xl border border-ink-200/60 px-4 py-2 text-sm text-ink-800 hover:border-gold-500"
          >
            抄录全文
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 pt-4 divider-t">
          <button
            type="button"
            onClick={() => void handleFork()}
            className="rounded-xl bg-cinnabar-600 px-4 py-2 text-sm text-card hover:bg-cinnabar-700"
          >
            一键复刻（可微调后开席）
          </button>
          <Link
            href={freshHref}
            className="rounded-xl border border-cinnabar-600/50 px-4 py-2 text-sm text-cinnabar-800 hover:bg-cinnabar-600/10"
          >
            同席重论（仅议题与列席）
          </Link>
          <Link href="/roundtable" className="rounded-xl border border-ink-200/60 px-4 py-2 text-sm text-ink-800">
            回开席页
          </Link>
        </div>

        <p className="mt-4 text-xs leading-6 text-ink-500">
          token
          生命周期说明：分享链接默认长期可读；发布者可随时撤回，或因安全治理与系统清理而失效。若显示“链接无效”，请向发布者索取新链接。
        </p>
        {promptLogin ? (
          <p className="mt-2 rounded-xl bg-cinnabar-600/8 px-3 py-2 text-xs text-cinnabar-800 ring-cinnabar-600/25">
            你当前未登入：可继续阅读；若要复刻/续写，请先
            <Link href="/login" className="mx-1 underline">
              登录
            </Link>
            再返回此页。
          </p>
        ) : null}
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
