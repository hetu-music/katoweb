FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

ENV SUPABASE_URL=placeholder
ENV SUPABASE_SECRET_API=placeholder
ENV NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x4AAAAAACFYZvRbKjlgehcx

COPY . .

RUN pnpm build

FROM node:20-alpine AS runner

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

# 只复制独立构建所需的文件
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/scripts ./scripts

# 安装 curl (用于 start.sh 中的 revalidate 请求)
RUN apk add --no-cache curl

# 给启动脚本执行权限
RUN chmod +x ./scripts/start.sh

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

EXPOSE 3000

CMD ["./scripts/start.sh"]