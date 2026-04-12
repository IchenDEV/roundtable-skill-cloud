# Skill Categories + Auto-Recommend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 58 superman skills via git submodule, replace 4 overlapping skills, add UI category grouping, and add a one-click "智能推荐" button that calls Claude to pick 3-5 relevant participants.

**Architecture:** Superman repo added as `skills-superman/` submodule. A new `skills/categories.json` maps skillIds to categories. The build script scans both `skills-superman/skills/` and `skills/`, injects `category` from the JSON, and writes a unified manifest. The recommend endpoint calls Claude with the topic + skill list and returns 3-5 skillIds. The UI groups skill buttons by category in collapsible sections and adds a recommend button.

**Tech Stack:** Next.js 15 App Router, TypeScript, `@anthropic-ai/sdk`, Zod, Vitest, Tailwind CSS, Lucide React.

---

## File Map

| File                                              | Action                                          |
| ------------------------------------------------- | ----------------------------------------------- |
| `skills-superman/`                                | Create (git submodule)                          |
| `skills/drucker-perspective/`                     | Delete                                          |
| `skills/laozi-perspective/`                       | Delete                                          |
| `skills/miyamoto-perspective/`                    | Delete                                          |
| `skills/wangyangming-perspective/`                | Delete                                          |
| `skills/categories.json`                          | Create                                          |
| `scripts/build-skills-manifest.mjs`               | Modify — scan two dirs + inject category        |
| `lib/skills/types.ts`                             | Modify — add `category: string` to `SkillEntry` |
| `lib/skills/skill-display.ts`                     | Modify — add 54 new entries                     |
| `tests/unit/load-manifest.test.ts`                | Modify — add `category` to mock                 |
| `tests/unit/lookup.test.ts`                       | Modify — add `category` to mock                 |
| `app/api/roundtable/recommend/route.ts`           | Create                                          |
| `components/roundtable/use-roundtable-session.ts` | Modify — add `category` to `SkillOpt`           |
| `app/roundtable/page.tsx`                         | Modify — pass `category` from manifest          |
| `app/roundtable/RoundtableClient.tsx`             | Modify — category UI + recommend button         |

---

## Task 1: Add superman git submodule

**Files:**

- Create: `skills-superman/` (via git submodule)

- [ ] **Step 1: Add the submodule**

```bash
cd /Users/chenli/projects/roundtable-skill-cloud
git submodule add https://github.com/IchenDEV/superman.git skills-superman
```

Expected output: `Cloning into '.../skills-superman'...` followed by `skills-superman` appearing in `.gitmodules`.

- [ ] **Step 2: Verify submodule contents**

```bash
ls skills-superman/skills/ | head -10
```

Expected: directory listing starting with `bian-que-perspective`, `camus-perspective`, etc.

- [ ] **Step 3: Commit**

```bash
git add .gitmodules skills-superman
git commit -m "chore: add superman perspectives as git submodule"
```

---

## Task 2: Remove the 4 overlapping skills from skills/

Superman versions of these 4 will be used instead.

**Files:**

- Delete: `skills/drucker-perspective/`, `skills/laozi-perspective/`, `skills/miyamoto-perspective/`, `skills/wangyangming-perspective/`

- [ ] **Step 1: Delete the directories**

```bash
git rm -r skills/drucker-perspective skills/laozi-perspective skills/miyamoto-perspective skills/wangyangming-perspective
```

- [ ] **Step 2: Commit**

```bash
git commit -m "chore: remove overlapping skills (superseded by superman submodule versions)"
```

---

## Task 3: Create skills/categories.json

**Files:**

- Create: `skills/categories.json`

- [ ] **Step 1: Write the file**

Create `skills/categories.json` with this exact content:

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

- [ ] **Step 2: Commit**

```bash
git add skills/categories.json
git commit -m "feat: add skill category configuration"
```

---

## Task 4: Update SkillEntry type + fix test mocks

**Files:**

- Modify: `lib/skills/types.ts`
- Modify: `tests/unit/load-manifest.test.ts`
- Modify: `tests/unit/lookup.test.ts`

- [ ] **Step 1: Add `category` to SkillEntry in `lib/skills/types.ts`**

Replace the entire file content with:

