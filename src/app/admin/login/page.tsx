"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, ArrowLeft, LogIn, Eye, EyeOff } from "lucide-react";
import WallpaperBackground from "../../components/WallpaperBackground";
import FloatingActionButtons from "../../components/FloatingActionButtons";
import { useWallpaper } from "../../context/WallpaperContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  // 壁纸功能
  const {
    wallpaper,
    isLoading: wallpaperLoading,
    error: wallpaperError,
    refreshWallpaper,
    wallpaperEnabled,
    toggleWallpaper,
    isHydrated,
  } = useWallpaper();

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
        {/* 浮动操作按钮组 - 仅壁纸控制，无返回顶部（登录页面不需要） */}
        <FloatingActionButtons
          showScrollTop={false}
          onScrollToTop={() => {}} // 空函数，不会显示按钮
          wallpaperEnabled={wallpaperEnabled}
          wallpaperLoading={wallpaperLoading}
          onWallpaperToggle={toggleWallpaper}
          onWallpaperRefresh={refreshWallpaper}
          isHydrated={isHydrated}
        />

        {/* 登录卡片 */}
        <div className="w-full max-w-md">
          {/* 主标题区域 */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
              <LogIn className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 tracking-wide">
              管理后台
            </h1>
            <p className="text-white/70 text-sm">
              请使用您的管理员账户登录
            </p>
          </div>

          {/* 登录表单 */}
          <form
            onSubmit={handleLogin}
            className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 shadow-2xl space-y-6 transition-all duration-300 hover:bg-white/15"
          >
            {/* 邮箱输入框 */}
            <div className="space-y-2">
              <label className="text-white/90 text-sm font-medium block">
                邮箱地址
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
                <input
                  type="email"
                  placeholder="请输入您的邮箱"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-14 pl-12 pr-4 rounded-xl border border-white/20 bg-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-200"
                  required
                />
              </div>
            </div>

            {/* 密码输入框 */}
            <div className="space-y-2">
              <label className="text-white/90 text-sm font-medium block">
                登录密码
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="请输入您的密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-14 pl-12 pr-12 rounded-xl border border-white/20 bg-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-200"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white/80 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* 错误信息 */}
            {error && (
              <div className="bg-red-500/20 border border-red-400/30 rounded-xl p-4 text-red-200 text-sm text-center backdrop-blur-sm">
                {error}
              </div>
            )}

            {/* 按钮组 */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => router.push("/")}
                className="flex-1 h-14 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white font-semibold rounded-xl border border-white/20 shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>返回主页</span>
              </button>
              <button
                type="submit"
                className="flex-1 h-14 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 active:from-blue-700 active:to-purple-800 text-white font-semibold rounded-xl shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
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
            </div>
          </form>

          {/* 底部提示 */}
          <div className="text-center mt-6">
            <p className="text-white/50 text-xs">
              登录即表示您同意遵守管理规范
            </p>
          </div>
        </div>
      </div>
    </WallpaperBackground>
  );
}
