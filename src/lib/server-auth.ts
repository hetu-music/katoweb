import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "./supabase-auth";
import { getUserClient, TABLES } from "./supabase-server";
import { verifyCSRFToken } from "./server-utils";

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
export async function getUserFromRequest(
  request: NextRequest,
): Promise<AuthenticatedUser | null> {
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

  return user as AuthenticatedUser | null;
}

/**
 * 验证用户身份（仅验证登录状态）
 */
export async function authenticateUser(
  request: NextRequest,
): Promise<AuthResult> {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return {
        success: false,
        error: "Unauthorized",
        response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      };
    }

    return {
      success: true,
      user,
    };
  } catch (error) {
    console.error("Authentication error:", error);
    return {
      success: false,
      error: "Authentication failed",
      response: NextResponse.json(
        { error: "Authentication failed" },
        { status: 500 },
      ),
    };
  }
}

/**
 * 验证用户身份和 CSRF token（用于需要 CSRF 保护的请求）
 */
export async function authenticateUserWithCSRF(
  request: NextRequest,
): Promise<AuthResult> {
  try {
    // 先验证 CSRF token
    if (!(await verifyCSRFToken(request))) {
      return {
        success: false,
        error: "Invalid CSRF token",
        response: NextResponse.json(
          { error: "Invalid CSRF token" },
          { status: 403 },
        ),
      };
    }

    // 再验证用户身份
    return await authenticateUser(request);
  } catch (error) {
    console.error("Authentication with CSRF error:", error);
    return {
      success: false,
      error: "Authentication failed",
      response: NextResponse.json(
        { error: "Authentication failed" },
        { status: 500 },
      ),
    };
  }
}

/**
 * 高阶函数：为 API 路由添加身份验证
 *
 * options.requireCSRF  — 同时验证 CSRF token（写操作必须开启）
 * options.requireAdmin — 额外校验 users 表中的 is_admin=true（管理后台操作必须开启）
 */
export function withAuth(
  handler: (
    request: NextRequest,
    user: AuthenticatedUser,
  ) => Promise<NextResponse>,
  options: { requireCSRF?: boolean; requireAdmin?: boolean } = {},
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const authResult = options.requireCSRF
      ? await authenticateUserWithCSRF(request)
      : await authenticateUser(request);

    if (!authResult.success) {
      return (
        authResult.response ||
        NextResponse.json({ error: "Authentication failed" }, { status: 500 })
      );
    }

    if (!authResult.user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    // Admin check: verify is_admin flag in the users table
    if (options.requireAdmin) {
      try {
        const supabase = await createSupabaseServerClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const userClient = getUserClient(session?.access_token);
        if (!userClient) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        const { data: userData } = await userClient
          .from(TABLES.USERS)
          .select("is_admin")
          .eq("id", authResult.user.id)
          .maybeSingle();
        if (!userData?.is_admin) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
      } catch (error) {
        console.error("Admin check error:", error);
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    return handler(request, authResult.user);
  };
}
