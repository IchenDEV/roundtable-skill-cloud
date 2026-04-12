import Link from "next/link";
import { listRoundtableSessions } from "@/lib/db/roundtable-sessions";
import { JiuxiListClient } from "@/components/roundtable/jiuxi-list-client";
import { FadeIn, InkReveal } from "@/components/motion-root";

export const dynamic = "force-dynamic";

export default async function JiuxiPage() {
  const r = await listRoundtableSessions();
  if (!r.ok) {
    if (r.reason === "unauthorized") {
      return (
        <FadeIn>
          <InkReveal>
            <header className="mb-6 pb-4 divider-b">
              <h1 className="font-serif text-2xl tracking-[0.2em] text-ink-900">旧席录</h1>
            </header>
            <p className="text-sm text-ink-700">
              查看旧席录须先
              <Link href="/login" className="mx-1 text-cinnabar-700 underline">
                登入
              </Link>
              。登入后完成的讨论会钤印入库。
            </p>
          </InkReveal>
        </FadeIn>
      );
    }
    if (r.reason === "no_db") {
      return <p className="text-sm text-ink-600">服务端未配置数据库，暂无旧席录。</p>;
    }
    return <p className="text-sm text-cinnabar-800">旧席录暂时不可读，请稍后再试。</p>;
  }

  return (
    <FadeIn>
      <InkReveal>
        <header className="mb-8 pb-6 divider-b">
          <h1 className="font-serif text-2xl tracking-[0.2em] text-ink-900">旧席录</h1>
          <p className="mt-2 text-sm text-ink-700">
            收录你已登入时钤印入库的圆桌：可展卷重温泳道与结案提要，或「回到此席」接着议。
          </p>
          <p className="mt-3 text-xs text-ink-600">
            <Link href="/roundtable" className="text-cinnabar-700 underline">
              返回开席
            </Link>
          </p>
        </header>
        <JiuxiListClient sessions={r.sessions} />
      </InkReveal>
    </FadeIn>
  );
}
