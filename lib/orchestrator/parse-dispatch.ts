import { MAX_DEBATE_TURNS_FACTOR } from "../spec/constants";
import type { DebateAction } from "../spec/schema";

type DispatchStep = {
  skillId: string;
  action?: DebateAction;
  target?: string;
  directive?: string;
};

/**
 * 从主持开场全文中解析 ```json:dispatch ... ``` 调度指令。
 * 解析失败时返回 null（调用方应 fallback 为默认顺序）。
 */
export function parseDispatchBlock(text: string, validSkillIds: string[]): DispatchStep[] | null {
  const re = /```json:dispatch\s*\n([\s\S]*?)```/;
  const m = re.exec(text);
  if (!m?.[1]) return null;

  let raw: unknown;
  try {
    raw = JSON.parse(m[1].trim());
  } catch {
    return null;
  }

  if (!Array.isArray(raw) || raw.length === 0) return null;

  const cap = validSkillIds.length * MAX_DEBATE_TURNS_FACTOR;
  const steps: DispatchStep[] = [];

  for (const item of raw) {
    if (steps.length >= cap) break;
    if (typeof item !== "object" || item === null) continue;
    const obj = item as Record<string, unknown>;
    const skillId = typeof obj.skillId === "string" ? obj.skillId.trim() : "";
    if (!skillId || !validSkillIds.includes(skillId)) continue;

    if (
      steps.length >= 2 &&
      steps[steps.length - 1]!.skillId === skillId &&
      steps[steps.length - 2]!.skillId === skillId
    ) {
      continue;
    }

    steps.push({
      action: obj.action === "attack" || obj.action === "defend" || obj.action === "judge" ? obj.action : undefined,
      skillId,
      target:
        typeof obj.target === "string" && validSkillIds.includes(obj.target.trim()) ? obj.target.trim() : undefined,
      directive: typeof obj.directive === "string" ? obj.directive.trim() || undefined : undefined,
    });
  }

  return steps.length > 0 ? steps : null;
}

/** 当调度解析失败时，按原始列席顺序生成默认调度 */
export function defaultDispatch(skillIds: string[]): DispatchStep[] {
  return skillIds.map((skillId) => ({ skillId }));
}

/** 辩论兜底：相邻两席互相质询，并在每组攻防后补一记主持判词。 */
export function defaultDebateDispatch(skillIds: string[]): DispatchStep[] {
  if (skillIds.length < 2) return skillIds.map((skillId) => ({ skillId }));
  const cap = skillIds.length * MAX_DEBATE_TURNS_FACTOR;
  const steps: DispatchStep[] = [];

  for (let i = 0; i < skillIds.length; i += 1) {
    const attacker = skillIds[i];
    const defender = skillIds[(i + 1) % skillIds.length];
    if (!attacker || !defender) continue;
    if (steps.length + 3 > cap) break;

    steps.push({
      action: "attack",
      skillId: attacker,
      target: defender,
      directive: "只打一处最要命的漏洞，不准铺陈立场。",
    });
    steps.push({
      action: "defend",
      skillId: defender,
      target: attacker,
      directive: "先正面回答，再补一记反击，不准绕开。",
    });
    steps.push({
      action: "judge",
      skillId: attacker,
      target: defender,
      directive: "指出谁答偏了，下一手该继续追哪一点。",
    });
  }

  return steps;
}
