# Agent 工作指引（圆桌 Skill 云）

面向在本仓库内改代码、查问题、加功能的 AI / 人类协作者。

## 用户偏好（对话与交付）

- 复杂或新产品向能力：**先对齐方案与边界**，再大规模改代码。
- 部署默认按 **Vercel** 想定；编排跑在 **Node**（勿把重 LLM 编排放 Edge）。
- UI：**古诗风**；对用户说明偏 **产品与流程**，少堆栈名与内部术语。
- Skill **唯一真源**是仓库 `skills/<kebab-id>/SKILL.md`，不依赖本机私有路径。
- 鉴权与结构化数据：**Supabase**（Auth + Postgres + RLS）；**不做**「平台代管用户 API Key」——BYOK，密钥加密存库。
- 包管理：**pnpm**；保持 **ESLint + Prettier**；Prettier 行宽 **120**。
- 保持根目录与结构清晰；**文件命名**见下节与根目录 `README.md`。

## 文件命名（简表）

- React 组件：`PascalCase.tsx`
- Hook：`use-kebab-case.ts`，导出 `useCamelCase`
- `lib/`、`tests/`：`kebab-case.ts`
- Next：`page.tsx` / `layout.tsx` / `route.ts`
- Skill：目录 kebab-case + `SKILL.md`，frontmatter 合法 YAML

## 仓库事实（实现层面）

### 产品能力

- **圆桌**：议题、多 Skill 列席、多轮、主持手记、轮末合成（结案提要）、泳道时间线。
- **席上插话**：阶段 `await_user` 时用户可写入 `transcript` 的 `user` 行，再续轮。
- **旧席录**：`/roundtable/jiuxi`，登录用户列表 / 展卷 / `?resume=` 续席 / 撤席。
- **分享**：快照表 + token；展卷页只读；`?fromShare=` 携卷复刻；查询参数可「同席重论」仅带议题与列席。

### 编排（`lib/orchestrator/`）

- **唯一执行路径**：`runRoundtableGraph`（主持开场 → 各席发言 → 主持收束 → `await_user` 或合成结案）。
- `runRoundtableDeepAgent` **即委托** `runRoundtableGraph`；API `mode: "deepagent"` 与 `graph` 同轨。历史上若有 Deep Agents / LangGraph 实验，**当前产品不依赖**其实现。
- 列席代理：`lib/orchestrator/agents/participant-agent.ts`；主持：`moderator-agent.ts`；上下文格式化：`format-context.ts`（含「席上你我」标签）。
- 主持人系统提示：`content/moderator.md`（运行时读盘）。

### 数据与 API

- Schema / 状态机：`lib/spec/schema.ts`（含 `roundtableStateSchema`、`streamEventSchema`）。
- 流式入口：`app/api/roundtable/stream/route.ts` → `lib/orchestrator/index.ts`。
- 执笔解析：`lib/server/resolve-llm.ts`（开发机 `DEV_LLM_*` 旁路 + Supabase 用户设置与凭据）。
- LLM 调用：`lib/llm/stream-chat.ts`（OpenAI 兼容 + Anthropic Messages）。
- 持久化：`lib/db/persist-roundtable.ts`；旧席：`lib/db/roundtable-sessions.ts`；分享：`lib/db/share-snapshot.ts`（**service role**）。

### 测试

- **Vitest**，用例在 `tests/unit/`；覆盖率主要统计 `lib/**/*.ts`（见 `vitest.config.ts`）。
- `server-only` 在测试中由 `tests/shims/server-only.ts` 替代。

## 改功能时的入口线索

| 目标            | 优先看的文件                                                                                   |
| --------------- | ---------------------------------------------------------------------------------------------- |
| 圆桌 UI 与交互  | `app/roundtable/RoundtableClient.tsx`，`components/roundtable/*`                               |
| 编排逻辑 / 轮次 | `lib/orchestrator/run-roundtable-graph.ts`，`agents/*`                                         |
| 协议与校验      | `lib/spec/schema.ts`                                                                           |
| 砚台 / BYOK     | `app/settings/SettingsClient.tsx`，`app/api/credentials/route.ts`，`lib/server/resolve-llm.ts` |
| 旧席 / 分享 API | `app/api/roundtable/sessions/*`，`app/api/roundtable/share/*`                                  |
| 新 Skill        | 新建 `skills/<id>/SKILL.md` 后 `pnpm run build:skills`                                         |

## 常见坑

- **Skill frontmatter** 必须是 `---` + YAML + `---`；误用 Markdown 标题会导致 `build:skills` / `prebuild` 报错。
- **分享**依赖 `SUPABASE_SERVICE_ROLE_KEY` 与迁移 `003`；缺则生成链接失败。
- **持久化**仅在流式正常结束并 `finalize` 后写入；中断的局可能未入库。
- 改 DB 后记得同步 `supabase/migrations/` 并在文档中提醒执行顺序。

更完整的命令、迁移顺序与路由表见 **`README.md`**。

## Learned User Preferences

- 首页与入席流：优先引导登录；未登录或网络异常时的提示与空态应可读、可恢复，避免出现难以理解或明显「半成品」界面。
- 首页内容：宜提供示例议题与预置人物 skill 介绍，降低冷启动与理解成本。
- 交互与动效：关键按钮与状态变化应有清晰反馈，减少可感知的卡顿（与整体古诗风视觉并存）。
- 核心库测试：持续补足 `lib/**/*.ts` 等单测，覆盖率目标约八成（以 `vitest.config.ts` 统计口径为准）。

## Learned Workspace Facts

- 多后端执笔：除单一厂商外，设置中需能接入多种 OpenAI 兼容及部分国内模型服务（如 OpenRouter、Minimax、Kimi、豆包等），走 BYOK。
- 列席模型：每席独立模型调用、各席 system 注入对应 Skill；用户可在 `await_user` 阶段插入发言，产品语义上强调「真·多 agent」而非单模型分饰多角。
