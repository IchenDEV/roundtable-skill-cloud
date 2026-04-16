import type { DebateAction, RoundtableState, TurnResponseEvent, TurnStep } from "@/lib/spec/schema";

export type DispatchStep = {
  action?: DebateAction;
  skillId: string;
  target?: string;
  directive?: string;
};

export type TurnStreamHandlers = {
  onToken: (role: "moderator" | "speaker", text: string, skillId?: string) => void;
  onTurnComplete: (role: "moderator" | "speaker", fullText: string, skillId?: string) => void;
  onDispatch: (steps: DispatchStep[]) => void;
  onTurnStructured: (payload: {
    skillId: string;
    stance?: string;
    confidence?: "low" | "medium" | "high";
    evidenceTendency?: string;
    styleCard?: string;
    conflictPoints?: string[];
  }) => void;
  onRoundStructured: (payload: {
    consensus?: { text: string; skillIds: string[] };
    disagreements?: { text: string; skillIds: string[] };
    evidenceNeeded?: { text: string; skillIds: string[] };
  }) => void;
  onMemory: (text: string) => void;
  onSynthesis: (text: string) => void;
  onError: (msg: string) => void;
};

function eventMatchesExpectedTurn(
  step: TurnStep,
  opts: { skillId?: string; target?: string; directive?: string; action?: DebateAction },
  event: TurnResponseEvent
) {
  if (event.type === "token" || event.type === "turn_complete") {
    if (step === "participant") {
      return event.role === "speaker" && event.skillId === opts.skillId;
    }
    if (step === "moderator_judge") {
      return event.role === "moderator";
    }
    return event.role === "moderator";
  }

  if (event.type === "dispatch") return step === "moderator_open";
  if (event.type === "turn_structured") return step === "participant";
  if (event.type === "round_structured") return step === "moderator_wrap";
  if (event.type === "memory") return step === "moderator_wrap";
  if (event.type === "synthesis_complete") return step === "synthesis";
  return true;
}

export async function consumeTurnStream(
  state: RoundtableState,
  step: TurnStep,
  opts: { skillId?: string; target?: string; directive?: string; action?: DebateAction },
  handlers: TurnStreamHandlers,
  signal: AbortSignal
) {
  const res = await fetch("/api/roundtable/turn", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ state, step, ...opts }),
    signal,
  });
  if (!res.ok) {
    const text = await res.text();
    let message = "暂时无法开始，请稍后再试。";
    try {
      const data = JSON.parse(text) as { error?: unknown };
      if (typeof data.error === "string") message = data.error;
    } catch {
      /* keep default */
    }
    throw new Error(message);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("连接未能建立，请重试。");
  const decoder = new TextDecoder();
  let carry = "";
  let sawDone = false;
  let sawCompletion = false;
  let sawStructuredError = false;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (signal.aborted) return;
    carry += decoder.decode(value, { stream: true });
    const blocks = carry.split("\n\n");
    carry = blocks.pop() ?? "";
    for (const block of blocks) {
      const line = block.trim();
      if (!line.startsWith("data:")) continue;
      const raw = line.slice(5).trim();
      let event: TurnResponseEvent;
      try {
        event = JSON.parse(raw) as TurnResponseEvent;
      } catch {
        /* skip malformed SSE */
        continue;
      }

      if (!eventMatchesExpectedTurn(step, opts, event)) {
        throw new Error("流式上下文错位，已中止本轮，请重试。");
      }

      if (event.type === "token") handlers.onToken(event.role, event.text, event.skillId);
      if (event.type === "turn_complete") {
        sawCompletion = true;
        handlers.onTurnComplete(event.role, event.fullText, event.skillId);
      }
      if (event.type === "dispatch") handlers.onDispatch(event.steps);
      if (event.type === "turn_structured") handlers.onTurnStructured(event);
      if (event.type === "round_structured") handlers.onRoundStructured(event);
      if (event.type === "memory") handlers.onMemory(event.text);
      if (event.type === "synthesis_complete") {
        sawCompletion = true;
        handlers.onSynthesis(event.text);
      }
      if (event.type === "error") {
        sawStructuredError = true;
        handlers.onError(event.message);
        return;
      }
      if (event.type === "done") {
        sawDone = true;
        return;
      }
    }
  }

  if (signal.aborted || sawStructuredError) return;
  if (!sawCompletion) {
    throw new Error("执笔中途断开，未收到完整结果，请重试。");
  }
  if (!sawDone) {
    throw new Error("连接在收束前中断，请重试。");
  }
}

export async function persistRoundtableState(state: RoundtableState) {
  try {
    await fetch("/api/roundtable/persist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state }),
    });
  } catch {
    /* persist failure is non-fatal */
  }
}
