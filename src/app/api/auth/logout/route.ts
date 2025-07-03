import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/app/lib/supabase';
import { cookies } from 'next/headers';
import { verifyCSRFToken } from '@/app/lib/utils.server';

export async function POST(request: NextRequest) {
  if (!(await verifyCSRFToken(request))) {
    return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
  }
  const cookieStore = await cookies();
  
  // 使用 supabase.ts 中的函数创建客户端
  const supabase = createSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const { error } = await supabase.auth.signOut();
  if (error) {
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
  }
  // 清理 cookie
  cookieStore.getAll().forEach(({ name }) => {
    cookieStore.set(name, '', { maxAge: -1 });
  });
  return NextResponse.json({ success: true });
}