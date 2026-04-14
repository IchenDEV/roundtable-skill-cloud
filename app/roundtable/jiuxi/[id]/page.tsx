import Link from "next/link";
import { notFound } from "next/navigation";
import { JiuxiDetailView } from "@/components/roundtable/jiuxi-detail-view";
import { FadeIn, InkReveal } from "@/components/motion-root";
import { getRoundtableSessionState } from "@/lib/db/roundtable-sessions";
import { loadSkillManifest } from "@/lib/skills/load-manifest";
import { toSkillSummaries } from "@/lib/skills/presentable-skills";
import { asServerUserContext, buildServerRequestContext } from "@/lib/server/request-context";

export const dynamic = "force-dynamic";

export default async function JiuxiDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await buildServerRequestContext();
  if (!ctx.supabase) {
    return (
      <p className="text-sm text-ink-600">
        服务端未配置数据库，无法展卷。
        <Link href="/roundtable" className="ml-2 text-cinnabar-700 underline">
          返回圆桌
        </Link>
      </p>
    );
  }
  if (!ctx.userId) {
    return (
      <FadeIn>
        <InkReveal>
          <p className="text-sm text-ink-700">
            展卷须先
            <Link href="/login" className="mx-1 text-cinnabar-700 underline">
              登入
            </Link>
            。
          </p>
        </InkReveal>
      </FadeIn>
    );
  }

  const state = await getRoundtableSessionState(asServerUserContext(ctx)!, id);
  if (!state) notFound();

  let skills: { skillId: string; name: string; description: string }[] = [];
  try {
    skills = toSkillSummaries(loadSkillManifest());
  } catch {
    skills = [];
  }

  return (
    <FadeIn>
      <InkReveal>
        <JiuxiDetailView state={state} skills={skills} />
      </InkReveal>
    </FadeIn>
  );
}
