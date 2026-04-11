# 辩论模式（交叉质询）设计规格

> 日期：2026-04-06
> 状态：待实施

## 一、产品概述

在现有「讨论」模式基础上新增「辩论」模式。辩论模式的核心区别：

- **主持动态调度**：主持开场后输出结构化调度指令，决定本轮谁先发言、谁质询谁、是否让同一席再次上场。
- **强制交叉回应**：每位列席发言前必须先点名反驳指定对象的核心论点，再表达自己的立场。
- **主持点评锋利度**：收束时主持指出最弱论证并要求下轮补强。
- **安全上限**：单轮发言总次数 ≤ 2N（N = 列席数），触顶自动进入主持收束。

## 二、用户交互

### 2.1 开席时选择模式

在议题输入区旁增加模式切换控件：

```
[ 讨论 | 辩论 ]   ← 互斥切换，默认「讨论」
```

开席后 `mode` 写入 `RoundtableState`，整局有效。

### 2.2 轮间切换

`await_user` 阶段新增「切换模式」按钮。点击后切换 `state.mode`，下一轮按新模式运行。无需重新开席。

### 2.3 其余交互不变

席上插话、再续一轮、钤印结案、抄录/下载、分享 — 均与讨论模式行为一致。

## 三、Schema 变更

### 3.1 `RoundtableState`

```typescript
mode: z.enum(["discussion", "debate"]).default("discussion");
```

新增可选字段，默认 `"discussion"`。已有会话若无此字段视为讨论模式。

### 3.2 常量

```typescript
export const MAX_DEBATE_TURNS_FACTOR = 2; // 单轮发言上限 = N × 此系数
```

### 3.3 `StreamEvent` / `TranscriptEntry`

不变。辩论模式复用现有的 `role: "speaker"` / `"moderator"` 结构。

## 四、主持调度指令格式

辩论模式主持开场结尾必须输出 JSON 调度块：

````
...（开场正文）...

```json:dispatch
[
  { "skillId": "sage-perspective", "target": "legalist-perspective", "directive": "反驳其关于法治优先性的论点" },
  { "skillId": "legalist-perspective", "target": "sage-perspective", "directive": "回应质疑并从制度视角反驳" },
  { "skillId": "sage-perspective", "directive": "最终回应" }
]
```　
````

### 解析规则（`parse-dispatch.ts`）

1. 从主持开场全文中匹配 `json:dispatch ... ` 代码块。
2. 解析为 `DispatchStep[]`：

```typescript
type DispatchStep = {
  skillId: string; // 哪个席位发言
  target?: string; // 质询对象 skillId（可选）
  directive?: string; // 质询/发言方向提示（可选）
};
```

1. **校验**：

- 所有 `skillId` 必须在 `participantSkillIds` 中存在。
- 总步骤数 ≤ 2N。超出部分截断。
- 不允许连续相同 skillId 超过 2 次。

2. **Fallback**：解析失败时按 `participantSkillIds` 原始顺序执行（每席一次），等同讨论模式行为，但保留辩论版 participant prompt。

## 五、编排流程

### 5.1 `run-roundtable-debate.ts`

```
async function* runRoundtableDebate(params): AsyncGenerator<StreamEvent, RoundtableState>
```

**流程**：

```
1. 判断 stop/maxRounds → 走 synthesis（与讨论共用）
2. 加载辩论版主持 prompt（content/moderator-debate.md）
3. resolveLlm()
4. 主持辩论开场
   - system: 辩论版主持 prompt
   - user: 议题 + 列席 + 前文记录 + 要求输出调度指令
5. 解析调度指令 → DispatchStep[]
6. 按调度序逐一调用列席
   - 每步构建 debate participant prompt：
     "你须先回应【{target}】关于「{directive}」的论点，
      指出其逻辑漏洞或事实错误，然后阐述你的立场。末行简言之。"
   - 若无 target，prompt 为：
     "请就 {directive || 当前争点} 发表你的独立论述。末行简言之。"
   - 每步后将发言追加到 transcript
   - cap 计数，触顶则 break
7. 主持辩论收束
   - "本轮交锋已毕。请：
      1）指出论证最薄弱的一席及其逻辑漏洞；
      2）给主持人记忆一段话；
      3）提出下轮引导问题。"
8. summarizeModeratorMemory
9. state.round++, phase → await_user
10. yield round_complete, done
```

### 5.2 共享逻辑提取（`shared-phases.ts`）

从 `run-roundtable-graph.ts` 提取 synthesis 路径为独立函数：

```typescript
export async function* runSynthesisPhase(
  runtime, model, modPrompt, state
): AsyncGenerator<StreamEvent, RoundtableState>
```

讨论图和辩论图共用此函数。

### 5.3 `orchestrator/index.ts`

```typescript
export async function* runRoundtableStream(params) {
  if (params.state.mode === "debate") {
    return yield* runRoundtableDebate(params);
  }
  return yield* runRoundtableGraph(params);
}
```

