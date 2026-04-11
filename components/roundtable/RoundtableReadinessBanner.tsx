"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { RoundtableReadiness } from "./use-roundtable-readiness";

const ctaPrimary = cn(
  buttonVariants({ size: "sm" }),
  "mt-3 inline-flex bg-ink-900 text-primary-foreground transition-[transform,box-shadow] duration-150 hover:bg-ink-800 active:scale-[0.99]"
);

export function RoundtableReadinessBanner({ readiness }: { readiness: RoundtableReadiness }) {
  if (readiness.kind === "loading") {
    return (
      <div className="mb-6 rounded-sm border border-ink-200/50 bg-paper-100/40 px-4 py-3 text-sm text-ink-600">
        正在确认你的登入与执笔是否就绪…
      </div>
    );
  }

  if (readiness.kind === "ready") return null;

  if (readiness.kind === "dev_local") {
    return (
      <div className="mb-6 border-l-2 border-gold-500 bg-paper-100/50 px-4 py-3 text-sm text-ink-700">
        当前为<strong className="text-ink-900">本地试墨</strong>：可直接开席。正式对外使用前，仍请先
        <Link href="/login" className="text-cinnabar-700 underline">
          登入
        </Link>
        并在
        <Link href="/settings" className="text-cinnabar-700 underline">
          砚台
        </Link>
        钤印。
      </div>
    );
  }

  if (readiness.kind === "no_backend") {
    return (
      <div className="mb-6 rounded-sm border border-cinnabar-600/40 bg-cinnabar-600/5 px-4 py-3 text-sm text-ink-800">
        <p className="font-medium text-cinnabar-800">本站尚未接通账户库，无法代你执笔。</p>
        <p className="mt-2 text-ink-700">
          请待维护者完成后台配置后刷新本页；在此之前，「开席」已暂时不可用，避免空跑。
        </p>
      </div>
    );
  }

  if (readiness.kind === "need_login") {
    return (
      <div className="mb-6 rounded-sm border border-cinnabar-600/40 bg-paper-100/80 px-4 py-3 text-sm text-ink-800">
        <p className="font-medium text-ink-900">请先登入，再开席。</p>
        <p className="mt-2 text-ink-700">
          圆桌需要认出是你本人，才能在砚台钤印、并为你保存讨论。未登入时强行开席只会半途停下。
        </p>
        <Link href="/login" className={ctaPrimary}>
          去登入
        </Link>
      </div>
    );
  }

  if (readiness.kind === "need_key") {
    return (
      <div className="mb-6 rounded-sm border border-cinnabar-600/40 bg-paper-100/80 px-4 py-3 text-sm text-ink-800">
        <p className="font-medium text-ink-900">请先在砚台钤印执笔授权。</p>
        <p className="mt-2 text-ink-700">你已登入，但尚未保存代笔所需的私人授权；未钤印前无法开席。</p>
        <Link href="/settings" className={ctaPrimary}>
          去砚台钤印
        </Link>
      </div>
    );
  }

  return null;
}
