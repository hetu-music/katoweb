"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useTransition } from "react";
import { cn } from "@/lib/utils/utils";

const LOCALE_LABELS: Record<string, string> = {
  "zh-CN": "简",
  "zh-TW": "繁",
};

export default function LocaleSwitcher({ className }: { className?: string }) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const otherLocale = locale === "zh-CN" ? "zh-TW" : "zh-CN";

  const handleSwitch = () => {
    startTransition(() => {
      router.replace(pathname, { locale: otherLocale });
    });
  };

  return (
    <button
      onClick={handleSwitch}
      disabled={isPending}
      className={cn(
        "relative rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide transition-all duration-300",
        "border border-slate-200 dark:border-slate-700",
        "text-slate-600 dark:text-slate-400",
        "hover:border-slate-400 dark:hover:border-slate-500",
        "hover:bg-slate-50 dark:hover:bg-slate-800",
        "disabled:opacity-50 disabled:cursor-wait",
        className,
      )}
      title={`切换至${otherLocale === "zh-TW" ? "繁體中文" : "简体中文"}`}
    >
      {isPending ? (
        <span className="opacity-50">{LOCALE_LABELS[locale]}</span>
      ) : (
        LOCALE_LABELS[locale]
      )}
    </button>
  );
}
