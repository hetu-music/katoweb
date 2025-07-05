import { createClient } from '@supabase/supabase-js';
import { Song, SongDetail } from './types';
import { mapAndSortSongs } from './utils';
import { processLyrics } from './lyrics-processor';

// 创建Supabase客户端，根据表名和可选 accessToken 选择不同的密钥
export function createSupabaseClient(table?: string, accessToken?: string) {
  let supabaseUrl: string | undefined;
  let supabaseKey: string | undefined;
  const options: { global?: { headers: { Authorization: string } } } = {};
  if (table === 'music') {
    supabaseUrl = process.env.SUPABASE_URL;
    supabaseKey = process.env.SUPABASE_SECRET_API;
    // 使用高权限API时不带token
  } else {
    supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (accessToken) {
      options.global = { headers: { Authorization: `Bearer ${accessToken}` } };
    }
  }
  if (!supabaseUrl || !supabaseKey ||
    supabaseUrl === 'placeholder' || supabaseKey === 'placeholder') {
    console.log('Using placeholder environment variables');
    return null;
  }
  return createClient(supabaseUrl, supabaseKey, options);
}

// 获取所有歌曲数据
export async function getSongs(table: string = 'music', accessToken?: string): Promise<Song[]> {
  const supabase = createSupabaseClient(table, accessToken);
  if (!supabase) {
    console.log('Supabase client not available, returning empty data');
    return [];
  }
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .order('id', { ascending: true });
  if (error) {
    console.error('Supabase error:', error);
    throw new Error('Failed to fetch songs');
  }
  return mapAndSortSongs(data);
}

// 根据ID获取歌曲详情
export async function getSongById(id: number, table: string = 'music', accessToken?: string): Promise<SongDetail | null> {
  const supabase = createSupabaseClient(table, accessToken);
  if (!supabase) {
    console.log('Supabase client not available');
    return null;
  }
  const { data, error } = await supabase
    .from(table)
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
  
  // 处理歌词转换
  let normalLyrics = '';
  if (data.lyrics) {
    try {
      const processed = processLyrics(data.lyrics);
      normalLyrics = processed.lyrics;
    } catch (error) {
      console.error('Error processing lyrics for song', id, ':', error);
      normalLyrics = '歌词转换失败，请检查LRC格式';
    }
  }
  
  // 映射数据并添加年份和转换后的歌词
  return {
    ...data,
    year: data.date ? new Date(data.date).getFullYear() : null,
    normalLyrics,
  } as SongDetail & { normalLyrics: string };
}

// 新增歌曲
export async function createSong(song: Partial<Song>, table: string = 'music', accessToken?: string): Promise<Song> {
  const supabase = createSupabaseClient(table, accessToken);
  if (!supabase) throw new Error('Supabase client not available');
  const { data, error } = await supabase.from(table).insert([song]).select().single();
  if (error) throw new Error('Failed to create song');
  return data as Song;
}

// 更新歌曲
export async function updateSong(id: number, song: Partial<Song>, table: string = 'music', accessToken?: string): Promise<Song> {
  const supabase = createSupabaseClient(table, accessToken);
  if (!supabase) throw new Error('Supabase client not available');
  let query = supabase.from(table).update(song).eq('id', id);
  if (song.updated_at) {
    query = query.eq('updated_at', song.updated_at);
  }
  const { data, error } = await query.select().single();
  if (error) {
    // 乐观锁冲突
    if (error.code === 'PGRST116' || error.message.includes('Results contain 0 rows')) {
      const conflictError: Error & { status?: number } = new Error('乐观锁冲突');
      conflictError.status = 409;
      throw conflictError;
    }
    throw new Error('Failed to update song');
  }
  return data as Song;
}
