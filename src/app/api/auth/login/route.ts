import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/app/lib/supabase';
import { cookies } from 'next/headers';
import { verifyCSRFToken } from '@/app/lib/utils.server';

export async function POST(request: NextRequest) {
  if (!(await verifyCSRFToken(request))) {
    return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
  }
  const { email, password } = await request.json();
  const cookieStore = await cookies();
  
  // 使用 supabase.ts 中的函数创建客户端
  const supabase = createSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }
  if (!data.session) {
    return NextResponse.json({ error: 'Login failed' }, { status: 401 });
  }
  // 登录成功，返回 200
  return NextResponse.json({ success: true });
}