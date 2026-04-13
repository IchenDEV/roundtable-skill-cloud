import type { RoundtableState, TurnResponseEvent, TurnStep } from "@/lib/spec/schema";

export type DispatchStep = { skillId: string; target?: string; directive?: string };

export type TurnStreamHandlers = {
  onToken: (role: "moderator" | "speaker", text: string, skillId?: string) => void;
  onTurnComplete: (role: "moderator" | "speaker", fullText: string, skillId?: string) => void;
  onDispatch: (steps: DispatchStep[]) => void;
  onMemory: (text: string) => void;
  onSynthesis: (text: string) => void;
  onError: (msg: string) => void;
};

export async function consumeTurnStream(
  state: RoundtableState,
  step: TurnStep,
  opts: { skillId?: string; target?: string; directive?: string },
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
      try {
        const event = JSON.parse(raw) as TurnResponseEvent;
        if (event.type === "token") handlers.onToken(event.role, event.text, event.skillId);
        if (event.type === "turn_complete") handlers.onTurnComplete(event.role, event.fullText, event.skillId);
        if (event.type === "dispatch") handlers.onDispatch(event.steps);
        if (event.type === "memory") handlers.onMemory(event.text);
        if (event.type === "synthesis_complete") handlers.onSynthesis(event.text);
        if (event.type === "error") {
          handlers.onError(event.message);
          return;
        }
        if (event.type === "done") return;
      } catch {
        /* skip malformed SSE */
      }
    }
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
