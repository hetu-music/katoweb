import MusicLibraryClient from './MusicLibraryClient';
import { getSongs } from './lib/supabase';

// 服务端组件 - 使用 ISR
export default async function MusicLibraryPage() {
  try {
    const songsData = await getSongs();
    
    return <MusicLibraryClient initialSongsData={songsData} />;
  } catch (error) {
    console.error('Error fetching songs:', error);
    
    // 服务端错误状态的 fallback UI
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">加载失败</h1>
          <p className="text-gray-300 mb-4">无法加载歌曲数据，请稍后再试</p>
          <p className="text-sm text-gray-400">错误信息：{error instanceof Error ? error.message : '未知错误'}</p>
        </div>
      </div>
    );
  }
}

// 启用 ISR - 每30分钟重新生成页面
export const revalidate = 3600;