```ts
export type SkillEntry = {
  skillId: string;
  name: string;
  description: string;
  contentHash: string;
  dirPath: string;
  entryPath: string;
  category: string;
};

export type SkillManifest = {
  generatedAt: string;
  skills: SkillEntry[];
};
```

- [ ] **Step 2: Update mock in `tests/unit/load-manifest.test.ts`**

Find the `manifestJson` variable and update the skill object to include `category: "其他"`:

```ts
const manifestJson = JSON.stringify({
  generatedAt: "g",
  skills: [
    {
      skillId: "s1",
      name: "N",
      description: "",
      contentHash: "h",
      dirPath: "skills/s1",
      entryPath: "skills/s1/SKILL.md",
      category: "其他",
    },
  ],
});
```

- [ ] **Step 3: Update mock in `tests/unit/lookup.test.ts`**

Find the `manifest` const and add `category: "其他"` to the skill object:

```ts
const manifest: SkillManifest = {
  generatedAt: "x",
  skills: [
    {
      skillId: "one",
      name: "One",
      description: "",
      contentHash: "h",
      dirPath: "skills/one",
      entryPath: "skills/one/SKILL.md",
      category: "其他",
    },
  ],
};
```

- [ ] **Step 4: Run tests to verify no breakage**

```bash
pnpm test
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/skills/types.ts tests/unit/load-manifest.test.ts tests/unit/lookup.test.ts
git commit -m "feat: add category field to SkillEntry type"
```

---

## Task 5: Update build-skills-manifest.mjs to scan two directories + inject category

**Files:**

- Modify: `scripts/build-skills-manifest.mjs`

- [ ] **Step 1: Replace the entire script with the updated version**

```js
#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

// Two skill source directories — superman submodule first, then local overrides
const skillSourceDirs = [path.join(root, "skills-superman", "skills"), path.join(root, "skills")];

const categoriesFile = path.join(root, "skills", "categories.json");
const outDir = path.join(root, ".generated");
const outFile = path.join(outDir, "skills-manifest.json");

function hashDir(dirPath) {
  const h = crypto.createHash("sha256");
  const files = [];
  (function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, e.name);
      if (e.isDirectory()) walk(full);
      else files.push(full);
    }
  })(dirPath);
  files.sort();
  for (const f of files) h.update(fs.readFileSync(f));
  return h.digest("hex").slice(0, 16);
}

function walkSkillDirs(sourceDir) {
  if (!fs.existsSync(sourceDir)) return [];
  const entries = fs.readdirSync(sourceDir, { withFileTypes: true });
  const dirs = entries.filter((e) => e.isDirectory()).map((e) => e.name);
  const result = [];
  for (const id of dirs) {
    const md = path.join(sourceDir, id, "SKILL.md");
    if (fs.existsSync(md)) result.push({ skillId: id, dir: path.join(sourceDir, id), file: md });
  }
  return result;
}

function buildCategoryMap() {
  if (!fs.existsSync(categoriesFile)) return {};
  const raw = JSON.parse(fs.readFileSync(categoriesFile, "utf8"));
  const map = {};
  for (const [cat, ids] of Object.entries(raw)) {
    for (const id of ids) {
      map[id] = cat;
    }
  }
  return map;
}

function main() {
  fs.mkdirSync(outDir, { recursive: true });

  const categoryMap = buildCategoryMap();

  // Collect all skills; if same skillId appears in multiple dirs, first wins
  const seen = new Set();
  const skills = [];

  for (const sourceDir of skillSourceDirs) {
    const items = walkSkillDirs(sourceDir);
    for (const { skillId, dir, file } of items) {
      if (seen.has(skillId)) continue; // first source (superman) wins
      seen.add(skillId);

      const raw = fs.readFileSync(file, "utf8");
      const { data } = matter(raw);
      const contentHash = hashDir(dir);
      const name = typeof data.name === "string" ? data.name : skillId;
      const description = typeof data.description === "string" ? data.description : "";
      const category = categoryMap[skillId] ?? "其他";

      skills.push({
        skillId,
        name,
        description,
        contentHash,
        dirPath: path.relative(root, dir),
        entryPath: path.relative(root, file),
        category,
      });
    }
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    skills,
  };

  fs.writeFileSync(outFile, JSON.stringify(manifest, null, 2), "utf8");
  console.log(`Wrote ${skills.length} skills → ${path.relative(root, outFile)}`);
}

main();
```

