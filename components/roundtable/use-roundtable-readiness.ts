"use client";

import { useCallback, useEffect, useState } from "react";

export type RoundtableReadiness =
  | { kind: "loading" }
  | { kind: "no_backend"; devBypass: boolean }
  | { kind: "need_login" }
  | { kind: "need_key" }
  | { kind: "ready" }
  | { kind: "dev_local" };

type ApiShape = {
  configured?: boolean;
  devBypass?: boolean;
  authenticated?: boolean;
  hasCredential?: boolean;
  /** @deprecated 兼容旧 API */
  hasOpenai?: boolean;
};

function parseReadiness(j: ApiShape | null): RoundtableReadiness {
  if (!j) return { kind: "no_backend", devBypass: false };
  if (j.configured === false) {
    return j.devBypass ? { kind: "dev_local" } : { kind: "no_backend", devBypass: false };
  }
  if (j.configured === true) {
    if (j.authenticated === false) return { kind: "need_login" };
    if (j.authenticated === true) {
      const hasKey = j.hasCredential ?? j.hasOpenai;
      if (!hasKey) return { kind: "need_key" };
      return { kind: "ready" };
    }
    return { kind: "loading" };
  }
  return { kind: "loading" };
}

export function useRoundtableReadiness() {
  const [readiness, setReadiness] = useState<RoundtableReadiness>({ kind: "loading" });

  const refetch = useCallback(() => {
    void fetch("/api/credentials")
      .then((r) => r.json() as Promise<ApiShape>)
      .then((j) => setReadiness(parseReadiness(j)))
      .catch(() => setReadiness({ kind: "no_backend", devBypass: false }));
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const canStartRoundtable = readiness.kind === "ready" || readiness.kind === "dev_local";

  return { readiness, refetch, canStartRoundtable };
}
