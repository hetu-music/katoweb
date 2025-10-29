import MusicLibraryClient from "./components/MusicLibraryClient";
import { getSongs } from "../lib/supabase";
import { Song } from "../lib/types";

// 错误回退组件
function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="min-h-screen bg-linear-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
      <div className="text-center text-white">
        <h1 className="text-2xl font-bold mb-4">加载失败</h1>
        <p className="text-gray-300 mb-4">无法加载歌曲数据，请稍后再试</p>
        <p className="text-sm text-gray-400">
          错误信息：{error.message || "未知错误"}
        </p>
      </div>
    </div>
  );
}

// 服务端组件 - 使用 ISR
export default async function MusicLibraryPage() {
  let songsData: Song[] = [];
  let error: Error | null = null;

  try {
    songsData = await getSongs();
  } catch (err) {
    console.error("Error fetching songs:", err);
    error = err instanceof Error ? err : new Error("未知错误");
  }

  if (error) {
    return <ErrorFallback error={error} />;
  }

  return <MusicLibraryClient initialSongsData={songsData} />;
}

// 启用 ISR - 每2小时重新生成页面，减少服务器负载
export const revalidate = 7200;
