"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  User,
  LogOut,
  Settings,
  ArrowLeft,
  Check,
  Loader2,
  ChevronRight,
  Heart,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Mail,
  Fingerprint,
} from "lucide-react";
import Image from "next/image";
import { useUserContext } from "@/context/UserContext";
import { useFavorites } from "@/hooks/useFavorites";
import { getCoverUrl } from "@/lib/utils-song";
import type { Song } from "@/lib/types";
import ThemeToggle from "@/components/shared/ThemeToggle";

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

type TabType = "favorites" | "account" | "security";

export default function ProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as TabType) ?? "favorites";

  const { user, loaded: userLoaded, logout, loggingOut } = useUserContext();
  const {
    favorites,
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
    if (activeTab !== "account") return;
    fetch("/api/public/csrf-token")
      .then((r) => r.json())
      .then((d) => setCsrfToken(d.csrfToken || ""));
  }, [activeTab]);

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

  // Favorites Data
  const [internalSongs, setInternalSongs] = useState<Song[]>([]);
  const [loadingSongs, setLoadingSongs] = useState(false);

  useEffect(() => {
    if (activeTab !== "favorites" || internalSongs.length > 0 || loadingSongs) return;
    setLoadingSongs(true);
    fetch("/api/public/collections")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data.songs)) setInternalSongs(data.songs); })
      .finally(() => setLoadingSongs(false));
  }, [activeTab, internalSongs.length, loadingSongs]);

  const favoritedSongs = useMemo(
    () => internalSongs.filter((s) => favorites.includes(s.id)),
    [internalSongs, favorites],
  );

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
          
          {/* Left Column: Profile Overview Card (Col-4) */}
          <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-32">
            <div className="bg-white dark:bg-[#111] rounded-3xl p-8 border border-slate-200/60 dark:border-slate-800/60 shadow-xl shadow-slate-200/20 dark:shadow-none overflow-hidden relative">
              {/* Decorative Background Element */}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
              
              <div className="relative flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 p-1 mb-6 shadow-lg shadow-blue-500/20">
                  <div className="w-full h-full rounded-full bg-white dark:bg-[#111] flex items-center justify-center text-3xl font-bold text-blue-600 dark:text-blue-400 shadow-inner">
                    {user?.name?.charAt(0)?.toUpperCase() || <User size={40} />}
                  </div>
                </div>
                
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  {user?.name || (userLoaded ? "访客" : "加载中...")}
                </h2>
                
                {user?.email && (
                  <div className="flex items-center gap-1.5 text-sm text-slate-400 dark:text-slate-500 mb-6">
                    <Mail size={14} />
                    {user.email}
                  </div>
                )}
                
                {user?.intro && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-8 max-w-xs">
                    {user.intro}
                  </p>
                )}

                {/* Stats Summary */}
                <div className="grid grid-cols-2 w-full gap-4 pt-8 border-t border-slate-100 dark:border-slate-800/50">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{favorites.length}</p>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mt-1">我的收藏</p>
                  </div>
                  <div className="text-center border-l border-slate-100 dark:border-slate-800/50">
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      {user?.isAdmin ? "管理员" : "普通用户"}
                    </p>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mt-1">当前身份</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions / Info */}
            {user?.isAdmin && (
              <a
                href="/admin"
                className="flex items-center justify-between w-full p-5 rounded-2xl bg-slate-900 dark:bg-blue-600 text-white hover:bg-slate-800 dark:hover:bg-blue-500 transition-all group shadow-lg shadow-blue-500/10"
              >
                <div className="flex items-center gap-3 font-bold text-sm">
                  <ShieldCheck size={20} />
                  前往管理面板
                </div>
                <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" />
              </a>
            )}

            {isLoggedIn && (
              <button
                onClick={logout}
                disabled={loggingOut}
                className="flex items-center justify-center gap-2 w-full p-4 rounded-2xl bg-white dark:bg-transparent border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-rose-500 hover:border-rose-200 dark:hover:border-rose-500/30 transition-all font-bold text-sm"
              >
                {loggingOut ? <Loader2 size={18} className="animate-spin" /> : <LogOut size={18} />}
                退出当前登录
              </button>
            )}
          </aside>

          {/* Right Column: Content Area (Col-8) */}
          <div className="lg:col-span-8 space-y-8">
            {/* Tabs Controller */}
            <div className="flex p-1.5 bg-white dark:bg-[#111] rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm sticky top-24 z-30">
              {(["favorites", "account", "security"] as TabType[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2",
                    activeTab === tab
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5"
                  )}
                >
                  {tab === "favorites" && <Heart size={16} className={cn(activeTab === tab && "fill-current")} />}
                  {tab === "account" && <Settings size={16} />}
                  {tab === "security" && <Fingerprint size={16} />}
                  {tab === "favorites" ? "我的收藏" : tab === "account" ? "账户设置" : "安全中心"}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="min-h-[500px]">
              {activeTab === "favorites" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {!isLoggedIn ? (
                    <div className="flex flex-col items-center justify-center py-32 bg-white dark:bg-[#111] rounded-3xl border border-slate-200/60 dark:border-slate-800/60 border-dashed">
                      <div className="w-20 h-20 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center mb-6">
                        <Heart size={32} className="text-slate-300" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">尚未登录</h3>
                      <p className="text-sm text-slate-400 mb-8 max-w-xs text-center">请先登录账号以查看您的个人收藏库</p>
                      <button
                        onClick={handleLogin}
                        className="px-8 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                      >
                        立即登录
                      </button>
                    </div>
                  ) : !favoritesLoaded || loadingSongs ? (
                    <div className="flex flex-col items-center justify-center py-32">
                      <Loader2 size={32} className="animate-spin text-blue-500 mb-4" />
                      <p className="text-sm text-slate-400 font-medium tracking-widest uppercase">加载曲目中...</p>
                    </div>
                  ) : favoritedSongs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 bg-white dark:bg-[#111] rounded-3xl border border-slate-200/60 dark:border-slate-800/60">
                      <Heart size={48} className="text-slate-200 dark:text-slate-800 mb-4" />
                      <p className="text-slate-400 font-medium">收藏夹空空如也</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between px-2">
                         <div className="flex items-center gap-2">
                           <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                           <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                             共 {favoritedSongs.length} 首作品
                           </span>
                         </div>
                         <button
                           onClick={clearFavorites}
                           className="text-xs font-bold text-rose-500 hover:text-rose-600 px-3 py-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors flex items-center gap-1.5"
                         >
                           <Trash2 size={14} />
                           全部清除
                         </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {favoritedSongs.map((song) => (
                          <div
                            key={song.id}
                            className="group flex items-center gap-4 p-4 bg-white dark:bg-[#111] rounded-2xl border border-slate-200/60 dark:border-slate-800/60 hover:border-blue-500/30 dark:hover:border-blue-500/30 transition-all hover:shadow-xl hover:shadow-slate-200/20 dark:hover:shadow-none"
                          >
                            <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 shadow-md">
                              <Image
                                src={getCoverUrl(song)}
                                alt={song.title}
                                width={64}
                                height={64}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {song.title}
                              </h4>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-slate-400 dark:text-slate-500 truncate">
                                  {song.artist?.join(" / ") || "河图"}
                                </span>
                                <span className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
                                <span className="text-[10px] font-mono text-slate-300">
                                  {song.year || "----"}
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-col gap-1">
                              <button
                                onClick={() => router.push(`/song/${song.id}`)}
                                className="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all"
                                title="查看详情"
                              >
                                <ExternalLink size={18} />
                              </button>
                              <button
                                onClick={() => toggleFavorite(song.id)}
                                className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all"
                                title="取消收藏"
                              >
                                <Heart size={18} className="fill-current" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "account" && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                   <div className="bg-white dark:bg-[#111] rounded-3xl p-8 border border-slate-200/60 dark:border-slate-800/60 shadow-sm space-y-8">
                     <div className="flex items-center gap-4 pb-6 border-b border-slate-50 dark:border-slate-800/50">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                          <Settings size={24} />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-slate-900 dark:text-white">个人资料</h3>
                          <p className="text-sm text-slate-400">管理您的公开信息与个性化设置</p>
                        </div>
                     </div>

                     {!isLoggedIn ? (
                        <div className="py-12 text-center space-y-4">
                           <p className="text-slate-400 font-medium">请登录后继续操作</p>
                           <button onClick={handleLogin} className="text-blue-600 font-bold hover:underline">去登录 →</button>
                        </div>
                     ) : (
                       <div className="space-y-6">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">用户名</label>
                              <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                maxLength={30}
                                placeholder="输入您的公开昵称"
                                className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-transparent focus:bg-white dark:focus:bg-[#111] focus:border-blue-500/50 outline-none transition-all text-slate-800 dark:text-slate-200"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">登录邮箱</label>
                              <div className="w-full px-5 py-3.5 rounded-2xl bg-slate-100 dark:bg-white/5 border border-transparent text-slate-400 cursor-not-allowed opacity-60">
                                {user?.email}
                              </div>
                            </div>
                         </div>

                         <div className="space-y-2">
                           <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">个人简介</label>
                           <textarea
                             value={intro}
                             onChange={(e) => setIntro(e.target.value)}
                             maxLength={200}
                             rows={4}
                             placeholder="在这里写下关于您的故事..."
                             className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-transparent focus:bg-white dark:focus:bg-[#111] focus:border-blue-500/50 outline-none transition-all text-slate-800 dark:text-slate-200 resize-none"
                           />
                         </div>

                         <div className="pt-4">
                           <button
                             onClick={handleSave}
                             disabled={saving || !name.trim()}
                             className={cn(
                               "px-8 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2",
                               saving || !name.trim()
                                 ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                                 : "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20 active:scale-95"
                             )}
                           >
                             {saving ? <Loader2 size={18} className="animate-spin" /> : saveMsg === "已保存" ? <Check size={18} /> : null}
                             {saveMsg ?? "更新个人资料"}
                           </button>
                         </div>
                       </div>
                     )}
                   </div>
                </div>
              )}

              {activeTab === "security" && (
                 <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-white dark:bg-[#111] rounded-3xl p-8 border border-slate-200/60 dark:border-slate-800/60 shadow-sm">
                       <div className="flex flex-col items-center justify-center py-24 text-center">
                          <div className="w-20 h-20 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center mb-6">
                            <ShieldCheck size={32} className="text-slate-300" />
                          </div>
                          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">安全中心已就绪</h3>
                          <p className="text-sm text-slate-400 max-w-xs">更多账号保护功能正在开发中，我们将竭力守护您的数据安全。</p>
                       </div>
                    </div>
                 </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
