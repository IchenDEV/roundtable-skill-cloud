"use client";

import { useEffect, useMemo, useState } from "react";
import { FadeIn } from "@/components/MotionRoot";
import { BYOK_PROVIDERS, PROVIDER_LABEL, defaultApiBaseUrl, type ByokProvider } from "@/lib/spec/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

type Status = {
  configured?: boolean;
  devBypass?: boolean;
  authenticated?: boolean;
  activeProvider?: string;
  defaultModel?: string | null;
  apiBaseUrl?: string | null;
  providersSaved?: string[];
  hasCredential?: boolean;
  hasOpenai?: boolean;
  updatedAt?: string | null;
  hasCustomBaseUrl?: boolean;
} | null;

export function SettingsClient() {
  const [status, setStatus] = useState<Status>(null);
  const [provider, setProvider] = useState<ByokProvider>("openai");
  const [key, setKey] = useState("");
  const [apiBaseUrl, setApiBaseUrl] = useState("");
  const [defaultModel, setDefaultModel] = useState("");
  const [label, setLabel] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const syncFromStatus = (j: Status) => {
    setStatus(j);
    if (j?.activeProvider && BYOK_PROVIDERS.includes(j.activeProvider as ByokProvider)) {
      setProvider(j.activeProvider as ByokProvider);
    }
    setDefaultModel(j?.defaultModel ?? "");
    setApiBaseUrl(j?.apiBaseUrl ?? "");
  };

  useEffect(() => {
    void fetch("/api/credentials")
      .then((r) => r.json())
      .then((j: Status) => syncFromStatus(j))
      .catch(() => setStatus(null));
  }, []);

  const baseHint = useMemo(() => defaultApiBaseUrl(provider), [provider]);
  const showBaseField = provider !== "anthropic";

  const save = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const r = await fetch("/api/credentials", {
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
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "保存失败");
      setMsg("已钤印入库。");
      setKey("");
      const s = await fetch("/api/credentials").then((x) => x.json());
      syncFromStatus(s);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "错误");
    } finally {
      setLoading(false);
    }
  };

  const remove = async () => {
    setLoading(true);
    await fetch("/api/credentials", { method: "DELETE" });
    const s = await fetch("/api/credentials").then((x) => x.json());
    syncFromStatus(s);
    setKey("");
    setLabel("");
    setLoading(false);
  };

  const hasKey = !!(status?.hasCredential ?? status?.hasOpenai);

  return (
    <FadeIn>
      <h1 className="mb-2 font-serif text-2xl tracking-[0.15em] text-ink-900">砚台</h1>
      <p className="mb-8 text-sm leading-relaxed text-ink-700">
        代你执笔的智能服务，需要一份只属于你的授权。你可选用不同笔会；钤印后，授权锁在你的私人柜中，平台不代持。
      </p>

      {status?.devBypass && (
        <Alert className="mb-4 border-gold-500/50 bg-paper-100/50 font-sans">
          <AlertDescription className="text-ink-800">
            当前为<strong className="text-ink-900">本地试墨</strong>：未登入也可开席，仅在本机有效，切勿用于对外站点。
          </AlertDescription>
        </Alert>
      )}

      {!status?.configured && !status?.devBypass && (
        <p className="mb-4 text-sm text-cinnabar-700">
          正式环境需先接通账户库；在本地试墨时，可由维护者开启仅本地的代笔通道。
        </p>
      )}

      {status?.authenticated === false && (
        <p className="mb-4 text-sm text-ink-700">
          请先{" "}
          <a href="/login" className="text-cinnabar-700 underline">
            登入
          </a>
          ，再在此钤印。
        </p>
      )}

      {hasKey && status?.activeProvider && (
        <p className="mb-4 text-sm text-ink-600">
          当前选用：
          <span className="text-ink-900">
            {PROVIDER_LABEL[status.activeProvider as ByokProvider] ?? status.activeProvider}
          </span>
          {status?.updatedAt ? `（${status.updatedAt}）` : ""}
        </p>
      )}

      <div className="max-w-lg space-y-4 rounded-lg border border-ink-200/50 bg-paper-100/30 p-4 font-sans">
        <div className="space-y-2">
          <Label>选用笔会</Label>
          <Select value={provider} onValueChange={(v) => setProvider(v as ByokProvider)} disabled={loading}>
            <SelectTrigger className="w-full bg-paper-50/80">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BYOK_PROVIDERS.map((p) => (
                <SelectItem key={p} value={p}>
                  {PROVIDER_LABEL[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="byok-key">执笔授权码</Label>
          <Input
            id="byok-key"
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            autoComplete="off"
            placeholder="粘贴授权码"
            className="bg-paper-50/80"
          />
        </div>

        {showBaseField && (
          <div className="space-y-2">
            <Label htmlFor="byok-base">接口根地址（可空，则用笔会默认）</Label>
            <Input
              id="byok-base"
              value={apiBaseUrl}
              onChange={(e) => setApiBaseUrl(e.target.value)}
              placeholder={baseHint || "https://…"}
              className="font-mono text-xs bg-paper-50/80"
            />
            {baseHint ? (
              <span className="block text-xs text-ink-500">默认：{baseHint}</span>
            ) : (
              <span className="block text-xs text-cinnabar-700">
                此笔会须自行填写完整根地址（通常以 /v1 或厂商文档为准）。
              </span>
            )}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="byok-model">默认模型名（可空）</Label>
          <Input
            id="byok-model"
            value={defaultModel}
            onChange={(e) => setDefaultModel(e.target.value)}
            placeholder={provider === "anthropic" ? "如 claude-sonnet-4-20250514" : "如 gpt-4o-mini"}
            className="bg-paper-50/80"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="byok-label">备注（可选）</Label>
          <Input id="byok-label" value={label} onChange={(e) => setLabel(e.target.value)} className="bg-paper-50/80" />
        </div>

        <div className="flex flex-wrap gap-3 pt-1">
          <Button
            type="button"
            onClick={() => void save()}
            disabled={loading || !key.trim()}
            className="bg-ink-900 text-primary-foreground transition-[transform,box-shadow] duration-150 hover:bg-ink-800 active:scale-[0.99] disabled:active:scale-100"
          >
            {loading ? "保存中…" : "保存"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => void remove()}
            disabled={loading || !hasKey}
            className="border-cinnabar-600/50 text-cinnabar-800 transition-[transform] duration-150 active:scale-[0.99]"
          >
            抹去当前选用
          </Button>
        </div>
        {msg && <p className="text-sm text-ink-800">{msg}</p>}
      </div>
    </FadeIn>
  );
}
