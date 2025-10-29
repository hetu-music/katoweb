"use client";

import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-linear-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
      <div className="text-center text-white">
        <div className="text-6xl font-bold mb-4">404</div>
        <div className="text-xl mb-2">歌曲未找到</div>
        <div className="text-lg mb-8 text-gray-300">
          抱歉，您访问的歌曲不存在
        </div>
        <div className="space-x-4">
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all duration-200 font-medium"
          >
            返回主页
          </button>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all duration-200 font-medium"
          >
            返回上页
          </button>
        </div>
      </div>
    </div>
  );
}
