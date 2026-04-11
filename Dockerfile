# ---------------------------------------------------------
# 圆桌 Skill 云 — 多阶段构建（本地开发 / 自托管用）
# 生产环境部署于 Vercel，此 Dockerfile 仅用于本地容器化运行。
# 需要在 next.config.ts 中添加 output: "standalone" 方可正常工作。
# ---------------------------------------------------------

# ── Base ─────────────────────────────────────────────────
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate
WORKDIR /app

# ── Dependencies ─────────────────────────────────────────
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ── Builder ──────────────────────────────────────────────
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# prebuild (build:skills) 由 package.json 的 prebuild 脚本自动触发
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm run build

# ── Runner ───────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

# standalone 输出
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 运行时读取的内容文件
COPY --from=builder /app/content ./content

# 构建时生成的 Skill 清单
COPY --from=builder /app/.generated ./.generated

# skills 目录（SKILL.md 源文件，部分逻辑可能运行时读取）
COPY --from=builder /app/skills ./skills

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
