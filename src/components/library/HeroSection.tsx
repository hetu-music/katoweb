"use client";

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
    <div className="w-full flex flex-col md:flex-row justify-between gap-5 md:gap-12 pt-1 md:pt-4" style={{ alignItems: 'stretch' }}>

      {/* 左侧：标题与子标题 */}
      {/* 移除 py-1 彻底消除上下预留 gap。移动端拉大主副标题间距为 gap-8 */}
      <div className="flex flex-col justify-between flex-1 gap-8 md:gap-0">
        {/* 使用 leading-[0.8] 和负 margin (-mt-1 到 -mt-2) 削掉中文字体本身的顶部字距 (Ascender) */}
        <h1 className="text-5xl md:text-6xl text-slate-900 dark:text-slate-50 italic tracking-tight leading-[0.8] -mt-1 lg:-mt-1.5">
          谣歌 <span className="text-[1.3em] font-semibold">{songCount}</span>
        </h1>

        {/* 使用 -mb-1 削弱文字行高产生的底部兜底空间 */}
        <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 mt-auto -mb-1 lg:-mb-1.5">
          <span className="text-blue-600 dark:text-blue-500 font-mono text-lg leading-none relative -top-[1.5px] select-none">
            &gt;
          </span>
          <p className="font-light tracking-[0.15em] text-sm md:text-[15px] leading-relaxed mb-0">
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
      <div className="flex w-full md:w-auto h-full justify-start md:justify-end items-end md:items-start pt-1 md:pt-0">

        {/* -- 桌面端入口 (Desktop) - 极简竖排发光点 -- */}
        <div className="hidden md:flex flex-row gap-10 lg:gap-14 justify-end mt-4 md:mt-0">
          {FEATURE_ENTRANCES.map((feature) => {
            const Icon = feature.icon;
            return (
              <Link key={feature.id} href={feature.href} className="group relative flex flex-col items-center outline-none text-sm" style={{ gap: '1em' }}>
                {/* 顶部发光点 - 移除中心点，仅保留呼吸晕影 */}
                <div className="relative flex items-center justify-center h-4 w-4">
                  <div className="absolute h-6 w-6 rounded-full bg-teal-500/10 blur-[2px] transition-all duration-800 ease-out group-hover:bg-teal-500/30 group-hover:blur-md group-hover:scale-150" />
                  <div className="absolute h-2.5 w-2.5 rounded-full bg-teal-500/30 animate-pulse shadow-[0_0_8px_rgba(20,184,166,0.4)]" style={{ animationDuration: '2s' }} />
                </div>

                {/* 竖排标题 - 移除 pr-1 防止不对称 padding 导致的盒子偏移，确保文字和光点绝对中心对齐 */}
                <span className="[writing-mode:vertical-rl] font-serif font-medium tracking-[1em] -mb-[1em] text-teal-600 dark:text-teal-300 transition-all duration-1000 group-hover:text-teal-800 dark:group-hover:text-teal-100 group-hover:drop-shadow-[0_0_12px_rgba(20,184,166,0.3)]">
                  {feature.label}
                </span>

                {/* Hover 展开的说明面板 (画卷式向左侧缓慢延展展出) */}
                <div className="absolute top-12 right-full mr-3 lg:mr-5 flex flex-row-reverse overflow-hidden w-0 opacity-0 transition-all duration-1200 ease-in-out group-hover:w-[210px] lg:group-hover:w-[240px] group-hover:opacity-100 z-10">
                  <div className="flex w-max shrink-0 items-center gap-4 lg:gap-5 border-r border-slate-300/60 dark:border-slate-600/60 pr-4 lg:pr-5 py-1">
                    <div className="flex flex-col items-end">
                      <span className="text-[15px] font-medium tracking-[0.25em] text-slate-900 dark:text-slate-100 mb-1 whitespace-nowrap transition-colors duration-1200 ease-in-out drop-shadow-sm">
                        {feature.label}
                      </span>
                      <span className="text-[12px] font-light tracking-[0.15em] text-slate-500 dark:text-slate-400 whitespace-nowrap transition-colors duration-1200 ease-in-out">
                        {feature.desc}
                      </span>
                    </div>
                    <Icon size={18} strokeWidth={1.5} className="text-teal-600/80 dark:text-teal-400/80 shrink-0 transition-colors duration-1200 ease-in-out" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* -- 移动端入口 (Mobile) - 与桌面端统一的青色系设计 -- */}
        <div className="flex md:hidden flex-col gap-4 w-full mt-1">
          {/* 主副标题与入口间的分界线 */}
          <div className="w-full h-px bg-slate-200/80 dark:bg-slate-800/60 mb-1" />

          {FEATURE_ENTRANCES.map((feature) => {
            return (
              <Link key={feature.id} href={feature.href} className="group flex items-center justify-between outline-none py-2">
                <div className="flex items-center gap-4">
                  {/* 发光晕影 (无实心中心，弱化呼吸) */}
                  <div className="relative flex items-center justify-center h-4 w-4">
                    <div className="absolute h-5 w-5 rounded-full bg-teal-500/10 blur-[1px] transition-all group-active:scale-110" />
                    <div className="absolute h-1.5 w-1.5 rounded-full bg-teal-500/30 animate-pulse shadow-[0_0_6px_rgba(20,184,166,0.4)]" />
                  </div>
                  {/* 标题 */}
                  <span className="text-[15px] font-serif font-medium tracking-[0.15em] text-teal-600 dark:text-teal-300 leading-none">
                    {feature.label}
                  </span>
                </div>
                {/* 描述说明 */}
                <span className="text-[12px] font-light text-slate-400 dark:text-slate-400/80 flex items-center gap-1.5">
                  {feature.desc}
                  <ArrowRight size={10} className="text-teal-600/60 dark:text-teal-400/60" />
                </span>
              </Link>
            )
          })}
        </div>
      </div>

    </div>
  );
}
