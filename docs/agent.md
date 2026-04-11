# 圆桌 Agent 调度架构文档

> 本文档完整描述「圆桌 Skill 云」中各 Agent 的角色、调度流程与交互协议。

---

## 一、系统总览

圆桌系统是一个**多 Agent 实时协作平台**——围绕一个议题，由一位「主持人 Agent」编排多位「列席 Agent」进行多轮讨论或辩论，用户可在每轮间隙插话干预。

### 核心角色

| 角色                       | 数量 | 实现                        | 职责                                         |
| -------------------------- | ---- | --------------------------- | -------------------------------------------- |
| **主持人 (Moderator)**     | 1    | `moderator-agent.ts`        | 开场锚定议题、引导发言、轮末收束、合成结案   |
| **列席代理 (Participant)** | 1–24 | `participant-agent.ts`      | 各自加载独立 Skill，以该人物第一人称视角发言 |
| **用户 (User)**            | 1    | 前端 `RoundtableClient.tsx` | 发起议题、选席、每轮插话、决定继续/终止      |

### 两种运行模式

| 模式                  | 主持 Prompt                   | 列席调度方式                                          |
| --------------------- | ----------------------------- | ----------------------------------------------------- |
| **讨论 (discussion)** | `content/moderator.md`        | 固定顺序：按 `participantSkillIds` 数组依次发言       |
| **辩论 (debate)**     | `content/moderator-debate.md` | 动态调度：主持输出 `json:dispatch` 指令，编排交叉质询 |

---

## 二、Per-Turn 架构

系统采用**每步一个 SSE**的架构——每次 API 调用只跑一个 Agent 的一次发言，由客户端按序编排。

```
┌───────────────────────────────────────────────────────────┐
│                    客户端 (Browser)                        │
│  RoundtableClient.tsx                                     │
│  └── use-roundtable-orchestrator.ts（客户端编排）          │
│       按 moderator_open → participant[0..N] → moderator_  │
│       wrap 的顺序，依次 POST /api/roundtable/turn         │
└─────────────────────────────┬─────────────────────────────┘
                              │ 每步一个 SSE
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                POST /api/roundtable/turn (Node.js, 120s)        │
│  ├── 鉴权 (Supabase Auth / DEV bypass)                          │
│  ├── 限流 (rate-limit-stream.ts: 并发 1 + 窗口 24/min)          │
│  ├── resolveLlm() → { runtime, model }                         │
│  ├── loadSkillManifest()                                        │
│  └── runSingleTurn(request) → SSE 流式推送                      │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│           run-single-turn.ts（单步执行器）                       │
│                                                                 │
│  step === "moderator_open"  → streamModeratorTurn               │
│  step === "participant"     → streamParticipantTurn (ReAct)     │
│  step === "moderator_wrap"  → streamModeratorTurn + memory      │
│  step === "synthesis"       → streamModeratorSynthesis           │
└─────────────────────────────┬───────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
     ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
     │  Moderator   │ │ Participant  │ │ Participant  │
     │  Agent       │ │ Agent (A)    │ │ Agent (B)    │  ...
     │              │ │              │ │              │
     │ streamChat() │ │ ReAct Agent  │ │ ReAct Agent  │
     │ 无工具       │ │ + skill-tools│ │ + skill-tools│
     └──────────────┘ └──────────────┘ └──────────────┘
```

### Per-Turn 的优势

| 旧架构（单 SSE 贯穿整轮）            | 新架构（每步一个 SSE）       |
| ------------------------------------ | ---------------------------- |
| 整轮超时窗口 300s，列席多易超时      | 每步仅需 ~60s，120s 余量充裕 |
| 流不断 / ReAct agent 挂起 → 整轮卡死 | 单步挂起只丢一席，可重试     |
| 客户端难以精确感知当前发言者         | 客户端精确控制每步的 UI 状态 |

---

## 三、Turn Request / Response 协议

### 请求 (`POST /api/roundtable/turn`)

```typescript
{
  state: RoundtableState,
  step: "moderator_open" | "participant" | "moderator_wrap" | "synthesis",
  skillId?: string,    // participant 步骤必填
  target?: string,     // 辩论模式：质询对象
  directive?: string,  // 辩论模式：发言方向
}
```

### SSE 响应事件 (`TurnResponseEvent`)

