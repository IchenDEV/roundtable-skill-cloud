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
  textareaClassName?: string;
  submitClassName?: string;
  continueClassName?: string;
  sealClassName?: string;
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
  textareaClassName,
  submitClassName,
  continueClassName,
  sealClassName,
  onChange,
  onSubmit,
  onContinue,
  onSeal,
}: Props) {
  return (
    <section className={cn("rounded-2xl bg-card p-4 ring-ring lg:shrink-0", containerClassName)}>
      <h3 className="text-sm font-medium text-ink-900">{title}</h3>
      <p className="mt-1 text-xs text-ink-600">{description}</p>
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
      <div className="mt-2 flex flex-wrap gap-2 font-sans">
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
