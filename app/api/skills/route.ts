import { loadSkillManifest } from "@/lib/skills/load-manifest";

export const runtime = "nodejs";

export async function GET() {
  try {
    const m = loadSkillManifest();
    return Response.json({
      skills: m.skills.map((s) => ({
        skillId: s.skillId,
        name: s.name,
        description: s.description,
        contentHash: s.contentHash,
      })),
    });
  } catch {
    return Response.json({ skills: [], error: "manifest missing" }, { status: 500 });
  }
}
