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
    maxAge: 60 * 60, // 1小时
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
      headerToken = (request.headers as Record<string, string>)[CSRF_HEADER_NAME];
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
  const authCookies = cookies.getAll().filter(cookie =>
    cookie.name.startsWith('sb-') ||
    cookie.name === CSRF_COOKIE_NAME
  );

  authCookies.forEach(({ name }) => {
    cookies.set(name, "", {
      maxAge: -1,
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "strict"
    });
  });
}
