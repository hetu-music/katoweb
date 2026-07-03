"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useTransition, useCallback } from "react";
import { cn } from "@/lib/utils/utils";

const LOCALE_LABELS: Record<string, string> = {
  "zh-CN": "简",
  "zh-TW": "繁",
};

const LOCALE_TITLES: Record<string, string> = {
  "zh-CN": "切換繁體中文",
  "zh-TW": "切换简体中文",
};

export default function LocaleSwitcher({ className }: { className?: string }) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const label = LOCALE_LABELS[locale] ?? "简";
  const title = LOCALE_TITLES[locale] ?? "切换语言";
  const otherLocale = locale === "zh-CN" ? "zh-TW" : "zh-CN";

  // 鼠标悬停 / 键盘 focus 时预取目标 locale 页面
  // 这样用户真正点击时，服务端（含 OpenCC 转换）已完成响应，切换近乎即时
  const handlePrefetch = useCallback(() => {
    router.prefetch(pathname, { locale: otherLocale });
  }, [router, pathname, otherLocale]);

  const handleSwitch = () => {
    startTransition(() => {
      router.replace(pathname, { locale: otherLocale });
    });
  };

  return (
    <button
      onClick={handleSwitch}
      onMouseEnter={handlePrefetch}
      onFocus={handlePrefetch}
      disabled={isPending}
      title={title}
      aria-label={title}
      className={cn(
        "p-2 rounded-full transition-colors",
        "text-slate-600 dark:text-slate-400",
        "hover:bg-slate-200/50 dark:hover:bg-slate-800",
        "disabled:opacity-40 disabled:cursor-wait",
        "w-9 h-9 flex items-center justify-center",
        "text-sm font-semibold leading-none select-none",
        isPending && "animate-pulse",
        className,
      )}
    >
      {label}
    </button>
  );
}
