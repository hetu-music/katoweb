"use client";

import ThemeToggle from "@/components/shared/ThemeToggle";
import { useFavorites } from "@/context/FavoritesContext";
import { useUserContext } from "@/context/UserContext";
import { getCoverUrl } from "@/lib/utils-song";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Heart,
  Loader2,
  LogOut,
  Mail,
  Settings,
  ShieldCheck,
  Trash2,
  User
} from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

type TabType = "favorites" | "account";

export default function ProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as TabType) ?? "favorites";

  const { user, loaded: userLoaded, logout, loggingOut } = useUserContext();
  const {
    favorites,
    favoriteSongs,
    toggleFavorite,
    clearFavorites,
    loaded: favoritesLoaded,
    isLoggedIn,
  } = useFavorites();

  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  // Account Form State
  const [name, setName] = useState("");
  const [intro, setIntro] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [csrfToken, setCsrfToken] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.name ?? "");
      setIntro(user.intro ?? "");
    }
  }, [user]);

  useEffect(() => {
    if (!isLoggedIn || activeTab !== "account") return;
    fetch("/api/public/csrf-token")
      .then((r) => r.json())
      .then((d) => setCsrfToken(d.csrfToken || ""));
  }, [activeTab, isLoggedIn]);

  const handleSave = useCallback(async () => {
    if (!csrfToken || saving) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch("/api/auth/account", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken },
        body: JSON.stringify({ displayName: name, intro }),
      });
      if (res.ok) {
        setSaveMsg("已保存");
      } else {
        const d = await res.json();
        setSaveMsg(d.error || "保存失败");
      }
    } catch {
      setSaveMsg("保存失败");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(null), 2500);
    }
  }, [csrfToken, saving, name, intro]);

  const handleLogin = useCallback(() => {
    const next = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `/login?next=${next}`;
  }, []);

  const handleBack = useCallback(() => {
    const navDepthStr = sessionStorage.getItem("__katoweb_nav_depth");
    const navDepth = navDepthStr ? parseInt(navDepthStr, 10) : 0;
    if (navDepth > 0) {
      sessionStorage.setItem("__katoweb_nav_depth", String(navDepth - 1));
      router.back();
    } else {
      router.push("/");
    }
  }, [router]);

  // Favorites Data — sourced directly from FavoritesContext
  // favoriteSongs already contains the full Song objects for all favorited songs
  const favoritedSongs = favoriteSongs;

  const NotLoggedInState = useCallback(() => (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-320px)] p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 border-dashed transition-all">
      <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center mb-6">
        <User size={32} className="text-slate-200 dark:text-slate-700" />
      </div>
      <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">尚未登录</h3>
      <p className="text-sm text-slate-400 mb-8">请先登录账号以访问您的个人收藏与设置</p>
      <button
        onClick={handleLogin}
        className="px-10 py-3 rounded-full bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 active:scale-95"
      >
        立即登录
      </button>
    </div>
  ), [handleLogin]);

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0B0F19] transition-colors duration-500 font-sans">
      {/* Header Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#FAFAFA]/80 dark:bg-[#0B0F19]/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="p-2 -ml-2 rounded-full transition-colors text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800 group"
              title="返回"
            >
              <ArrowLeft size={20} className="transition-transform group-hover:-translate-x-1" />
            </button>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white font-serif tracking-tight">
              个人中心
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-20 max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left Column: Compact Profile Card (Col-3) */}
          <aside className="lg:col-span-3 space-y-4 lg:sticky lg:top-32">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/60 dark:border-slate-800/60 shadow-sm overflow-hidden relative">
              <div className="relative flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 p-[2px] mb-4 shadow-md">
                  <div className="w-full h-full rounded-full bg-white dark:bg-[#111] flex items-center justify-center text-xl font-bold text-blue-600 dark:text-blue-400">
                    {user?.name?.charAt(0)?.toUpperCase() || <User size={24} />}
                  </div>
                </div>

                <h2 className="text-lg font-bold text-slate-900 dark:text-white truncate w-full">
                  {user?.name || (userLoaded ? "访客" : "加载中...")}
                </h2>

                {user?.email && (
                  <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 mt-1 mb-4">
                    <Mail size={12} />
                    {user.email}
                  </div>
                )}

                {user?.intro && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6 line-clamp-2">
                    {user.intro}
                  </p>
                )}

                {/* Compact Stats */}
                <div className="flex w-full gap-4 pt-4 border-t border-slate-100 dark:border-slate-800/50">
                  <div className="flex-1 text-center">
                    <p className="text-lg font-bold text-slate-900 dark:text-white">{favorites.length}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">收藏</p>
                  </div>
                  <div className="w-px h-8 bg-slate-100 dark:bg-slate-800/50 self-center" />
                  <div className="flex-1 text-center">
                    <p className="text-lg font-bold text-slate-900 dark:text-white truncate">
                      {user?.isAdmin ? "管理" : "用户"}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">角色</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2">
              {user?.isAdmin && (
                <a
                  href="/admin"
                  className="flex items-center justify-between w-full p-4 rounded-xl bg-slate-900 dark:bg-blue-600 text-white hover:bg-slate-800 dark:hover:bg-blue-500 transition-all group shadow-sm"
                >
                  <div className="flex items-center gap-2.5 font-bold text-xs">
                    <ShieldCheck size={16} />
                    管理面板
                  </div>
                  <ChevronRight size={14} className="transition-transform group-hover:translate-x-1" />
                </a>
              )}

              {isLoggedIn && (
                <button
                  onClick={logout}
                  disabled={loggingOut}
                  className="flex items-center justify-center gap-2 w-full p-3.5 rounded-xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-rose-500 hover:border-rose-200 dark:hover:border-rose-500/30 transition-all font-bold text-xs"
                >
                  {loggingOut ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
                  退出登录
                </button>
              )}
            </div>
          </aside>

          {/* Right Column: Content Area (Col-9) */}
          <div className="lg:col-span-9 space-y-6 min-h-[calc(100vh-240px)] flex flex-col">
            {/* Tabs Controller - Styled like site filters */}
            <div className="flex p-1 bg-slate-100 dark:bg-slate-900/50 rounded-xl border border-slate-200/50 dark:border-slate-800/50 w-fit shrink-0">
              {(["favorites", "account"] as TabType[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "py-2 px-6 rounded-lg text-sm font-bold transition-all flex items-center gap-2",
                    activeTab === tab
                      ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  )}
                >
                  {tab === "favorites" && <Heart size={14} className={cn(activeTab === tab && "fill-current")} />}
                  {tab === "account" && <Settings size={14} />}
                  {tab === "favorites" ? "我的收藏" : "账户设置"}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 flex flex-col">
              {activeTab === "favorites" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 flex-1 flex flex-col">
                  {!isLoggedIn ? (
                    <NotLoggedInState />
                  ) : !favoritesLoaded ? (
                    <div className="flex-1 flex flex-col items-center justify-center min-h-[calc(100vh-320px)]">
                      <Loader2 size={32} className="animate-spin text-blue-500" />
                    </div>
                  ) : favoritedSongs.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center min-h-[calc(100vh-320px)] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 transition-all">
                      <Heart size={40} className="text-slate-100 dark:text-slate-800 mb-4" />
                      <p className="text-slate-400 text-sm">还没有收藏任何曲目</p>
                    </div>
                  ) : (
                    <div className="space-y-4 flex-1">
                      <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                            已收藏 {favoritedSongs.length} 首作品
                          </span>
                        </div>
                        <button
                          onClick={clearFavorites}
                          className="text-xs font-bold text-rose-500 hover:text-rose-600 px-3 py-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors flex items-center gap-1.5"
                        >
                          <Trash2 size={12} />
                          全部清除
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-8">
                        {favoritedSongs.map((song) => (
                          <div
                            key={song.id}
                            onClick={() => router.push(`/song/${song.id}`)}
                            className="group flex items-center gap-4 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800/60 hover:border-blue-500/30 dark:hover:border-blue-500/30 transition-all hover:shadow-lg hover:shadow-slate-200/20 dark:hover:shadow-none cursor-pointer"
                          >
                            <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 shadow-sm">
                              <Image
                                src={getCoverUrl(song)}
                                alt={song.title}
                                width={56}
                                height={56}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              />
                            </div>

                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {song.title}
                              </h4>
                              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                                {song.artist?.join(" / ") || "河图"}
                              </p>
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(song.id);
                              }}
                              className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100"
                              title="取消收藏"
                            >
                              <Heart size={16} className="fill-current" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "account" && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex-1 flex flex-col">
                  {!isLoggedIn ? (
                    <NotLoggedInState />
                  ) : (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200/60 dark:border-slate-800/60 shadow-sm space-y-8 flex-1">
                      <div className="space-y-1">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">账户设置</h3>
                        <p className="text-xs text-slate-400">管理您的公开资料与基本信息</p>
                      </div>

                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">用户名</label>
                            <input
                              type="text"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              maxLength={30}
                              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-transparent focus:bg-white dark:focus:bg-[#111] focus:border-blue-500/50 outline-none transition-all text-sm text-slate-800 dark:text-slate-200"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">邮箱</label>
                            <div className="w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-white/5 text-xs text-slate-400 cursor-not-allowed">
                              {user?.email}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">个人简介</label>
                          <textarea
                            value={intro}
                            onChange={(e) => setIntro(e.target.value)}
                            maxLength={200}
                            rows={3}
                            className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-transparent focus:bg-white dark:focus:bg-[#111] focus:border-blue-500/50 outline-none transition-all text-sm text-slate-800 dark:text-slate-200 resize-none"
                          />
                        </div>

                        <div className="pt-2">
                          <button
                            onClick={handleSave}
                            disabled={saving || !name.trim()}
                            className={cn(
                              "px-6 py-2.5 rounded-full text-sm font-bold transition-all flex items-center justify-center gap-2",
                              saving || !name.trim()
                                ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                                : "bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/10 active:scale-95"
                            )}
                          >
                            {saving ? <Loader2 size={16} className="animate-spin" /> : saveMsg === "已保存" ? <Check size={16} /> : null}
                            {saveMsg ?? "保存更改"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
