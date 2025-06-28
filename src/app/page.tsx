// page.tsx - 改为服务端组件，使用 ISR
import { createClient } from '@supabase/supabase-js';
import MusicLibraryClient from './MusicLibraryClient';

type Song = {
  id: number;
  title: string;
  album: string | null;
  year: number | null;
  genre: string[] | null;
  lyricist: string[] | null;
  composer: string[] | null;
  artist: string[] | null;
  length: number | null;
  hascover?: boolean | null;
  date?: string | null;
  type?: string[] | null;
};

// 服务端数据获取函数
async function getSongs(): Promise<Song[]> {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase
    .from('music')
    .select('*')
    .order('id', { ascending: true });

  if (error) {
    console.error('Supabase error:', error);
    throw new Error('Failed to fetch songs');
  }

  // 数据映射和排序逻辑（与原来的客户端逻辑相同）
  const mapped = data.map((song: any) => ({
    id: song.id,
    title: song.title,
    album: song.album,
    year: song.date ? new Date(song.date).getFullYear() : null,
    genre: song.genre,
    lyricist: song.lyricist,
    composer: song.composer,
    artist: song.artist,
    length: song.length,
    hascover: song.hascover,
    date: song.date,
    type: song.type,
  }));

  // 排序：有日期的按日期从新到旧，无日期的排在后面并保持原顺序
  const sorted = mapped.slice().sort((a: Song, b: Song) => {
    if (a.date && b.date) {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    } else if (a.date && !b.date) {
      return -1;
    } else if (!a.date && b.date) {
      return 1;
    } else {
      return 0;
    }
  });

  return sorted;
}

// 服务端组件 - 使用 ISR
export default async function MusicLibraryPage() {
  try {
    const songsData = await getSongs();
    
    return <MusicLibraryClient initialSongsData={songsData} />;
  } catch (error) {
    console.error('Error fetching songs:', error);
    
    // 错误状态的 fallback UI
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">加载失败</h1>
          <p className="text-gray-300 mb-4">无法加载歌曲数据，请稍后再试</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            重新加载
          </button>
        </div>
      </div>
    );
  }
}

// 启用 ISR - 每30分钟重新生成页面
export const revalidate = 1800; // 30 minutes