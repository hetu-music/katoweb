# 构建阶段
FROM node:20-slim AS builder
WORKDIR /app

# 启用 corepack 安装 pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# 复制依赖文件
COPY package.json pnpm-lock.yaml ./

# 安装生产依赖
RUN pnpm install --frozen-lockfile --prod

# 复制必要源码
COPY . .

# 设置生产环境并构建
ENV NODE_ENV=production
RUN pnpm build

# 运行阶段
FROM node:20-slim AS runner
WORKDIR /app

# 安装 sharp 依赖
RUN apt-get update && apt-get install -y libvips-dev && apt-get clean

# 复制构建产物和必要文件
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/next.config.ts ./next.config.ts

# 设置环境变量
ENV NODE_ENV=production

# 暴露端口并启动
EXPOSE 3000
CMD ["pnpm", "start"]