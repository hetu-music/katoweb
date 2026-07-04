"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useTransition, useCallback, useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils/utils";
import { Languages, Check } from "lucide-react";

// 语言配置项，未来如需添加英语（en）、日语（ja）等，只需在此追加配置即可
const LANGUAGES = [
  { code: "zh-CN", label: "简体中文" },
  { code: "zh-TW", label: "繁體中文" },
];

export default function LocaleSwitcher({ className }: { className?: string }) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 点击外部区域自动收起下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 鼠标悬停时预加载非当前语系，保证流畅度
  const handlePrefetch = useCallback(() => {
    LANGUAGES.forEach((lang) => {
      if (lang.code !== locale) {
        router.prefetch(pathname, { locale: lang.code });
      }
    });
  }, [router, pathname, locale]);

  const handleSwitch = (targetLocale: string) => {
    setIsOpen(false);
    if (targetLocale === locale || isPending) return;
    startTransition(() => {
      router.replace(pathname, { locale: targetLocale });
    });
  };

  return (
    <div
      ref={dropdownRef}
      className={cn("relative flex items-center", className)}
      onMouseEnter={handlePrefetch}
    >
      {/* 触发按钮：与 ThemeToggle / User 按钮尺寸及悬浮状态完美统一，极大节省移动端空间 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
        title="切换语言 / Switch Language"
        aria-expanded={isOpen}
        aria-haspopup="true"
        className={cn(
          "w-9 h-9 flex items-center justify-center rounded-full transition-colors cursor-pointer",
          "text-slate-600 dark:text-slate-400",
          isOpen
            ? "bg-slate-200/60 dark:bg-slate-800 text-blue-600 dark:text-blue-400"
            : "hover:bg-slate-200/50 dark:hover:bg-slate-800",
          isPending && "opacity-40 cursor-wait animate-pulse",
        )}
      >
        <Languages size={19} />
      </button>

      {/* 下拉菜单浮层 */}
      {isOpen && (
        <div
          role="menu"
          className={cn(
            "absolute right-0 top-11 z-50 min-w-[128px] py-1.5 rounded-xl border",
            "bg-white/95 dark:bg-[#0F1424]/95 backdrop-blur-md shadow-lg shadow-slate-100/50 dark:shadow-none",
            "border-slate-200/60 dark:border-slate-800/80",
            "animate-in fade-in slide-in-from-top-2 duration-150",
          )}
        >
          {LANGUAGES.map((lang) => {
            const isActive = lang.code === locale;
            return (
              <button
                key={lang.code}
                role="menuitem"
                disabled={isPending}
                onClick={() => handleSwitch(lang.code)}
                className={cn(
                  "w-full px-4 py-2 text-left text-xs font-medium tracking-wide flex items-center justify-between transition-colors cursor-pointer",
                  isActive
                    ? "text-blue-600 dark:text-blue-400 font-semibold bg-blue-50/30 dark:bg-blue-950/15"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200",
                )}
              >
                <span>{lang.label}</span>
                {isActive && <Check size={13} className="text-blue-500" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
