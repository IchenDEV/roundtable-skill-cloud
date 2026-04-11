# 🏮 圆桌 Skill 云

> **让历史上最锐利的头脑，为你的问题交锋。**

一句议题，数位大师入席——马斯克拆成本、芒格查盲点、费曼验真伪——独立思考，当面辩论，你随时插话。结束时主持人铺纸结案：共识、分歧、悬而未决。

---

## ✨ 核心体验

🎭 **真·多 Agent** — 每位列席都是独立的 AI 代理，拥有自己的思维框架、调研材料和表达风格。不是一个模型分饰多角，而是各自为战。

🗣️ **席上插话** — 每轮讨论间隙，你可以写下判断、质疑或补充。所有代理都会在下一轮回应你的观点。

⚔️ **讨论 / 辩论双模式** — 讨论模式求共识，辩论模式追交锋。辩论中主持人会动态调度质询顺序，让论证最弱的一方接受盘问。

📜 **结案提要** — 主持人最终输出结构化报告：共识 · 分歧 · 开放问题 · 可执行结论。

🔑 **BYOK 自带钥匙** — 你的 API Key 加密存储，平台不代管明文。支持 OpenAI、Anthropic、OpenRouter、MiniMax、Kimi、豆包。

---

## 🎓 内置 21 位思维人物

| 人物          | 一句话                             |
| ------------- | ---------------------------------- |
| 保罗·格雷厄姆 | YC 创始人，创业、写作与产品哲学    |
| 张一鸣        | 字节跳动创始人，产品、组织与全球化 |
| 马斯克        | 第一性原理，工程与成本拆解         |
| 乔布斯        | 苹果创始人，产品设计与战略         |
| 芒格          | 多元思维模型，投资与逆向思考       |
| 费曼          | 物理学家，学习方法与科学思维       |
| 纳瓦尔        | 杠杆、特定知识与财富哲学           |
| 塔勒布        | 反脆弱、黑天鹅与风险管理           |
| 卡帕西        | AI 工程师，深度学习与技术教育      |
| 伊利亚        | AI 安全先驱，scaling 与研究品味    |
| 特朗普        | 谈判、权力博弈与传播策略           |
| MrBeast       | YouTube 之王，内容创造方法论       |
| 张雪峰        | 教育选择、职业规划与阶层流动       |
| 巴菲特        | 价值投资，能力圈与长期主义         |
| 德鲁克        | 管理学之父，组织效能与知识工作者   |
| 马克思        | 结构分析、矛盾分析与实践检验       |
| 老子          | 道法自然，反身观照与柔弱胜刚       |
| 王阳明        | 知行合一，致良知与心学实践         |
| 宫本茂        | 任天堂，游戏设计与交互体验         |
| 道家          | 无为守柔，顺势与反身思考           |
| 法家          | 信赏必罚，规则与激励结构           |

每位人物的思维框架均由深度调研蒸馏而成，存放在 `skills/<id>/SKILL.md` 及 `references/` 目录。

---

## 🚀 快速开始

```bash
git clone https://github.com/ichendev/roundtable-skill-cloud.git
cd roundtable-skill-cloud
cp .env.example .env.local
# 至少填写 DEV_LLM_API_KEY 即可本地跑通（无需 Supabase）

pnpm install
pnpm dev
# → http://localhost:3000
```

完整部署指南（Supabase、Docker、Vercel）见 [docs/deploy.md](docs/deploy.md)。

---

## 🏗 技术架构

详见 [docs/agent.md](docs/agent.md) — 完整的 Agent 调度架构文档。

**要点**：

- **Per-Turn SSE** — 每个 Agent 的每次发言是一个独立的 SSE 请求，不会超时
- **ReAct Agent** — 列席代理基于 LangChain ReAct，运行时从本席目录读取思维框架
- **沙箱隔离** — 每个代理只能读取自己的 Skill 目录，不可越界
- **身份锁定** — 多层 prompt 锚定，防止代理串台

---

## 📖 文档

| 文档                           | 内容                         |
| ------------------------------ | ---------------------------- |
| [docs/agent.md](docs/agent.md) | Agent 调度架构、状态机、协议 |
| [.env.example](.env.example)   | 环境变量说明                 |

---

## 🙏 致谢

- **Skill 蒸馏框架** — [花叔 (alchaincyf)](https://github.com/alchaincyf) 及 [女娲造人](https://github.com/alchaincyf/nuwa-skill)
- **产品灵感** — [lijigang/ljg-roundtable](https://github.com/lijigang/ljg-skills/tree/master/skills/ljg-roundtable)
- **Skill 索引** — [awesome-persona-distill-skills](https://github.com/xixu-me/awesome-persona-distill-skills)

完整致谢见 [/credits](https://roundtable-skill-cloud.vercel.app/credits)。

---

## 📄 License

MIT
