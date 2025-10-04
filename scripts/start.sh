#!/bin/sh

# 启动 Next.js 应用
node_modules/.bin/next start &

# 获取 Next.js 进程 PID
NEXT_PID=$!

# 等待应用启动（等待 5 秒）
sleep 10

# 执行 revalidate 请求
echo "执行 revalidate 请求..."
if [ -n "$REVALIDATE_SECRET" ]; then
    if curl -X POST "127.0.0.1:3000/api/revalidate?secret=$REVALIDATE_SECRET" > /dev/null 2>&1; then
        echo "✅ Revalidate 请求执行成功"
    else
        echo "Revalidate 请求失败，应用可能还在启动中"
    fi
else
    echo "警告: REVALIDATE_SECRET 环境变量未设置，跳过 revalidate 请求"
fi

# 等待 Next.js 进程结束
wait $NEXT_PID