import { randomBytes, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';

const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';

export function generateCsrfToken() {
  return randomBytes(32).toString('hex');
}

export async function setCsrfCookie(token: string) {
  const cookieStore = await cookies();
  await cookieStore.set(CSRF_COOKIE_NAME, token, {
    httpOnly: false,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60, // 1 hour
  });
}

export async function getCsrfTokenFromCookie() {
  const cookieStore = await cookies();
  return cookieStore.get(CSRF_COOKIE_NAME)?.value;
}

export function getCsrfTokenFromRequest(req: Request) {
  return req.headers.get(CSRF_HEADER_NAME);
}

export async function validateCsrf(req: Request): Promise<boolean> {
  const cookieToken = await getCsrfTokenFromCookie();
  const headerToken = getCsrfTokenFromRequest(req);
  if (!cookieToken || !headerToken) return false;
  try {
    return timingSafeEqual(Buffer.from(cookieToken), Buffer.from(headerToken));
  } catch {
    return false;
  }
}

export { CSRF_COOKIE_NAME, CSRF_HEADER_NAME }; 