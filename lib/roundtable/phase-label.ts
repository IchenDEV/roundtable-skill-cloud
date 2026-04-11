/** 圆桌阶段在界面上的文言 */
export function phaseInWords(phase: string): string {
  const m: Record<string, string> = {
    idle: "静候",
    running: "正在铺陈",
    await_user: "候你一言",
    synthesis: "收束定论",
    done: "已毕",
    error: "有所滞碍",
  };
  return m[phase] ?? "进行中";
}
