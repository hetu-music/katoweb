"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, ArrowLeft, LogIn, Eye, EyeOff } from "lucide-react";
import WallpaperBackground from "../../components/WallpaperBackground";
import FloatingActionButtons from "../../components/FloatingActionButtons";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // 每次登录前都获取最新的 CSRF token
      const csrfRes = await fetch("/api/auth/csrf-token");
      const csrfData = await csrfRes.json();
      const latestCsrfToken = csrfData.csrfToken || "";

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": latestCsrfToken,
        },
        body: JSON.stringify({ email, password }),
      });
      const result = await res.json();
      if (!res.ok) {
        setError(result.error || "登录失败");
        setLoading(false);
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch (err: unknown) {
      setError("网络连接异常，请稍后重试");
      setLoading(false);
      if (
        err &&
        typeof err === "object" &&
        "message" in err &&
        typeof (err as Error).message === "string"
      ) {
        console.error("Unexpected login error:", (err as Error).message);
      } else {
        console.error("Unexpected login error:", err);
      }
    }
  };

  return (
    <WallpaperBackground>
      <div className="min-h-screen flex items-center justify-center relative p-4">
        {/* 浮动操作按钮组 - 仅返回顶部（登录页面不需要，所以不显示） */}
        <FloatingActionButtons
          showScrollTop={false}
          onScrollToTop={() => { }} // 空函数，不会显示按钮
        />

        {/* 统一的竖向长容器 */}
        <div className="w-full max-w-sm sm:max-w-md bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl shadow-2xl transition-all duration-300 hover:bg-white/15">
          {/* 主标题区域 */}
          <div className="text-center pt-8 pb-6 px-6 sm:pt-10 sm:pb-8 sm:px-8">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl mb-4 sm:mb-6 shadow-xl">
              <LogIn className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3 tracking-wide">
              管理后台
            </h1>
            <p className="text-white/70 text-base">
              请使用您的管理员账户登录
            </p>
          </div>

          {/* 登录表单 */}
          <form onSubmit={handleLogin} className="px-6 pb-6 space-y-5 sm:px-8 sm:pb-8 sm:space-y-6">
            {/* 邮箱输入框 */}
            <div className="space-y-3">
              <label className="text-white/90 text-sm font-medium block">
                邮箱地址
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center">
                  <Mail className="w-4 h-4 text-white/90" />
                </div>
                <input
                  type="email"
                  placeholder="请输入您的邮箱"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-14 pl-14 pr-4 rounded-xl border border-white/30 bg-white/15 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/25 transition-all duration-200"
                  required
                />
              </div>
            </div>

            {/* 密码输入框 */}
            <div className="space-y-3">
              <label className="text-white/90 text-sm font-medium block">
                登录密码
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center">
                  <Lock className="w-4 h-4 text-white/90" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="请输入您的密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-14 pl-14 pr-14 rounded-xl border border-white/30 bg-white/15 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/25 transition-all duration-200"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30 transition-all duration-200"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-white/90" />
                  ) : (
                    <Eye className="w-4 h-4 text-white/90" />
                  )}
                </button>
              </div>
            </div>

            {/* 错误信息 */}
            {error && (
              <div className="bg-red-500/20 border border-red-400/40 rounded-xl p-4 text-red-200 text-sm text-center backdrop-blur-sm">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 bg-red-400/30 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-red-300 rounded-full"></div>
                  </div>
                  <span>{error}</span>
                </div>
              </div>
            )}

            {/* 按钮组 */}
            <div className="flex flex-col gap-3 pt-4">
              <button
                type="submit"
                className="w-full h-14 flex items-center justify-center gap-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 active:from-blue-700 active:to-purple-800 text-white font-semibold rounded-xl shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                disabled={loading}
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
                className="w-full h-12 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white/90 font-medium rounded-xl border border-white/20 shadow-md transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>返回主页</span>
              </button>
            </div>
          </form>

          {/* 底部提示 */}
          <div className="text-center pb-6 px-6 sm:pb-8 sm:px-8">
            <p className="text-white/50 text-xs">
              登录即表示您同意遵守管理规范
            </p>
          </div>
        </div>
      </div>
    </WallpaperBackground>
  );
}
