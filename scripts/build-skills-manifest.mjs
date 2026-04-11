#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const skillsDir = path.join(root, "skills");
const outDir = path.join(root, ".generated");
const outFile = path.join(outDir, "skills-manifest.json");

const MAX_PROMPT_CHARS = 12000;

function hashContent(s) {
  return crypto.createHash("sha256").update(s, "utf8").digest("hex").slice(0, 16);
}

function walkSkillDirs() {
  if (!fs.existsSync(skillsDir)) return [];
  const entries = fs.readdirSync(skillsDir, { withFileTypes: true });
  const dirs = entries.filter((e) => e.isDirectory()).map((e) => e.name);
  const result = [];
  for (const id of dirs) {
    const md = path.join(skillsDir, id, "SKILL.md");
    if (fs.existsSync(md)) result.push({ skillId: id, file: md });
  }
  return result;
}

function compilePrompt(body) {
  const t = body.trim();
  if (t.length <= MAX_PROMPT_CHARS) return t;
  return `${t.slice(0, MAX_PROMPT_CHARS)}\n\n[…truncated for token budget…]`;
}

function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const items = walkSkillDirs();
  const skills = [];

  for (const { skillId, file } of items) {
    const raw = fs.readFileSync(file, "utf8");
    const { data, content } = matter(raw);
    const contentHash = hashContent(raw);
    const name = typeof data.name === "string" ? data.name : skillId;
    const description = typeof data.description === "string" ? data.description : "";
    skills.push({
      skillId,
      name,
      description,
      contentHash,
      compiledPrompt: compilePrompt(content),
      rawPath: path.relative(root, file),
    });
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    skills,
  };

  fs.writeFileSync(outFile, JSON.stringify(manifest, null, 2), "utf8");
  console.log(`Wrote ${skills.length} skills → ${path.relative(root, outFile)}`);
}

main();
