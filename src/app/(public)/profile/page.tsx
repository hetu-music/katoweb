"use client";

import ThemeToggle from "@/components/shared/ThemeToggle";
import { useFavorites } from "@/context/FavoritesContext";
import { useUserContext } from "@/context/UserContext";
import {
  profileAccountFormSchema,
  profilePasswordFormSchema,
  type ProfileAccountFormValues,
  type ProfilePasswordFormValues,
} from "@/lib/profile-form";
import { cn } from "@/lib/utils";
import { getCoverUrl } from "@/lib/utils-song";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Heart,
  Home,
  Loader2,
  LogOut,
  Mail,
  Settings,
  ShieldCheck,
  Trash2,
  User,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";

type TabType = "favorites" | "account";
const PROFILE_TABS = ["favorites", "account"] as const;

function ProfileContent() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useQueryState(
    "tab",
    parseAsStringLiteral(PROFILE_TABS).withDefault("favorites").withOptions({
      history: "push",
      shallow: true,
      throttleMs: 300,
    }),
  );

  const { user, loaded: userLoaded, logout, loggingOut } = useUserContext();
  const {
    favorites,
    favoriteSongs,
    toggleFavorite,
    clearFavorites,
    refreshFavorites,
    loaded: favoritesLoaded,
  } = useFavorites();
  const [expandedReviews, setExpandedReviews] = useState<
    Record<number, boolean>
  >({});
  // Lazy-loaded review texts: songId -> review text (or "loading")
  const [reviewTexts, setReviewTexts] = useState<Record<number, string | null>>(
    {},
  );

  // Always refresh favorites on mount to ensure review data is up-to-date
  useEffect(() => {
    if (user) {
      refreshFavorites();
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const toggleReview = useCallback(
    async (id: number, e: React.MouseEvent) => {
      e.stopPropagation();
      setExpandedReviews((prev) => {
        const isExpanding = !prev[id];
        if (isExpanding && reviewTexts[id] === undefined) {
          // Lazy-load review text on first expand
          fetch(`/api/public/collections/review?songId=${id}`)
            .then((res) => res.json())
            .then((data) => {
              setReviewTexts((rt) => ({ ...rt, [id]: data.review || "" }));
            })
            .catch(() => {
              setReviewTexts((rt) => ({ ...rt, [id]: null }));
            });
        }
        return { ...prev, [id]: isExpanding };
      });
    },
    [reviewTexts],
  );

  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [csrfToken, setCsrfToken] = useState("");

  const [pwdMsg, setPwdMsg] = useState<string | null>(null);

  const accountForm = useForm<ProfileAccountFormValues>({
    resolver: zodResolver(profileAccountFormSchema),
    defaultValues: {
      displayName: "",
      intro: "",
    },
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  const passwordForm = useForm<ProfilePasswordFormValues>({
    resolver: zodResolver(profilePasswordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  useEffect(() => {
    accountForm.reset({
      displayName: user?.name ?? "",
      intro: user?.intro ?? "",
    });
  }, [accountForm, user]);

  useEffect(() => {
    if (!user || activeTab !== "account") return;
    fetch("/api/public/csrf-token")
      .then((r) => r.json())
      .then((d) => setCsrfToken(d.csrfToken || ""));
  }, [activeTab, user]);

  const handleSave = accountForm.handleSubmit(async ({ displayName, intro }) => {
    setSaveMsg(null);
    if (!csrfToken) {
      setSaveMsg("保存失败");
      return;
    }
    try {
      const res = await fetch("/api/auth/account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
        body: JSON.stringify({ displayName, intro }),
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
      setTimeout(() => setSaveMsg(null), 2500);
    }
  });

  const handleChangePassword = passwordForm.handleSubmit(
    async ({ currentPassword, newPassword }) => {
    setPwdMsg(null);
      if (!csrfToken) {
        setPwdMsg("修改失败");
        return;
      }
      try {
        const res = await fetch("/api/auth/change-password", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-csrf-token": csrfToken,
          },
          body: JSON.stringify({ oldPassword: currentPassword, newPassword }),
        });
        if (res.ok) {
          setPwdMsg("密码修改成功");
          passwordForm.reset();
        } else {
          const d = await res.json();
          setPwdMsg(d.error || "修改失败");
        }
      } catch {
        setPwdMsg("修改失败");
      } finally {
        setTimeout(() => setPwdMsg(null), 3500);
      }
    },
  );

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

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0B0F19] transition-colors duration-500 font-sans">
      {/* Header Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#FAFAFA]/80 dark:bg-[#0B0F19]/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 -ml-2">
              <button
                onClick={handleBack}
                className="p-2 rounded-full transition-colors text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800 group"
                title="返回"
              >
                <ArrowLeft
                  size={20}
                  className="transition-transform group-hover:-translate-x-0.5"
                />
              </button>

              <div className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-0.5" />

              <button
                onClick={() => router.push("/")}
                className="p-2 rounded-full transition-colors text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800 group"
                title="回到主页"
              >
                <Home
                  size={20}
                  className="transition-transform group-hover:scale-105 group-active:scale-95"
                />
              </button>
            </div>
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
                    <p className="text-lg font-bold text-slate-900 dark:text-white">
                      {favorites.length}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      收藏
                    </p>
                  </div>
                  <div className="w-px h-8 bg-slate-100 dark:bg-slate-800/50 self-center" />
                  <div className="flex-1 text-center">
                    <p className="text-lg font-bold text-slate-900 dark:text-white truncate">
                      {user?.isAdmin ? "管理" : "用户"}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      角色
                    </p>
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
                  <ChevronRight
                    size={14}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </a>
              )}

              {user && (
                <button
                  onClick={logout}
                  disabled={loggingOut}
                  className="flex items-center justify-center gap-2 w-full p-3.5 rounded-xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-rose-500 hover:border-rose-200 dark:hover:border-rose-500/30 transition-all font-bold text-xs"
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
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200",
                  )}
                >
                  {tab === "favorites" && (
                    <Heart
                      size={14}
                      className={cn(activeTab === tab && "fill-current")}
                    />
                  )}
                  {tab === "account" && <Settings size={14} />}
                  {tab === "favorites" ? "我的收藏" : "账户设置"}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 flex flex-col">
              {activeTab === "favorites" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 flex-1 flex flex-col">
                  {!favoritesLoaded ? (
                    <div className="flex-1 flex flex-col items-center justify-center min-h-[calc(100vh-320px)]">
                      <Loader2
                        size={32}
                        className="animate-spin text-blue-500"
                      />
                    </div>
                  ) : favoritedSongs.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center min-h-[calc(100vh-320px)] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 transition-all">
                      <Heart
                        size={40}
                        className="text-slate-100 dark:text-slate-800 mb-4"
                      />
                      <p className="text-slate-400 text-sm">
                        还没有收藏任何曲目
                      </p>
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

                      <div className="grid grid-cols-1 gap-4 pb-8">
                        {favoritedSongs.map((song) => (
                          <div
                            key={song.id}
                            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800/60 overflow-hidden transition-all hover:border-blue-500/30 dark:hover:border-blue-500/30 group"
                          >
                            <div
                              onClick={() => {
                                const d = parseInt(
                                  sessionStorage.getItem(
                                    "__katoweb_nav_depth",
                                  ) || "0",
                                  10,
                                );
                                sessionStorage.setItem(
                                  "__katoweb_nav_depth",
                                  String(d + 1),
                                );
                                router.push(`/song/${song.id}`);
                              }}
                              className="flex items-center gap-4 p-4 cursor-pointer"
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
                                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate flex items-center gap-2">
                                  {song.collectionInfo?.created_at && (
                                    <span>
                                      收藏于{" "}
                                      {new Date(
                                        song.collectionInfo.created_at,
                                      ).toLocaleDateString()}
                                    </span>
                                  )}
                                </p>
                              </div>

                              <div className="flex items-center gap-2">
                                {!!song.collectionInfo?.review && (
                                  <button
                                    onClick={(e) => toggleReview(song.id, e)}
                                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                  >
                                    {expandedReviews[song.id]
                                      ? "隐藏评论"
                                      : "查看评论"}
                                  </button>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFavorite(song.id);
                                  }}
                                  className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                                  title="取消收藏"
                                >
                                  <Heart size={16} className="fill-current" />
                                </button>
                              </div>
                            </div>

                            {/* Expanded Review — lazy-loaded */}
                            {!!song.collectionInfo?.review &&
                              expandedReviews[song.id] && (
                                <div className="px-4 pb-4 pt-1 border-t border-slate-100 dark:border-slate-800/50 mt-1">
                                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-100 dark:border-slate-800/30">
                                    {reviewTexts[song.id] === undefined ? (
                                      <p className="text-sm text-slate-400 animate-pulse">
                                        加载评论中...
                                      </p>
                                    ) : (
                                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                                        {reviewTexts[song.id] ||
                                          song.collectionInfo.review ||
                                          "暂无内容"}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "account" && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex-1 flex flex-col">
                  {!userLoaded ? (
                    <div className="flex-1 flex flex-col items-center justify-center min-h-[calc(100vh-320px)]">
                      <Loader2
                        size={32}
                        className="animate-spin text-blue-500"
                      />
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200/60 dark:border-slate-800/60 shadow-sm space-y-8 flex-1">
                      <div className="space-y-1">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                          账户设置
                        </h3>
                        <p className="text-xs text-slate-400">
                          管理您的公开资料与基本信息
                        </p>
                      </div>

                      <div className="space-y-6">
                        <form
                          onSubmit={handleSave}
                          className="space-y-6"
                          noValidate
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">
                                用户名
                              </label>
                              <input
                                type="text"
                                maxLength={30}
                                {...accountForm.register("displayName")}
                                className={cn(
                                  "w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border outline-none transition-all text-sm text-slate-800 dark:text-slate-200",
                                  accountForm.formState.errors.displayName
                                    ? "border-rose-300 focus:border-rose-500"
                                    : "border-transparent focus:bg-white dark:focus:bg-[#111] focus:border-blue-500/50",
                                )}
                              />
                              {accountForm.formState.errors.displayName && (
                                <p className="text-xs text-rose-500 ml-1">
                                  {
                                    accountForm.formState.errors.displayName
                                      .message
                                  }
                                </p>
                              )}
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">
                                邮箱
                              </label>
                              <div className="w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-white/5 text-xs text-slate-400 cursor-not-allowed">
                                {user?.email}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">
                              个人简介
                            </label>
                            <textarea
                              maxLength={200}
                              rows={3}
                              {...accountForm.register("intro")}
                              className={cn(
                                "w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border outline-none transition-all text-sm text-slate-800 dark:text-slate-200 resize-none",
                                accountForm.formState.errors.intro
                                  ? "border-rose-300 focus:border-rose-500"
                                  : "border-transparent focus:bg-white dark:focus:bg-[#111] focus:border-blue-500/50",
                              )}
                            />
                            {accountForm.formState.errors.intro && (
                              <p className="text-xs text-rose-500 ml-1">
                                {accountForm.formState.errors.intro.message}
                              </p>
                            )}
                          </div>

                          <div className="pt-2">
                            <button
                              type="submit"
                              disabled={
                                accountForm.formState.isSubmitting || !csrfToken
                              }
                              className={cn(
                                "px-6 py-2.5 rounded-full text-sm font-bold transition-all flex items-center justify-center gap-2",
                                accountForm.formState.isSubmitting || !csrfToken
                                  ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                                  : "bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/10 active:scale-95",
                              )}
                            >
                              {accountForm.formState.isSubmitting ? (
                                <Loader2 size={16} className="animate-spin" />
                              ) : saveMsg === "已保存" ? (
                                <Check size={16} />
                              ) : null}
                              {saveMsg ?? "保存更改"}
                            </button>
                          </div>
                        </form>
                      </div>

                      {/* Password Change Section */}
                      <div className="pt-8 mt-8 border-t border-slate-100 dark:border-slate-800 space-y-6">
                        <div className="space-y-1">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            修改密码
                          </h4>
                          <p className="text-xs text-slate-400">
                            设置一个更安全的新密码
                          </p>
                        </div>

                        <form
                          onSubmit={handleChangePassword}
                          className="space-y-6"
                          noValidate
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">
                                当前密码
                              </label>
                              <input
                                type="password"
                                {...passwordForm.register("currentPassword")}
                                className={cn(
                                  "w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border outline-none transition-all text-sm text-slate-800 dark:text-slate-200",
                                  passwordForm.formState.errors.currentPassword
                                    ? "border-rose-300 focus:border-rose-500"
                                    : "border-transparent focus:bg-white dark:focus:bg-[#111] focus:border-blue-500/50",
                                )}
                              />
                              {passwordForm.formState.errors.currentPassword && (
                                <p className="text-xs text-rose-500 ml-1">
                                  {
                                    passwordForm.formState.errors
                                      .currentPassword.message
                                  }
                                </p>
                              )}
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">
                                新密码
                              </label>
                              <input
                                type="password"
                                placeholder="至少8位，包含字母和数字"
                                {...passwordForm.register("newPassword")}
                                className={cn(
                                  "w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border outline-none transition-all text-sm text-slate-800 dark:text-slate-200",
                                  passwordForm.formState.errors.newPassword
                                    ? "border-rose-300 focus:border-rose-500"
                                    : "border-transparent focus:bg-white dark:focus:bg-[#111] focus:border-blue-500/50",
                                )}
                              />
                              {passwordForm.formState.errors.newPassword && (
                                <p className="text-xs text-rose-500 ml-1">
                                  {
                                    passwordForm.formState.errors.newPassword
                                      .message
                                  }
                                </p>
                              )}
                            </div>
                            <div className="space-y-1.5 md:col-span-2 md:w-1/2">
                              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">
                                确认新密码
                              </label>
                              <input
                                type="password"
                                placeholder="再次输入新密码"
                                {...passwordForm.register("confirmPassword")}
                                className={cn(
                                  "w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border outline-none transition-all text-sm text-slate-800 dark:text-slate-200",
                                  passwordForm.formState.errors.confirmPassword
                                    ? "border-rose-300 focus:border-rose-500"
                                    : "border-transparent focus:bg-white dark:focus:bg-[#111] focus:border-blue-500/50",
                                )}
                              />
                              {passwordForm.formState.errors.confirmPassword && (
                                <p className="text-xs text-rose-500 ml-1">
                                  {
                                    passwordForm.formState.errors
                                      .confirmPassword.message
                                  }
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="pt-2 flex items-center gap-3">
                            <button
                              type="submit"
                              disabled={
                                passwordForm.formState.isSubmitting || !csrfToken
                              }
                              className={cn(
                                "px-6 py-2.5 rounded-full text-sm font-bold transition-all flex items-center justify-center gap-2",
                                passwordForm.formState.isSubmitting || !csrfToken
                                  ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                                  : "bg-rose-600 text-white hover:bg-rose-700 shadow-md shadow-rose-500/10 active:scale-95",
                              )}
                            >
                              {passwordForm.formState.isSubmitting ? (
                                <Loader2 size={16} className="animate-spin" />
                              ) : null}
                              确认修改
                            </button>
                            {pwdMsg && (
                              <span
                                className={cn(
                                  "text-xs font-bold",
                                  pwdMsg === "密码修改成功"
                                    ? "text-emerald-500"
                                    : "text-rose-500",
                                )}
                              >
                                {pwdMsg}
                              </span>
                            )}
                          </div>
                        </form>
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

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0B0F19] flex items-center justify-center">
          <Loader2 size={32} className="animate-spin text-blue-500" />
        </div>
      }
    >
      <ProfileContent />
    </Suspense>
  );
}
