import React, { useRef, useState } from "react";
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
    const containerRef = useRef<HTMLDivElement>(null);
    const [placement, setPlacement] = useState<"top" | "bottom">("top");

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

    const [isHovered, setIsHovered] = useState(false);

    const checkPosition = () => {
        if (!containerRef.current || !tags) return;
        const rect = containerRef.current.getBoundingClientRect();
        // Nav (80px) + Sticky Bar (approx 60px) + Safety margin
        const safeZoneTop = 180;
        const estimatedHeight = tags.length * 30 + 20;

        if (rect.top - estimatedHeight < safeZoneTop) {
            setPlacement("bottom");
        } else {
            setPlacement("top");
        }
    };

    const handleMouseEnter = () => {
        checkPosition();
        setIsHovered(true);
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
    };

    // Multiple tags
    return (
        <div
            ref={containerRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="relative flex items-center justify-center gap-2 w-24"
        >
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
            <div
                className={cn(
                    "absolute left-0 w-24 flex gap-2 pointer-events-none z-50",
                    placement === "top"
                        ? "bottom-full mb-4 flex-col-reverse"
                        : "top-full mt-4 flex-col"
                )}
            >
                {tags.map((t, i) => (
                    <span
                        key={t}
                        style={{ transitionDelay: `${i * 50}ms` }}
                        className={cn(
                            "px-3 py-1 text-xs font-medium text-center border rounded-full w-24 truncate transition-all duration-300 ease-out",
                            type === "type"
                                ? getTypeTagStyle(t, "glass")
                                : getGenreTagStyle(t, "glass"),
                            isHovered
                                ? "opacity-100 scale-100 translate-y-0 blur-0"
                                : cn(
                                    "opacity-0 scale-90 blur-sm",
                                    placement === "top" ? "translate-y-2" : "-translate-y-2"
                                )
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
