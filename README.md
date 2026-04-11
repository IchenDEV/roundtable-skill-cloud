# 圆桌 Skill 云

多视角圆桌讨论产品：**每位列席是独立模型调用 + 本席 Skill**，主持单独一路；古诗风 UI；用户可在轮末 **席上插话**。**Skill 真源**为仓库内 `skills/<id>/SKILL.md`（YAML frontmatter + Markdown 正文），构建期写入 `.generated/skills-manifest.json`。

**栈**：Next.js 15（App Router）· Supabase（Auth / Postgres / RLS）· 用户 BYOK（多笔会）· SSE 流式编排。

## 主要页面与能力

| 路径                        | 说明                                                          |
| --------------------------- | ------------------------------------------------------------- |
| `/`                         | 序页与示例议题                                                |
| `/roundtable`               | 开席、泳道、席上插话、抄录 / 下载 Markdown、生成分享链接      |
| `/roundtable/jiuxi`         | **旧席录**（登录）：历史会话列表、展卷、回到此席、撤席        |
| `/roundtable/jiuxi/[id]`    | 单条旧席详情（同上操作）                                      |
| `/roundtable/share/[token]` | **展卷**（公开只读）：同览泳道与结案提要，携卷复刻 / 同席重论 |
| `/settings`                 | **砚台**：笔会、授权、接口根地址、默认模型                    |
| `/login`                    | 登入（Supabase Auth）                                         |

查询参数：`/roundtable?resume=<uuid>` 载入旧席；`?fromShare=<token>` 携分享复刻；`?topic=&skills=id1,id2&maxRounds=n` 预填议题与列席。

## 目录约定

| 路径                   | 说明                                      |
| ---------------------- | ----------------------------------------- |
| `app/`、`components/`  | 页面、布局、API Route、UI 组件            |
| `lib/`                 | 编排、LLM、schema、DB 访问、工具函数      |
| `skills/*/SKILL.md`    | Skill 源（frontmatter 须合法 YAML，见下） |
| `content/moderator.md` | 主持人系统提示（运行时读取）              |
| `scripts/`             | 构建脚本（如 manifest）                   |
| `tests/unit/`          | Vitest 单测                               |
| `supabase/migrations/` | 数据库迁移（按序号执行）                  |

根目录保留框架与工具链入口（`package.json`、`next.config.ts`、`middleware.ts`、`vitest.config.ts`、`eslint` / `prettier` 等）。

### Skill 文件格式

每个 `SKILL.md` 开头须为 **YAML frontmatter**（`---` 包裹），例如：

```yaml
---
name: my-skill-id
description: 一句话说明
---
```

正文为 Markdown；勿用 `## name:` 等标题冒充 frontmatter，否则 `pnpm build` 会失败。

## 文件命名

| 类别                 | 风格                                               | 示例                                   |
| -------------------- | -------------------------------------------------- | -------------------------------------- |
| React 组件（`.tsx`） | **PascalCase**，与默认导出名一致                   | `SwimLanes.tsx`                        |
| Hook（`.ts`）        | **kebab-case**，`use-foo-bar.ts`，导出 `useFooBar` | `use-roundtable-stream.ts`             |
| `lib/`、`tests/`     | **kebab-case**                                     | `resolve-llm.ts`                       |
| Next 路由            | 固定小写文件名                                     | `page.tsx`、`layout.tsx`、`route.ts`   |
| Skill 目录           | **kebab-case** + `SKILL.md`                        | `skills/legalist-perspective/SKILL.md` |

## 本地开发

```bash
cp .env.example .env.local
# 至少填 DEV_LLM_API_KEY 即可本地跑通圆桌（无需 Supabase）
corepack enable   # 可选：锁定 pnpm 版本
pnpm install
pnpm dev
```

### Supabase 与迁移

在 [Supabase](https://supabase.com) 建项目后，**按顺序**在 SQL 编辑器执行：

1. `supabase/migrations/001_init.sql` — 会话、消息、凭据（含后续 BYOK 表结构基础）
2. `002_llm_providers.sql` — 多笔会、`user_llm_settings` 等
3. `003_roundtable_share_snapshots.sql` — 分享快照（仅服务端 `SUPABASE_SERVICE_ROLE_KEY` 写入）

将 `NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_ANON_KEY` 写入 `.env.local`；生产需 `KEY_ENCRYPTION_SECRET`（加密 BYOK 密文）。分享链接绝对地址可选 `NEXT_PUBLIC_SITE_URL`；未设时由请求头推断。

**砚台**：选用笔会并保存授权；OpenAI 兼容类（OpenRouter、MiniMax、Kimi、豆包等）与 Anthropic 均已支持。

## 脚本与质量

| 命令                                                   | 作用                                                                         |
| ------------------------------------------------------ | ---------------------------------------------------------------------------- |
| `pnpm run build:skills`                                | 扫描 `skills/` 生成 manifest                                                 |
| `pnpm build`                                           | prebuild 自动生成 manifest 后 Next 生产构建                                  |
| `pnpm format` / `pnpm format:check`                    | Prettier                                                                     |
| `pnpm lint` / `pnpm lint:fix`                          | ESLint                                                                       |
| `pnpm check`                                           | `format:check` + `lint`                                                      |
| `pnpm test` / `pnpm test:watch` / `pnpm test:coverage` | Vitest；覆盖率统计主要为 `lib/**/*.ts`（门禁：行/语句/函数 ≥80%，分支 ≥75%） |
| `pnpm check:all`                                       | `format:check` + `lint` + `test:coverage`                                    |

提交时 **husky** + **lint-staged** 对暂存文件跑 Prettier 与 ESLint。建议安装 `.vscode/extensions.json` 中的推荐扩展。

## 编排与产品行为

- **多代理逐席**：主持与每位列席各自 `stream` 调用；列席 system 仅含本席 Skill。API body 仍可有 `mode: "graph" | "deepagent"`，**二者同一套图编排**（`deepagent` 仅为兼容旧参数）。
- **席上插话**：`await_user` 阶段用户可写入观点，记入 transcript（`role: user`），再「再续一轮」时进入各代理上下文。
- **持久化**：每段流式编排 **finalize 后** 若已登录则写入 `roundtable_sessions` / `roundtable_messages`（见 `lib/db/persist-roundtable.ts`）。
- **分享**：`POST /api/roundtable/share` 生成 token；公开读 `GET /api/roundtable/share/[token]` 与展卷页；须配置 `SUPABASE_SERVICE_ROLE_KEY` 与 `003` 迁移。

## Vercel 部署

连接 Git 仓库，环境变量与 `.env.example` 对齐；`vercel.json` 已为流式 API 延长 `maxDuration`。部署前本地执行 `pnpm run build` 确认通过。
