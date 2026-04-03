"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  User,
  LogIn,
  LogOut,
  Settings,
  X,
  Check,
  Loader2,
  ChevronRight,
  Heart,
  Trash2,
  ExternalLink,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useUserContext } from "@/context/UserContext";
import { useFavorites } from "@/hooks/useFavorites";
import { getCoverUrl } from "@/lib/utils-song";
import type { Song } from "@/lib/types";

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

type TabType = "account" | "favorites";

interface UserPanelProps {
  isOpen: boolean;
  onClose: () => void;
  allSongs?: Song[];
  initialTab?: TabType;
}

const UserPanel: React.FC<UserPanelProps> = ({
  isOpen,
  onClose,
  allSongs = [],
  initialTab = "account",
}) => {
  const { user, loaded: userLoaded, logout, loggingOut } = useUserContext();
  const {
    favorites,
    toggleFavorite,
    clearFavorites,
    loaded: favoritesLoaded,
    isLoggedIn,
  } = useFavorites();
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  // 个人信息编辑状态
  const [name, setName] = useState("");
  const [intro, setIntro] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [csrfToken, setCsrfToken] = useState("");

  // 当 initialTab 改变或 isOpen 变为 true 时同步 activeTab
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // 初始化表单
  useEffect(() => {
    if (user) {
      setName(user.name ?? "");
      setIntro(user.intro ?? "");
    }
  }, [user]);

  // 获取 CSRF token
  useEffect(() => {
    if (!isOpen || activeTab !== "account") return;
    fetch("/api/public/csrf-token")
      .then((r) => r.json())
      .then((d) => setCsrfToken(d.csrfToken || ""));
  }, [isOpen, activeTab]);

  // 点击遮罩关闭 (Handle in Backdrop)
  // ESC 关闭
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      document.body.style.overflow = "unset";
      document.body.style.paddingRight = "0px";
    }
    return () => {
      document.body.style.overflow = "unset";
      document.body.style.paddingRight = "0px";
    };
  }, [isOpen]);

  const handleSave = useCallback(async () => {
    if (!csrfToken || saving) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch("/api/auth/account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
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
    const next = encodeURIComponent(
      window.location.pathname + window.location.search,
    );
    window.location.href = `/login?next=${next}`;
  }, []);

  const [internalSongs, setInternalSongs] = useState<Song[]>([]);

  const favoritedSongs = useMemo(() => {
    return (allSongs.length > 0 ? allSongs : internalSongs).filter((s) =>
      favorites.includes(s.id),
    );
  }, [allSongs, internalSongs, favorites]);
  const [loadingSongs, setLoadingSongs] = useState(false);

  // 如果没有提供 allSongs，在打开收藏夹时尝试加载
  useEffect(() => {
    if (
      isOpen &&
      activeTab === "favorites" &&
      allSongs.length === 0 &&
      internalSongs.length === 0 &&
      !loadingSongs
    ) {
      setLoadingSongs(true);
      fetch("/api/public/collections")
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data.songs)) {
            setInternalSongs(data.songs);
          }
        })
        .finally(() => setLoadingSongs(false));
    }
  }, [isOpen, activeTab, allSongs.length, internalSongs.length, loadingSongs]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/20 dark:bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div
        ref={panelRef}
        className="relative bg-white dark:bg-[#111] w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <User size={20} className="text-slate-500 dark:text-slate-400" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              个人中心
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <button
            onClick={() => setActiveTab("favorites")}
            className={cn(
              "flex-1 pb-3 pt-4 text-sm font-medium transition-colors relative flex items-center justify-center gap-2",
              activeTab === "favorites"
                ? "text-blue-600 dark:text-blue-400"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200",
            )}
          >
            <Heart
              size={14}
              className={cn(activeTab === "favorites" && "fill-current")}
            />
            我的收藏
            {activeTab === "favorites" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("account")}
            className={cn(
              "flex-1 pb-3 pt-4 text-sm font-medium transition-colors relative flex items-center justify-center gap-2",
              activeTab === "account"
                ? "text-blue-600 dark:text-blue-400"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200",
            )}
          >
            <Settings size={14} />
            账户设置
            {activeTab === "account" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
            )}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800 scrollbar-track-transparent">
          {activeTab === "favorites" && (
            <div className="space-y-4">
              {!isLoggedIn ? (
                <div className="flex flex-col items-center justify-center py-12 gap-5 px-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <Heart size={28} className="text-slate-400" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-slate-700 dark:text-slate-200">
                      尚未登录
                    </p>
                    <p className="text-sm text-slate-400 dark:text-slate-500">
                      登录后可收藏歌曲，跨设备同步
                    </p>
                  </div>
                  <button
                    onClick={handleLogin}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
                  >
                    <LogIn size={16} />
                    立即登录
                  </button>
                </div>
              ) : !favoritesLoaded ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-3">
                  <Loader2 size={24} className="animate-spin" />
                  <span className="text-sm">加载中...</span>
                </div>
              ) : favoritedSongs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400 dark:text-slate-500">
                  <Heart size={48} className="opacity-20" />
                  <p className="text-sm">还没有收藏任何歌曲</p>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center justify-between mb-2 px-1">
                    <span className="text-xs font-medium text-slate-400">
                      共 {favoritedSongs.length} 首歌曲
                    </span>
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
                          <Image
                            src={getCoverUrl(song)}
                            alt={song.title}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                            {song.title}
                          </p>
                          {song.artist && song.artist.length > 0 && (
                            <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">
                              {song.artist.join(" / ")}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              onClose();
                              router.push(`/song/${song.id}`);
                            }}
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

          {activeTab === "account" && (
            <div className="space-y-6">
              {!userLoaded ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={24} className="animate-spin text-slate-400" />
                </div>
              ) : !user ? (
                <div className="flex flex-col items-center justify-center py-12 gap-5 px-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <User size={28} className="text-slate-400" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-slate-700 dark:text-slate-200">
                      尚未登录
                    </p>
                    <p className="text-sm text-slate-400 dark:text-slate-500">
                      登录后可同步个人资料与收藏
                    </p>
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
                  {/* 用户基本信息卡片 */}
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 shadow-sm">
                    <div className="w-14 h-14 rounded-full bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-inner">
                      {user.name?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 dark:text-slate-100 text-lg truncate">
                        {user.name}
                      </p>
                      {user.email && (
                        <p className="text-sm text-slate-400 dark:text-slate-500 truncate">
                          {user.email}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 编辑表单 */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 block px-1">
                        用户名
                      </label>
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
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 block px-1">
                        个人简介
                      </label>
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
                      {saving ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : saveMsg === "已保存" ? (
                        <Check size={16} />
                      ) : null}
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
                        <ChevronRight
                          size={18}
                          className="text-slate-400 group-hover:text-blue-500 transition-colors"
                        />
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
                      {loggingOut ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <LogOut size={16} />
                      )}
                      退出登录
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserPanel;
