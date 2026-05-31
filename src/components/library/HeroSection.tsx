"use client";

import { motion } from "framer-motion";
import { Scroll, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState, useSyncExternalStore } from "react";

interface HeroSectionProps {
  songCount: number;
}

// 模板化入口配置区：未来添加新功能入口只需在此处添加配置即可
const FEATURE_ENTRANCES = [
  {
    id: "qjtx",
    label: "倾尽天下",
    desc: "一纸长歌，倾尽天下",
    href: "/story/qjtx",
    icon: Scroll,
    textBase: "text-[#A33E3E] dark:text-[#DE5D5D]",
    textHover: "group-hover:text-[#7A2828] dark:group-hover:text-[#F38B8B]",
    haloBg: "bg-[#A33E3E]/25 dark:bg-[#DE5D5D]/25",
    glow: "rgba(163,62,62,0.15)",
    offsetClass: "relative -left-[2px]",
  },
  {
    id: "imagery",
    label: "意象词云",
    desc: "探索词中万千意象",
    href: "/imagery",
    icon: Sparkles,
    textBase: "text-[#2E756C] dark:text-[#44B0A2]",
    textHover: "group-hover:text-[#1D514A] dark:group-hover:text-[#6FD1C4]",
    haloBg: "bg-[#2E756C]/25 dark:bg-[#44B0A2]/25",
    glow: "rgba(46,117,108,0.15)",
    offsetClass: "relative -left-[0.5px]",
  },
];

