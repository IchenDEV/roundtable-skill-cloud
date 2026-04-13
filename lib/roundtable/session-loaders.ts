import { cloneStateForFork } from "@/lib/roundtable/clone-for-fork";
import type { SharePayload } from "@/lib/spec/share-payload";
import type { RoundtableState } from "@/lib/spec/schema";

export async function fetchResumedSession(sessionId: string) {
  const res = await fetch(`/api/roundtable/sessions/${sessionId.trim()}`);
  const data = (await res.json()) as { state?: RoundtableState; error?: string };
  return { ok: res.ok, state: data.state, error: data.error };
}

export async function fetchSharedSession(token: string) {
  const res = await fetch(`/api/roundtable/share/${token.trim()}`);
  const data = (await res.json()) as { payload?: SharePayload; error?: string };
  return {
    ok: res.ok,
    state: data.payload ? cloneStateForFork(data.payload.state) : undefined,
    error: data.error,
  };
}
