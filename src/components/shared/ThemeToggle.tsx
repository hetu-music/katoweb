"use client";

import React, { useState, useEffect } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { flushSync } from "react-dom";

interface ThemeToggleProps {
  /**
   * 自定义按钮样式类名
   * @default "p-2 rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400"
   */
  className?: string;
}

/**
 * 主题切换按钮组件
 *
 * 支持明暗主题切换，带有优雅的视图过渡动画效果
 */
export default function ThemeToggle({ className }: ThemeToggleProps) {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Use requestAnimationFrame to avoid synchronous setState in effect
    requestAnimationFrame(() => {
      setMounted(true);
    });
  }, []);

  const toggleTheme = (e: React.MouseEvent<HTMLButtonElement>) => {
    // 如果浏览器不支持 View Transition API，直接切换主题
    if (!document.startViewTransition) {
      setTheme(resolvedTheme === "dark" ? "light" : "dark");
      return;
    }

    // 计算动画中心点和半径
    const x = e.clientX;
    const y = e.clientY;
    const endRadius = Math.hypot(
      Math.max(x, innerWidth - x),
      Math.max(y, innerHeight - y),
    );

    // 临时禁用过渡效果，避免闪烁
    document.documentElement.classList.add("no-transitions");

    // 使用 View Transition API 创建流畅的主题切换动画
    const transition = document.startViewTransition(() => {
      flushSync(() => {
        setTheme(resolvedTheme === "dark" ? "light" : "dark");
      });
    });

    // 动画完成后重新启用过渡效果
    transition.finished.then(() => {
      document.documentElement.classList.remove("no-transitions");
    });

    // 添加圆形扩散动画
    transition.ready.then(() => {
      const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${endRadius}px at ${x}px ${y}px)`,
      ];

      document.documentElement.animate(
        {
          clipPath: clipPath,
        },
        {
          duration: 500,
          easing: "ease-in-out",
          pseudoElement: "::view-transition-new(root)",
        },
      );
    });
  };

  const defaultClassName =
    "p-2 rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400";

  return (
    <button
      onClick={toggleTheme}
      className={className || defaultClassName}
      title={
        mounted
          ? resolvedTheme === "dark"
            ? "暗色主题"
            : "亮色主题"
          : "主题切换"
      }
      aria-label="切换主题"
    >
      {mounted ? (
        resolvedTheme === "dark" ? (
          <Moon size={20} className="animate-in fade-in duration-200" />
        ) : (
          <Sun size={20} className="animate-in fade-in duration-200" />
        )
      ) : (
        <div className="w-5 h-5" />
      )}
    </button>
  );
}