- [ ] **Step 2: Run the build script to verify it works**

```bash
pnpm build:skills
```

Expected output: `Wrote 75 skills → .generated/skills-manifest.json`

- [ ] **Step 3: Spot-check the manifest output**

```bash
node -e "const m = JSON.parse(require('fs').readFileSync('.generated/skills-manifest.json','utf8')); console.log('total:', m.skills.length); console.log('sample:', JSON.stringify(m.skills.find(s => s.skillId === 'sun-wu-perspective'), null, 2));"
```

Expected: `total: 75` and a sun-wu-perspective entry with `"category": "军事战略"`.

- [ ] **Step 4: Commit**

```bash
git add scripts/build-skills-manifest.mjs .generated/skills-manifest.json
git commit -m "feat: update manifest builder to scan superman submodule + inject categories"
```

---

## Task 6: Update skill-display.ts with 54 new entries

**Files:**

- Modify: `lib/skills/skill-display.ts`

- [ ] **Step 1: Add the 54 new entries to SKILL_DISPLAY**

Open `lib/skills/skill-display.ts` and add the following entries to the `SKILL_DISPLAY` record (keep all existing 21 entries, just add these new ones):

```ts
  // === Superman skills ===
  "sun-wu-perspective": { label: "孙武", brief: "孙子兵法，战略算法与不战而屈人之兵" },
  "sun-bin-perspective": { label: "孙膑", brief: "减灶诱敌，间接路线与势差作战" },
  "wu-qi-perspective": { label: "吴起", brief: "战国名将，兵法与军队激励管理" },
  "han-xin-perspective": { label: "韩信", brief: "汉初军神，背水一战与极限势差" },
  "huo-qubing-perspective": { label: "霍去病", brief: "闪电奇袭，以速决胜与极简战法" },
  "qi-jiguang-perspective": { label: "戚继光", brief: "抗倭名将，军事改革与纪律体系" },
  "zhuge-liang-perspective": { label: "诸葛亮", brief: "三国智圣，全局战略与鞠躬尽瘁" },
  "guo-jia-perspective": { label: "郭嘉", brief: "曹魏谋士，风险判断与奇谋决策" },
  "sima-yi-perspective": { label: "司马懿", brief: "三国谋略家，隐忍待机与长线博弈" },
  "zhang-liang-perspective": { label: "张良", brief: "汉初三杰，谋略辅佐与功成身退" },
  "li-shimin-perspective": { label: "李世民", brief: "唐太宗，贞观之治与用人纳谏" },
  "wu-zetian-perspective": { label: "武则天", brief: "中国唯一女皇，权力运营与政治手段" },
  "zhu-yuanzhang-perspective": { label: "朱元璋", brief: "明太祖，草根逆袭与制度铁腕" },
  "shang-yang-perspective": { label: "商鞅", brief: "法家变法，奖惩机制与制度设计" },
  "zhang-juzheng-perspective": { label: "张居正", brief: "明朝首辅，制度改革与行政效能" },
  "wang-anshi-perspective": { label: "王安石", brief: "北宋变法，财政改革与制度创新" },
  "guan-zhong-perspective": { label: "管仲", brief: "春秋第一相，富国强兵与经济治国" },
  "lu-buwei-perspective": { label: "吕不韦", brief: "商人丞相，政治投资与奇货可居" },
  "han-fei-perspective": { label: "韩非", brief: "法家集大成者，法术势三论" },
  "confucius-perspective": { label: "孔子", brief: "仁义礼智，儒家伦理与教育之道" },
  "mencius-perspective": { label: "孟子", brief: "性善论，仁政民本与浩然之气" },
  "mo-zi-perspective": { label: "墨子", brief: "兼爱非攻，平等主义与工程实用" },
  "xun-zi-perspective": { label: "荀子", brief: "性恶论，礼法并重与实用儒学" },
  "zhuang-zi-perspective": { label: "庄子", brief: "逍遥游，相对主义与自然自由" },
  "plato-perspective": { label: "柏拉图", brief: "理念论，洞穴比喻与哲人王设计" },
  "socrates-perspective": { label: "苏格拉底", brief: "苏格拉底问答法，批判性思维" },
  "nietzsche-perspective": { label: "尼采", brief: "超人哲学，权力意志与价值重估" },
  "camus-perspective": { label: "加缪", brief: "荒诞哲学，反抗与存在意义重建" },
  "sartre-perspective": { label: "萨特", brief: "存在主义，自由选择与彻底责任" },
  "newton-perspective": { label: "牛顿", brief: "万有引力与微积分，第一原理建模" },
  "leibniz-perspective": { label: "莱布尼茨", brief: "微积分、二进制与普遍符号语言" },
  "turing-perspective": { label: "图灵", brief: "计算机之父，图灵机与人工智能基础" },
  "von-neumann-perspective": { label: "冯·诺依曼", brief: "计算机架构，博弈论与极限数学" },
  "da-vinci-perspective": { label: "达·芬奇", brief: "文艺复兴巨匠，跨领域观察与创造" },
  "bian-que-perspective": { label: "扁鹊", brief: "中医诊断鼻祖，望闻问切与预防思维" },
  "guiguzi-perspective": { label: "鬼谷子", brief: "纵横鼻祖，游说术与心理博弈" },
  "su-qin-perspective": { label: "苏秦", brief: "合纵策略，多方联盟与势力平衡" },
  "fan-li-perspective": { label: "范蠡", brief: "越国谋士，商道经营与功成身退" },
  "shen-buhai-perspective": { label: "申不害", brief: "法家术治，权术管理与组织控制" },
  "shen-dao-perspective": { label: "慎到", brief: "法家势论，制度权威与无为而治" },
  "deng-xi-perspective": { label: "邓析", brief: "名辩之祖，法律辩术与逻辑推演" },
  "gongsun-long-perspective": { label: "公孙龙", brief: "白马非马，名实辩证与概念分析" },
  "zou-yan-perspective": { label: "邹衍", brief: "阴阳五行，宏大叙事与历史周期论" },
  "yan-zi-perspective": { label: "晏子", brief: "齐国名相，谏诤智慧与外交辞令" },
  "jia-yi-perspective": { label: "贾谊", brief: "西汉政论，过秦论与治乱兴衰分析" },
  "liu-bowen-perspective": { label: "刘伯温", brief: "明朝谋士，策略推演与治乱预判" },
  "yang-zhu-perspective": { label: "杨朱", brief: "贵己思想，个人主义与自我保全" },
  "xu-xing-perspective": { label: "许行", brief: "农家学说，劳动价值与自给自足" },
  "paul-perspective": { label: "保罗使徒", brief: "基督教神学奠基，信仰传播与组织建设" },
  "li-bai-perspective": { label: "李白", brief: "诗仙，浪漫主义与自由不羁精神" },
  "du-fu-perspective": { label: "杜甫", brief: "诗圣，忧国忧民与现实主义情怀" },
  "su-shi-perspective": { label: "苏轼", brief: "苏东坡，全才文人与旷达人生观" },
  "caocao-perspective": { label: "曹操", brief: "魏武帝，乱世枭雄与政军一体统治" },
  "zeng-guofan-perspective": { label: "曾国藩", brief: "晚清中兴名臣，修身治学与知人善用" },
```

