# 1. 使用官方 Node.js 运行时作为基础镜像
FROM node:20-alpine AS builder

# 2. 设置工作目录
WORKDIR /app

# 3. 复制依赖文件并安装 pnpm
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm

# 4. 安装依赖
RUN pnpm install --frozen-lockfile

# 5. 复制所有源代码
COPY . .

# 6. 构建 Next.js 应用
RUN pnpm build

# 7. 生产环境镜像
FROM node:20-alpine AS runner
WORKDIR /app

# 8. 只复制生产需要的文件
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

# 9. 设置环境变量
ENV NODE_ENV=production

# 10. 启动 Next.js 应用
EXPOSE 3000
CMD ["node_modules/.bin/next", "start"] 