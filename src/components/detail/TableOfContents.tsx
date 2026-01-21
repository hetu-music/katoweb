"use client";

import React, { useState, useEffect } from "react";
import { SongDetail } from "@/lib/types";

// 简易 classNames 工具
function cn(...classes: (string | undefined | null | false)[]) {
    return classes.filter(Boolean).join(" ");
}

interface TableOfContentsProps {
    song: SongDetail;
}

const TableOfContents: React.FC<TableOfContentsProps> = ({ song }) => {
    const [activeSection, setActiveSection] = useState<string>("info");

    const navItems = [
        { id: "info", label: "Basic Info" },
        ...(song.comment ? [{ id: "remarks", label: "Remarks" }] : []),
        { id: "lyrics", label: "Lyrics" },
        ...(song.nmn_status ? [{ id: "score", label: "Score" }] : []),
    ];

    useEffect(() => {
        const handleScroll = () => {
            const scrollPosition = window.scrollY + 200; // Offset for better triggering

            for (const item of navItems) {
                const element = document.getElementById(item.id);
                if (element) {
                    const { offsetTop, offsetHeight } = element;
                    if (
                        scrollPosition >= offsetTop &&
                        scrollPosition < offsetTop + offsetHeight
                    ) {
                        setActiveSection(item.id);
                    }
                }
            }
        };

        window.addEventListener("scroll", handleScroll);
        handleScroll(); // Initial check
        return () => window.removeEventListener("scroll", handleScroll);
    }, [navItems]);

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
        }
    };

    return (
        <div className="fixed right-8 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col gap-4">
            {navItems.map((item) => (
                <button
                    key={item.id}
                    onClick={() => handleScrollTo(item.id)}
                    className="group relative flex items-center justify-end"
                    aria-label={`Scroll to ${item.label}`}
                >
                    {/* Label (Tooltip) */}
                    <span
                        className={cn(
                            "absolute right-8 px-3 py-1.5 rounded-md bg-slate-900/80 dark:bg-white/90 text-white dark:text-slate-900 text-xs font-medium whitespace-nowrap opacity-0 transform translate-x-2 transition-all duration-300 pointer-events-none",
                            activeSection === item.id
                                ? "opacity-100 translate-x-0"
                                : "group-hover:opacity-100 group-hover:translate-x-0"
                        )}
                    >
                        {item.label}
                        {/* Arrow */}
                        <span className="absolute top-1/2 -right-1 -translate-y-1/2 border-4 border-transparent border-l-slate-900/80 dark:border-l-white/90"></span>
                    </span>

                    {/* Dot */}
                    <div
                        className={cn(
                            "w-3 h-3 rounded-full border-2 transition-all duration-300",
                            activeSection === item.id
                                ? "bg-slate-900 dark:bg-white border-slate-900 dark:border-white scale-125"
                                : "bg-transparent border-slate-400 dark:border-slate-600 group-hover:border-slate-600 dark:group-hover:border-slate-400"
                        )}
                    />
                </button>
            ))}
        </div>
    );
};

export default TableOfContents;
