import { NextRequest, NextResponse } from "next/server";
import { withAuth, type AuthenticatedUser } from "@/lib/server-auth";
import type { DetailResponse } from "@/lib/api-auto-complete";
import { neteaseProvider, type MusicProvider } from "./providers";

// ============================================
// 提供者注册表
// ============================================

const providers: Record<string, MusicProvider> = {
  netease: neteaseProvider,
  // 后续可添加其他提供者，例如：
  // kugou: kugouProvider,
};

/** 默认提供者 */
const DEFAULT_PROVIDER = "netease";

// ============================================
// API 路由 Handler
// ============================================

export const GET = withAuth(
  async (request: NextRequest, _user: AuthenticatedUser) => {
    try {
      const { searchParams } = new URL(request.url);
      const action = searchParams.get("action") || "search";
      const providerName = searchParams.get("provider") || DEFAULT_PROVIDER;

      // 获取提供者
      const provider = providers[providerName];
      if (!provider) {
        return NextResponse.json(
          { error: `未知的提供者: ${providerName}` },
          { status: 400 },
        );
      }

      // 1. 搜索模式
      if (action === "search") {
        const keywords = searchParams.get("keywords");
        const limit = parseInt(searchParams.get("limit") || "10", 10);

        if (!keywords) {
          return NextResponse.json(
            { error: "缺少 keywords 参数" },
            { status: 400 },
          );
        }

        const data = await provider.searchSongs(keywords, limit);
        return NextResponse.json(data);
      }

      // 2. 详情模式
      if (action === "detail") {
        const id = searchParams.get("id");
        if (!id) {
          return NextResponse.json({ error: "缺少 id 参数" }, { status: 400 });
        }

        // 从查询参数获取前端透传的基础信息
        const duration = searchParams.get("duration");
        const publishTime = searchParams.get("publishTime");
        const album = searchParams.get("album");
        const albumartist = searchParams.get("albumartist");

        const data = await provider.getSongDetail(
          parseInt(id, 10),
          duration ? parseInt(duration, 10) : null,
          publishTime ? parseInt(publishTime, 10) : null,
          album || null,
          albumartist || null,
        );

        const response: DetailResponse = { type: "detail", data };
        return NextResponse.json(response);
      }

      return NextResponse.json(
        { error: "无效的 action 参数" },
        { status: 400 },
      );
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("Auto-complete error:", msg);
      return NextResponse.json({ error: "自动补全请求失败" }, { status: 500 });
    }
  },
  { requireCSRF: true },
);
