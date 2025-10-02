'use client';
import React from 'react';
import { Bell, X, Shield, Database, AlertTriangle } from 'lucide-react';

interface NotificationProps {
  onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-gradient-to-br from-purple-800 via-blue-900 to-indigo-900 border border-white/20 rounded-2xl shadow-2xl p-8 w-full max-w-4xl relative text-white max-h-[90vh] overflow-hidden">
        <button
          className="absolute top-4 right-4 text-gray-300 hover:text-white text-xl font-bold transition-colors"
          onClick={onClose}
          aria-label="关闭"
        >
          <X className="w-6 h-6" />
        </button>

        {/* 标题 */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-blue-500/20 text-blue-300">
            <Bell className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-white">说明与注意</h2>
        </div>

        {/* 内容区域 */}
        <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
          {/* 重要提示 */}
          <div className="relative p-5 rounded-xl bg-gradient-to-r from-red-500/25 to-orange-500/25 border-2 border-red-400/50 shadow-lg">
            {/* 装饰性背景 */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-red-400/10 to-orange-400/10 opacity-50"></div>

            {/* 闪烁动画的边框 */}
            <div className="absolute inset-0 rounded-xl border-2 border-red-400/30 animate-pulse"></div>

            <div className="relative flex items-start gap-4">
              <div className="flex-shrink-0 mt-0.5 p-2 rounded-full bg-red-500/30 border border-red-400/50">
                <AlertTriangle className="w-6 h-6 text-red-200" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <h4 className="font-bold text-red-100 text-lg">⚠️ 重要提示</h4>
                  <span className="px-2 py-1 bg-red-500/40 border border-red-400/60 rounded-full text-xs text-red-100 font-medium animate-pulse">
                    必读
                  </span>
                </div>
                <ul className="text-sm text-red-100/90 leading-relaxed space-y-2 font-medium">
                  <li className="flex items-start gap-2">
                    <span className="text-red-300 font-bold flex-shrink-0 leading-relaxed">•</span>
                    <span>数据更改不会立刻同步到主页面</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-300 font-bold flex-shrink-0 leading-relaxed">•</span>
                    <span>在本页面修改完成就是变更成功</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          {/* 数据管理规则 */}
          <div className="p-5 rounded-xl bg-blue-500/20 border border-blue-400/30">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 mt-1">
                <Database className="w-6 h-6 text-blue-300" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-white mb-3 text-lg">数据编辑</h4>
                <ul className="text-sm text-white/80 leading-relaxed space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-300 font-bold flex-shrink-0 leading-relaxed">•</span>
                    <span>新增歌曲时请确保标题和专辑信息准确无误</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-300 font-bold flex-shrink-0 leading-relaxed">•</span>
                    <span>作词、作曲、编曲、演唱、出品发行支持多人，请每个输入框只填写一人</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-300 font-bold flex-shrink-0 leading-relaxed">•</span>
                    <span>歌曲时长需要换算成秒</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-300 font-bold flex-shrink-0 leading-relaxed">•</span>
                    <span>歌词只需填写LRC歌词</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* 权限管理规则 */}
          <div className="p-5 rounded-xl bg-green-500/20 border border-green-400/30">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 mt-1">
                <Shield className="w-6 h-6 text-green-300" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-white mb-3 text-lg">权限安全</h4>
                <ul className="text-sm text-white/80 leading-relaxed space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-green-300 font-bold flex-shrink-0 leading-relaxed">•</span>
                    <span>请妥善保管账号，不要与他人分享</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-300 font-bold flex-shrink-0 leading-relaxed">•</span>
                    <span>定期检查数据变更，确保信息准确性</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-300 font-bold flex-shrink-0 leading-relaxed">•</span>
                    <span>如发现异常操作请及时联系管理员</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* 底部操作区域 */}
        <div className="mt-6 pt-4 border-t border-white/20 flex justify-between items-center">
          <div className="text-sm text-white/60">
            注意事项 · 请仔细阅读并遵守
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white font-medium hover:bg-white/20 transition-all"
          >
            我知道了
          </button>
        </div>
      </div>
    </div>
  );
};

export default Notification;