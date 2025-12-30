import React from "react";
import { getTypeTagStyle, getGenreTagStyle } from "@/lib/constants";

// 简易 classNames 工具
function cn(...classes: (string | undefined | null | false)[]) {
    return classes.filter(Boolean).join(" ");
}

const MultiTagDisplay = ({
    tags,
    type,
}: {
    tags: string[] | null | undefined;
    type: "type" | "genre";
}) => {
    if (!tags || tags.length === 0) {
        return (
            <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-medium w-24 text-center truncate text-slate-500 dark:text-slate-400">
                {type === "type" ? "未知类型" : "未知流派"}
            </span>
        );
    }

    if (tags.length === 1) {
        const t = tags[0];
        const style =
            type === "type" ? getTypeTagStyle(t, "subtle") : getGenreTagStyle(t);
        return (
            <span
                className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium w-24 text-center truncate border",
                    style,
                )}
            >
                {t}
            </span>
        );
    }

    // Multiple tags
    return (
        <div className="group relative flex items-center justify-center gap-1 w-24">
            {/* Small circles */}
            {tags.slice(0, 3).map((t) => (
                <div
                    key={t}
                    className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-[10px] border shadow-sm shrink-0 bg-white dark:bg-slate-800/50 transition-transform group-hover:scale-110",
                        type === "type"
                            ? getTypeTagStyle(t, "subtle")
                            : getGenreTagStyle(t),
                    )}
                >
                    {t[0]}
                </div>
            ))}
            {tags.length > 3 && (
                <div className="text-[10px] text-slate-400 font-medium">
                    +{tags.length - 3}
                </div>
            )}

            {/* Tooltip */}
            <div className="absolute opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none bottom-full mb-3 left-1/2 -translate-x-1/2 z-50 w-max max-w-[240px] translate-y-2 group-hover:translate-y-0">
                <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-xl rounded-xl p-3 border border-slate-100 dark:border-slate-700 flex flex-wrap gap-2 justify-center">
                    {tags.map((t) => (
                        <span
                            key={t}
                            className={cn(
                                "px-3 py-1 rounded-full text-xs font-medium border text-center shadow-sm",
                                type === "type"
                                    ? getTypeTagStyle(t, "emphasized")
                                    : getGenreTagStyle(t, "emphasized"),
                            )}
                        >
                            {t}
                        </span>
                    ))}
                </div>
                {/* Arrow */}
                <div className="w-2 h-2 bg-white dark:bg-slate-800 rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2 border-b border-r border-slate-100 dark:border-slate-700"></div>
            </div>
        </div>
    );
};

export default MultiTagDisplay;
