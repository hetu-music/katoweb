import React, { useState, useEffect } from "react";
import { Mail, LogIn } from "lucide-react";
import { useRouter } from "next/navigation";

interface Contributor {
  name?: string;
  display?: boolean;
  intro?: string;
  sort_order?: number;
}

const About: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<"about" | "maintainer">("about");
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [contributorsLoading, setContributorsLoading] = useState(false);
  const [contributorsError, setContributorsError] = useState<string | null>(
    null,
  );
  const router = useRouter(); // 初始化 router

  useEffect(() => {
    const fetchContributors = async () => {
      setContributorsLoading(true);
      setContributorsError(null);
      
      try {
        const res = await fetch("/api/auth/contributors");
        const data = await res.json();
        
        if (Array.isArray(data.contributors)) {
          setContributors(data.contributors);
        } else {
          setContributors([]);
        }
      } catch {
        setContributorsError("获取贡献者失败");
      } finally {
        setContributorsLoading(false);
      }
    };

    fetchContributors();
  }, []);

  // 点击登录按钮的处理函数
  const handleLoginClick = () => {
    router.push("/admin/login");
  };

  const mainContributor = contributors.find((c) => c.sort_order === 2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-linear-to-br from-purple-800 via-blue-900 to-indigo-900 border border-white/20 rounded-2xl shadow-2xl p-8 max-w-lg w-full relative text-white">
        <button
          className="absolute top-4 right-4 text-gray-300 hover:text-white text-xl font-bold"
          onClick={onClose}
          aria-label="关闭"
        >
          ×
        </button>

        {/* 标签页导航 */}
        <div className="flex mb-6 border-b border-white/20">
          <button
            className={`flex-1 py-2 px-4 text-center font-medium transition-colors relative ${
              activeTab === "about"
                ? "text-white"
                : "text-gray-300 hover:text-white"
            }`}
            onClick={() => setActiveTab("about")}
          >
            关于
            {activeTab === "about" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"></div>
            )}
          </button>
          <button
            className={`flex-1 py-2 px-4 text-center font-medium transition-colors relative ${
              activeTab === "maintainer"
                ? "text-white"
                : "text-gray-300 hover:text-white"
            }`}
            onClick={() => setActiveTab("maintainer")}
          >
            维护者
            {activeTab === "maintainer" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"></div>
            )}
          </button>
        </div>

        {/* 内容区域 */}
        {activeTab === "about" ? (
          <div className="text-base leading-relaxed space-y-2">
            <p>
              本项目为河图作品勘鉴，收录了河图的主要音乐作品资料，支持筛选与搜索。
            </p>
            <p>
              数据由本人整理，来源为创作者微博及各大音乐平台，不能保证完全准确。如有误漏请
              <span className="ml-1 mr-1">
                <a
                  href="mailto:feedback@hetu-music.com"
                  className="inline-flex items-baseline gap-1 text-green-400 underline hover:text-green-300 font-semibold transition-colors"
                >
                  <Mail
                    className="w-4 h-4"
                    style={{ transform: "translateY(2px)" }}
                  />
                  <span>发送邮件</span>
                </a>
              </span>
              提交反馈。
            </p>
            <p>
              特别鸣谢：正版河图吧吧主{" "}
              <span className="font-bold text-blue-300">
                {mainContributor ? mainContributor.name : "顾大一"}
              </span>{" "}
              及众位网友整理的《歌手河图作品发布勘鉴》，为本项目提供了宝贵参考资料。
            </p>
          </div>
        ) : (
          <div className="text-base leading-relaxed">
            {contributorsLoading ? (
              <div className="flex items-center justify-center h-32 text-gray-400">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                  <span>加载中...</span>
                </div>
              </div>
            ) : contributorsError ? (
              <div className="flex flex-col items-center justify-center h-32 text-red-400 space-y-2">
                <div className="text-lg">⚠️</div>
                <div>{contributorsError}</div>
              </div>
            ) : contributors.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-gray-400 space-y-2">
                <div className="text-lg">👥</div>
                <div>暂无贡献者</div>
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto pr-2 space-y-3 mb-16 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                {contributors
                  .sort((a, b) => (a.sort_order || 999) - (b.sort_order || 999))
                  .map((contributor, idx) => (
                    <div
                      key={idx}
                      className="bg-white/10 border border-white/20 rounded-xl shadow flex items-start px-4 py-3 transition-all duration-200 hover:bg-white/15 hover:border-white/30 hover:shadow-lg"
                    >
                      {/* 头像 */}
                      <div className="w-12 h-12 flex items-center justify-center rounded-full bg-linear-to-br from-blue-500 via-purple-500 to-indigo-500 text-white text-xl font-bold mr-4 shadow-md shrink-0">
                        {contributor.name?.charAt(0).toUpperCase() || "?"}
                      </div>

                      {/* 信息区域 */}
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-semibold text-base truncate mb-1">
                          {contributor.name || "未知贡献者"}
                        </div>
                        {contributor.intro && (
                          <div className="text-white/80 text-sm leading-relaxed whitespace-pre-line wrap-break-word">
                            {contributor.intro}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* 当 "维护者" 标签页激活时，显示登录按钮 */}
        {activeTab === "maintainer" && (
          <button
            onClick={handleLoginClick}
            className="absolute bottom-8 right-10 flex items-center gap-2 px-6 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg text-white font-semibold hover:bg-white/20 active:scale-95 transition-all"
            aria-label="跳转至登录页面"
          >
            <LogIn size={18} />
            <span>登录</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default About;
