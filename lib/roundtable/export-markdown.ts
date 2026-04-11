import type { RoundtableState, TranscriptEntry } from "@/lib/spec/schema";

export function buildRoundtableMarkdown(
  state: Pick<RoundtableState, "topic" | "transcript" | "synthesis">,
  skillTitle: (skillId: string | undefined) => string
): string {
  const lines = state.transcript.map((t: TranscriptEntry) => {
    const h = t.role === "moderator" ? "## 主持" : t.role === "user" ? "## 席上（我）" : `## ${skillTitle(t.skillId)}`;
    return `${h}\n\n${t.content}\n`;
  });
  const syn = state.synthesis ? `\n## 结案提要\n\n${state.synthesis}\n` : "";
  return `# 圆桌：${state.topic}\n\n${lines.join("\n")}${syn}`;
}

export function markdownFilename(topic: string): string {
  const slug =
    topic
      .trim()
      .slice(0, 48)
      .replace(/[/\\?%*:|"<>.\s]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "圆桌";
  return `圆桌-${slug}.md`;
}

/** 浏览器触发下载 UTF-8 Markdown */
export function triggerMarkdownDownload(topic: string, body: string): void {
  const blob = new Blob([body], { type: "text/markdown;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = markdownFilename(topic);
  a.click();
  URL.revokeObjectURL(a.href);
}
