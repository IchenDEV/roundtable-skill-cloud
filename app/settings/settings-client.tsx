"use client";

import { useEffect, useMemo, useState } from "react";
import { FadeIn } from "@/components/motion-root";
import { SettingsFormCard } from "@/components/settings/settings-form-card";
import { SettingsStatusNotices } from "@/components/settings/settings-status-notices";
import type { CredentialStatus } from "@/components/settings/settings-types";
import { BYOK_PROVIDERS, defaultApiBaseUrl, type ByokProvider } from "@/lib/spec/constants";

export function SettingsClient() {
  const [status, setStatus] = useState<CredentialStatus>(null);
  const [provider, setProvider] = useState<ByokProvider>("openai");
  const [key, setKey] = useState("");
  const [apiBaseUrl, setApiBaseUrl] = useState("");
  const [defaultModel, setDefaultModel] = useState("");
  const [label, setLabel] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const syncFromStatus = (nextStatus: CredentialStatus) => {
    setStatus(nextStatus);
    if (nextStatus?.activeProvider && BYOK_PROVIDERS.includes(nextStatus.activeProvider as ByokProvider)) {
      setProvider(nextStatus.activeProvider as ByokProvider);
    }
    setDefaultModel(nextStatus?.defaultModel ?? "");
    setApiBaseUrl(nextStatus?.apiBaseUrl ?? "");
  };

  useEffect(() => {
    void fetch("/api/credentials")
      .then((res) => res.json())
      .then((data: CredentialStatus) => syncFromStatus(data))
      .catch(() => setStatus(null));
  }, []);

  const baseHint = useMemo(() => defaultApiBaseUrl(provider), [provider]);
  const showBaseField = provider !== "anthropic";
  const hasKey = !!(status?.hasCredential ?? status?.hasOpenai);

  const save = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          apiKey: key,
          label: label || undefined,
          apiBaseUrl: apiBaseUrl.trim() || undefined,
          defaultModel: defaultModel.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "保存失败");
      setMessage("已钤印入库。");
      setKey("");
      syncFromStatus(await fetch("/api/credentials").then((next) => next.json()));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "错误");
    } finally {
      setLoading(false);
    }
  };

  const remove = async () => {
    setLoading(true);
    await fetch("/api/credentials", { method: "DELETE" });
    syncFromStatus(await fetch("/api/credentials").then((next) => next.json()));
    setKey("");
    setLabel("");
    setLoading(false);
  };

  return (
    <FadeIn>
      <h1 className="mb-2 font-serif text-2xl tracking-[0.15em] text-ink-900">砚台</h1>
      <p className="mb-8 text-sm leading-relaxed text-ink-700">
        代你执笔的智能服务，需要一份只属于你的授权。你可选用不同笔会；钤印后，授权锁在你的私人柜中，平台不代持。
      </p>
      <SettingsStatusNotices status={status} hasKey={hasKey} />
      <SettingsFormCard
        provider={provider}
        keyValue={key}
        apiBaseUrl={apiBaseUrl}
        defaultModel={defaultModel}
        label={label}
        loading={loading}
        hasKey={hasKey}
        baseHint={baseHint}
        showBaseField={showBaseField}
        message={message}
        onProviderChange={setProvider}
        onKeyChange={setKey}
        onApiBaseUrlChange={setApiBaseUrl}
        onDefaultModelChange={setDefaultModel}
        onLabelChange={setLabel}
        onSave={() => void save()}
        onRemove={() => void remove()}
      />
    </FadeIn>
  );
}
