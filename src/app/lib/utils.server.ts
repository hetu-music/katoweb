import { cookies as nextCookies } from 'next/headers';

const CSRF_COOKIE_NAME = 'csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';

// 设置 CSRF token 到 cookie
export async function setCSRFCookie(token: string) {
  const cookies = await nextCookies();
  cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60, // 1小时
  });
}

// 获取 cookie 中的 CSRF token
export async function getCSRFCookie(): Promise<string | undefined> {
  const cookies = await nextCookies();
  return cookies.get(CSRF_COOKIE_NAME)?.value;
}

// 校验 CSRF token
export async function verifyCSRFToken(request: Request | { headers: any }): Promise<boolean> {
  const cookieToken = await getCSRFCookie();
  let headerToken = undefined;
  if (request.headers?.get) {
    headerToken = request.headers.get(CSRF_HEADER_NAME);
  } else if (request.headers && typeof request.headers === 'object') {
    headerToken = request.headers[CSRF_HEADER_NAME];
  }
  return !!cookieToken && !!headerToken && cookieToken === headerToken;
} 