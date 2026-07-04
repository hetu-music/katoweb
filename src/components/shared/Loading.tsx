"use client";

import React from "react";
import { useTranslations } from "next-intl";

/**
 * 雅致极简的通用加载屏
 * 以 “加载中” 为核心主题，融入极细旋转星环、脉冲星芒与柔和的呼吸光晕，
 * 既符合全站国风与现代交融的视觉调性，又适用于主页、详情页等所有切换场景。
 */
export default function Loading() {
  const t = useTranslations("common");
  const tHero = useTranslations("library.hero");

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#FAFAFA] transition-colors duration-500 dark:bg-[#0B0F19]">
      {/* 局部动画与渐变样式 */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes pulse-dot {
          0%, 100% { transform: scale(0.85); opacity: 0.4; }
          50% { transform: scale(1.15); opacity: 1; }
        }
        @keyframes rotate-ring {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes text-breathe {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        @keyframes glow-breathe {
          0%, 100% { opacity: 0.3; transform: scale(0.9); }
          50% { opacity: 0.7; transform: scale(1.1); }
        }
        .anim-dot {
          animation: pulse-dot 2.2s ease-in-out infinite;
        }
        .anim-ring {
          animation: rotate-ring 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        .anim-text {
          animation: text-breathe 2.2s ease-in-out infinite;
        }
        .anim-glow {
          animation: glow-breathe 4s ease-in-out infinite;
        }
        .bg-glow {
          background: radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, transparent 65%);
        }
        .dark .bg-glow {
          background: radial-gradient(circle, rgba(59, 130, 246, 0.03) 0%, transparent 65%);
        }
      `}} />

      {/* 中心呼吸微光背景 */}
      <div className="anim-glow bg-glow absolute h-[400px] w-[400px] rounded-full pointer-events-none select-none" />

      {/* 极简星环与星芒组合 */}
      <div className="relative flex h-24 w-24 items-center justify-center z-10">
        {/* 中心微光圆点 */}
        <div className="anim-dot h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-500" />

        {/* 极细缺口旋转圆环 */}
        <div className="anim-ring absolute h-16 w-16 rounded-full border border-slate-200 dark:border-slate-800/80 border-t-blue-600/80 dark:border-t-blue-500/80" />
      </div>

      {/* 加载文字提示 */}
      <div className="mt-4 flex flex-col items-center gap-2.5 z-10">
        <p className="anim-text font-serif text-[17px] font-medium tracking-widest text-slate-700 dark:text-slate-300">
          {t("nav.loading")}
        </p>
        <span className="h-px w-8 bg-slate-200 dark:bg-slate-800" />
      </div>

      {/* 底部低调的诗意边脚 */}
      <div className="absolute bottom-12 select-none pointer-events-none z-10 opacity-70">
        <p className="font-serif italic text-xs tracking-widest text-slate-400/60 dark:text-slate-500/50">
          “ {tHero("defaultDesc")} ”
        </p>
      </div>
    </div>
  );
}
