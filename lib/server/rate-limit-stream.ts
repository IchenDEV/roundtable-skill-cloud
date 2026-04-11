import { MAX_CONCURRENT_STREAMS_PER_USER } from "@/lib/spec/constants";

type CountBucket = { n: number; reset: number };

const rateBuckets = new Map<string, CountBucket>();
const concurrent = new Map<string, number>();

const WINDOW_MS = 60_000;
/** 每窗口内允许发起的流式请求次数（单实例内存计数；多实例各自独立） */
const MAX_STREAM_STARTS_PER_WINDOW = 24;

function pruneRate(now: number) {
  if (rateBuckets.size < 2000) return;
  for (const [k, b] of rateBuckets) {
    if (now >= b.reset) rateBuckets.delete(k);
  }
}

/** @returns 是否允许本次计数 */
export function takeStreamRateToken(key: string): boolean {
  const now = Date.now();
  pruneRate(now);
  let b = rateBuckets.get(key);
  if (!b || now >= b.reset) {
    b = { n: 0, reset: now + WINDOW_MS };
    rateBuckets.set(key, b);
  }
  if (b.n >= MAX_STREAM_STARTS_PER_WINDOW) return false;
  b.n += 1;
  return true;
}

export function beginStreamSlot(key: string): boolean {
  const c = concurrent.get(key) ?? 0;
  if (c >= MAX_CONCURRENT_STREAMS_PER_USER) return false;
  concurrent.set(key, c + 1);
  return true;
}

export function endStreamSlot(key: string) {
  const c = (concurrent.get(key) ?? 1) - 1;
  if (c <= 0) concurrent.delete(key);
  else concurrent.set(key, c);
}
