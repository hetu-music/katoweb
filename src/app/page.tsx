import { Suspense } from "react";
import MusicLibraryClient from "@/components/public/MusicLibraryClient";
import { getSongs } from "@/lib/supabase";
import { Song } from "@/lib/types";

// 错误回退组件
function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="min-h-screen bg-linear-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
      <div className="text-center text-white">
        <h1 className="text-2xl font-bold mb-4">加载失败</h1>
        <p className="text-gray-300 mb-4">无法加载歌曲数据，请稍后再试</p>
        <p className="text-sm text-gray-400">
          错误信息:{error.message || "未知错误"}
        </p>
      </div>
    </div>
  );
}

// 加载中组件
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0B0F19] flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
        <p className="mt-4 text-slate-600 dark:text-slate-400">加载中...</p>
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

  return (
    <Suspense fallback={<LoadingFallback />}>
      <MusicLibraryClient initialSongsData={songsData} />
    </Suspense>
  );
}

// 启用 ISR - 每2小时重新生成页面，减少服务器负载
export const revalidate = 7200;
