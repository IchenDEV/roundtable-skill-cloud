# 设计文档：superman submodule + 技能分类 + 智能推荐

**日期**：2026-04-13  
**状态**：已批准

---

## 目标

1. 将 superman 仓库（58 个历史/哲学人物 skill）作为 git submodule 引入
2. 用 superman 版本替换 roundtable 中重叠的 4 个 skill
3. UI 支持按领域分类展示人物
4. 支持「智能推荐」按钮：根据话题调用 LLM 自动选出 3-5 个最相关人物

---

## 当前状态

- roundtable 现有 21 个 skill，全部在 `skills/` 目录下平铺
- 其中 4 个与 superman 重叠：`drucker`、`laozi`、`miyamoto`、`wangyangming`
- UI 将所有人物渲染为一排平铺 button，无分类，无推荐

---

## 目录结构

```
roundtable-skill-cloud/
├── skills/                          # 17 个 roundtable-only skills（保留）
│   ├── andrej-karpathy-perspective/
│   ├── elon-musk-perspective/
│   ├── feynman-perspective/
│   ├── ilya-sutskever-perspective/
│   ├── karl-marx-perspective/
│   ├── legalist-perspective/
│   ├── mrbeast-perspective/
│   ├── munger-perspective/
│   ├── naval-perspective/
│   ├── paul-graham-perspective/
│   ├── sage-perspective/
│   ├── steve-jobs-perspective/
│   ├── taleb-perspective/
│   ├── trump-perspective/
│   ├── warren-buffett-perspective/
│   ├── zhang-yiming-perspective/
│   ├── zhangxuefeng-perspective/
│   └── categories.json              # 分类配置（roundtable 自管）
├── skills-superman/                 # git submodule → github.com/IchenDEV/superman.git
│   └── skills/                      # superman 的 58 个 skill
└── scripts/build-skills-manifest.mjs
```

**删除**：`skills/drucker-perspective/`、`skills/laozi-perspective/`、`skills/miyamoto-perspective/`、`skills/wangyangming-perspective/`（统一使用 superman 版本）

---

## 分类配置：`skills/categories.json`

分类作为 roundtable 自己维护的配置，不依赖 submodule 内部结构。

```json
{
  "军事战略": [
    "sun-wu-perspective",
    "sun-bin-perspective",
    "wu-qi-perspective",
    "han-xin-perspective",
    "huo-qubing-perspective",
    "qi-jiguang-perspective",
    "zhuge-liang-perspective",
    "guo-jia-perspective",
    "sima-yi-perspective",
    "zhang-liang-perspective"
  ],
  "政治治国": [
    "li-shimin-perspective",
    "wu-zetian-perspective",
    "zhu-yuanzhang-perspective",
    "shang-yang-perspective",
    "zhang-juzheng-perspective",
    "wang-anshi-perspective",
    "guan-zhong-perspective",
    "lu-buwei-perspective",
    "han-fei-perspective"
  ],
  "哲学思想": [
    "laozi-perspective",
    "zhuang-zi-perspective",
    "confucius-perspective",
    "mencius-perspective",
    "mo-zi-perspective",
    "xun-zi-perspective",
    "wangyangming-perspective",
    "plato-perspective",
    "socrates-perspective",
    "nietzsche-perspective",
    "camus-perspective",
    "sartre-perspective",
    "karl-marx-perspective",
    "legalist-perspective",
    "sage-perspective"
  ],
  "商业投资": [
    "munger-perspective",
    "naval-perspective",
    "warren-buffett-perspective",
    "paul-graham-perspective",
    "zhang-yiming-perspective",
    "zhangxuefeng-perspective",
    "drucker-perspective",
    "miyamoto-perspective",
    "steve-jobs-perspective",
    "elon-musk-perspective",
    "mrbeast-perspective",
    "trump-perspective",
    "taleb-perspective"
  ],
  "科技理工": [
    "newton-perspective",
    "leibniz-perspective",
    "turing-perspective",
    "von-neumann-perspective",
    "da-vinci-perspective",
    "bian-que-perspective",
    "feynman-perspective",
    "andrej-karpathy-perspective",
    "ilya-sutskever-perspective"
  ],
  "谋略纵横": [
    "guiguzi-perspective",
    "su-qin-perspective",
    "fan-li-perspective",
    "shen-buhai-perspective",
    "shen-dao-perspective",
    "deng-xi-perspective",
    "gongsun-long-perspective",
    "zou-yan-perspective",
    "yan-zi-perspective",
    "jia-yi-perspective",
    "liu-bowen-perspective",
    "yang-zhu-perspective",
    "xu-xing-perspective",
    "paul-perspective",
    "li-bai-perspective",
    "du-fu-perspective",
    "su-shi-perspective",
    "caocao-perspective"
  ]
}
```