- [ ] **Step 2: Run tests**

```bash
pnpm test -- tests/unit/skill-display.test.ts
```

Expected: PASS (existing tests unchanged).

- [ ] **Step 3: Commit**

```bash
git add lib/skills/skill-display.ts
git commit -m "feat: add display metadata for 54 new superman skill perspectives"
```

---

## Task 7: Create the recommend API endpoint

**Files:**

- Create: `app/api/roundtable/recommend/route.ts`

- [ ] **Step 1: Create the file**

Create `app/api/roundtable/recommend/route.ts`:

```ts
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parseJsonBody } from "@/lib/server/parse-json-body";
import { getSkillDisplay } from "@/lib/skills/skill-display";

export const runtime = "nodejs";
export const maxDuration = 30;

const bodySchema = z.object({
  topic: z.string().min(1).max(500),
  availableSkillIds: z.array(z.string().max(80)).min(1).max(100),
});

function isDevBypass() {
  return process.env.NODE_ENV === "development" && !!process.env.DEV_LLM_API_KEY?.trim();
}

export async function POST(req: Request) {
  // Auth check
  if (!isDevBypass()) {
    const supabase = await createSupabaseServerClient();
    if (!supabase) {
      return Response.json({ error: "服务端未配置账户库。" }, { status: 503 });
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return Response.json({ error: "请先登入。" }, { status: 401 });
    }
  }

  const body = await parseJsonBody(req, bodySchema);
  if (!body.ok) {
    return Response.json({ error: body.error }, { status: body.status });
  }

  const { topic, availableSkillIds } = body.data;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "服务端未配置推荐引擎。" }, { status: 503 });
  }

  // Build roster string for prompt
  const roster = availableSkillIds
    .map((id) => {
      const d = getSkillDisplay(id);
      return `${id}: ${d.label}（${d.brief}）`;
    })
    .join("\n");

  const prompt = `你是一个圆桌讨论主持人。用户想讨论以下话题：

