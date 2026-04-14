import { loadSkillManifest } from "@/lib/skills/load-manifest";
import { toSkillSummaries } from "@/lib/skills/presentable-skills";

export const runtime = "nodejs";

export async function GET() {
  try {
    const skills = toSkillSummaries(loadSkillManifest());
    return Response.json({
      skills,
    });
  } catch {
    return Response.json({ skills: [], error: "manifest missing" }, { status: 500 });
  }
}
