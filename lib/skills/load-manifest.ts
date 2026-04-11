import "server-only";
import fs from "node:fs";
import path from "node:path";
import type { SkillManifest } from "./types";

let cached: SkillManifest | null = null;

export function loadSkillManifest(): SkillManifest {
  if (cached) return cached;
  const p = path.join(process.cwd(), ".generated", "skills-manifest.json");
  const raw = fs.readFileSync(p, "utf8");
  cached = JSON.parse(raw) as SkillManifest;
  return cached;
}

export { getSkillById } from "./lookup";
