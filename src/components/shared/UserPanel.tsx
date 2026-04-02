"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  User,
  LogIn,
  LogOut,
  Settings,
  X,
  Check,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { createBrowserClient } from "@supabase/ssr";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createBrowserClient(url, key);
}

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

interface UserPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserPanel: React.FC<UserPanelProps> = ({ isOpen, onClose }) => {
  const { user, loaded } = useUser();
  const panelRef = useRef<HTMLDivElement>(null);

  // 个人信息编辑状态
  const [name, setName] = useState("");
  const [intro, setIntro] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [csrfToken, setCsrfToken] = useState("");

  // 登出状态
  const [loggingOut, setLoggingOut] = useState(false);

  // 初始化表单
  useEffect(() => {
    if (user) {
      setName(user.name ?? "");
      setIntro(user.intro ?? "");
    }
  }, [user]);

  // 获取 CSRF token
  useEffect(() => {
    if (!isOpen) return;
    fetch("/api/public/csrf-token")
      .then((r) => r.json())
      .then((d) => setCsrfToken(d.csrfToken || ""));
  }, [isOpen]);

  // 点击遮罩关闭
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen, onClose]);

  // ESC 关闭
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

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

  const handleLogout = useCallback(async () => {
    setLoggingOut(true);
    try {
      const csrf = csrfToken || (await fetch("/api/public/csrf-token").then(r => r.json()).then(d => d.csrfToken));
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrf },
      });
      // 刷新页面让 session 状态同步
      window.location.reload();
    } finally {
      setLoggingOut(false);
    }
  }, [csrfToken]);

  const handleLogin = useCallback(() => {
    // 记录当前路径，登录后回来
    const next = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `/login?next=${next}`;
  }, []);

  return (
    <>
      {/* 遮罩 */}
      <div
        className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* 侧边面板 */}
      <div
        ref={panelRef}
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-sm bg-white dark:bg-slate-900 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <User size={18} className="text-slate-500 dark:text-slate-400" />
            <span className="font-medium text-slate-800 dark:text-slate-100">
              {loaded ? (user ? user.name : "账户") : "账户"}
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="关闭"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* 内容 */}
        <div className="flex-1 overflow-y-auto">
          {!loaded ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 size={20} className="animate-spin text-slate-400" />
            </div>
          ) : !user ? (
            /* 未登录 */
            <div className="flex flex-col items-center justify-center h-full gap-5 px-6 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <User size={28} className="text-slate-400" />
              </div>
              <div className="space-y-1">
                <p className="font-medium text-slate-700 dark:text-slate-200">尚未登录</p>
                <p className="text-sm text-slate-400 dark:text-slate-500">
                  登录后可收藏歌曲，跨设备同步
                </p>
              </div>
              <button
                onClick={handleLogin}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                <LogIn size={16} />
                登录
              </button>
            </div>
          ) : (
            /* 已登录 */
            <div className="p-5 space-y-6">
              {/* 用户头像 & 邮箱 */}
              <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm shrink-0">
                  {user.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-slate-800 dark:text-slate-100 truncate">{user.name}</p>
                  {user.email && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{user.email}</p>
                  )}
                </div>
              </div>

              {/* 编辑信息 */}
              <div className="space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  个人信息
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">
                      用户名
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      maxLength={30}
                      className="w-full px-3 py-2 text-sm rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">
                      简介
                    </label>
                    <textarea
                      value={intro}
                      onChange={(e) => setIntro(e.target.value)}
                      maxLength={200}
                      rows={3}
                      className="w-full px-3 py-2 text-sm rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 transition-colors resize-none"
                    />
                  </div>
                  <button
                    onClick={handleSave}
                    disabled={saving || !name.trim()}
                    className={cn(
                      "w-full py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2",
                      saving || !name.trim()
                        ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700",
                    )}
                  >
                    {saving ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : saveMsg === "已保存" ? (
                      <Check size={14} />
                    ) : null}
                    {saveMsg ?? "保存"}
                  </button>
                </div>
              </div>

              {/* Admin 入口 */}
              {user.isAdmin && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    管理
                  </h3>
                  <a
                    href="/admin"
                    className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 transition-colors group"
                  >
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                      <Settings size={16} />
                      管理面板
                    </div>
                    <ChevronRight size={16} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 底部登出 */}
        {user && (
          <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm text-slate-500 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
            >
              {loggingOut ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <LogOut size={15} />
              )}
              退出登录
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default UserPanel;
