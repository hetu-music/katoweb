import React, { useState, useEffect } from 'react';
import { ExternalLink, Mail } from 'lucide-react';

const About: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'about' | 'maintainer'>('about');
  const [contributors, setContributors] = useState<any[]>([]);
  const [contributorsLoading, setContributorsLoading] = useState(false);
  const [contributorsError, setContributorsError] = useState<string | null>(null);

  useEffect(() => {
    setContributorsLoading(true);
    setContributorsError(null);
    fetch('/api/auth/contributors')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data.contributors)) {
          setContributors(data.contributors);
        } else {
          setContributors([]);
        }
      })
      .catch(() => setContributorsError('获取贡献者失败'))
      .finally(() => setContributorsLoading(false));
  }, []);

  const mainContributor = contributors.find((c) => c.sort_order === 2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-purple-800 via-blue-900 to-indigo-900 border border-white/20 rounded-2xl shadow-2xl p-8 max-w-lg w-full relative text-white">
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
              activeTab === 'about'
                ? 'text-white'
                : 'text-gray-300 hover:text-white'
            }`}
            onClick={() => setActiveTab('about')}
          >
            关于
            {activeTab === 'about' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"></div>
            )}
          </button>
          <button
            className={`flex-1 py-2 px-4 text-center font-medium transition-colors relative ${
              activeTab === 'maintainer'
                ? 'text-white'
                : 'text-gray-300 hover:text-white'
            }`}
            onClick={() => setActiveTab('maintainer')}
          >
            维护者
            {activeTab === 'maintainer' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"></div>
            )}
          </button>
        </div>

        {/* 内容区域 */}
        {activeTab === 'about' ? (
          <div className="text-base leading-relaxed space-y-2">
            <p>本项目为河图作品勘鉴，收录了河图的主要音乐作品资料，支持筛选与搜索。</p>
            <p>数据由本人整理，来源为创作者微博及各大音乐平台，如有误漏请至
              <span className="ml-1 mr-1">
                <a href="https://github.com/hetu-music/katodata" target="_blank" rel="noopener noreferrer" className="inline-flex items-baseline gap-1 text-blue-400 underline hover:text-blue-300 font-semibold transition-colors">
                  <ExternalLink className="w-4 h-4" style={{ transform: 'translateY(2px)' }} />
                  <span>GitHub</span>
                </a>
              </span>
              或
              <span className="ml-1 mr-1">
                <a href="mailto:feedback@hetu-music.com" className="inline-flex items-baseline gap-1 text-green-400 underline hover:text-green-300 font-semibold transition-colors">
                  <Mail className="w-4 h-4" style={{ transform: 'translateY(2px)' }} />
                  <span>发送邮件</span>
                </a>
              </span>
              提交反馈。
            </p>
            <p>特别鸣谢：正版河图吧吧主 <span className="font-bold text-blue-300">{mainContributor ? mainContributor.name : '顾大一'}</span> 及众位网友整理的《歌手河图作品发布勘鉴》，为本项目提供了宝贵参考资料。</p>
          </div>
        ) : (
          <div className="text-base leading-relaxed space-y-4">
            {contributorsLoading ? (
              <div className="flex items-center justify-center h-32 text-gray-400">加载中...</div>
            ) : contributorsError ? (
              <div className="flex items-center justify-center h-32 text-red-400">{contributorsError}</div>
            ) : contributors.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-gray-400">暂无贡献者</div>
            ) : (
              <ul className="space-y-3">
                {contributors.map((contributor, idx) => (
                  <li
                    key={idx}
                    className="bg-white/10 border border-white/20 rounded-xl shadow flex items-center px-4 py-3 transition-transform hover:scale-[1.02] hover:bg-white/15"
                  >
                    <div className="w-12 h-12 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-500 text-white text-xl font-bold mr-4 shadow-md">
                      {contributor.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-semibold text-base truncate">{contributor.name}</div>
                      {contributor.intro && (
                        <div className="text-white/80 text-sm mt-0.5 whitespace-pre-line break-words">{contributor.intro}</div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default About;