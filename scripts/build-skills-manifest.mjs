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

function hashDir(dirPath) {
  const h = crypto.createHash("sha256");
  const files = [];
  (function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, e.name);
      if (e.isDirectory()) walk(full);
      else files.push(full);
    }
  })(dirPath);
  files.sort();
  for (const f of files) h.update(fs.readFileSync(f));
  return h.digest("hex").slice(0, 16);
}

function walkSkillDirs() {
  if (!fs.existsSync(skillsDir)) return [];
  const entries = fs.readdirSync(skillsDir, { withFileTypes: true });
  const dirs = entries.filter((e) => e.isDirectory()).map((e) => e.name);
  const result = [];
  for (const id of dirs) {
    const md = path.join(skillsDir, id, "SKILL.md");
    if (fs.existsSync(md)) result.push({ skillId: id, dir: path.join(skillsDir, id), file: md });
  }
  return result;
}

function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const items = walkSkillDirs();
  const skills = [];

  for (const { skillId, dir, file } of items) {
    const raw = fs.readFileSync(file, "utf8");
    const { data } = matter(raw);
    const contentHash = hashDir(dir);
    const name = typeof data.name === "string" ? data.name : skillId;
    const description = typeof data.description === "string" ? data.description : "";
    skills.push({
      skillId,
      name,
      description,
      contentHash,
      dirPath: path.relative(root, dir),
      entryPath: path.relative(root, file),
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
