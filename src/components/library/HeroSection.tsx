"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { useSyncExternalStore } from "react";

interface HeroSectionProps {
  songCount: number;
}

// 模板化入口配置区：未来添加新功能入口只需在此处添加配置即可
const FEATURE_ENTRANCES = [
  {
    id: "imagery",
    label: "意象词云",
    desc: "探索词作的万千意象",
    href: "/imagery",
    icon: Sparkles,
    gradient: "from-blue-500/10 to-indigo-500/10",
    border: "group-hover:border-blue-500/30",
    textGlow: "group-hover:text-blue-600 dark:group-hover:text-blue-400",
  },
  // 可以继续添加其他重大功能入口，例如：
  // {
  //   id: "timeline",
  //   label: "年代纪事",
  //   desc: "一览音乐创作的流年轨迹",
  //   href: "/timeline",
  //   icon: Clock3,
  //   gradient: "from-amber-500/10 to-orange-500/10",
  //   border: "group-hover:border-amber-500/30",
  //   textGlow: "group-hover:text-amber-600 dark:group-hover:text-amber-400",
  // },
];

export default function HeroSection({ songCount }: HeroSectionProps) {
  const isHoverDevice = useSyncExternalStore(
    (onStoreChange) => {
      const mediaQuery = window.matchMedia(
        "(hover: hover) and (pointer: fine)",
      );
      mediaQuery.addEventListener("change", onStoreChange);
      return () => mediaQuery.removeEventListener("change", onStoreChange);
    },
    () => window.matchMedia("(hover: hover) and (pointer: fine)").matches,
    () => false,
  );

  return (
    <div className="w-full flex flex-col md:flex-row md:items-end justify-between gap-8 md:gap-12 pt-1 md:pt-4">

      {/* 左侧：标题与子标题 */}
      <div className="space-y-4 md:space-y-8 flex-1">
        <h1 className="text-5xl md:text-6xl text-slate-900 dark:text-slate-50 italic tracking-tight">
          谣歌 <span className="text-[1.3em] font-semibold">{songCount}</span>
        </h1>

        <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
          <span className="text-blue-600 dark:text-blue-500 font-mono text-lg leading-none relative -top-[1.5px] select-none">
            &gt;
          </span>
          <p className="font-light tracking-[0.15em] text-sm md:text-[15px] leading-relaxed">
            你一定想知道，戏里讲了什么故事
            {isHoverDevice ? (
              <motion.span
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="select-none inline-block ml-1 font-normal text-slate-400 dark:text-slate-500"
              >
                ……
              </motion.span>
            ) : (
              <span className="ml-1 text-slate-400 dark:text-slate-500">
                ……
              </span>
            )}
          </p>
        </div>
      </div>

      {/* 右侧：功能入口区 (Feature Entrances) */}
      <div className="flex w-full md:w-auto h-full justify-start md:justify-end items-end md:items-start pt-6 md:pt-0">
        
        {/* -- 桌面端入口 (Desktop) - 极简竖排发光点 -- */}
        <div className="hidden md:flex flex-row gap-10 lg:gap-14 justify-end">
          {FEATURE_ENTRANCES.map((feature) => {
            const Icon = feature.icon;
            return (
              <Link key={feature.id} href={feature.href} className="group relative flex flex-col items-center outline-none">
                {/* 顶部发光点 */}
                <div className="relative mb-3 flex items-center justify-center">
                  <div className="absolute h-5 w-5 rounded-full bg-blue-500/10 blur-[2px] transition-all duration-700 group-hover:bg-blue-500/30 group-hover:blur-sm group-hover:scale-150" />
                  <div className="absolute h-2.5 w-2.5 rounded-full bg-blue-500/30 animate-pulse" style={{ animationDuration: '2s' }} />
                  <div className="h-[3px] w-[3px] rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] transition-all duration-500 group-hover:bg-blue-400 group-hover:shadow-[0_0_12px_rgba(59,130,246,1)]" />
                </div>

                {/* 竖排标题 */}
                <span className="[writing-mode:vertical-rl] font-serif text-[15px] tracking-[0.4em] text-slate-500/90 dark:text-slate-400/90 transition-colors duration-500 group-hover:text-slate-900 dark:group-hover:text-white drop-shadow-xs pr-1">
                  {feature.label}
                </span>

                {/* Hover 展开的说明面板 (向左侧弹出) */}
                <div className="absolute top-8 right-full mr-4 lg:mr-6 flex items-center opacity-0 -translate-x-3 pointer-events-none transition-all duration-500 ease-out group-hover:opacity-100 group-hover:translate-x-0 w-max z-10">
                  <div className="flex items-center gap-4 lg:gap-5 border-r border-slate-200/60 dark:border-slate-700/60 pr-5 py-2">
                    <div className="flex flex-col items-end">
                       <span className="text-[14px] font-medium tracking-[0.15em] text-slate-800 dark:text-slate-200 mb-1">
                         {feature.label}
                       </span>
                       <span className="text-[12px] font-light tracking-[0.05em] text-slate-500 dark:text-slate-400">
                         {feature.desc}
                       </span>
                    </div>
                    <Icon size={18} strokeWidth={1.5} className="text-blue-500/70 dark:text-blue-400/80" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* -- 移动端入口 (Mobile) - 极简发光点排列 -- */}
        <div className="flex md:hidden flex-col gap-4 w-full mt-4">
           {FEATURE_ENTRANCES.map((feature) => {
             return (
               <Link key={feature.id} href={feature.href} className="group flex items-center justify-between outline-none py-1 border-b border-slate-100 dark:border-slate-800/50 pb-3">
                 <div className="flex items-center gap-4">
                   {/* 发光点 */}
                   <div className="relative flex items-center justify-center ml-1">
                     <div className="absolute h-4 w-4 rounded-full bg-blue-500/20 blur-[1px]" />
                     <div className="h-1.5 w-1.5 rounded-full bg-blue-400 shadow-[0_0_6px_rgba(59,130,246,0.6)] animate-pulse" />
                   </div>
                   {/* 标题 */}
                   <span className="text-[15px] font-serif tracking-[0.15em] text-slate-700 dark:text-slate-300">
                     {feature.label}
                   </span>
                 </div>
                 {/* 描述说明 */}
                 <span className="text-[11px] font-light text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                   {feature.desc}
                   <ArrowRight size={10} className="opacity-50" />
                 </span>
               </Link>
             )
           })}
        </div>
      </div>

    </div>
  );
}
