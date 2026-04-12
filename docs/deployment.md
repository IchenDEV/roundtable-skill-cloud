# 部署与本地运行

## 1. 首次拉取

```bash
git clone https://github.com/ichendev/roundtable-skill-cloud.git
cd roundtable-skill-cloud
git submodule update --init --recursive
pnpm install
```

`skills-superman/` 是外部 skill 源；未初始化 submodule 时，`build:skills` 只能看到本仓 `skills/`。

## 2. 本地最小启动

只想先把前后端和编排跑起来，可以使用开发旁路：

```bash
cp .env.example .env.local
```

至少填写：

```bash
DEV_LLM_API_KEY=你的测试 Key
```

然后启动：

```bash
pnpm run build:skills
pnpm dev
```

默认访问：`http://localhost:3000`

## 3. 生产前提

生产环境需要完整接通：

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `KEY_ENCRYPTION_SECRET`

可选但建议补齐：

- `NEXT_PUBLIC_SITE_URL`
- `DEFAULT_OPENAI_MODEL`
- `DEFAULT_ANTHROPIC_MODEL`

## 4. Supabase 迁移顺序

按目录中的顺序执行：

1. `001_init.sql`
2. `002_llm_providers.sql`
3. `003_roundtable_share_snapshots.sql`
4. `004_remove_jm_jiminai_providers.sql`
5. `005_roundtable_mode_and_atomic_persist.sql`

至少需要完成到：

- `003` 才能使用分享快照
- `005` 才能保证 `mode` 与原子持久化逻辑一致

## 5. Vercel 部署要点

- 项目默认按 Vercel 部署设计
- `vercel.json` 已固定 Next.js 框架，并为 `app/api/roundtable/turn/route.ts` 设置 Node runtime 的 `maxDuration`
- 重编排与流式接口都应继续跑在 Node.js，不要改到 Edge

部署前建议先执行：

```bash
pnpm run build:skills
pnpm lint
pnpm test
pnpm build
```

## 6. 常见问题

### `build:skills` 失败

优先检查：

- submodule 是否已初始化
- `skills/<id>/SKILL.md` 或 `skills-superman/skills/<id>/SKILL.md` 的 frontmatter 是否合法

### 登录后仍无法保存 BYOK

优先检查：

- Supabase Redirect URLs 是否包含 `/auth/callback`
- `KEY_ENCRYPTION_SECRET` 是否已配置
- `SUPABASE_SERVICE_ROLE_KEY` 是否存在

### 分享链接生成失败

优先检查：

- `SUPABASE_SERVICE_ROLE_KEY`
- `003_roundtable_share_snapshots.sql` 是否已执行
