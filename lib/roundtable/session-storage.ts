import { roundtableStateSchema, type RoundtableState } from "@/lib/spec/schema";

const ACTIVE_SNAPSHOT_KEY = "roundtable.active-session.v1";

type StoredSnapshot = {
  savedAt: string;
  state: RoundtableState;
};

function browserStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  return window.localStorage ?? null;
}

export function saveRoundtableLocalSnapshot(state: RoundtableState) {
  const storage = browserStorage();
  if (!storage) return;

  try {
    const payload: StoredSnapshot = { savedAt: new Date().toISOString(), state };
    storage.setItem(ACTIVE_SNAPSHOT_KEY, JSON.stringify(payload));
  } catch {
    /* local snapshots are a fallback only */
  }
}

export function loadRoundtableLocalSnapshot(): RoundtableState | null {
  const storage = browserStorage();
  if (!storage) return null;

  try {
    const raw = storage.getItem(ACTIVE_SNAPSHOT_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Partial<StoredSnapshot>;
    const parsed = roundtableStateSchema.safeParse(data.state);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
