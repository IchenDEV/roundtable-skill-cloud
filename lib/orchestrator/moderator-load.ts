import fs from "node:fs";
import path from "node:path";

export function loadModeratorPrompt(): string {
  const p = path.join(process.cwd(), "content", "moderator.md");
  return fs.readFileSync(p, "utf8");
}

export function loadModeratorDebatePrompt(): string {
  const p = path.join(process.cwd(), "content", "moderator-debate.md");
  return fs.readFileSync(p, "utf8");
}
