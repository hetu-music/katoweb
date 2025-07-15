import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

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

  // 仅管理员可用，或公开（如无敏感信息）
  // 查询所有有 display_name 的用户
  // 需要服务端有 RLS 权限或用 service key，或在 supabase dashboard 配置 policy 允许读取 user_metadata
  const { data, error } = await supabase
    .from('users')
    .select('id, user_metadata')
    .neq('user_metadata->>display_name', '')
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 提取 display_name
  const contributors = (data || [])
    .map((u: any) => u.user_metadata?.display_name)
    .filter((name: string | undefined) => !!name);

  return NextResponse.json({ contributors });
} 