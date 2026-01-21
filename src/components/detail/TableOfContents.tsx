"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { SongDetail } from "@/lib/types";

interface TableOfContentsProps {
    song: SongDetail;
}

interface NavItem {
    id: string;
    label: string;
}

const TableOfContents: React.FC<TableOfContentsProps> = ({ song }) => {
    const [activeId, setActiveId] = useState<string>("info");
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const [showActiveLabel, setShowActiveLabel] = useState(false);
    const observerRef = useRef<IntersectionObserver | null>(null);
    const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

    // 构建导航项
    const getNavItems = useCallback((): NavItem[] => {
        const items: NavItem[] = [{ id: "info", label: "基本信息" }];
        if (song.comment) items.push({ id: "remarks", label: "备注" });
        items.push({ id: "lyrics", label: "歌词" });
        if (song.nmn_status) items.push({ id: "score", label: "乐谱" });
        return items;
    }, [song.comment, song.nmn_status]);

    const navItems = getNavItems();

    // 当 activeId 变化时，短暂显示标签
    useEffect(() => {
        // 清除之前的定时器
        if (hideTimerRef.current) {
            clearTimeout(hideTimerRef.current);
        }

        // 显示标签
        setShowActiveLabel(true);

        // 1.5秒后隐藏
        hideTimerRef.current = setTimeout(() => {
            setShowActiveLabel(false);
        }, 1500);

        return () => {
            if (hideTimerRef.current) {
                clearTimeout(hideTimerRef.current);
            }
        };
    }, [activeId]);

    // 使用 IntersectionObserver 监听当前可见的 section
    useEffect(() => {
        if (typeof window === "undefined") return;

        const options = {
            root: null,
            rootMargin: "-20% 0px -60% 0px",
            threshold: 0,
        };

        observerRef.current = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    setActiveId(entry.target.id);
                }
            });
        }, options);

        const timer = setTimeout(() => {
            navItems.forEach((item) => {
                const element = document.getElementById(item.id);
                if (element && observerRef.current) {
                    observerRef.current.observe(element);
                }
            });
        }, 100);

        return () => {
            clearTimeout(timer);
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [navItems]);

    const handleClick = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            const offset = 120;
            const top = element.getBoundingClientRect().top + window.scrollY - offset;
            window.scrollTo({ top, behavior: "smooth" });
        }
    };

    return (
        <nav
            className="fixed right-6 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col items-end gap-3"
            aria-label="目录导航"
        >
            {navItems.map((item) => {
                const isActive = activeId === item.id;
                const isHovered = hoveredId === item.id;
                // 只在悬停时或（激活且 showActiveLabel 为 true）时显示标签
                const showLabel = isHovered || (isActive && showActiveLabel);

                return (
                    <button
                        key={item.id}
                        onClick={() => handleClick(item.id)}
                        onMouseEnter={() => setHoveredId(item.id)}
                        onMouseLeave={() => setHoveredId(null)}
                        className="group flex items-center gap-3 outline-none"
                        aria-label={`跳转到${item.label}`}
                        aria-current={isActive ? "location" : undefined}
                    >
                        {/* 标签 */}
                        <span
                            className={`
                                px-3 py-1.5 rounded-full text-xs font-medium
                                backdrop-blur-md border
                                transition-all duration-300 ease-out
                                ${showLabel
                                    ? "opacity-100 translate-x-0"
                                    : "opacity-0 translate-x-4 pointer-events-none"
                                }
                                ${isActive
                                    ? "bg-slate-900/90 dark:bg-white/90 text-white dark:text-slate-900 border-transparent shadow-lg"
                                    : "bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200/50 dark:border-slate-700/50"
                                }
                            `}
                        >
                            {item.label}
                        </span>

                        {/* 指示点 */}
                        <span
                            className={`
                                relative flex items-center justify-center
                                w-3 h-3 rounded-full
                                transition-all duration-300 ease-out
                                ${isActive
                                    ? "bg-slate-900 dark:bg-white scale-100"
                                    : "bg-slate-300 dark:bg-slate-600 scale-75 group-hover:scale-100 group-hover:bg-slate-400 dark:group-hover:bg-slate-500"
                                }
                            `}
                        >
                            {isActive && (
                                <span className="absolute inset-0 rounded-full bg-slate-900/30 dark:bg-white/30 animate-ping" />
                            )}
                        </span>
                    </button>
                );
            })}

            {/* 连接线 */}
            <div
                className="absolute right-[5px] top-0 bottom-0 w-[2px] bg-gradient-to-b from-transparent via-slate-200 dark:via-slate-700 to-transparent -z-10"
                aria-hidden="true"
            />
        </nav>
    );
};

export default TableOfContents;
