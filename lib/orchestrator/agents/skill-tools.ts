import { tool } from "@langchain/core/tools";
import { z } from "zod";
import fs from "node:fs";
import path from "node:path";

/**
 * 将用户传入的相对路径解析到 skillDir 内，阻止路径穿越。
 * 仅在 skillDir 内部合法，否则抛错。
 */
function safePath(skillDir: string, relPath: string): string {
  const normalized = path.resolve(skillDir, relPath);
  if (normalized !== skillDir && !normalized.startsWith(skillDir + path.sep)) {
    throw new Error("路径越界：只允许访问本席 skill 目录");
  }
  return normalized;
}

/** 为单个 skill 目录创建沙箱内的只读文件工具 */
export function createSkillTools(skillDir: string) {
  const readFile = tool(
    ({ filePath }) => {
      const abs = safePath(skillDir, filePath);
      if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) {
        return `错误：文件不存在 — ${filePath}`;
      }
      return fs.readFileSync(abs, "utf8");
    },
    {
      name: "file_read",
      description: "读取当前 skill 目录下的文件。传入相对路径，如 SKILL.md 或 references/research/01-writings.md",
      schema: z.object({
        filePath: z.string().describe("相对于 skill 根目录的文件路径"),
      }),
    }
  );

  const listFiles = tool(
    ({ dirPath }) => {
      const abs = dirPath ? safePath(skillDir, dirPath) : skillDir;
      if (!fs.existsSync(abs) || !fs.statSync(abs).isDirectory()) {
        return `错误：目录不存在 — ${dirPath ?? "."}`;
      }
      const entries = fs.readdirSync(abs, { withFileTypes: true });
      return entries.map((e) => (e.isDirectory() ? `${e.name}/` : e.name)).join("\n");
    },
    {
      name: "list_files",
      description: "列出当前 skill 目录（或其子目录）下的文件与文件夹",
      schema: z.object({
        dirPath: z.string().optional().describe("相对子目录路径，不传则列出根目录"),
      }),
    }
  );

  return [readFile, listFiles] as const;
}
