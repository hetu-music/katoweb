import { cookies as nextCookies } from "next/headers";

const CSRF_COOKIE_NAME = "csrf-token";
const CSRF_HEADER_NAME = "x-csrf-token";

// 生成安全的 CSRF token
export function generateCSRFToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// 设置 CSRF token 到 cookie
export async function setCSRFCookie(token: string) {
  const cookies = await nextCookies();
  cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
  });
}

// 获取 cookie 中的 CSRF token
export async function getCSRFCookie(): Promise<string | undefined> {
  const cookies = await nextCookies();
  return cookies.get(CSRF_COOKIE_NAME)?.value;
}

// 校验 CSRF token
export async function verifyCSRFToken(
  request: Request | { headers: Record<string, string> | Headers },
): Promise<boolean> {
  try {
    const cookieToken = await getCSRFCookie();
    let headerToken: string | undefined = undefined;
    if (
      request.headers &&
      typeof (request.headers as Headers).get === "function"
    ) {
      headerToken =
        (request.headers as Headers).get(CSRF_HEADER_NAME) ?? undefined;
    } else if (request.headers && typeof request.headers === "object") {
      headerToken = (request.headers as Record<string, string>)[
        CSRF_HEADER_NAME
      ];
    }

    // 更严格的校验：token 必须为非空字符串且不能全为空白
    const isValidToken = (token: unknown): token is string =>
      typeof token === "string" && token.trim().length > 0;

    return (
      isValidToken(cookieToken) &&
      isValidToken(headerToken) &&
      cookieToken === headerToken
    );
  } catch (error) {
    console.error("CSRF token verification error:", error);
    return false;
  }
}

// 清理认证相关的 cookies
export async function clearAuthCookies() {
  const cookies = await nextCookies();
  const authCookies = cookies
    .getAll()
    .filter(
      (cookie) =>
        cookie.name.startsWith("sb-") || cookie.name === CSRF_COOKIE_NAME,
    );

  authCookies.forEach(({ name }) => {
    // 使用 delete 方法删除 cookie
    cookies.delete({
      name,
      path: "/",
    });

    // 备用方法：同时设置过期的空值
    cookies.set(name, "", {
      path: "/",
      expires: new Date(0),
      maxAge: 0,
    });
  });
}

/**
 * Turnstile 验证结果接口
 */
export interface TurnstileVerifyResult {
  success: boolean;
  error?: string;
  errorCodes?: string[];
}

/**
 * 验证 Cloudflare Turnstile token
 * @param token - Turnstile token (从客户端获取)
 * @returns 验证结果
 */
export async function verifyTurnstileToken(
  token: string | null | undefined,
): Promise<TurnstileVerifyResult> {
  // 检查 token 是否存在
  if (!token || typeof token !== "string" || token.trim().length === 0) {
    return {
      success: false,
      error: "缺少验证令牌",
    };
  }

  // 检查环境变量
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  if (!secretKey) {
    console.error("TURNSTILE_SECRET_KEY 未配置");
    return {
      success: false,
      error: "服务器配置错误",
    };
  }

  try {
    // 调用 Cloudflare Turnstile API 验证
    const verifyResponse = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          secret: secretKey,
          response: token,
        }),
      },
    );

    const verifyData = await verifyResponse.json();

    if (verifyData.success) {
      return { success: true };
    } else {
      return {
        success: false,
        error: "验证失败",
        errorCodes: verifyData["error-codes"],
      };
    }
  } catch (error) {
    console.error("Turnstile 验证错误:", error);
    return {
      success: false,
      error: "验证服务异常",
    };
  }
}
