import { NextResponse } from 'next/server';
import { createSupabaseClient } from '@/app/lib/supabase';

export async function GET() {
  // 使用高权限API
  const supabase = createSupabaseClient('music'); // 'music' 表示高权限API
  if (!supabase) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  // 查询 users 表，获取 name, display, intro, sort_order，按 sort_order 排序，过滤 display=true
  const { data, error } = await supabase
    .from('users')
    .select('name, display, intro, sort_order')
    .eq('display', true)
    .order('sort_order', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 直接返回完整信息
  return NextResponse.json({ contributors: data || [] });
} 