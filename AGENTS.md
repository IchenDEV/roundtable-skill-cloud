# Agent 工作指引（圆桌 Skill 云）

面向在本仓库内改代码、查问题、加功能的 AI / 人类协作者。

## 用户偏好

- 复杂或新能力：先对齐方案与边界，再大规模动代码。
- 部署默认按 Vercel 想定；重编排与流式执行跑在 Node，不放 Edge。
- UI 保持古诗风；对用户说明偏产品与流程，少堆栈名。
- 鉴权与结构化数据使用 Supabase（Auth + Postgres + RLS）。
- 平台不代管用户明文 API Key：坚持 BYOK，密钥加密存库。
- 包管理固定 `pnpm`；保持 ESLint + Prettier；Prettier 行宽 120。

## 文件命名

- React 组件文件：统一 `kebab-case.tsx`
- React 组件导出名：继续用 `PascalCase`
- Hook：`use-kebab-case.ts`，导出 `useCamelCase`
- `lib/`、`tests/`、`scripts/`：`kebab-case.ts` / `kebab-case.mjs`
- Next 约定文件：`page.tsx` / `layout.tsx` / `route.ts`
- Skill：目录 kebab-case + `SKILL.md`，frontmatter 必须是合法 YAML

## Skill 来源约束

- 只允许使用版本库内的两层 skill 来源：
  - `skills-superman/skills/`
  - `skills/`
- 禁止依赖本机私有 skill 路径。
- 运行时 manifest 由 `pnpm run build:skills` 汇总生成到 `.generated/skills-manifest.json`。

## 当前实现事实

### 产品能力

- 圆桌：议题、多 skill 列席、多轮讨论或辩论、轮末收束、最终结案。
- 席上插话：`await_user` 阶段允许把用户发言写入 `transcript` 再续轮。
- 旧席录：`/roundtable/jiuxi` 支持列表、展卷、续席。
- 分享：快照表 + token；支持只读展卷与 `fromShare` 复刻。

### 编排

- 推荐执行路径是 per-turn SSE：`app/api/roundtable/turn/route.ts` → `lib/orchestrator/run-single-turn.ts`
- 兼容整轮流式入口仍保留：`app/api/roundtable/stream/route.ts`
- `runRoundtableDeepAgent` 仅是兼容名，当前直接委托到 `runRoundtableGraph`
- 列席代理在 `lib/orchestrator/agents/participant-agent.ts`
- 主持 prompt 运行时从 `content/moderator.md` 与 `content/moderator-debate.md` 读取

### 数据与测试

- 核心 schema：`lib/spec/schema.ts`
- 执笔解析：`lib/server/resolve-llm.ts`
- 持久化：`lib/db/persist-roundtable.ts`
- 测试：Vitest，主要在 `tests/unit/`

## 常用入口

| 目标           | 优先看的文件                                                                                    |
| -------------- | ----------------------------------------------------------------------------------------------- |
| 圆桌 UI 与交互 | `app/roundtable/roundtable-client.tsx`、`components/roundtable/*`                               |
| 法庭页         | `components/court/courtroom-client.tsx`                                                         |
| 编排逻辑       | `lib/orchestrator/run-single-turn.ts`、`lib/orchestrator/run-roundtable-graph.ts`               |
| 砚台 / BYOK    | `app/settings/settings-client.tsx`、`app/api/credentials/route.ts`、`lib/server/resolve-llm.ts` |
| 分享 / 旧席    | `app/api/roundtable/share/*`、`app/api/roundtable/sessions/*`                                   |
| 新 Skill       | 新建 `skills/<id>/SKILL.md` 后执行 `pnpm run build:skills`                                      |

## 常见坑

- Skill frontmatter 必须是 `---` + YAML + `---`；否则 `build:skills` / `prebuild` 会失败。
- 分享依赖 `SUPABASE_SERVICE_ROLE_KEY` 与迁移 `003_roundtable_share_snapshots.sql`。
- `skills-superman/` 未初始化时，manifest 只会扫描到本仓 `skills/`。
- 流式中断的局不一定会成功入库；不要把“看到部分输出”当作“已持久化”。

## Learned User Preferences

- 首页与入席流：优先引导登录；未登录或网络异常时的提示与空态要可读、可恢复。
- 首页内容：宜提供示例议题与预置人物 skill，降低冷启动成本。
- 交互与动效：关键按钮与状态变化要有明确反馈，但避免花哨和噪音。
- 核心库测试：持续补足 `lib/**/*.ts` 单测，覆盖率目标约八成。

## Learned Workspace Facts

- 多后端执笔：需支持 OpenAI 兼容与 Anthropic，以及部分国内 OpenAI 兼容服务，统一走 BYOK。
- 列席模型：每席独立模型调用，并各自读取本席 skill；产品语义强调真多 agent，而不是单模型分饰多角。
