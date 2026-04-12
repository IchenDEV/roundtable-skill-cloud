import Link from "next/link";
import { InkMark, InkRipple } from "@/components/brand/ink-mark";

const footLink = "text-xs text-ink-600 transition-colors hover:text-cinnabar-600";

export function AppFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="relative mt-auto divider-t bg-paper-50/85 backdrop-blur-[2px]">
      <InkRipple className="h-5 text-ink-900 opacity-90" />
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-3">
            <InkMark className="size-11 text-ink-800" />
            <div>
              <p className="font-serif text-base tracking-[0.2em] text-ink-900">圆桌</p>
              <p className="mt-1 max-w-xs text-xs leading-relaxed text-ink-600">
                主持控场，多席异见，钤印收束。纸墨为席，不代持你的执笔。
              </p>
            </div>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 font-sans" aria-label="页脚导航">
            <Link href="/" className={footLink}>
              序
            </Link>
            <Link href="/roundtable" className={footLink}>
              圆桌
            </Link>
            <Link href="/roundtable/jiuxi" className={footLink}>
              旧席录
            </Link>
            <Link href="/settings" className={footLink}>
              砚台
            </Link>
            <Link href="/credits" className={footLink}>
              致谢
            </Link>
          </nav>
        </div>
        <p className="mt-8 border-t border-ink-400/25 pt-4 text-center font-sans text-[11px] text-ink-600">
          © {year} 圆桌 · 水墨底纹为饰，论理为本
        </p>
      </div>
    </footer>
  );
}
