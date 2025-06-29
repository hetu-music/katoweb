import { createClient } from '@supabase/supabase-js';
import { Song, SongDetail } from './types';
import { mapAndSortSongs } from './utils';

// 创建Supabase客户端
export function createSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  // 如果是构建时的占位符，返回null
  if (!supabaseUrl || !supabaseAnonKey ||
    supabaseUrl === 'placeholder' || supabaseAnonKey === 'placeholder') {
    console.log('Using placeholder environment variables');
    return null;
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

// 获取所有歌曲数据
export async function getSongs(): Promise<Song[]> {
  const supabase = createSupabaseClient();

  if (!supabase) {
    console.log('Supabase client not available, returning empty data');
    return [];
  }

  const { data, error } = await supabase
    .from('music')
    .select('*')
    .order('id', { ascending: true });

  if (error) {
    console.error('Supabase error:', error);
    throw new Error('Failed to fetch songs');
  }

  return mapAndSortSongs(data);
}

// 根据ID获取歌曲详情
export async function getSongById(id: number): Promise<SongDetail | null> {
  const supabase = createSupabaseClient();

  if (!supabase) {
    console.log('Supabase client not available');
    return null;
  }

  const { data, error } = await supabase
    .from('music')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.log('Supabase query failed for id:', id, 'Error:', error);
    return null;
  }

  if (!data) {
    console.log('No song found for id:', id);
    return null;
  }

  // 映射数据并添加年份
  return {
    ...data,
    year: data.date ? new Date(data.date).getFullYear() : null,
  } as SongDetail;
}
