"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Mail,
  Lock,
  ArrowLeft,
  Feather,
  LogIn,
  Eye,
  EyeOff,
} from "lucide-react";
import { Turnstile } from "@marsidev/react-turnstile";

import FloatingActionButtons from "@/components/public/FloatingActionButtons";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // 验证 Turnstile
      if (!turnstileToken) {
        setError("请完成人机验证");
        setLoading(false);
        return;
      }

      const turnstileRes = await fetch("/api/auth/verify-turnstile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: turnstileToken }),
      });

      const turnstileData = await turnstileRes.json();
      if (!turnstileData.success) {
        setError("人机验证失败，请重试");
        setLoading(false);
        return;
      }

      // 每次登录前都获取最新的 CSRF token
      const csrfRes = await fetch("/api/auth/csrf-token", {
        cache: "no-store", // 确保获取最新的 token
      });

      if (!csrfRes.ok) {
        throw new Error("无法获取安全令牌");
      }

      const csrfData = await csrfRes.json();
      const latestCsrfToken = csrfData.csrfToken || "";

      if (!latestCsrfToken) {
        throw new Error("安全令牌无效");
      }

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": latestCsrfToken,
        },
        body: JSON.stringify({ email, password }),
        cache: "no-store",
      });

      const result = await res.json();
      if (!res.ok) {
        // 如果是 CSRF 错误，提示用户刷新页面
        if (res.status === 403) {
          setError("安全验证失败，请刷新页面后重试");
        } else {
          setError(result.error || "登录失败");
        }
        setLoading(false);
        return;
      }

      // 登录成功后等待一下再跳转，确保 cookies 设置完成
      await new Promise((resolve) => setTimeout(resolve, 100));
      router.push("/admin");
      router.refresh();
    } catch (err: unknown) {
      console.error("Login error:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("网络连接异常，请稍后重试");
      }
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen">
      <div className="min-h-screen flex items-center justify-center relative p-4">
        {/* 浮动操作按钮组 - 仅返回顶部（登录页面不需要，所以不显示） */}
        <FloatingActionButtons
          showScrollTop={false}
          onScrollToTop={() => {
            // No scroll to top needed on login page
          }}
        />

        {/* 统一的竖向长容器 */}
        <div className="w-full max-w-sm sm:max-w-md bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl shadow-2xl transition-all duration-300 hover:bg-white/15">
          {/* 主标题区域 */}
          <div className="text-center pt-7 pb-5 px-6 sm:pt-8 sm:pb-6 sm:px-8">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-18 sm:h-18 bg-linear-to-br from-blue-500 to-purple-600 rounded-3xl mb-4 sm:mb-5 shadow-xl">
              <Feather className="w-8 h-8 sm:w-9 sm:h-9 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2.5 tracking-wide">
              管理页面
            </h1>
            <p className="text-white/70 text-sm">请使用您的账户登录</p>
          </div>

          {/* 登录表单 */}
          <form
            onSubmit={handleLogin}
            className="px-6 pb-6 space-y-4.5 sm:px-8 sm:pb-7"
          >
            {/* 邮箱输入框 */}
            <div className="space-y-2.5">
              <label className="text-white/90 text-sm font-medium block">
                邮箱地址
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-white/50 backdrop-blur-sm rounded-lg flex items-center justify-center shadow-md border border-white/40 z-10">
                  <Mail className="w-4 h-4 text-gray-700 font-semibold" />
                </div>
                <input
                  type="email"
                  placeholder="请输入您的邮箱"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-12 pl-14 pr-4 rounded-xl border border-white/30 bg-white/15 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/25 transition-all duration-200"
                  required
                />
              </div>
            </div>

            {/* 密码输入框 */}
            <div className="space-y-2.5">
              <label className="text-white/90 text-sm font-medium block">
                登录密码
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-white/50 backdrop-blur-sm rounded-lg flex items-center justify-center shadow-md border border-white/40 z-10">
                  <Lock className="w-4 h-4 text-gray-700 font-semibold" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="请输入您的密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-12 pl-14 pr-14 rounded-xl border border-white/30 bg-white/15 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/25 transition-all duration-200"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-white/50 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-white/60 transition-all duration-200 shadow-md border border-white/40 z-10"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-gray-700 font-semibold" />
                  ) : (
                    <Eye className="w-4 h-4 text-gray-700 font-semibold" />
                  )}
                </button>
              </div>
            </div>

            {/* Turnstile 人机验证 - 使用 flexible 模式适应容器宽度 */}
            <div className="w-full pt-1">
              <Turnstile
                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ""}
                onSuccess={(token) => setTurnstileToken(token)}
                onError={() => setError("人机验证加载失败")}
                onExpire={() => setTurnstileToken("")}
                options={{
                  theme: "light",
                  size: "flexible",
                }}
              />
            </div>

            {/* 错误信息 */}
            {error && (
              <div className="bg-red-500/20 border border-red-400/40 rounded-xl p-3.5 text-red-200 text-sm text-center backdrop-blur-sm">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 bg-red-400/30 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-red-300 rounded-full"></div>
                  </div>
                  <span>{error}</span>
                </div>
              </div>
            )}

            {/* 按钮组 */}
            <div className="flex flex-col gap-3 pt-3">
              <button
                type="submit"
                className="w-full h-13 flex items-center justify-center gap-2.5 bg-linear-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 active:from-blue-700 active:to-purple-800 text-white font-semibold rounded-xl shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                disabled={loading || !turnstileToken}
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>登录中...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    <span>立即登录</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => router.push("/")}
                className="w-full h-12 flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 active:bg-white/40 text-indigo-700 font-semibold rounded-xl border border-white/30 shadow-lg backdrop-blur-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:shadow-xl"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>返回主页</span>
              </button>
            </div>
          </form>

          {/* 底部提示 */}
          <div className="text-center pb-6 px-6 sm:pb-7 sm:px-8">
            <p className="text-white/50 text-xs">如有疑问请联系管理员</p>
          </div>
        </div>
      </div>
    </div>
  );
}
