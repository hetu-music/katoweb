import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { generateCsrfToken, setCsrfCookie, validateCsrf } from '../../../lib/csrf';

export async function POST(request: NextRequest) {
  // CSRF 校验（登录页可选，防止登录劫持）
  if (!(await validateCsrf(request))) {
    return NextResponse.json({ error: 'CSRF token invalid' }, { status: 403 });
  }
  const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6).max(100),
  });
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parseResult = LoginSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json({ error: 'Invalid input', details: parseResult.error.errors }, { status: 400 });
  }
  const { email, password } = parseResult.data;
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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
    }
  );

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return NextResponse.json({ error: 'Login failed' }, { status: 401 });
  }
  if (!data.session) {
    return NextResponse.json({ error: 'No session returned after login' }, { status: 401 });
  }
  // 登录成功，生成并设置 CSRF token
  const csrfToken = generateCsrfToken();
  await setCsrfCookie(csrfToken);
  return NextResponse.json({ success: true });
} 