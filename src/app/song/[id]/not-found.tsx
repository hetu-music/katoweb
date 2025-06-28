"use client";

import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
      <div className="text-center text-white">
        <div className="text-lg mb-4">❌ 未找到该歌曲</div>
        <div className="space-x-4">
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all duration-200"
          >
            返回主页
          </button>
        </div>
      </div>
    </div>
  );
}