| 事件类型             | 字段                           | 说明               | 出现步骤                   |
| -------------------- | ------------------------------ | ------------------ | -------------------------- |
| `token`              | `role`, `skillId?`, `text`     | 流式 token 片段    | 所有                       |
| `turn_complete`      | `role`, `skillId?`, `fullText` | 单次发言完成       | 所有                       |
| `dispatch`           | `steps[]`                      | 辩论调度指令       | `moderator_open`（仅辩论） |
| `memory`             | `text`                         | 压缩后的主持人记忆 | `moderator_wrap`           |
| `synthesis_complete` | `text`                         | 合成稿完成         | `synthesis`                |
| `error`              | `message`                      | 错误               | 任意                       |
| `done`               | —                              | 本步结束           | 所有                       |

### 持久化 (`POST /api/roundtable/persist`)

轮次完成后客户端调用，非流式 JSON：

```typescript
{ state: RoundtableState }  →  { ok: true }
```

---

## 四、客户端编排流程

### 4.1 讨论模式（一轮）

```
客户端 use-roundtable-orchestrator.ts
  │
  ├── POST /turn { step: "moderator_open", state }
  │   ← tokens... → turn_complete(moderator, fullText)
  │   客户端追加 transcript + 更新 UI
  │
  ├── POST /turn { step: "participant", state, skillId: A }
  │   ← tokens... → turn_complete(speaker, fullText)
  │   客户端追加 transcript
  │
  ├── POST /turn { step: "participant", state, skillId: B }
  │   ← tokens... → turn_complete(speaker, fullText)
  │   客户端追加 transcript
  │
  ├── POST /turn { step: "moderator_wrap", state }
  │   ← tokens... → turn_complete(moderator, fullText) → memory(text)
  │   客户端追加 transcript + 更新 moderatorMemory + round++
  │
  └── POST /persist { state }
      → await_user
```

### 4.2 辩论模式（一轮）

```
客户端
  │
  ├── POST /turn { step: "moderator_open", state }
  │   ← tokens... → turn_complete → dispatch(steps[])
  │   客户端追加 transcript + 缓存 dispatch 指令
  │
  ├── 按 dispatch 序列依次调用：
  │   POST /turn { step: "participant", state, skillId, target?, directive? }
  │   ← tokens... → turn_complete
  │   客户端追加 transcript
  │
  ├── POST /turn { step: "moderator_wrap", state }
  │   ← tokens... → turn_complete → memory(text)
  │   客户端追加 transcript + round++
  │
  └── POST /persist { state }
```

### 4.3 合成结案

```
客户端
  │
  └── POST /turn { step: "synthesis", state }
      ← tokens... → synthesis_complete(text)
      客户端设 phase="done" + synthesis=text → POST /persist
```

---

## 五、Agent 详细设计

### 5.1 主持人 Agent (Moderator)

| 属性               | 值                                                                    |
| ------------------ | --------------------------------------------------------------------- |
| 实现文件           | `lib/orchestrator/agents/moderator-agent.ts`                          |
| LLM 调用方式       | `streamChat()` 直接调用，无工具                                       |
| System Prompt 来源 | `content/moderator.md`（讨论）/ `content/moderator-debate.md`（辩论） |
| 身份锁定           | Prompt 开头含「身份锁定」段，禁止以任何列席身份发言                   |

**三种调用时机**：

1. `streamModeratorTurn` — 开场与收束，接收 system + user 两条消息
2. `streamModeratorSynthesis` — 合成结案，仅接收一条 user 消息（含全文记录）
3. `summarizeModeratorMemory` — 非流式 `chatComplete`，将轮末总结压缩为 ≤600 字的记忆卡片

### 5.2 列席 Agent (Participant)

| 属性          | 值                                                            |
| ------------- | ------------------------------------------------------------- |
| 实现文件      | `lib/orchestrator/agents/participant-agent.ts`                |
| LLM 调用方式  | LangChain `createReactAgent` (ReAct 模式，带工具)             |
| System Prompt | 含「身份锁定（不可违反）」段，多次重复席名锚定                |
| 可用工具      | `read_file`、`list_files`（沙箱限定在 `skills/<id>/` 目录内） |

**身份锁定机制**：

- System prompt 开头：`你是「XX」，且只能是「XX」。绝对禁止：冒充主持人、冒充其他列席……`
- User message 末尾：`你是「XX」。请以「XX」的第一人称视角发言。记住：你只能是「XX」。`
- Transcript 中本席发言标 `★`（`formatTranscriptForSeat`）

