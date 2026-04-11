import { describe, expect, it, beforeAll, afterAll } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { createSkillTools } from "@/lib/orchestrator/agents/skill-tools";

describe("createSkillTools", () => {
  let tmpDir: string;

  beforeAll(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "skill-tools-test-"));
    fs.writeFileSync(path.join(tmpDir, "SKILL.md"), "# Test Skill\nHello");
    fs.mkdirSync(path.join(tmpDir, "references"), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, "references", "note.md"), "ref content");
  });

  afterAll(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("read_file reads a file inside skill dir", async () => {
    const [readFile] = createSkillTools(tmpDir);
    const result = await readFile.invoke({ filePath: "SKILL.md" });
    expect(result).toContain("# Test Skill");
  });

  it("read_file reads nested files", async () => {
    const [readFile] = createSkillTools(tmpDir);
    const result = await readFile.invoke({ filePath: "references/note.md" });
    expect(result).toBe("ref content");
  });

  it("read_file returns error for missing file", async () => {
    const [readFile] = createSkillTools(tmpDir);
    const result = await readFile.invoke({ filePath: "nonexistent.md" });
    expect(result).toContain("错误");
  });

  it("read_file blocks path traversal", async () => {
    const [readFile] = createSkillTools(tmpDir);
    await expect(readFile.invoke({ filePath: "../../etc/passwd" })).rejects.toThrow("路径越界");
  });

  it("list_files lists root directory", async () => {
    const [, listFiles] = createSkillTools(tmpDir);
    const result = await listFiles.invoke({});
    expect(result).toContain("SKILL.md");
    expect(result).toContain("references/");
  });

  it("list_files lists subdirectory", async () => {
    const [, listFiles] = createSkillTools(tmpDir);
    const result = await listFiles.invoke({ dirPath: "references" });
    expect(result).toContain("note.md");
  });

  it("list_files returns error for missing dir", async () => {
    const [, listFiles] = createSkillTools(tmpDir);
    const result = await listFiles.invoke({ dirPath: "nope" });
    expect(result).toContain("错误");
  });
});
