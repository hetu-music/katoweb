import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { locales } from "@/i18n/config";

export async function POST(request: NextRequest) {
  try {
    // 添加安全验证
    const secret = request.nextUrl.searchParams.get("secret");
    if (secret !== process.env.REVALIDATE_SECRET) {
      return new NextResponse("ERROR: Invalid secret", {
        status: 401,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    // 重新验证各语言版本的页面缓存
    for (const locale of locales) {
      revalidatePath(`/${locale}`);
      revalidatePath(`/${locale}/imagery`);
      revalidatePath(`/${locale}/story/qjtx`);
    }

    // 防范未命中重写路径的缓存，同时也刷新 sitemap
    revalidatePath("/");
    revalidatePath("/imagery");
    revalidatePath("/story/qjtx");
    revalidatePath("/sitemap.xml");

    const timestamp = new Date().toISOString();

    const response = `SUCCESS: Home page, imagery, story, and sitemap revalidated at ${timestamp}`;

    return new NextResponse(response, {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (error) {
    console.error("Revalidation error:", error);

    return new NextResponse("ERROR: Revalidation failed", {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}

// 新增: 刷新指定 /song/[id] 页面的 GET 路由
export async function GET(request: NextRequest) {
  try {
    const secret = request.nextUrl.searchParams.get("secret");
    const id = request.nextUrl.searchParams.get("id");

    if (secret !== process.env.REVALIDATE_SECRET) {
      return new NextResponse("ERROR: Invalid secret", {
        status: 401,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    if (!id) {
      return new NextResponse("ERROR: Missing id parameter", {
        status: 400,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    const timestamp = new Date().toISOString();

    let response: string;

    if (id === "all") {
      for (const locale of locales) {
        revalidatePath(`/${locale}/song/[id]`, "page");
      }
      revalidatePath("/song/[id]", "page");
      response = `SUCCESS: All song pages revalidated at ${timestamp}`;
    } else {
      for (const locale of locales) {
        revalidatePath(`/${locale}/song/${id}`);
      }
      revalidatePath(`/song/${id}`);
      response = `SUCCESS: Page /song/${id} revalidated at ${timestamp}`;
    }

    return new NextResponse(response, {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (error) {
    console.error("Revalidation error:", error);

    return new NextResponse("ERROR: Revalidation failed", {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}
