import { NextRequest, NextResponse } from "next/server";
import { withAuth, type AuthenticatedUser } from "@/lib/server-auth";

// Hetu API 基础地址 - 只能在服务器端访问
const HETU_API_BASE = "http://hetu-api:3000";

export const GET = withAuth(
    async (request: NextRequest, _user: AuthenticatedUser) => {
        try {
            const { searchParams } = new URL(request.url);
            const title = searchParams.get("title");
            const album = searchParams.get("album");

            if (!title) {
                return NextResponse.json(
                    { error: "缺少 title 参数" },
                    { status: 400 },
                );
            }

            // 构建请求参数
            const params = new URLSearchParams({ title });
            if (album) params.append("album", album);

            // 从服务器端请求 hetu-api
            // TODO: 等实现后定义具体的 API 路径和参数
            const res = await fetch(`${HETU_API_BASE}/api/song/search?${params}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (!res.ok) {
                if (res.status === 404) {
                    return NextResponse.json(
                        { error: "未找到匹配的歌曲" },
                        { status: 404 },
                    );
                }
                throw new Error(`Hetu API 请求失败: ${res.status}`);
            }

            const data = await res.json();
            return NextResponse.json(data);
        } catch (e: unknown) {
            if (
                e &&
                typeof e === "object" &&
                "message" in e &&
                typeof (e as Error).message === "string"
            ) {
                console.error("Auto-complete error:", (e as Error).message);
            } else {
                console.error("Auto-complete error:", e);
            }
            return NextResponse.json(
                { error: "自动补全请求失败" },
                { status: 500 },
            );
        }
    },
    { requireCSRF: true },
);
