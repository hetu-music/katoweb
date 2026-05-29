"use client";

import { useFavorites } from "@/context/FavoritesContext";
import { useUserContext } from "@/context/UserContext";
import { cn } from "@/lib/utils";
import { Loader2, LogOut, Mail, ShieldCheck, User } from "lucide-react";
import Link from "next/link";

export default function ProfileHeaderCard() {
  const { user, loaded: userLoaded, logout, loggingOut } = useUserContext();
  const { favorites } = useFavorites();

  const isSuperAdmin = userLoaded && !!user?.isSuper;
  const hasBenefits = userLoaded && !!user?.hasBenefits;
  const favoritesCount = favorites.length;

  return (
    <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 shadow-xs p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Avatar + Details */}
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-slate-50 dark:bg-slate-800/60 flex items-center justify-center shrink-0 border border-slate-200/50 dark:border-slate-700/50">
            <span className="text-lg sm:text-xl font-bold text-slate-400 dark:text-slate-500">
              {user?.name?.charAt(0)?.toUpperCase() || <User size={20} />}
            </span>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                {user?.name || (userLoaded ? "访客" : "加载中...")}
              </h2>
              <span
                className={cn(
                  "text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider scale-90 origin-left shrink-0",
                  user?.isAdmin
                    ? "bg-blue-50 text-blue-600 border-blue-200/60 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/30"
                    : "bg-slate-50 text-slate-500 border-slate-200/60 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-700",
                )}
              >
                {user?.isAdmin
                  ? isSuperAdmin
                    ? "系统超管"
                    : "管理员"
                  : "普通用户"}
              </span>
            </div>

            {/* Stats + Email row */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              {user?.email && (
                <span className="flex items-center gap-1 truncate max-w-[200px]">
                  <Mail size={12} className="shrink-0" />
                  {user.email}
                </span>
              )}
              {user?.email && (
                <span className="text-slate-200 dark:text-slate-800/60 select-none">
                  •
                </span>
              )}
              <span>{favoritesCount} 收藏</span>
              <span className="text-slate-200 dark:text-slate-800/60 select-none">
                •
              </span>
              <span
                className={cn(
                  hasBenefits
                    ? "text-emerald-500 dark:text-emerald-400/90 font-medium"
                    : "",
                )}
              >
                权益{hasBenefits ? "已开通" : "未开通"}
              </span>
            </div>

            {user?.intro && (
              <div className="border-l-2 border-slate-200 dark:border-slate-800 pl-2.5 mt-2 max-w-md">
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 leading-relaxed">
                  {user.intro}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          {user?.isAdmin && (
            <Link
              href="/admin"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 transition-colors text-xs font-bold shadow-xs"
            >
              <ShieldCheck size={14} />
              管理面板
            </Link>
          )}
          {user && (
            <button
              onClick={logout}
              disabled={loggingOut}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-rose-600 hover:border-rose-200 dark:hover:text-rose-400 dark:hover:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-colors text-xs font-bold shadow-xs"
            >
              {loggingOut ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <LogOut size={14} />
              )}
              退出登录
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
