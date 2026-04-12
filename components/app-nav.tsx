import Link from "next/link";
import { FadeIn } from "./motion-root";
import { InkMark } from "@/components/brand/ink-mark";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NavUser } from "./nav-user";
import { cn } from "@/lib/utils";

const navClass =
  "text-sm text-ink-700 transition-[color,transform] duration-150 hover:text-cinnabar-600 active:scale-[0.98]";

export async function AppNav() {
  const supabase = await createSupabaseServerClient();
  let email: string | null = null;
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    email = user?.email ?? null;
  }

  return (
    <FadeIn>
      <nav className="divider-b bg-paper-50/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3.5">
          <Link
            href="/"
            className="flex items-center gap-2.5 font-serif text-lg tracking-widest text-ink-900 transition-opacity duration-150 hover:opacity-80"
          >
            <InkMark className="size-9 text-ink-800" />
            <span>圆桌</span>
          </Link>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/" className={navClass}>
              序
            </Link>
            <Link href="/roundtable" className={navClass}>
              圆桌
            </Link>
            <Link href="/court" className={navClass}>
              公堂
            </Link>
            <Link href="/roundtable/jiuxi" className={navClass}>
              旧席录
            </Link>
            <Link href="/settings" className={navClass}>
              砚台
            </Link>
            {email ? (
              <NavUser email={email} />
            ) : (
              <Link
                href="/login"
                className={cn(
                  navClass,
                  "rounded-lg ring-warm bg-paper-50 px-3 py-1.5 hover:shadow-[0px_0px_0px_1px_var(--color-terracotta-500)]"
                )}
              >
                登入
              </Link>
            )}
          </div>
        </div>
      </nav>
    </FadeIn>
  );
}
