"use client";

import React, { useState } from "react";
import {
    Info,
    Mic2,
    LayoutTemplate,
    PenTool,
    List,
    X,
} from "lucide-react";
import { SongDetail } from "@/lib/types";

// 简易 classNames 工具
function cn(...classes: (string | undefined | null | false)[]) {
    return classes.filter(Boolean).join(" ");
}

interface TableOfContentsProps {
    song: SongDetail;
}

const TableOfContents: React.FC<TableOfContentsProps> = ({ song }) => {
    const [isOpen, setIsOpen] = useState(false);

    const navItems = [
        { id: "info", label: "Basic Info", icon: Info },
        ...(song.comment
            ? [{ id: "remarks", label: "Remarks", icon: PenTool }]
            : []),
        { id: "lyrics", label: "Lyrics", icon: Mic2 },
        ...(song.nmn_status
            ? [{ id: "score", label: "Score", icon: LayoutTemplate }]
            : []),
    ];

    const handleScrollTo = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            const offset = 100; // Header height + padding
            const elementPosition =
                element.getBoundingClientRect().top + window.scrollY;
            window.scrollTo({
                top: elementPosition - offset,
                behavior: "smooth",
            });
            setIsOpen(false);
        }
    };

    return (
        <div className="fixed right-6 top-1/2 -translate-y-1/2 z-40 flex flex-col items-end gap-4">
            {/* 展开后的菜单 */}
            <div
                className={cn(
                    "bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl p-2 transition-all duration-300 origin-right overflow-hidden",
                    isOpen
                        ? "opacity-100 scale-100 translate-x-0 w-48"
                        : "opacity-0 scale-95 translate-x-8 w-0 pointer-events-none p-0 border-0"
                )}
            >
                <div className="flex flex-col gap-1">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => handleScrollTo(item.id)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all group w-full text-left"
                        >
                            <item.icon
                                size={16}
                                className="opacity-50 group-hover:opacity-100 transition-opacity"
                            />
                            <span>{item.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* 触发按钮 */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "h-12 w-12 rounded-full shadow-lg flex items-center justify-center transition-all duration-300",
                    isOpen
                        ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rotate-90"
                        : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:scale-110"
                )}
                title={isOpen ? "关闭目录" : "显示目录"}
            >
                {isOpen ? <X size={20} /> : <List size={20} />}
            </button>
        </div>
    );
};

export default TableOfContents;
