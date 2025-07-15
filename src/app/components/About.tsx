import React from 'react';
import { ExternalLink, Mail } from 'lucide-react';

const About: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
    <div className="bg-gradient-to-br from-purple-800 via-blue-900 to-indigo-900 border border-white/20 rounded-2xl shadow-2xl p-8 max-w-lg w-full relative text-white">
      <button
        className="absolute top-4 right-4 text-gray-300 hover:text-white text-xl font-bold"
        onClick={onClose}
        aria-label="关闭"
      >
        ×
      </button>
      <h2 className="text-2xl font-bold mb-4">关于</h2>
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
        <p>特别鸣谢：正版河图吧吧主 @正版河图吧 及众位网友整理的《歌手河图作品发布勘鉴》，为本项目提供了宝贵参考资料。</p>
      </div>
    </div>
  </div>
);

export default About;
