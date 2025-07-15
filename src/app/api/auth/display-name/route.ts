import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { verifyCSRFToken } from '@/app/lib/utils.server';

export async function GET(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }
  const cookieStore = await cookies();
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
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

  // 获取当前用户
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: '未登录或会话失效' }, { status: 401 });
  }

  // 返回 display name
  const displayName = user.user_metadata?.display_name || '';
  return NextResponse.json({ displayName });
}

export async function POST(request: NextRequest) {
  // CSRF 验证
  if (!(await verifyCSRFToken(request))) {
    return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
  }

  // 解析请求体
  const { displayName } = await request.json();
  if (!displayName || typeof displayName !== 'string' || displayName.length < 2) {
    return NextResponse.json({ error: '用户名不能为空且不少于2个字符' }, { status: 400 });
  }

  // 初始化 Supabase 客户端
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }
  const cookieStore = await cookies();
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
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

  // 获取当前用户
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: '未登录或会话失效' }, { status: 401 });
  }
  if (!user.email) {
    return NextResponse.json({ error: '用户不存在，无法更新用户名' }, { status: 400 });
  }

  // 更新 display name
  const { error: updateError } = await supabase.auth.updateUser({
    data: { display_name: displayName },
  });
  if (updateError) {
    return NextResponse.json({ error: updateError.message || '更新失败' }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}