export default function HeroSection({ songCount }: HeroSectionProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

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
    <div
      className="w-full flex flex-col md:flex-row justify-between gap-5 md:gap-12 pt-1 md:pt-4"
      style={{ alignItems: "stretch" }}
    >
      {/* 左侧：标题与子标题 */}
      <div className="flex flex-col justify-between flex-1 gap-8 md:gap-0">
        <h1 className="text-5xl md:text-6xl text-slate-900 dark:text-slate-50 italic tracking-tight leading-[0.8] -mt-1 lg:-mt-1.5">
          谣歌 <span className="text-[1.3em] font-semibold">{songCount}</span>
        </h1>

        <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 mt-auto -mb-1 lg:-mb-1.5">
          <span className="text-blue-600 dark:text-blue-500 font-mono text-lg leading-none relative top-0 md:top-[-1.5px] select-none">
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
        {/* -- 桌面端入口 (Desktop) - 极简水墨印章 -- */}
        <div className="hidden md:flex flex-row gap-5 justify-end mt-4 md:mt-0">
          {FEATURE_ENTRANCES.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Link
                key={feature.id}
                href={feature.href}
                onMouseEnter={() => setHoveredId(feature.id)}
                onMouseLeave={() => setHoveredId(null)}
                className="group relative flex flex-col items-center outline-none text-[16px]"
                style={{ gap: "0.6em" }}
              >
                {/* 菱形小玉印与水墨涟漪指示器 */}
                <div className="relative flex items-center justify-center h-5 w-5">
                  {/* concentric ripples - 采用无边框高斯模糊光晕，消除硬边缘圆形 */}
                  <div
                    className={`absolute h-3 w-3 rounded-full opacity-0 blur-[3px] ${feature.haloBg} classical-ripple-anim`}
                    style={{ animationDelay: "0s" }}
                  />
                  <div
                    className={`absolute h-3 w-3 rounded-full opacity-0 blur-[3px] ${feature.haloBg} classical-ripple-anim`}
                    style={{ animationDelay: "2s" }}
                  />
                  {/* 核心玉印 */}
                  <div
                    className={`h-2 w-2 rotate-45 border border-current bg-transparent transition-all duration-1000 ease-out group-hover:rotate-135 ${feature.textBase} ${feature.textHover} group-hover:bg-current group-hover:scale-110`}
                  />
                </div>

                {/* 竖排标题 - 确保文字和光点绝对中心对齐 */}
                <div
                  className={`[writing-mode:vertical-rl] font-calligraphy font-medium text-[18px] tracking-[0.55em] mb-[-0.55em] ${feature.offsetClass} ${feature.textBase} ${feature.textHover} transition-[color,filter,text-shadow] duration-1000 group-hover:drop-shadow-[0_0_12px_${feature.glow}] select-none`}
                >
                  {feature.label.split("").map((char, i) => (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0, scale: 0.8, filter: "blur(8px)" }}
                      animate={
                        !hoveredId || hoveredId === feature.id
                          ? { opacity: 1, scale: 1, filter: "blur(0px)" }
                          : { opacity: 0, scale: 0.6, filter: "blur(12px)" }
                      }
                      style={{
                        backfaceVisibility: "hidden",
                        WebkitFontSmoothing: "antialiased",
                        transform: "translateZ(0)",
                        willChange: "transform, opacity",
                      }}
                      transition={{
                        delay:
                          !hoveredId || hoveredId === feature.id
                            ? 0.45 + index * 0.15 + i * 0.15
                            : i * 0.05,
                        duration:
                          !hoveredId || hoveredId === feature.id ? 2.0 : 0.8,
                        ease: [0.215, 0.61, 0.355, 1],
                      }}
                      className="inline-block"
                    >
                      {char}
                    </motion.span>
                  ))}
                </div>

                {/* Hover 展开的竖版云纱画笺面板 */}
                <div className="absolute top-[-14px] right-full mr-4 lg:mr-6 flex flex-row-reverse overflow-hidden w-0 opacity-0 transition-[width,opacity] duration-1500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:w-[112px] group-hover:opacity-100 z-10 will-change-[width,opacity]">
                  <div className="flex w-[112px] h-[150px] shrink-0 flex-row-reverse justify-center items-center gap-2.5 backdrop-blur-md bg-[#FCFAF2]/95 dark:bg-[#0E131F]/95 border border-[#E6DFCD] dark:border-slate-800/80 shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] rounded-2xl py-4 px-3 relative overflow-hidden select-none">
                    {/* 内置古典信笺框边线 */}
                    <div className="absolute inset-[4px] border border-[#E6DFCD]/50 dark:border-slate-800/30 rounded-xl pointer-events-none" />

                    {/* 右侧：主标题竖排 */}
                    <div className={`[writing-mode:vertical-rl] font-serif font-bold text-[15px] tracking-[0.25em] ${feature.textBase} whitespace-nowrap z-10 mb-0 leading-none`}>
                      {feature.label}
                    </div>

                    {/* 中间古典分割线 */}
                    <div className="h-full w-px bg-slate-200/60 dark:bg-slate-800/60 z-10" />

                    {/* 左侧：描述文字与小图标 */}
                    <div className="flex flex-col items-center justify-between h-full py-1 z-10">
                      <div className="[writing-mode:vertical-rl] font-sans font-light text-[11px] tracking-[0.2em] text-slate-500 dark:text-slate-400 whitespace-nowrap leading-[1.4] mb-0">
                        {feature.desc}
                      </div>
                      <Icon
                        size={14}
                        strokeWidth={1.5}
                        className={`${feature.textBase} opacity-80 shrink-0 transition-transform duration-1000 group-hover:rotate-12`}
                      />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* -- 移动端入口 (Mobile) - 极简横向排列 -- */}
        <div className="flex md:hidden flex-row gap-8 w-full mt-2 flex-wrap">
          {/* 主副标题与入口间的分界线 - 古典编排风格的高级分界线 */}
          <div className="flex items-center w-full mt-2 mb-1.5 opacity-80">
            <div className="flex-1 h-px bg-linear-to-r from-transparent to-slate-300 dark:to-slate-700" />
            <div className="mx-4 flex items-center justify-center gap-1.5 text-slate-400 dark:text-slate-600">
              <div className="h-[2px] w-[2px] rounded-full bg-current" />
              <div className="h-[4px] w-[4px] rounded-xs bg-current rotate-45" />
              <div className="h-[2px] w-[2px] rounded-full bg-current" />
            </div>
            <div className="flex-1 h-px bg-linear-to-l from-transparent to-slate-300 dark:to-slate-700" />
          </div>

          {FEATURE_ENTRANCES.map((feature, index) => {
            return (
              <Link
                key={feature.id}
                href={feature.href}
                onMouseEnter={() => setHoveredId(feature.id)}
                onMouseLeave={() => setHoveredId(null)}
                onTouchStart={() => setHoveredId(feature.id)}
                className="group flex items-center justify-between outline-none py-2"
              >
                <div className="flex items-center gap-4">
                  {/* 菱形小印章指示点 - 加上与桌面端统一的无边界高斯模糊光晕 */}
                  <div className="relative flex items-center justify-center h-3 w-3">
                    {/* concentric ripples */}
                    <div
                      className={`absolute h-2.5 w-2.5 rounded-full opacity-0 blur-[2px] ${feature.haloBg} classical-ripple-anim`}
                      style={{ animationDelay: "0s" }}
                    />
                    <div
                      className={`absolute h-2.5 w-2.5 rounded-full opacity-0 blur-[2px] ${feature.haloBg} classical-ripple-anim`}
                      style={{ animationDelay: "2s" }}
                    />
                    {/* 核心印章 */}
                    <div
                      className={`h-1.5 w-1.5 rotate-45 border border-current bg-transparent transition-all duration-500 group-active:rotate-135 group-active:bg-current ${feature.textBase}`}
                    />
                  </div>
                  {/* 标题 */}
                  <div
                    className={`flex items-center text-[16px] font-calligraphy font-medium tracking-[0.5em] ${feature.textBase} ${feature.textHover} leading-none transition-opacity duration-500`}
                  >
                    {feature.label.split("").map((char, i) => (
                      <motion.span
                        key={i}
                        initial={{ opacity: 0, scale: 0.8, filter: "blur(8px)" }}
                        animate={
                          !hoveredId || hoveredId === feature.id
                            ? { opacity: 1, scale: 1, filter: "blur(0px)" }
                            : { opacity: 0, scale: 0.6, filter: "blur(12px)" }
                        }
                        style={{
                          backfaceVisibility: "hidden",
                          WebkitFontSmoothing: "antialiased",
                          transform: "translateZ(0)",
                          willChange: "transform, opacity",
                        }}
                        transition={{
                          delay:
                            !hoveredId || hoveredId === feature.id
                              ? 0.35 + index * 0.15 + i * 0.15
                              : i * 0.05,
                          duration:
                            !hoveredId || hoveredId === feature.id ? 2.0 : 0.8,
                          ease: [0.215, 0.61, 0.355, 1],
                        }}
                        className="inline-block"
                      >
                        {char}
                      </motion.span>
                    ))}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
