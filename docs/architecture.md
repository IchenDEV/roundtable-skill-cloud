# 圆桌架构总览

> 当前实现以「每步一个 SSE」的圆桌编排为主，文档只记录仍在生效的运行路径。

## 总体结构

- 前端负责持有 `RoundtableState`，按步骤串起主持开场、列席发言、主持收束与最终结案。
- 服务端默认运行在 Node.js 上；重编排与流式输出都不走 Edge。
- Skill 运行时来源有两层：
  - `skills-superman/skills/`：外部 skill 源，构建时优先扫描
  - `skills/`：本仓自管 skill，用于补充与覆盖
- 构建脚本会把两层来源汇总进 `.generated/skills-manifest.json`，运行时由 `loadSkillManifest()` 读取。

## 当前主执行路径

### 推荐路径：Per-turn SSE

主流程入口是 `POST /api/roundtable/turn`：

1. 校验请求体与鉴权状态
2. 加载 skill manifest
3. 解析当前执笔后端与模型
4. 调用 `runSingleTurn()`
5. 将单步事件以 SSE 持续推给前端

`runSingleTurn()` 支持四种步骤：

- `moderator_open`
- `participant`
- `moderator_wrap`
- `synthesis`

对应前端主编排入口：

- `app/roundtable/roundtable-client.tsx`
- `components/roundtable/use-roundtable-session.ts`
- `components/roundtable/use-roundtable-orchestrator.ts`

### 兼容路径：整轮流式

`POST /api/roundtable/stream` 仍然保留，用于兼容旧入口：

- 讨论模式走 `runRoundtableGraph()`
- 辩论模式走 `runRoundtableDebate()`

该路径不是推荐的新功能接入面，但本轮未移除。

## Agent 角色

### 主持人

- 由 `lib/orchestrator/agents/moderator-agent.ts` 驱动
- system prompt 运行时从 `content/moderator.md` 或 `content/moderator-debate.md` 读取
- 负责开场定题、轮末收束、结案合成与主持记忆压缩

### 列席

- 由 `lib/orchestrator/agents/participant-agent.ts` 驱动
- 每席只读本席 skill 目录
- 运行时通过 `list_files` / `read_file` 读取 `SKILL.md` 与所需 `references/`
- 输出必须锁定在该人物第一人称视角

### DeepAgent 兼容名

- `lib/orchestrator/run-roundtable-deepagent.ts` 仍保留
- 当前只做兼容委托，直接转发到 `runRoundtableGraph()`
- 产品当前不依赖独立 deep agent 实现

## 状态与持久化

- 核心 schema 在 `lib/spec/schema.ts`
- 会话持久化在 `lib/db/persist-roundtable.ts`
- 旧席查询与恢复在 `lib/db/roundtable-sessions.ts`
- 分享快照在 `lib/db/share-snapshot.ts`

圆桌状态的关键语义：

- `phase: "await_user"`：允许席间插话
- `phase: "synthesis"` / `phase: "done"`：进入结案阶段
- `mode: "discussion" | "debate"`：决定主持 prompt 与列席调度方式

## 关键实现文件

- `app/roundtable/roundtable-client.tsx`：圆桌页主客户端
- `components/court/courtroom-client.tsx`：法庭页主客户端
- `components/roundtable/timeline.tsx`：圆桌时间线
- `lib/orchestrator/run-single-turn.ts`：单步执行器
- `lib/orchestrator/run-roundtable-graph.ts`：讨论模式整轮执行
- `lib/server/resolve-llm.ts`：BYOK / 开发旁路解析

## 维护注意

- Skill 唯一允许的版本库来源是 `skills-superman/skills` 与 `skills`
- `pnpm run build:skills` 失败时，优先检查 skill frontmatter 与 submodule 是否已初始化
- 新功能优先接在 per-turn SSE 路径，而不是继续扩展旧的整轮流式入口