**ReAct Agent 工作流**：

```
① list_files() → 查看 skill 目录结构
② read_file("SKILL.md") → 获取核心思维框架与表达 DNA
③ read_file("references/research/*") → 按需查阅深度调研材料
④ 以该人物第一人称视角输出发言
```

**安全沙箱**：

- `resolveSkillDir()` 验证路径不超出 `skills/` 目录
- `safePath()` 阻止路径穿越（`../` 等）
- 工具仅限只读操作

### 5.3 Deep Agent（备用实现）

| 属性     | 值                                                   |
| -------- | ---------------------------------------------------- |
| 实现文件 | `lib/orchestrator/agents/participant-deepagent.ts`   |
| 依赖     | `deepagents` 库                                      |
| 当前状态 | 未在主流程中启用，作为列席 Agent 的备用 drop-in 替换 |

---

## 六、调度指令协议（辩论模式）

主持人开场输出 `json:dispatch` 指令，客户端据此驱动列席发言：

```json
[
  { "skillId": "munger-perspective", "target": "taleb-perspective", "directive": "质疑其对黑天鹅的定义" },
  { "skillId": "taleb-perspective", "directive": "阐述反脆弱的实操路径" }
]
```

**约束规则**（`parse-dispatch.ts`）：

- 总步骤数 ≤ `列席数 × 2`
- 同一席不可连续出现 3 次
- 无效 ID 被静默过滤
- 解析失败 → fallback 为默认列席顺序

---

## 七、前端 UI 架构

### 时间线布局 (`Timeline.tsx`)

替代旧的泳道布局（`SwimLanes`），改为按发言时序线性排列：

- 每条发言是一张卡片，左上角有彩色席名 badge
- 不同人物分配不同颜色（amber/emerald/blue/purple/rose/teal/orange/indigo）
- 主持人 = 朱红，用户 = 金色
- 轮次分割线标注「第 N / M 轮」
- 正在发言的卡片加 `ring-2` 高亮 + 脉冲圆点「执笔中」
- 自动滚动到底部（流式时始终滚底，静止时近底才滚）

### Token 缓冲 (`use-token-buffer.ts`)

- 以 ~50ms 间隔批量刷新 token 到 display state
- 减少每个 token 一次 re-render 的卡顿
- 新发言者切换时自动 flush 旧缓冲

### 主持手记（折叠）

- 默认折叠，点击展开 / 收起
- 使用 `ChevronRight` / `ChevronDown` 图标

### 结案提要 (`SynthesisDialog.tsx`)

- 默认显示折叠摘要条（各章节标题一行展示）
- 点击「展开查看」打开全屏弹窗
- 弹窗内按 `## ` 分节渲染

---

## 八、状态机与生命周期

### 状态流转

```
idle ──▶ running ──▶ await_user ──┬──▶ running（continue）
                                  ├──▶ done（stop → synthesis）
                                  └──▶ running（用户插话后 continue）
```

### `RoundtableState` 关键字段

| 字段                  | 类型                                                                      | 说明                                     |
| --------------------- | ------------------------------------------------------------------------- | ---------------------------------------- |
| `mode`                | `"discussion" \| "debate"`                                                | 运行模式                                 |
| `phase`               | `"idle" \| "running" \| "await_user" \| "synthesis" \| "done" \| "error"` | 当前阶段                                 |
| `round`               | `number`                                                                  | 已完成的轮次数                           |
| `maxRounds`           | `number`                                                                  | 最大轮次（≤ 8）                          |
| `participantSkillIds` | `string[]`                                                                | 列席代理 ID 列表（≤ 24）                 |
| `transcript`          | `TranscriptEntry[]`                                                       | 全文记录（≤ 400 条，每条 ≤ 80,000 字符） |
| `moderatorMemory`     | `string`                                                                  | 主持人跨轮记忆（≤ 48,000 字符）          |
| `userCommand`         | `"continue" \| "stop" \| ...`                                             | 用户指令                                 |
| `synthesis`           | `string`                                                                  | 合成结案稿                               |

---

## 九、LLM 调用层

### 双通道架构

```
主持人 Agent ──▶ streamChat() / chatComplete()
                 直接 OpenAI SDK / Anthropic SDK
                 无工具调用，纯文本生成

列席 Agent   ──▶ LangChain createReactAgent()
                 toLangChainModel() 适配
                 支持 tool-calling (ReAct loop)
                 工具：read_file, list_files
```

