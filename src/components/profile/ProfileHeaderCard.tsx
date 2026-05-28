"use client";

import { cn } from "@/lib/utils";
import { Loader2, LogOut, Mail, ShieldCheck, User } from "lucide-react";
import type { UserInfo } from "@/context/UserContext";

interface ProfileHeaderCardProps {
  user: UserInfo | null;
  userLoaded: boolean;
  isSuperAdmin: boolean;
  hasBenefits: boolean;
  favoritesCount: number;
  loggingOut: boolean;
  logout: () => Promise<void>;
}

export default function ProfileHeaderCard({
  user,
  userLoaded,
  isSuperAdmin,
  hasBenefits,
  favoritesCount,
  loggingOut,
  logout,
}: ProfileHeaderCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Left side: Avatar + User details */}
        <div className="flex items-center gap-4 sm:gap-6 min-w-0">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
            <div className="w-full h-full rounded-full flex items-center justify-center text-2xl font-bold text-slate-400 dark:text-slate-500">
              {user?.name?.charAt(0)?.toUpperCase() || <User size={28} />}
            </div>
          </div>
          
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 truncate">
                {user?.name || (userLoaded ? "访客" : "加载中...")}
              </h2>
              <span className={cn(
                "text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider",
                user?.isAdmin 
                  ? "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/10 dark:text-blue-400 dark:border-blue-800/30" 
                  : "bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-700"
              )}>
                {user?.isAdmin ? (isSuperAdmin ? "系统超管" : "管理员") : "普通用户"}
              </span>
            </div>
            
            {user?.email && (
              <div className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 mb-2">
                <Mail size={13} className="shrink-0" />
                <span className="truncate">{user.email}</span>
              </div>
            )}
            
            {user?.intro ? (
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl line-clamp-2 md:line-clamp-none">
                {user.intro}
              </p>
            ) : (
              <p className="text-sm text-slate-400 dark:text-slate-500 italic">
                暂无个人简介...
              </p>
            )}
          </div>
        </div>

        {/* Right side: Stats & Actions in a row/grid */}
        <div className="flex flex-wrap md:flex-nowrap items-center gap-4 sm:gap-6 shrink-0 pt-4 md:pt-0 border-t border-slate-100 dark:border-slate-800/50 md:border-t-0 w-full md:w-auto">
          {/* Stats */}
          <div className="flex gap-6 sm:gap-8 bg-slate-50 dark:bg-slate-800/30 px-6 py-3 rounded-xl border border-slate-100 dark:border-slate-800/50 flex-1 md:flex-initial justify-around md:justify-start">
            <div className="text-center min-w-[50px]">
              <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                {favoritesCount}
              </p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">
                我的收藏
              </p>
            </div>
            <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 self-center" />
            <div className="text-center min-w-[50px]">
              <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                {hasBenefits ? "已开通" : "未开通"}
              </p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">
                试听权益
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex sm:flex-col gap-2 w-full md:w-auto">
            {user?.isAdmin && (
              <a
                href="/admin"
                className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white transition-colors text-sm font-medium"
              >
                <ShieldCheck size={16} />
                管理面板
              </a>
            )}
            {user && (
              <button
                onClick={logout}
                disabled={loggingOut}
                className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-rose-600 hover:border-rose-200 dark:hover:text-rose-400 dark:hover:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-colors text-sm font-medium"
              >
                {loggingOut ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <LogOut size={16} />
                )}
                退出登录
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
