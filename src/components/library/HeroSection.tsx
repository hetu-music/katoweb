"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

interface HeroSectionProps {
  songCount: number;
}

export default function HeroSection({ songCount }: HeroSectionProps) {
  // Detect pointer-capable (hover) devices
  const [isHoverDevice, setIsHoverDevice] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    setIsHoverDevice(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsHoverDevice(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (isHoverDevice) return;
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHoverDevice]);

  const showEntryLink = isHoverDevice ? isHovered : scrolled;

  return (
    <div
      ref={containerRef}
      className="space-y-4"
      onMouseEnter={() => isHoverDevice && setIsHovered(true)}
      onMouseLeave={() => isHoverDevice && setIsHovered(false)}
    >
      <h1 className="text-5xl md:text-6xl text-slate-900 dark:text-slate-50 italic">
        谣歌{" "}
        <span className="text-[1.3em] font-semibold">{songCount}</span>
      </h1>

      <p className="text-slate-500 dark:text-slate-400 font-light max-w-lg">
        你一定想知道，戏里讲了什么故事
        {/* Breathing ellipsis — only on hover-capable devices when not hovered */}
        {isHoverDevice && (
          <motion.span
            animate={{ opacity: isHovered ? 0 : [0.4, 0.8, 0.4] }}
            transition={
              isHovered
                ? { duration: 0.3, ease: "easeOut" }
                : {
                    duration: 2.4,
                    repeat: Infinity,
                    ease: "easeInOut",
                    repeatDelay: 0.2,
                  }
            }
            className="select-none"
          >
            ……
          </motion.span>
        )}
        {/* On mobile there's no breathing cursor */}
        {!isHoverDevice && "……"}
      </p>

      {/* Text C: 意象词云 entry link */}
      <AnimatePresence>
        {showEntryLink && (
          <motion.div
            key="imagery-entry"
            initial={
              isHoverDevice
                ? { opacity: 0, x: -10 }
                : { opacity: 0, y: 10 }
            }
            animate={
              isHoverDevice
                ? { opacity: 1, x: 0 }
                : { opacity: 1, y: 0 }
            }
            exit={
              isHoverDevice
                ? { opacity: 0, x: -10 }
                : { opacity: 0, y: 10 }
            }
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <Link
              href="/imagery"
              className="inline-flex items-center gap-1 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors duration-300 text-sm font-light tracking-wide"
            >
              意象词云 ↗
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