### 支持的 BYOK 后端

| Provider   | Kind            | 默认模型                    |
| ---------- | --------------- | --------------------------- |
| OpenAI     | `openai_compat` | gpt-5.4                     |
| Anthropic  | `anthropic`     | claude-sonnet-4-6           |
| OpenRouter | `openai_compat` | anthropic/claude-sonnet-4-6 |
| MiniMax    | `openai_compat` | MiniMax-M2.7                |
| Kimi       | `openai_compat` | kimi-k2.5                   |
| 豆包       | `openai_compat` | doubao-2.0-pro              |

---

## 十、安全与限流

| 机制       | 实现                           | 说明                       |
| ---------- | ------------------------------ | -------------------------- |
| 鉴权       | Supabase Auth / DEV bypass     | 生产环境必须登录           |
| BYOK 密钥  | AES 加密存 DB，运行时解密      | 平台不代管明文 Key         |
| 并发限流   | `beginStreamSlot`              | 每用户同时 ≤ 1 个流式 turn |
| 频率限流   | `takeStreamRateToken`          | 每用户每分钟 ≤ 24 次请求   |
| Skill 沙箱 | `resolveSkillDir` + `safePath` | 列席 Agent 只能读本席目录  |
| Turn 超时  | `maxDuration = 120s`           | 单步不会超时               |
| 最大轮次   | `MAX_ROUND_ROUNDS = 8`         | 防无限循环                 |

---

## 十一、关键文件索引

| 文件                                                   | 职责                               |
| ------------------------------------------------------ | ---------------------------------- |
| **编排**                                               |                                    |
| `lib/orchestrator/run-single-turn.ts`                  | 单步执行器（核心）                 |
| `lib/orchestrator/index.ts`                            | 编排入口（re-export）              |
| `lib/orchestrator/agents/moderator-agent.ts`           | 主持人 Agent                       |
| `lib/orchestrator/agents/participant-agent.ts`         | 列席 Agent（ReAct）                |
| `lib/orchestrator/agents/llm-stream.ts`                | LLM 流式调用 → StreamEvent         |
| `lib/orchestrator/agents/skill-tools.ts`               | 列席 Agent 的沙箱文件工具          |
| `lib/orchestrator/format-context.ts`                   | Transcript 格式化                  |
| `lib/orchestrator/parse-dispatch.ts`                   | 辩论调度指令解析                   |
| `lib/orchestrator/moderator-load.ts`                   | 主持 Prompt 加载                   |
| **API**                                                |                                    |
| `app/api/roundtable/turn/route.ts`                     | Per-turn SSE 端点                  |
| `app/api/roundtable/persist/route.ts`                  | 状态持久化端点                     |
| **LLM**                                                |                                    |
| `lib/llm/stream-chat.ts`                               | 底层 LLM 调用                      |
| `lib/llm/to-langchain-model.ts`                        | LlmRuntime → LangChain 适配        |
| `lib/llm/types.ts`                                     | 类型定义                           |
| **前端**                                               |                                    |
| `app/roundtable/RoundtableClient.tsx`                  | 圆桌主页面                         |
| `components/roundtable/use-roundtable-orchestrator.ts` | 客户端编排 hook                    |
| `components/roundtable/use-token-buffer.ts`            | Token 平滑缓冲                     |
| `components/roundtable/Timeline.tsx`                   | 时间线布局                         |
| `components/roundtable/SynthesisDialog.tsx`            | 结案弹窗                           |
| `components/roundtable/MarkdownContent.tsx`            | Markdown 渲染                      |
| **Spec**                                               |                                    |
| `lib/spec/schema.ts`                                   | 状态 / 事件 / Turn 请求 Zod schema |
| `lib/spec/constants.ts`                                | 系统上限常量                       |
| **其他**                                               |                                    |
| `lib/server/resolve-llm.ts`                            | 执笔后端解析                       |
| `lib/server/rate-limit-stream.ts`                      | 并发与频率限流                     |
| `lib/skills/load-manifest.ts`                          | Skill 名录加载                     |
| `lib/db/persist-roundtable.ts`                         | 状态持久化                         |
| `content/moderator.md`                                 | 讨论模式主持 Prompt                |
| `content/moderator-debate.md`                          | 辩论模式主持 Prompt                |
