"use client";

import ThemeToggle from "@/components/shared/ThemeToggle";
import { useUserContext } from "@/context/UserContext";
import { cn } from "@/lib/utils";
import { Info, User } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { forwardRef, useCallback } from "react";

interface AppNavbarProps {
  title: React.ReactNode;
  onTitleClick: () => void;
  onAboutClick?: () => void;
  titleTooltip?: string;
  className?: string;
}

const AppNavbar = forwardRef<HTMLElement, AppNavbarProps>(function AppNavbar(
  { title, onTitleClick, onAboutClick, titleTooltip = "返回首页", className },
  ref,
) {
  const router = useRouter();
  const { user } = useUserContext();

  const openUserPanel = useCallback(() => {
    if (!user) {
      const next = encodeURIComponent(
        window.location.pathname + window.location.search,
      );
      router.push(`/login?next=${next}`);
      return;
    }

    const navDepth = parseInt(
      sessionStorage.getItem("__katoweb_nav_depth") || "0",
      10,
    );
    sessionStorage.setItem("__katoweb_nav_depth", String(navDepth + 1));
    router.push("/profile?tab=favorites");
  }, [router, user]);

  return (
    <nav
      ref={ref}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 border-b border-slate-200/50 bg-[#FAFAFA]/80 backdrop-blur-md transition-colors duration-500 dark:border-slate-800/50 dark:bg-[#0B0F19]/80",
        className,
      )}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        <button
          onClick={onTitleClick}
          className="flex cursor-pointer items-center gap-1 text-2xl font-bold tracking-tight text-slate-900 transition-colors hover:text-blue-600 dark:text-white dark:hover:text-blue-400 font-serif"
          title={titleTooltip}
        >
          {title}
        </button>
        <div className="flex items-center gap-2">
          {onAboutClick && (
            <button
              onClick={onAboutClick}
              className="rounded-full p-2 text-slate-600 transition-colors hover:bg-slate-200/50 dark:text-slate-400 dark:hover:bg-slate-800"
              title="关于"
            >
              <Info size={20} />
            </button>
          )}
          <button
            onClick={openUserPanel}
            className="relative rounded-full p-2 text-slate-600 transition-colors hover:bg-slate-200/50 dark:text-slate-400 dark:hover:bg-slate-800"
            title={user ? user.name : "登录"}
          >
            <User
              size={20}
              className={user ? "text-blue-500 dark:text-blue-400" : ""}
            />
          </button>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
});

export default AppNavbar;
