"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

interface HeroSectionProps {
  songCount: number;
}

export default function HeroSection({ songCount }: HeroSectionProps) {
  // Detect pointer-capable (hover) devices
  const [isHoverDevice, setIsHoverDevice] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    setIsHoverDevice(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsHoverDevice(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <div
      ref={containerRef}
      className="space-y-4 md:space-y-10 pt-1 md:pt-4"
      onMouseEnter={() => isHoverDevice && setIsHovered(true)}
      onMouseLeave={() => isHoverDevice && setIsHovered(false)}
    >
      <h1 className="text-5xl md:text-6xl text-slate-900 dark:text-slate-50 italic tracking-tight">
        谣歌{" "}
        <span className="text-[1.3em] font-semibold">{songCount}</span>
      </h1>

      <div className="flex flex-col md:flex-row md:items-center gap-y-3 gap-x-0 md:gap-x-10 transition-all duration-700 ease-in-out">
        <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
          <span className="text-blue-600 dark:text-blue-500 font-mono text-lg leading-none relative -top-[1.5px] select-none">
            &gt;
          </span>
          <p className="font-light tracking-[0.15em] text-sm md:text-[15px] leading-relaxed">
            你一定想知道，戏里讲了什么故事
            {/* Breathing ellipsis — only on hover-capable devices when not hovered */}
            {isHoverDevice && (
              <motion.span
                animate={{ opacity: isHovered ? 0 : [0.4, 1, 0.4] }}
                transition={
                  isHovered
                    ? { duration: 0.3, ease: "easeOut" }
                    : {
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                      repeatDelay: 0.5,
                    }
                }
                className="select-none inline-block ml-1 font-normal text-slate-400 dark:text-slate-500"
              >
                ……
              </motion.span>
            )}
            {/* On mobile there's no breathing cursor */}
            {!isHoverDevice && <span className="ml-1 text-slate-400 dark:text-slate-500">……</span>}
          </p>
        </div>

        {/* --- Mobile Entry Link --- */}
        <div className="flex md:hidden justify-end hero-unroll" style={{ animationDelay: '0.4s' }}>
          <Link
            href="/imagery"
            className="flex items-center gap-2 px-1 py-0.5 text-sm font-medium tracking-widest text-slate-600 dark:text-slate-400 active:opacity-60 transition-opacity"
          >
            <span className="relative pb-0.5 border-b border-slate-100 dark:border-slate-800/50">
              意象词云
            </span>
            <ArrowUpRight className="h-4 w-4 opacity-70 relative -top-[2px]" />
          </Link>
        </div>

        {/* --- Desktop Entry Link --- */}
        <div className="hidden md:flex">
          <AnimatePresence>
            {isHoverDevice && isHovered && (
              <motion.div
                key="imagery-entry-desktop"
                initial={{ opacity: 0, x: -12, filter: "blur(8px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, x: -8, filter: "blur(4px)" }}
                transition={{
                  duration: 0.8,
                  ease: [0.42, 0, 0.58, 1]
                }}
                className="flex items-center before:content-[''] before:block before:w-10 before:h-px before:bg-slate-200 dark:before:bg-slate-800 before:mr-6"
              >
                <Link
                  href="/imagery"
                  className="group flex items-center gap-2 text-sm font-medium tracking-widest text-slate-700 dark:text-slate-300 transition-colors hover:text-black dark:hover:text-white"
                >
                  <span className="relative pb-1">
                    意象词云
                    <span className="absolute bottom-0 left-0 h-px w-0 bg-current transition-all duration-500 ease-out group-hover:w-full" />
                  </span>
                  <ArrowUpRight className="h-3.5 w-3.5 opacity-60 transition-transform duration-500 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100 relative -top-[2.5px]" />
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
