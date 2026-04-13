<p align="center">
  <img src="./app/icon.svg" alt="圆桌图标" width="88" height="88" />
</p>

<h1 align="center">圆桌 Skill 云</h1>

<p align="center">让不同人格化视角同席论辩，再由主持慢慢收束成一纸结案。</p>

> 品牌图标采用“俯视圆桌 + 多席围坐”的意象，对应产品里的主持控场、列席分席与轮次收束。

圆桌是一个面向思辨与写作场景的多 Agent Web 应用：你给出议题，选择几位人物视角入席，主持控场，各席独立发言、彼此回应，你也可以在轮间插话。最终系统会给出结构化结案提要。

## 核心体验

- 真多 Agent：每席独立调用模型，并只读取本席 skill 目录
- 讨论 / 辩论双模式：既能求共识，也能做交锋式质询
- 席上插话：`await_user` 阶段可追加用户发言，再续下一轮
- 旧席与分享：支持恢复会话、生成快照链接、按分享复刻重开
- BYOK：凭据加密存储，平台不代管明文 API Key

## Skill 来源

运行时 skill manifest 由两层目录汇总生成：

- `skills-superman/skills/`：外部 skill 源，构建时优先扫描
- `skills/`：本仓自管 skill，用于补充与覆盖

构建命令会生成：

- `.generated/skills-manifest.json`

manifest 数量会随 `skills-superman` 子模块版本变化；请以 `pnpm run build:skills` 的输出为准。

## 快速开始

```bash
git clone https://github.com/ichendev/roundtable-skill-cloud.git
cd roundtable-skill-cloud
git submodule update --init --recursive
cp .env.example .env.local
pnpm install
pnpm dev
```

如果只是本地体验流程，`.env.local` 至少填一个：

```bash
DEV_LLM_API_KEY=你的测试 Key
```

默认访问：`http://localhost:3000`

## 常用命令

```bash
pnpm run build:skills
pnpm lint
pnpm test
pnpm build
```

## 项目结构

```text
app/                  Next.js App Router 页面与 API
components/           共享 UI 与业务组件
content/              主持 prompt
docs/                 当前有效文档
lib/                  编排、技能、服务端、数据库与 schema
scripts/              构建脚本
skills/               本仓自管 skill
skills-superman/      外部 skill 源（git submodule）
supabase/migrations/  数据库迁移
tests/unit/           Vitest 单元测试
```

## 文档

- [docs/architecture.md](docs/architecture.md)：当前架构与主执行路径
- [docs/deployment.md](docs/deployment.md)：本地运行、迁移顺序与部署前提
- [docs/design-system.md](docs/design-system.md)：界面风格与设计约束
- [AGENTS.md](AGENTS.md)：协作者工作指引

## 致谢

- 产品灵感：[lijigang/ljg-roundtable](https://github.com/lijigang/ljg-skills/tree/master/skills/ljg-roundtable)
- 蒸馏标准：[花叔 / 女娲造人](https://github.com/alchaincyf/nuwa-skill)
- 外部视角库：[IchenDEV/superman](https://github.com/IchenDEV/superman)
- 社区索引：[awesome-persona-distill-skills](https://github.com/xixu-me/awesome-persona-distill-skills)

完整来源说明见 [app/credits/page.tsx](app/credits/page.tsx) 对应页面；页面内容按运行时 `.generated/skills-manifest.json` 的实际来源统计展示。

## License

MIT
