import Link from "next/link";
import { FadeIn } from "./MotionRoot";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NavUser } from "./NavUser";
import { cn } from "@/lib/utils";

const navClass =
  "text-sm text-ink-700 transition-[color,transform] duration-150 hover:text-cinnabar-700 active:scale-[0.98]";

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
      <nav className="border-b border-ink-200/40 bg-paper-50/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link
            href="/"
            className="font-serif text-lg tracking-widest text-ink-900 transition-opacity duration-150 hover:opacity-80"
          >
            圆桌
          </Link>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/" className={navClass}>
              序
            </Link>
            <Link href="/roundtable" className={navClass}>
              圆桌
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
                  "rounded-md border border-ink-200/60 bg-paper-50 px-3 py-1.5 hover:border-gold-500/60"
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