"${topic}"

以下是所有可选人物（格式：skillId: 姓名（简介））：
${roster}

请从中选出最适合讨论这个话题的 3 到 5 位人物。只返回一个 JSON 数组，包含对应的 skillId 字符串，不要任何其他文字。例如：["sun-wu-perspective","plato-perspective"]`;

  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 256,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text.trim() : "";

    // Parse and whitelist-validate
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      return Response.json({ error: "推荐引擎返回格式异常，请重试。" });
    }

    if (!Array.isArray(parsed)) {
      return Response.json({ error: "推荐引擎返回格式异常，请重试。" });
    }

    const validSet = new Set(availableSkillIds);
    const recommendedSkillIds = (parsed as unknown[])
      .filter((x): x is string => typeof x === "string" && validSet.has(x))
      .slice(0, 5);

    if (recommendedSkillIds.length === 0) {
      return Response.json({ error: "推荐引擎未能找到合适人物，请手动选择。" });
    }

    return Response.json({ recommendedSkillIds });
  } catch {
    return Response.json({ error: "推荐引擎调用失败，请重试。" });
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles (no tsc errors)**

```bash
pnpm exec tsc --noEmit 2>&1 | head -20
```

Expected: no errors (or only pre-existing ones unrelated to this file).

- [ ] **Step 3: Commit**

```bash
git add app/api/roundtable/recommend/route.ts
git commit -m "feat: add /api/roundtable/recommend endpoint for smart participant suggestion"
```

---

## Task 8: Update SkillOpt type and page.tsx

**Files:**

- Modify: `components/roundtable/use-roundtable-session.ts`
- Modify: `app/roundtable/page.tsx`

- [ ] **Step 1: Add `category` to `SkillOpt` in `components/roundtable/use-roundtable-session.ts`**

Find line:

```ts
export type SkillOpt = { skillId: string; name: string; description: string };
```

Replace with:

```ts
export type SkillOpt = { skillId: string; name: string; description: string; category: string };
```

- [ ] **Step 2: Update `app/roundtable/page.tsx` to pass `category` from manifest**

Find the skills mapping block:

```ts
skills = m.skills.map((s) => ({
  skillId: s.skillId,
  name: s.name,
  description: s.description,
}));
```

Replace with:

```ts
skills = m.skills.map((s) => ({
  skillId: s.skillId,
  name: s.name,
  description: s.description,
  category: s.category,
}));
```

- [ ] **Step 3: Run tests**

```bash
pnpm test
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add components/roundtable/use-roundtable-session.ts app/roundtable/page.tsx
git commit -m "feat: propagate skill category from manifest through to UI data layer"
```

---

## Task 9: Update RoundtableClient — category grouping + recommend button

**Files:**

- Modify: `app/roundtable/RoundtableClient.tsx`

This task replaces the flat skill button list with categorized collapsible sections and adds the recommend button. Make all changes to `RoundtableClient.tsx`.

- [ ] **Step 1: Add `useMemo` import and category constants at the top of the component**

The file already imports from `react`. Find the existing import and add `useMemo` if not present:

```ts
import { useState, useMemo } from "react";
```

Add this constant just above the `RoundtableClient` function definition:

```ts
const CATEGORY_ORDER = ["军事战略", "政治治国", "哲学思想", "商业投资", "科技理工", "谋略纵横", "其他"];
```

- [ ] **Step 2: Add state and derived data inside `RoundtableClient`**

Inside `RoundtableClient`, after the existing `const [memoryOpen, setMemoryOpen] = useState(false);` line, add:

```ts
const [openCategories, setOpenCategories] = useState<Set<string>>(() => new Set([CATEGORY_ORDER[0]]));
const [recommendLoading, setRecommendLoading] = useState(false);
const [recommendError, setRecommendError] = useState<string | null>(null);

