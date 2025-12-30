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
        <div className="group/tags relative flex items-center justify-center gap-2 w-24">
            {/* Small circles */}
            {tags.slice(0, 3).map((t) => (
                <div
                    key={t}
                    className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center text-xs border shrink-0",
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

            {/* Expanded List */}
            <div className="absolute bottom-full mb-4 left-0 w-24 flex flex-col-reverse gap-3 pointer-events-none z-50">
                {tags.map((t, i) => (
                    <span
                        key={t}
                        style={{ transitionDelay: `${i * 40}ms` }}
                        className={cn(
                            "px-3 py-1 text-xs font-medium text-center border rounded-full w-24 truncate transition-all duration-300 ease-out",
                            type === "type"
                                ? getTypeTagStyle(t, "glass")
                                : getGenreTagStyle(t, "glass"),
                            "opacity-0 translate-y-8 scale-50 group-hover/tags:opacity-100 group-hover/tags:translate-y-0 group-hover/tags:scale-100"
                        )}
                    >
                        {t}
                    </span>
                ))}
            </div>
        </div>
    );
};

export default MultiTagDisplay;
