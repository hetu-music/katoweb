import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { verifyCSRFToken } from "@/app/lib/utils.server";
import { uploadScoreFile, validateScoreFile } from "@/app/lib/upload";

// 创建支持 cookies 的 Supabase 客户端
async function createSupabaseServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables");
  }

  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    },
  });
}

async function getUserFromRequest(request: NextRequest) {
  const supabase = await createSupabaseServerClient();

  const authHeader = request.headers.get("authorization");
  let token: string | undefined;
  if (authHeader) {
    const match = authHeader.match(/^Bearer ([A-Za-z0-9\-\._~\+\/]+=*)$/);
    if (match) {
      token = match[1];
    } else {
      return null;
    }
  } else {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    token = session?.access_token;
  }

  if (!token) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser(token);
  return user;
}

export async function POST(request: NextRequest) {
  if (!(await verifyCSRFToken(request))) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const songId = formData.get("songId") as string;

    if (!file || !songId) {
      return NextResponse.json(
        { error: "Missing file or songId" },
        { status: 400 }
      );
    }

    // 验证文件
    const validation = validateScoreFile(file);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // 获取文件内容
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 上传文件
    const uploadResult = await uploadScoreFile(buffer, songId);
    
    if (!uploadResult.success) {
      return NextResponse.json(
        { error: uploadResult.error || "Upload failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: "乐谱上传成功",
      fileName: `${songId}.jpg`
    });

  } catch (error) {
    console.error("Upload score error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}