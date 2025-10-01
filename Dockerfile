FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

ENV SUPABASE_URL=placeholder
ENV SUPABASE_SECRET_API=placeholder

COPY . .

RUN pnpm build

FROM node:20-alpine AS runner

WORKDIR /app

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/scripts ./scripts

# 安装 curl
RUN apk add --no-cache curl

# 给启动脚本执行权限
RUN chmod +x ./scripts/start.sh

ENV NODE_ENV=production

EXPOSE 3000
CMD ["./scripts/start.sh"]