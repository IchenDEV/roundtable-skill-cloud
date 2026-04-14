#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

// Two skill source directories — external skill source first, then local additions/overrides
const skillSourceDirs = [path.join(root, "skills-superman", "skills"), path.join(root, "skills")];

const categoriesFile = path.join(root, "skills", "categories.json");
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

function walkSkillDirs(sourceDir) {
  if (!fs.existsSync(sourceDir)) return [];
  const entries = fs.readdirSync(sourceDir, { withFileTypes: true });
  const dirs = entries.filter((e) => e.isDirectory()).map((e) => e.name);
  const result = [];
  for (const id of dirs) {
    const md = path.join(sourceDir, id, "SKILL.md");
    if (fs.existsSync(md)) result.push({ skillId: id, dir: path.join(sourceDir, id), file: md });
  }
  return result;
}

function buildCategoryMap() {
  if (!fs.existsSync(categoriesFile)) return {};
  const raw = JSON.parse(fs.readFileSync(categoriesFile, "utf8"));
  const map = {};
  for (const [cat, ids] of Object.entries(raw)) {
    for (const id of ids) {
      map[id] = cat;
    }
  }
  return map;
}

function firstNonEmptyLine(text) {
  return String(text)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean);
}

function deriveDisplayName({ skillId, rawName, description, content, data }) {
  const explicit = [data.display_name, data.displayName, data.label].find(
    (value) => typeof value === "string" && value.trim()
  );
  if (explicit) return explicit.trim();

  if (typeof rawName === "string" && rawName.trim() && rawName !== skillId) {
    return rawName.trim();
  }

  const intro = firstNonEmptyLine(description) ?? "";
  const introMatch = intro.match(/^(.+?)(?:（[^）]+）)?的思维框架与表达方式/);
  if (introMatch?.[1]?.trim()) return introMatch[1].trim();

  const heading = content.match(/^#\s+(.+)$/m)?.[1]?.trim();
  if (heading) {
    const title = heading.split(/\s+[·•｜|—-]\s+/)[0]?.trim();
    if (title) return title;
  }

  return skillId;
}

function deriveDisplayBrief({ description, data }) {
  const explicit = [data.display_brief, data.displayBrief, data.brief, data.summary].find(
    (value) => typeof value === "string" && value.trim()
  );
  if (explicit) return explicit.trim();

  const normalized = String(description).replace(/\r/g, "").trim();
  if (!normalized) return "";

  const usageMatch = normalized.match(/用途[：:]\s*([\s\S]*?)(?:\n(?:当用户|也适用于|即使|不在|适用场景)|$)/);
  let brief = usageMatch?.[1] ?? "";
  if (!brief) {
    const sentences = normalized
      .split(/[。！？]\s*/)
      .map((line) => line.trim())
      .filter(Boolean);
    brief = sentences[1] ?? sentences[0] ?? "";
  }

  brief = brief.replace(/\s+/g, " ").trim();
  brief = brief.replace(/^作为思维顾问，?/, "");
  brief = brief.replace(/[。；;，,]\s*$/, "");

  if (brief.length > 36) {
    const firstClause = brief.split(/[，；;]/)[0]?.trim();
    if (firstClause && firstClause.length >= 8) brief = firstClause;
  }

  return brief;
}

function main() {
  fs.mkdirSync(outDir, { recursive: true });

  const categoryMap = buildCategoryMap();

  // Collect all skills; if the same skillId appears in multiple dirs, the earlier source wins
  const seen = new Set();
  const skills = [];

  for (const sourceDir of skillSourceDirs) {
    const items = walkSkillDirs(sourceDir);
    for (const { skillId, dir, file } of items) {
      if (seen.has(skillId)) continue; // earlier source wins
      seen.add(skillId);

      const raw = fs.readFileSync(file, "utf8");
      const { data, content } = matter(raw);
      const contentHash = hashDir(dir);
      const name = typeof data.name === "string" ? data.name : skillId;
      const description = typeof data.description === "string" ? data.description : "";
      const displayName = deriveDisplayName({ skillId, rawName: name, description, content, data });
      const displayBrief = deriveDisplayBrief({ description, data });
      const category = categoryMap[skillId] ?? "其他";

      skills.push({
        skillId,
        name,
        description,
        displayName,
        displayBrief,
        contentHash,
        dirPath: path.relative(root, dir),
        entryPath: path.relative(root, file),
        category,
      });
    }
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    skills,
  };

  fs.writeFileSync(outFile, JSON.stringify(manifest, null, 2), "utf8");
  console.log(`Wrote ${skills.length} skills → ${path.relative(root, outFile)}`);
}

main();
