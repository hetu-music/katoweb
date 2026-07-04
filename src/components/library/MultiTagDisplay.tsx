import React, { useRef, useState } from "react";
import { getTypeTagStyle, getGenreTagStyle } from "@/lib/constants";
import { cn } from "@/lib/utils/utils";
import { useTranslations } from "next-intl";

const MultiTagDisplay = ({
  tags,
  type,
}: {
  tags: string[] | null | undefined;
  type: "type" | "genre";
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [placement, setPlacement] = useState<"top" | "bottom">("top");
  const tEnum = useTranslations("enums");

  if (!tags || tags.length === 0) {
    return (
      <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-medium w-24 text-center truncate text-slate-500 dark:text-slate-400">
        {type === "type" ? "未知类型" : "未知流派"}
      </span>
    );
  }

  if (tags.length === 1) {
    const tVal = tags[0];
    const style =
      type === "type"
        ? getTypeTagStyle(tVal, "subtle")
        : getGenreTagStyle(tVal);
    const label = tEnum.has(`${type}.${tVal}`)
      ? tEnum(`${type}.${tVal}`)
      : tVal;
    return (
      <span
        className={cn(
          "px-3 py-1 rounded-full text-xs font-medium w-24 text-center truncate border",
          style,
        )}
      >
        {label}
      </span>
    );
  }

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

  // Multiple tags
  return (
    <div
      ref={containerRef}
      onMouseEnter={checkPosition}
      className="group/tags relative flex items-center justify-center gap-2 w-24"
    >
      {/* Small circles */}
      {tags.slice(0, 3).map((tVal) => {
        const label = tEnum.has(`${type}.${tVal}`)
          ? tEnum(`${type}.${tVal}`)
          : tVal;
        return (
          <div
            key={tVal}
            className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center text-xs border shrink-0",
              type === "type"
                ? getTypeTagStyle(tVal, "subtle")
                : getGenreTagStyle(tVal),
            )}
          >
            {label[0]}
          </div>
        );
      })}
      {tags.length > 3 && (
        <div className="text-[10px] text-slate-400 font-medium">
          +{tags.length - 3}
        </div>
      )}

      {/* Expanded List */}
      <div
        className={cn(
          "absolute left-0 w-24 flex gap-3 pointer-events-none z-50",
          placement === "top"
            ? "bottom-full mb-4 flex-col-reverse"
            : "top-full mt-4 flex-col",
        )}
      >
        {tags.map((tVal, i) => {
          const label = tEnum.has(`${type}.${tVal}`)
            ? tEnum(`${type}.${tVal}`)
            : tVal;
          return (
            <span
              key={tVal}
              style={{ transitionDelay: `${i * 40}ms` }}
              className={cn(
                "px-3 py-1 text-xs font-medium text-center border rounded-full w-24 truncate transition-all duration-300 ease-out",
                type === "type"
                  ? getTypeTagStyle(tVal, "glass")
                  : getGenreTagStyle(tVal, "glass"),
                "opacity-0 scale-50 group-hover/tags:opacity-100 group-hover/tags:translate-y-0 group-hover/tags:scale-100",
                placement === "top" ? "translate-y-8" : "-translate-y-8",
              )}
            >
              {label}
            </span>
          );
        })}
      </div>
    </div>
  );
};

export default MultiTagDisplay;