## 六、Prompt 文件

### 6.1 `content/moderator-debate.md`

````markdown
# 圆桌辩论主持人

你是严厉、追求论证质量的辩论主持人。职责：

1. 开场锚定议题与当前核心争点。
2. 分析各席立场后，输出本轮**调度指令**（JSON 格式，见下）决定发言顺序与质询对象。
3. 你可以让同一席发言多次（如先质询、后回应反驳），但总发言次数不超过列席数的两倍。
4. 收束时指出**论证最薄弱的一席**及其逻辑漏洞，给主持人记忆一段话，提出下轮引导问题。
5. 用户选择结束时，输出合成稿：正反论点清单 / 最强论证 / 最弱论证 / 未决争点 / 结论。

调度指令格式（放在开场正文末尾）：

\```json:dispatch
[
{ "skillId": "<列席ID>", "target": "<质询对象ID>", "directive": "质询方向" },
...
]
\```

结构说明：与讨论模式相同 — 每位列席独立代理，只加载本席 Skill。
记录里标为「席上你我」的是真人用户插话，必须显式纳入推进。

语气：严厉、尖锐、追问到底。
````

### 6.2 辩论版 participant prompt

在 `participant-agent.ts` 中新增：

```typescript
export function buildDebateParticipantPrompt(skill: SkillRow, formattedTranscript: string, step: DispatchStep): string;
```

与现有 `buildParticipantSystemPrompt` 类似，额外注入质询指令。

## 七、UI 变更

### 7.1 `RoundtableClient.tsx`

1. **模式选择控件**（开席前）：

- 在「最多几轮」旁增加讨论/辩论切换按钮组
- 写入 `emptyState` 的 `mode` 字段

2. **轮间切换**（`await_user` 阶段）：

- 在席上插话区上方显示当前模式，旁附「切换为辩论/讨论」按钮
- 点击修改 `state.mode`

3. **视觉区分**：

- 辩论模式下 header 副标题变为「交叉质询 · 每席须先反驳再立论」
- 可选：泳道卡片边框在辩论模式用不同主题色（如 cinnabar 加深）

### 7.2 泳道（SwimLanes）

不需要改造。辩论模式的 transcript 结构与讨论模式一致（role/skillId/content），泳道原样渲染。

## 八、测试计划

| 测试文件                        | 覆盖                                                           |
| ------------------------------- | -------------------------------------------------------------- |
| `parse-dispatch.test.ts`        | 正常解析、缺字段、非法 skillId、超 cap 截断、解析失败 fallback |
| `run-roundtable-debate.test.ts` | 正常一轮、synthesis 路径、cap 触顶、fallback 路径、未知 skill  |
| `shared-phases.test.ts`         | synthesis 共用逻辑                                             |
| `participant-agent.test.ts`     | 新增 `buildDebateParticipantPrompt` 用例                       |
| `moderator-agent.test.ts`       | 新增辩论版 opening/wrap 用例                                   |
| `schema.test.ts`                | mode 字段校验、默认值                                          |

## 九、不做的事

- 不做打分/淘汰制
- 不做正方/反方阵营划分
- 不做并行发言（仍逐一串行调用）
- 不改持久化/分享结构（mode 自然随 state 入库和快照）
- 不改 API route 签名（mode 在 state 内，无需新字段）

## 十、文件清单

| 操作 | 文件                                                               |
| ---- | ------------------------------------------------------------------ |
| 新建 | `lib/orchestrator/run-roundtable-debate.ts`                        |
| 新建 | `lib/orchestrator/parse-dispatch.ts`                               |
| 新建 | `lib/orchestrator/shared-phases.ts`                                |
| 新建 | `content/moderator-debate.md`                                      |
| 新建 | `tests/unit/parse-dispatch.test.ts`                                |
| 新建 | `tests/unit/run-roundtable-debate.test.ts`                         |
| 新建 | `tests/unit/shared-phases.test.ts`                                 |
| 修改 | `lib/spec/schema.ts` — 加 mode 字段                                |
| 修改 | `lib/spec/constants.ts` — 加 MAX_DEBATE_TURNS_FACTOR               |
| 修改 | `lib/orchestrator/index.ts` — mode 分发                            |
| 修改 | `lib/orchestrator/run-roundtable-graph.ts` — 提取 synthesis        |
| 修改 | `lib/orchestrator/agents/participant-agent.ts` — debate prompt     |
| 修改 | `lib/orchestrator/agents/moderator-agent.ts` — debate opening/wrap |
| 修改 | `lib/orchestrator/moderator-load.ts` — 加载辩论版 prompt           |
| 修改 | `app/roundtable/RoundtableClient.tsx` — 模式选择 UI                |
| 修改 | `tests/unit/participant-agent.test.ts`                             |
| 修改 | `tests/unit/moderator-agent.test.ts`                               |
| 修改 | `tests/unit/schema.test.ts`                                        |
