"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Mail,
  Lock,
  ArrowLeft,
  LogIn,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { Turnstile } from "@marsidev/react-turnstile";

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
      if (!turnstileToken) {
        setError("请完成人机验证");
        setLoading(false);
        return;
      }

      const turnstileRes = await fetch("/api/auth/verify-turnstile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: turnstileToken }),
      });

      const turnstileData = await turnstileRes.json();
      if (!turnstileData.success) {
        setError("人机验证失败，请重试");
        setLoading(false);
        return;
      }

      const csrfRes = await fetch("/api/auth/csrf-token", {
        cache: "no-store",
      });
      if (!csrfRes.ok) throw new Error("无法获取安全令牌");

      const csrfData = await csrfRes.json();
      const latestCsrfToken = csrfData.csrfToken || "";
      if (!latestCsrfToken) throw new Error("安全令牌无效");

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
        if (res.status === 403) {
          setError("安全验证失败，请刷新页面后重试");
        } else {
          setError(result.error || "登录失败");
        }
        setLoading(false);
        return;
      }

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
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0B0F19] transition-colors duration-500 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor (Optional subtle gradients) */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl shadow-slate-200/50 dark:shadow-black/50 border border-slate-100 dark:border-slate-800 overflow-hidden">
          {/* Header Section */}
          <div className="px-8 pt-12 pb-8 text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6 ring-1 ring-blue-100 dark:ring-blue-800">
              <ShieldCheck size={32} strokeWidth={1.5} />
            </div>
            <h1 className="text-3xl font-medium text-slate-900 dark:text-white tracking-tight">
              Admin Portal
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-light text-sm">
              Sign in to manage the library content.
            </p>
          </div>

          {/* Form Section */}
          <form onSubmit={handleLogin} className="px-8 pb-12 space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">
                Email
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-11 pr-4 text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">
                Password
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-11 pr-11 text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-all"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Turnstile */}
            <div className="flex justify-center pt-2">
              <Turnstile
                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ""}
                onSuccess={(token) => setTurnstileToken(token)}
                onError={() => setError("Captcha failed to load")}
                onExpire={() => setTurnstileToken("")}
                options={{
                  theme: "auto",
                  size: "flexible",
                }}
                className="w-full"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300 flex items-start gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 text-sm leading-relaxed">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-4 pt-2">
              <button
                type="submit"
                disabled={loading || !turnstileToken}
                className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2 group"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign In</span>
                    <LogIn
                      size={18}
                      className="group-hover:translate-x-0.5 transition-transform"
                    />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Footer Link */}
          <div className="bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 p-6 text-center">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
            >
              <ArrowLeft size={16} />
              <span>Back to Library</span>
            </button>
          </div>
        </div>

        <div className="text-center mt-8">
          <p className="text-xs text-slate-400 dark:text-slate-600 font-mono">
            &copy; {new Date().getFullYear()} 河图作品勘鉴
          </p>
        </div>
      </div>
    </div>
  );
}
