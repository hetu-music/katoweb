"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  User,
  LogIn,
  LogOut,
  Settings,
  ArrowLeft,
  Check,
  Loader2,
  ChevronRight,
  Heart,
  Trash2,
  ExternalLink,
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

type TabType = "account" | "favorites";

export default function ProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as TabType) ?? "account";

  const { user, loaded: userLoaded, logout, loggingOut } = useUserContext();
  const {
    favorites,
    toggleFavorite,
    clearFavorites,
    loaded: favoritesLoaded,
    isLoggedIn,
  } = useFavorites();

  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
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

  // 收藏歌曲列表
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
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0B0F19] transition-colors duration-500">
      {/* 顶部导航 */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#FAFAFA]/80 dark:bg-[#0B0F19]/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="max-w-lg mx-auto px-6 h-16 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="p-2 -ml-2 rounded-full transition-colors text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800 group"
          >
            <ArrowLeft size={20} className="transition-transform group-hover:-translate-x-1" />
          </button>
          <span className="font-bold text-slate-900 dark:text-white">个人中心</span>
          <ThemeToggle />
        </div>
      </nav>

      <main className="pt-24 pb-16 max-w-lg mx-auto px-6">
        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 mb-8">
          {(["favorites", "account"] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 pb-3 pt-2 text-sm font-medium transition-colors relative flex items-center justify-center gap-2",
                activeTab === tab
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200",
              )}
            >
              {tab === "favorites" ? <Heart size={14} className={cn(activeTab === "favorites" && "fill-current")} /> : <Settings size={14} />}
              {tab === "favorites" ? "我的收藏" : "账户设置"}
              {activeTab === tab && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* 收藏 Tab */}
        {activeTab === "favorites" && (
          <div className="space-y-4">
            {!isLoggedIn ? (
              <div className="flex flex-col items-center justify-center py-20 gap-5 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <Heart size={28} className="text-slate-400" />
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-slate-700 dark:text-slate-200">尚未登录</p>
                  <p className="text-sm text-slate-400 dark:text-slate-500">登录后可收藏歌曲，跨设备同步</p>
                </div>
                <button
                  onClick={handleLogin}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
                >
                  <LogIn size={16} />
                  立即登录
                </button>
              </div>
            ) : !favoritesLoaded || loadingSongs ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
                <Loader2 size={24} className="animate-spin" />
                <span className="text-sm">加载中...</span>
              </div>
            ) : favoritedSongs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400 dark:text-slate-500">
                <Heart size={48} className="opacity-20" />
                <p className="text-sm">还没有收藏任何歌曲</p>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex items-center justify-between mb-4 px-1">
                  <span className="text-xs font-medium text-slate-400">共 {favoritedSongs.length} 首歌曲</span>
                  <button
                    onClick={clearFavorites}
                    className="text-xs font-medium text-rose-500 hover:text-rose-600 flex items-center gap-1 transition-colors"
                  >
                    <Trash2 size={12} />
                    清空收藏
                  </button>
                </div>
                <ul className="space-y-2">
                  {favoritedSongs.map((song) => (
                    <li
                      key={song.id}
                      className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group border border-transparent hover:border-slate-100 dark:hover:border-white/10"
                    >
                      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 shadow-sm">
                        <Image src={getCoverUrl(song)} alt={song.title} width={48} height={48} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{song.title}</p>
                        {song.artist && song.artist.length > 0 && (
                          <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">{song.artist.join(" / ")}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => router.push(`/song/${song.id}`)}
                          title="查看详情"
                          className="p-2 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                        >
                          <ExternalLink size={16} />
                        </button>
                        <button
                          onClick={() => toggleFavorite(song.id)}
                          title="取消收藏"
                          className="p-2 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                        >
                          <Heart size={16} className="fill-current" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* 账户 Tab */}
        {activeTab === "account" && (
          <div className="space-y-6">
            {!userLoaded ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 size={24} className="animate-spin text-slate-400" />
              </div>
            ) : !user ? (
              <div className="flex flex-col items-center justify-center py-20 gap-5 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <User size={28} className="text-slate-400" />
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-slate-700 dark:text-slate-200">尚未登录</p>
                  <p className="text-sm text-slate-400 dark:text-slate-500">登录后可同步个人资料与收藏</p>
                </div>
                <button
                  onClick={handleLogin}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
                >
                  <LogIn size={16} />
                  立即登录
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* 用户信息卡片 */}
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 shadow-sm">
                  <div className="w-14 h-14 rounded-full bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-inner">
                    {user.name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 dark:text-slate-100 text-lg truncate">{user.name}</p>
                    {user.email && (
                      <p className="text-sm text-slate-400 dark:text-slate-500 truncate">{user.email}</p>
                    )}
                  </div>
                </div>

                {/* 编辑表单 */}
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 block px-1">用户名</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      maxLength={30}
                      placeholder="请输入用户名"
                      className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 block px-1">个人简介</label>
                    <textarea
                      value={intro}
                      onChange={(e) => setIntro(e.target.value)}
                      maxLength={200}
                      rows={3}
                      placeholder="简单介绍一下自己吧"
                      className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                    />
                  </div>
                  <button
                    onClick={handleSave}
                    disabled={saving || !name.trim()}
                    className={cn(
                      "w-full py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg",
                      saving || !name.trim()
                        ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none"
                        : "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20 active:scale-[0.98]",
                    )}
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : saveMsg === "已保存" ? <Check size={16} /> : null}
                    {saveMsg ?? "保存修改"}
                  </button>
                </div>

                {/* Admin 入口 */}
                {user.isAdmin && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <a
                      href="/admin"
                      className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-50 dark:bg-white/5 hover:bg-blue-50 dark:hover:bg-blue-500/10 border border-slate-100 dark:border-white/10 transition-all group"
                    >
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        <Settings size={18} />
                        管理面板
                      </div>
                      <ChevronRight size={18} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                    </a>
                  </div>
                )}

                {/* 退出登录 */}
                <div className="pt-4">
                  <button
                    onClick={logout}
                    disabled={loggingOut}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all border border-transparent hover:border-rose-100 dark:hover:border-rose-500/20"
                  >
                    {loggingOut ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
                    退出登录
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
