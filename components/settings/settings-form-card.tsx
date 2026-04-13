"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BYOK_PROVIDERS, PROVIDER_LABEL, type ByokProvider } from "@/lib/spec/constants";

type Props = {
  provider: ByokProvider;
  keyValue: string;
  apiBaseUrl: string;
  defaultModel: string;
  label: string;
  loading: boolean;
  hasKey: boolean;
  baseHint: string;
  showBaseField: boolean;
  message: string | null;
  onProviderChange: (value: ByokProvider) => void;
  onKeyChange: (value: string) => void;
  onApiBaseUrlChange: (value: string) => void;
  onDefaultModelChange: (value: string) => void;
  onLabelChange: (value: string) => void;
  onSave: () => void;
  onRemove: () => void;
};

export function SettingsFormCard({
  provider,
  keyValue,
  apiBaseUrl,
  defaultModel,
  label,
  loading,
  hasKey,
  baseHint,
  showBaseField,
  message,
  onProviderChange,
  onKeyChange,
  onApiBaseUrlChange,
  onDefaultModelChange,
  onLabelChange,
  onSave,
  onRemove,
}: Props) {
  return (
    <div className="max-w-lg space-y-4 rounded-2xl bg-card p-6 font-sans card-elevated">
      <div className="space-y-2">
        <Label>选用笔会</Label>
        <Select value={provider} onValueChange={(value) => onProviderChange(value as ByokProvider)} disabled={loading}>
          <SelectTrigger className="w-full rounded-xl bg-paper-50/80">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {BYOK_PROVIDERS.map((entry) => (
              <SelectItem key={entry} value={entry}>
                {PROVIDER_LABEL[entry]}
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
          value={keyValue}
          autoComplete="off"
          placeholder="粘贴授权码"
          onChange={(event) => onKeyChange(event.target.value)}
          className="rounded-xl bg-paper-50/80"
        />
      </div>
      {showBaseField ? (
        <div className="space-y-2">
          <Label htmlFor="byok-base">接口根地址（可空，则用笔会默认）</Label>
          <Input
            id="byok-base"
            value={apiBaseUrl}
            placeholder={baseHint || "https://…"}
            onChange={(event) => onApiBaseUrlChange(event.target.value)}
            className="rounded-xl bg-paper-50/80 font-mono text-xs"
          />
          {baseHint ? (
            <span className="block text-xs text-ink-500">默认：{baseHint}</span>
          ) : (
            <span className="block text-xs text-cinnabar-700">
              此笔会须自行填写完整根地址（通常以 /v1 或厂商文档为准）。
            </span>
          )}
        </div>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="byok-model">默认模型名（可空）</Label>
        <Input
          id="byok-model"
          value={defaultModel}
          onChange={(event) => onDefaultModelChange(event.target.value)}
          placeholder={provider === "anthropic" ? "如 claude-sonnet-4-20250514" : "如 gpt-4o-mini"}
          className="rounded-xl bg-paper-50/80"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="byok-label">备注（可选）</Label>
        <Input
          id="byok-label"
          value={label}
          onChange={(event) => onLabelChange(event.target.value)}
          className="rounded-xl bg-paper-50/80"
        />
      </div>
      <div className="flex flex-wrap gap-3 pt-1">
        <Button
          type="button"
          onClick={onSave}
          disabled={loading || !keyValue.trim()}
          className="rounded-xl bg-cinnabar-600 text-primary-foreground transition-[transform,box-shadow] duration-150 hover:bg-cinnabar-700 active:scale-[0.99] disabled:active:scale-100"
        >
          {loading ? "保存中…" : "保存"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onRemove}
          disabled={loading || !hasKey}
          className="rounded-xl border-cinnabar-600/50 text-cinnabar-800 transition-[transform] duration-150 active:scale-[0.99]"
        >
          抹去当前选用
        </Button>
      </div>
      {message ? <p className="text-sm text-ink-800">{message}</p> : null}
    </div>
  );
}
