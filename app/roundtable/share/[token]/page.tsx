import Link from "next/link";
import { notFound } from "next/navigation";
import { SharePublicClient } from "@/components/roundtable/share-public-client";
import { FadeIn, InkReveal } from "@/components/motion-root";
import { fetchSharePayloadByToken } from "@/lib/db/share-snapshot";

export const dynamic = "force-dynamic";

export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const payload = await fetchSharePayloadByToken(token);
  if (!payload) notFound();

  return (
    <FadeIn>
      <InkReveal>
        <p className="mb-4 text-xs text-ink-600">
          <Link href="/roundtable" className="text-cinnabar-700 underline">
            圆桌
          </Link>
          <span className="mx-2 text-ink-400">·</span>
          <Link href="/roundtable/jiuxi" className="text-cinnabar-700 underline">
            旧席录
          </Link>
        </p>
        <SharePublicClient token={token} payload={payload} />
      </InkReveal>
    </FadeIn>
  );
}
