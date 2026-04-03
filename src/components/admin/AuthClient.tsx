"use client";

import ThemeToggle from "@/components/shared/ThemeToggle";
import { Turnstile } from "@marsidev/react-turnstile";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Lock,
  LogIn,
  Mail,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface AuthClientProps {
  nonce?: string;
  mode: "login" | "register";
}

export default function AuthClient({ nonce, mode }: AuthClientProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [nextPath, setNextPath] = useState("/");
  const router = useRouter();

  const isLogin = mode === "login";

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const next = params.get("next");
    if (next) setNextPath(next);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!turnstileToken) {
        setError("请完成人机验证");
        setLoading(false);
        return;
      }

      if (!isLogin && !/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password)) {
        setError("密码要求至少8位，并包含字母和数字");
        setLoading(false);
        return;
      }

      if (isLogin && (!password || password.length < 1)) {
        setError("请输入密码");
        setLoading(false);
        return;
      }

      const csrfRes = await fetch("/api/public/csrf-token", {
        cache: "no-store",
      });
      if (!csrfRes.ok) throw new Error("无法获取安全令牌");
      const { csrfToken } = await csrfRes.json();
      if (!csrfToken) throw new Error("安全令牌无效");

      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
        body: JSON.stringify({
          email,
          password,
          turnstileToken,
          next: nextPath,
        }),
        cache: "no-store",
      });

      const result = await res.json();
      if (!res.ok) {
        setError(
          result.error ||
          (isLogin ? "登录失败，请检查邮箱或密码" : "注册失败，请稍后重试"),
        );
        setLoading(false);
        return;
      }

      if (isLogin) {
        window.location.href = nextPath || "/admin";
      } else {
        setSent(true);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "网络连接异常，请稍后重试");
    } finally {
      if (!isLogin && sent) {
        // If registration mail was sent, we might be navigating away soon or just stay on success screen
      } else {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0B0F19] transition-colors duration-500 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl shadow-slate-200/50 dark:shadow-black/50 border border-slate-100 dark:border-slate-800 overflow-hidden relative">
          <div className="absolute top-4 right-4 z-10">
            <ThemeToggle />
          </div>

          <div className="px-8 pt-12 pb-8 text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6 ring-1 ring-blue-100 dark:ring-blue-800">
              <ShieldCheck size={32} strokeWidth={1.5} />
            </div>
            <h1 className="text-3xl font-medium text-slate-900 dark:text-white tracking-tight">
              {isLogin ? "Welcome Back" : "Create Account"}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-light text-sm">
              {isLogin
                ? "请输入邮箱和密码登录"
                : "请设置您的邮箱和密码进行注册"}
            </p>
          </div>

          {!isLogin && sent ? (
            <div className="px-8 pb-12 space-y-6">
              <div className="flex flex-col items-center gap-4 p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 text-center">
                <CheckCircle2
                  size={40}
                  className="text-emerald-500"
                  strokeWidth={1.5}
                />
                <div className="space-y-1">
                  <p className="font-medium text-slate-800 dark:text-slate-200">
                    验证邮件已发送
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    请检查{" "}
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {email}
                    </span>{" "}
                    的收件箱，点击邮件中的链接完成注册。
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSent(false);
                  setTurnstileToken("");
                }}
                className="w-full py-3 text-sm text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
              >
                重新注册
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="px-8 pb-12 space-y-6">
              <div className="space-y-4">
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

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">
                    Password
                  </label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                      <Lock size={18} />
                    </div>
                    <input
                      type="password"
                      placeholder={
                        isLogin ? "••••••••" : "至少8位，包含字母和数字"
                      }
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-11 pr-4 text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-center pt-2">
                <Turnstile
                  siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ""}
                  onSuccess={(token) => setTurnstileToken(token)}
                  onError={() => setError("Captcha failed to load")}
                  onExpire={() => setTurnstileToken("")}
                  scriptOptions={{ nonce }}
                  options={{ theme: "auto", size: "flexible" }}
                  className="w-full"
                />
              </div>

              {error && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300 flex items-start gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 text-sm leading-relaxed">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !turnstileToken}
                className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2 group"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{isLogin ? "登录" : "注册"}</span>
                    {isLogin ? (
                      <LogIn
                        size={16}
                        className="group-hover:translate-x-0.5 transition-transform"
                      />
                    ) : (
                      <UserPlus
                        size={16}
                        className="group-hover:translate-x-0.5 transition-transform"
                      />
                    )}
                  </>
                )}
              </button>

              <div className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
                {isLogin ? (
                  <p>
                    还没有账号？{" "}
                    <Link
                      href={
                        "/register" +
                        (nextPath !== "/"
                          ? "?next=" + encodeURIComponent(nextPath)
                          : "")
                      }
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      立即注册
                    </Link>
                  </p>
                ) : (
                  <p>
                    已有账号？{" "}
                    <Link
                      href={
                        "/login" +
                        (nextPath !== "/"
                          ? "?next=" + encodeURIComponent(nextPath)
                          : "")
                      }
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      返回登录
                    </Link>
                  </p>
                )}
              </div>
            </form>
          )}

          <div className="bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 p-6 text-center">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
            >
              <ArrowLeft size={16} />
              <span>返回主页</span>
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