---

## 数据层变更

### `lib/skills/types.ts`

`SkillEntry` 新增 `category` 字段：

```ts
export type SkillEntry = {
  skillId: string;
  name: string;
  description: string;
  contentHash: string;
  dirPath: string;
  entryPath: string;
  category: string; // 新增，来自 categories.json；未命中则为 "其他"
};
```

### `scripts/build-skills-manifest.mjs`

构建逻辑改为：

1. 扫描 `skills-superman/skills/`（superman 全部 58 个）
2. 扫描 `skills/`（roundtable-only 17 个，跳过 categories.json）
3. 读取 `skills/categories.json`，构建 skillId → category 映射
4. 合并输出到 `.generated/skills-manifest.json`，每条 entry 含 `category`

superman 目录优先：若同 skillId 在两处都有，以 superman 版为准（实际上删除重叠后不会发生）。

### `lib/skills/skill-display.ts`

新增 superman 中 54 个新人物的中文名和 brief（原有 21 条保留，重叠的 4 条更新为 superman 版描述）。

---

## API：`POST /api/roundtable/recommend`

**位置**：`app/api/roundtable/recommend/route.ts`

**请求体**：

```ts
{ topic: string; availableSkillIds: string[] }
```

**响应**：

```ts
{ recommendedSkillIds: string[] }  // 3-5 个
```

**实现**：

- 调用 Claude API（`claude-haiku-4-5-20251001`，低延迟）
- Prompt 包含：话题文本 + 所有人物的 `skillId / 中文名 / brief`
- 要求模型返回纯 JSON 数组，不超过 5 个 skillId
- 对模型输出做白名单校验（只允许 availableSkillIds 中存在的 id）
- 失败时返回 `{ error: string }`，HTTP 200（前端 toast 提示，不中断交互）
- 需鉴权（与现有 API 路由一致）

---

## UI 变更：`RoundtableClient.tsx`

### 分类展示

将现有平铺 button 列表改为按分类折叠展示：

- 每个分类为一个可展开/收起的区块，标题显示分类名 + `已选 x / 共 y`
- 默认展开第一个分类（军事战略），其余收起
- 人物 button 样式、选中状态、tooltip 与现有逻辑保持不变

### 智能推荐按钮

- 位置：「请哪些视角入席」标题右侧
- 文字：「智能推荐」；loading 时显示转圈图标
- 点击后：调用 `/api/roundtable/recommend`，成功则替换当前 `selected` 状态
- 失败则 toast 提示，不改变 `selected`
- 按钮在 `streaming === true` 时禁用

---

## 变更文件清单

| 文件                                    | 操作                                                   |
| --------------------------------------- | ------------------------------------------------------ |
| `.gitmodules`                           | 新增 superman submodule（`skills-superman`）           |
| `skills-superman/`                      | git submodule，指向 `github.com/IchenDEV/superman.git` |
| `skills/drucker-perspective/`           | 删除                                                   |
| `skills/laozi-perspective/`             | 删除                                                   |
| `skills/miyamoto-perspective/`          | 删除                                                   |
| `skills/wangyangming-perspective/`      | 删除                                                   |
| `skills/categories.json`                | 新建                                                   |
| `scripts/build-skills-manifest.mjs`     | 修改：扫描双目录 + 注入 category                       |
| `lib/skills/types.ts`                   | `SkillEntry` 加 `category` 字段                        |
| `lib/skills/skill-display.ts`           | 补充 54 个新人物中文名 + brief                         |
| `app/api/roundtable/recommend/route.ts` | 新建                                                   |
| `app/roundtable/RoundtableClient.tsx`   | 分类 UI + 推荐按钮                                     |

---

## 不在本次范围内

- superman submodule 内部 SKILL.md 的任何修改
- 分类配置的 UI 管理界面
- 推荐结果的持久化或缓存
