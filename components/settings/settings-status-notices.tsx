"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { PROVIDER_LABEL, type ByokProvider } from "@/lib/spec/constants";
import type { CredentialStatus } from "@/components/settings/settings-types";

export function SettingsStatusNotices({ status, hasKey }: { status: CredentialStatus; hasKey: boolean }) {
  return (
    <>
      {status?.devBypass ? (
        <Alert className="mb-4 rounded-xl border-none bg-card font-sans ring-ring">
          <AlertDescription className="text-ink-800">
            当前为<strong className="text-ink-900">本地试墨</strong>：未登入也可开席，仅在本机有效，切勿用于对外站点。
          </AlertDescription>
        </Alert>
      ) : null}
      {!status?.configured && !status?.devBypass ? (
        <p className="mb-4 text-sm text-cinnabar-700">
          正式环境需先接通账户库；在本地试墨时，可由维护者开启仅本地的代笔通道。
        </p>
      ) : null}
      {status?.authenticated === false ? (
        <p className="mb-4 text-sm text-ink-700">
          请先{" "}
          <a href="/login" className="text-cinnabar-700 underline">
            登入
          </a>
          ，再在此钤印。
        </p>
      ) : null}
      {hasKey && status?.activeProvider ? (
        <p className="mb-4 text-sm text-ink-600">
          当前选用：
          <span className="text-ink-900">
            {PROVIDER_LABEL[status.activeProvider as ByokProvider] ?? status.activeProvider}
          </span>
          {status.updatedAt ? `（${status.updatedAt}）` : ""}
        </p>
      ) : null}
    </>
  );
}
