# 圆桌 Skill 云

多视角圆桌讨论产品：**每位列席是独立模型调用 + 本席 Skill**，主持单独一路；古诗风 UI；用户可在轮末 **席上插话**。**Skill 真源**为仓库内 `skills/<id>/SKILL.md`（YAML frontmatter + Markdown 正文），构建期写入 `.generated/skills-manifest.json`。

**栈**：Next.js 15（App Router）· Supabase（Auth / Postgres / RLS）· 用户 BYOK（多笔会）· SSE 流式编排。

## 架构概览

```mermaid
flowchart TB
    subgraph CLIENT["浏览器 · 古诗风 UI"]
        RC[RoundtableClient]
        SL[SwimLanes 泳道]
        Hook[useRoundtableStream]
        RC --> SL
        RC --> Hook
    end

    subgraph NEXTJS["Next.js 15 App Router · Node Runtime"]
        subgraph API["API Routes"]
            STREAM["/api/roundtable/stream · SSE"]
            SESS["/api/roundtable/sessions"]
            SHARE["/api/roundtable/share"]
            CRED["/api/credentials"]
        end

        subgraph ORCH["编排 lib/orchestrator/"]
            GRAPH["runRoundtableGraph\n主持开场→各席发言→主持收束"]
            MOD[moderator-agent]
            PART[participant-agent]
            GRAPH --> MOD & PART
        end

        subgraph LLM["LLM lib/llm/"]
            SC[streamChat / chatComplete]
            OAI[OpenAI SDK]
            ANTH[Anthropic SDK]
            SC --> OAI & ANTH
        end

        RESOLVE[resolve-llm\nDEV旁路 / BYOK]
        PERSIST[persist-roundtable]
    end

    subgraph SUPA["Supabase"]
        AUTH[(Auth)]
        PG[(Postgres)]
    end

    subgraph EXT["外部 LLM"]
        E1[OpenAI / OpenRouter / MiniMax / Kimi / 豆包]
        E2[Anthropic]
    end

    Hook -->|POST SSE| STREAM
    STREAM --> GRAPH
    MOD & PART --> SC
    OAI --> E1
    ANTH --> E2
    RESOLVE --> PG
    PERSIST --> PG
```

**数据流**：浏览器 `useRoundtableStream` → SSE POST → `runRoundtableGraph`（主持开场 → 各席逐一发言 → 主持收束 → `await_user` 或合成结案）→ 每次 LLM 调用经 `streamChat` 走 OpenAI 兼容 / Anthropic → token 实时 SSE 推送 → 泳道渲染。

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
| `docker/`              | Docker 本地开发辅助配置（Kong 等）        |

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

### 方式一：直接运行（推荐快速迭代）

```bash
cp .env.example .env.local
# 至少填 DEV_LLM_API_KEY 即可本地跑通圆桌（无需 Supabase）
corepack enable   # 可选：锁定 pnpm 版本
pnpm install
pnpm dev
```

### 方式二：Docker Compose（含本地 Supabase）

全栈容器化，一键启动 Next.js + Supabase（Postgres / Auth / REST / Kong / Studio）。

```bash
cp .env.example .env.local
# 填写 DEV_LLM_API_KEY、JWT_SECRET、POSTGRES_PASSWORD 等

docker compose up --build
```

| 服务            | 地址                   | 说明                     |
| --------------- | ---------------------- | ------------------------ |
| 应用            | http://localhost:3000  | Next.js                  |
| Supabase API    | http://localhost:8000  | Kong 网关（Auth + REST） |
| Supabase Studio | http://localhost:54323 | 数据库管理 UI            |
| Postgres        | localhost:54322        | 直连（用户 postgres）    |

> **注意**：Dockerfile 使用 Next.js standalone 输出模式，需在 `next.config.ts` 中添加 `output: "standalone"` 方可构建。本地直接 `pnpm dev` 不需要此配置。

### Supabase 与迁移

在 [Supabase](https://supabase.com) 建项目后（或使用 Docker 本地实例），**按顺序**在 SQL 编辑器执行：

1. `supabase/migrations/001_init.sql` — 会话、消息、凭据（含后续 BYOK 表结构基础）
2. `002_llm_providers.sql` — 多笔会、`user_llm_settings` 等
3. `003_roundtable_share_snapshots.sql` — 分享快照（仅服务端 `SUPABASE_SERVICE_ROLE_KEY` 写入）
4. `004_remove_jm_jiminai_providers.sql` — 清理弃用笔会

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

- **多代理逐席**：主持与每位列席各自 `stream` 调用；列席 system 仅含本席 Skill。
- **席上插话**：`await_user` 阶段用户可写入观点，记入 transcript（`role: user`），再「再续一轮」时进入各代理上下文。
- **持久化**：每段流式编排 **finalize 后** 若已登录则写入 `roundtable_sessions` / `roundtable_messages`（见 `lib/db/persist-roundtable.ts`）。
- **分享**：`POST /api/roundtable/share` 生成 token；公开读 `GET /api/roundtable/share/[token]` 与展卷页；须配置 `SUPABASE_SERVICE_ROLE_KEY` 与 `003` 迁移。

## Vercel 部署

连接 Git 仓库，环境变量与 `.env.example` 对齐；`vercel.json` 已为流式 API 延长 `maxDuration`。部署前本地执行 `pnpm run build` 确认通过。
