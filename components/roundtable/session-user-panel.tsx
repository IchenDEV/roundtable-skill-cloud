"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  title: string;
  description: string;
  placeholder: string;
  submitLabel: string;
  continueLabel: string;
  sealLabel: string;
  containerClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  textareaClassName?: string;
  submitClassName?: string;
  continueClassName?: string;
  sealClassName?: string;
  actionsClassName?: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onContinue: () => void;
  onSeal: () => void;
};

export function SessionUserPanel({
  value,
  title,
  description,
  placeholder,
  submitLabel,
  continueLabel,
  sealLabel,
  containerClassName,
  titleClassName,
  descriptionClassName,
  textareaClassName,
  submitClassName,
  continueClassName,
  sealClassName,
  actionsClassName,
  onChange,
  onSubmit,
  onContinue,
  onSeal,
}: Props) {
  // 允许场景页只覆盖文案块与按钮层的样式，保持面板结构与交互逻辑仍由这里统一维护。
  return (
    <section className={cn("rounded-2xl bg-card p-4 ring-ring lg:shrink-0", containerClassName)}>
      <h3 className={cn("text-sm font-medium text-ink-900", titleClassName)}>{title}</h3>
      <p className={cn("mt-1 text-xs text-ink-600", descriptionClassName)}>{description}</p>
      <textarea
        value={value}
        rows={2}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "mt-2 w-full rounded-xl border border-ink-200/60 bg-paper-50 px-3 py-2 text-sm text-ink-900 outline-none focus:ring-1 focus:ring-gold-500",
          textareaClassName
        )}
      />
      <div className={cn("mt-2 flex flex-wrap gap-2 font-sans", actionsClassName)}>
        <Button
          type="button"
          onClick={onSubmit}
          disabled={!value.trim()}
          className={cn(
            "rounded-xl bg-cinnabar-600 text-card hover:bg-cinnabar-700 active:scale-[0.99]",
            submitClassName
          )}
        >
          {submitLabel}
        </Button>
        <Button type="button" variant="outline" onClick={onContinue} className={cn("rounded-xl", continueClassName)}>
          {continueLabel}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onSeal}
          className={cn("rounded-xl border-cinnabar-600/60 text-cinnabar-800 hover:bg-cinnabar-600/10", sealClassName)}
        >
          {sealLabel}
        </Button>
      </div>
    </section>
  );
}
