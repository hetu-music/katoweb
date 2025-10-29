import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "./supabase-server";
import { verifyCSRFToken } from "./utils.server";

export interface AuthenticatedUser {
  id: string;
  email?: string;
  [key: string]: unknown;
}

export interface AuthResult {
  success: boolean;
  user?: AuthenticatedUser;
  error?: string;
  response?: NextResponse;
}

/**
 * 从请求中获取用户信息
 */
export async function getUserFromRequest(request: NextRequest): Promise<AuthenticatedUser | null> {
  const supabase = await createSupabaseServerClient();

  // 优先使用 Authorization header
  const authHeader = request.headers.get("authorization");
  let token: string | undefined;
  
  if (authHeader) {
    // 严格校验 Bearer token 格式
    const match = authHeader.match(/^Bearer ([A-Za-z0-9\-._~+/]+=*)$/);
    if (match) {
      token = match[1];
    } else {
      return null;
    }
  } else {
    // 没有 header 时，取 session 里的 access_token
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

/**
 * 验证用户身份（仅验证登录状态）
 */
export async function authenticateUser(request: NextRequest): Promise<AuthResult> {
  try {
    const user = await getUserFromRequest(request);
    
    if (!user) {
      return {
        success: false,
        error: "Unauthorized",
        response: NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      };
    }

    return {
      success: true,
      user
    };
  } catch (error) {
    console.error("Authentication error:", error);
    return {
      success: false,
      error: "Authentication failed",
      response: NextResponse.json({ error: "Authentication failed" }, { status: 500 })
    };
  }
}

/**
 * 验证用户身份和 CSRF token（用于需要 CSRF 保护的请求）
 */
export async function authenticateUserWithCSRF(request: NextRequest): Promise<AuthResult> {
  try {
    // 先验证 CSRF token
    if (!(await verifyCSRFToken(request))) {
      return {
        success: false,
        error: "Invalid CSRF token",
        response: NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 })
      };
    }

    // 再验证用户身份
    return await authenticateUser(request);
  } catch (error) {
    console.error("Authentication with CSRF error:", error);
    return {
      success: false,
      error: "Authentication failed",
      response: NextResponse.json({ error: "Authentication failed" }, { status: 500 })
    };
  }
}

/**
 * 高阶函数：为 API 路由添加身份验证
 */
export function withAuth(
  handler: (request: NextRequest, user?: AuthenticatedUser) => Promise<NextResponse>,
  options: { requireCSRF?: boolean } = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const authResult = options.requireCSRF 
      ? await authenticateUserWithCSRF(request)
      : await authenticateUser(request);

    if (!authResult.success || !authResult.response) {
      return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
    }

    if (!authResult.user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    return handler(request, authResult.user);
  };
}