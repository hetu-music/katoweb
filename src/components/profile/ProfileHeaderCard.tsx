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
    <div className="relative overflow-hidden rounded-3xl border border-slate-200/50 dark:border-slate-800/50 bg-linear-to-br from-white/70 via-white/50 to-slate-50/30 dark:from-slate-900/70 dark:via-slate-900/50 dark:to-slate-950/30 backdrop-blur-xl shadow-xs p-6 md:p-8">
      {/* Decorative ambient backgrounds */}
      <div className="absolute -top-24 -left-20 w-80 h-80 bg-blue-500/10 dark:bg-blue-600/10 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute -bottom-24 -right-20 w-80 h-80 bg-indigo-500/10 dark:bg-indigo-600/10 rounded-full blur-3xl -z-10 pointer-events-none" />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        {/* Left side: Avatar + User details */}
        <div className="flex items-center gap-4 sm:gap-6 min-w-0">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-linear-to-br from-blue-500 via-indigo-500 to-purple-600 p-[2.5px] shadow-lg shrink-0">
            <div className="w-full h-full rounded-full bg-white dark:bg-slate-950 flex items-center justify-center text-2xl font-bold text-blue-600 dark:text-blue-400">
              {user?.name?.charAt(0)?.toUpperCase() || <User size={28} />}
            </div>
          </div>
          
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-serif tracking-tight truncate">
                {user?.name || (userLoaded ? "访客" : "加载中...")}
              </h2>
              <span className={cn(
                "text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs",
                user?.isAdmin 
                  ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20" 
                  : "bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20"
              )}>
                {user?.isAdmin ? (isSuperAdmin ? "系统超管" : "管理员") : "普通用户"}
              </span>
            </div>
            
            {user?.email && (
              <div className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-400 dark:text-slate-500 mt-1 mb-2">
                <Mail size={13} className="shrink-0" />
                <span className="truncate">{user.email}</span>
              </div>
            )}
            
            {user?.intro ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xl line-clamp-2 md:line-clamp-none">
                {user.intro}
              </p>
            ) : (
              <p className="text-xs text-slate-450 dark:text-slate-550 italic">
                暂无个人简介...
              </p>
            )}
          </div>
        </div>

        {/* Right side: Stats & Actions in a row/grid */}
        <div className="flex flex-wrap md:flex-nowrap items-center gap-4 sm:gap-6 shrink-0 pt-4 md:pt-0 border-t border-slate-200/40 dark:border-slate-800/40 md:border-t-0 w-full md:w-auto">
          {/* Stats */}
          <div className="flex gap-6 sm:gap-8 bg-slate-50/50 dark:bg-slate-950/20 px-6 py-3 rounded-2xl border border-slate-200/30 dark:border-slate-800/30 flex-1 md:flex-initial justify-around md:justify-start">
            <div className="text-center min-w-[50px]">
              <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                {favoritesCount}
              </p>
              <p className="text-[10px] font-bold text-slate-405 uppercase tracking-wider mt-0.5">
                我的收藏
              </p>
            </div>
            <div className="w-px h-8 bg-slate-200 dark:bg-slate-800 self-center" />
            <div className="text-center min-w-[50px]">
              <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                {hasBenefits ? "已开通" : "未开通"}
              </p>
              <p className="text-[10px] font-bold text-slate-405 uppercase tracking-wider mt-0.5">
                试听权益
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex sm:flex-col gap-2 w-full md:w-auto">
            {user?.isAdmin && (
              <a
                href="/admin"
                className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-blue-600 text-white hover:bg-slate-800 dark:hover:bg-blue-500 transition-all font-bold text-xs shadow-xs hover:scale-[1.02] active:scale-[0.98]"
              >
                <ShieldCheck size={14} />
                管理面板
              </a>
            )}
            {user && (
              <button
                onClick={logout}
                disabled={loggingOut}
                className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-rose-500 hover:border-rose-200 dark:hover:border-rose-500/30 transition-all font-bold text-xs hover:scale-[1.02] active:scale-[0.98]"
              >
                {loggingOut ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <LogOut size={14} />
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
