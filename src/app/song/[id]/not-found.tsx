"use client";

import { useRouter } from "next/navigation";
import { Disc, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0B0F19] transition-colors duration-500 font-sans flex items-center justify-center p-6">
      <div className="text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="relative inline-block">
          <Disc
            size={120}
            className="text-slate-200 dark:text-slate-800 animate-[spin_10s_linear_infinite]"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl font-serif font-bold text-slate-400 dark:text-slate-600">
              404
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-serif text-slate-900 dark:text-slate-50">
            歌曲未找到
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-light max-w-sm mx-auto">
            抱歉，您访问的歌曲不存在或已被移除。
          </p>
        </div>

        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => router.back()}
            className="group px-6 py-2.5 rounded-full border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-300 flex items-center gap-2"
          >
            <ArrowLeft
              size={18}
              className="group-hover:-translate-x-1 transition-transform"
            />
            <span>返回上页</span>
          </button>

          <button
            onClick={() => router.push("/")}
            className="group px-6 py-2.5 rounded-full bg-blue-600 text-white border border-blue-600 shadow-lg shadow-blue-200/50 dark:shadow-none hover:bg-blue-700 hover:border-blue-700 transition-all duration-300 flex items-center gap-2"
          >
            <Home size={18} />
            <span>返回主页</span>
          </button>
        </div>
      </div>
    </div>
  );
}