const groupedSkills = useMemo(() => {
  const groups: Record<string, typeof skills> = {};
  for (const s of skills) {
    const cat = s.category || "其他";
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(s);
  }
  return groups;
}, [skills]);

const orderedCategories = useMemo(() => CATEGORY_ORDER.filter((c) => groupedSkills[c]?.length > 0), [groupedSkills]);

const toggleCategory = (cat: string) =>
  setOpenCategories((prev) => {
    const next = new Set(prev);
    if (next.has(cat)) next.delete(cat);
    else next.add(cat);
    return next;
  });

const handleRecommend = async () => {
  if (!topic.trim() || skills.length === 0) return;
  setRecommendLoading(true);
  setRecommendError(null);
  try {
    const res = await fetch("/api/roundtable/recommend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic: topic.trim(), availableSkillIds: skills.map((s) => s.skillId) }),
    });
    const data = (await res.json()) as { recommendedSkillIds?: string[]; error?: string };
    if (data.recommendedSkillIds && data.recommendedSkillIds.length > 0) {
      toggle(data.recommendedSkillIds[0]); // use existing toggle won't work for bulk-set
      // Bulk-set selected: expose a setter from session or set directly
      setSelectedDirectly(data.recommendedSkillIds);
    } else {
      setRecommendError(data.error ?? "推荐失败，请重试。");
    }
  } catch {
    setRecommendError("网络错误，请重试。");
  } finally {
    setRecommendLoading(false);
  }
};
```

> **Note:** The `handleRecommend` function calls `setSelectedDirectly`. You need to expose this from `use-roundtable-session.ts` in the next step.

- [ ] **Step 3: Expose `setSelected` as `setSelectedDirectly` from `use-roundtable-session.ts`**

In `components/roundtable/use-roundtable-session.ts`, find the return object of `useRoundtableSession` and add `setSelectedDirectly: setSelected` to it. Then also add `setSelectedDirectly: (ids: string[]) => void` to the return type.

Find where `toggle` is returned and add alongside it:

```ts
setSelectedDirectly: setSelected,
```

Then update the destructuring in `RoundtableClient.tsx`:

```ts
const {
  // ... existing fields ...
  setSelectedDirectly,
  toggle,
  // ...
} = session;
```

And update `handleRecommend` to use `setSelectedDirectly` directly:

```ts
      if (data.recommendedSkillIds && data.recommendedSkillIds.length > 0) {
        setSelectedDirectly(data.recommendedSkillIds);
      } else {
```

- [ ] **Step 4: Replace the flat skill button list in the JSX**

Find this block in `RoundtableClient.tsx` (around the `请哪些视角入席` section):

```tsx
<div>
  <span className="text-sm text-ink-900">请哪些视角入席</span>
  <div className="mt-2 flex flex-wrap gap-2">
    {skills.map((s) => {
      const d = getSkillDisplay(s.skillId);
      return (
        <Button
          key={s.skillId}
          type="button"
          variant="outline"
          size="sm"
          title={d.brief}
          onClick={() => toggle(s.skillId)}
          className={cn(
            "font-sans transition-[transform,border-color,background-color] duration-150 active:scale-[0.97]",
            selected.includes(s.skillId) &&
              "border-cinnabar-600 bg-cinnabar-600/10 text-cinnabar-800 hover:bg-cinnabar-600/15"
          )}
        >
          {d.label}
        </Button>
      );
    })}
  </div>
</div>
```

Replace with:

```tsx
<div>
  <div className="flex items-center justify-between">
    <span className="text-sm text-ink-900">请哪些视角入席</span>
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={streaming || recommendLoading || !topic.trim() || skills.length === 0}
      onClick={handleRecommend}
      className="font-sans text-xs"
    >
      {recommendLoading ? <Loader2 className="size-3 animate-spin" /> : "智能推荐"}
    </Button>
  </div>
  {recommendError && <p className="mt-1 text-xs text-cinnabar-700">{recommendError}</p>}
  <div className="mt-2 space-y-1">
    {orderedCategories.map((cat) => {
      const isOpen = openCategories.has(cat);
      const catSkills = groupedSkills[cat] ?? [];
      const selectedCount = catSkills.filter((s) => selected.includes(s.skillId)).length;
      return (
        <div key={cat} className="rounded-sm border border-ink-200/40">
          <button
            type="button"
            onClick={() => toggleCategory(cat)}
            className="flex w-full items-center justify-between px-2 py-1.5 text-xs text-ink-700 hover:bg-ink-50"
          >
            <span className="flex items-center gap-1">
              {isOpen ? <ChevronDown className="size-3 shrink-0" /> : <ChevronRight className="size-3 shrink-0" />}
              {cat}
            </span>
            <span className="text-ink-400">
              {selectedCount > 0 ? `已选 ${selectedCount} / ` : ""}共 {catSkills.length}
            </span>
          </button>
          {isOpen && (
            <div className="flex flex-wrap gap-1.5 border-t border-ink-200/30 px-2 py-2">
              {catSkills.map((s) => {
                const d = getSkillDisplay(s.skillId);
                return (
                  <Button
                    key={s.skillId}
                    type="button"
                    variant="outline"
                    size="sm"
                    title={d.brief}
                    onClick={() => toggle(s.skillId)}
                    className={cn(
                      "font-sans text-xs transition-[transform,border-color,background-color] duration-150 active:scale-[0.97]",
                      selected.includes(s.skillId) &&
                        "border-cinnabar-600 bg-cinnabar-600/10 text-cinnabar-800 hover:bg-cinnabar-600/15"
                    )}
                  >
                    {d.label}
                  </Button>
                );
              })}
            </div>
          )}
        </div>
      );
    })}
  </div>
</div>
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
pnpm exec tsc --noEmit 2>&1 | head -30
```

Expected: no new errors.

- [ ] **Step 6: Run tests**

```bash
pnpm test
```

Expected: all tests pass.

- [ ] **Step 7: Start dev server and test in browser**

```bash
pnpm dev
```

Open `http://localhost:3000/roundtable` and verify:

- Skills are grouped into 6 collapsible categories
- First category ("军事战略") is expanded by default, others collapsed
- Each category header shows "共 N" or "已选 X / 共 N"
- Clicking a person button toggles selection (cinnabar highlight)
- Clicking category header expands/collapses it
- Typing a topic and clicking "智能推荐" auto-selects 3-5 relevant people
- "智能推荐" shows loading spinner while fetching
- If recommend fails, error text appears below the button

- [ ] **Step 8: Commit**

```bash
git add app/roundtable/RoundtableClient.tsx components/roundtable/use-roundtable-session.ts
git commit -m "feat: category grouping UI + smart recommend button for participant selection"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement                                | Task   |
| ----------------------------------------------- | ------ |
| superman as submodule                           | Task 1 |
| Delete 4 overlapping skills                     | Task 2 |
| categories.json                                 | Task 3 |
| SkillEntry.category type                        | Task 4 |
| Build script scans both dirs + injects category | Task 5 |
| skill-display for new 54 entries                | Task 6 |
| POST /api/roundtable/recommend                  | Task 7 |
| SkillOpt + page.tsx plumbing                    | Task 8 |
| Category UI (collapsible, counts)               | Task 9 |
| Recommend button (loading, error, auto-select)  | Task 9 |

All spec requirements covered.

**Type consistency:**

- `SkillEntry.category: string` defined in Task 4, used in Task 5 (build script), Task 8 (page.tsx mapping)
- `SkillOpt.category: string` defined in Task 8, built from `SkillEntry.category`
- `setSelectedDirectly` exposed in Task 9 Step 3, consumed in same task Step 2
- `groupedSkills`, `orderedCategories`, `toggleCategory`, `handleRecommend` all defined before use in JSX

**No placeholders detected.**
