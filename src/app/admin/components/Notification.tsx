'use client';
import React from 'react';
import { Bell, X, BookOpen, Shield, Database, Users } from 'lucide-react';

interface NotificationProps {
  onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-purple-800 via-blue-900 to-indigo-900 border border-white/20 rounded-2xl shadow-2xl p-8 max-w-2xl w-full mx-4 relative text-white max-h-[90vh] overflow-hidden">
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
          <h2 className="text-2xl font-bold text-white">管理规则</h2>
        </div>

        {/* 内容区域 */}
        <div className="space-y-6 max-h-96 overflow-y-auto">
          {/* 数据管理规则 */}
          <div className="p-4 rounded-xl bg-blue-500/20 border border-blue-400/30">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <Database className="w-5 h-5 text-blue-300" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-white mb-2">数据管理规范</h4>
                <ul className="text-sm text-white/80 leading-relaxed space-y-1">
                  <li>• 新增歌曲时请确保标题和专辑信息准确无误</li>
                  <li>• 作词、作曲信息支持多人，请用逗号分隔</li>
                  <li>• 发布日期格式为 YYYY-MM-DD</li>
                  <li>• 编辑数据前请先展开查看完整信息</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 权限管理规则 */}
          <div className="p-4 rounded-xl bg-green-500/20 border border-green-400/30">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <Shield className="w-5 h-5 text-green-300" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-white mb-2">权限与安全</h4>
                <ul className="text-sm text-white/80 leading-relaxed space-y-1">
                  <li>• 请妥善保管登录凭证，不要与他人分享</li>
                  <li>• 定期检查数据变更，确保信息准确性</li>
                  <li>• 如发现异常操作请及时联系管理员</li>
                  <li>• 系统会自动记录所有操作日志</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 操作指南 */}
          <div className="p-4 rounded-xl bg-purple-500/20 border border-purple-400/30">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <BookOpen className="w-5 h-5 text-purple-300" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-white mb-2">操作指南</h4>
                <ul className="text-sm text-white/80 leading-relaxed space-y-1">
                  <li>• 使用搜索功能快速定位目标歌曲</li>
                  <li>• 点击眼睛图标查看歌曲详细信息</li>
                  <li>• 编辑时系统会自动校验数据格式</li>
                  <li>• 保存前请仔细核对所有信息</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 协作规范 */}
          <div className="p-4 rounded-xl bg-yellow-500/20 border border-yellow-400/30">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <Users className="w-5 h-5 text-yellow-300" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-white mb-2">协作规范</h4>
                <ul className="text-sm text-white/80 leading-relaxed space-y-1">
                  <li>• 多人同时编辑时请注意避免冲突</li>
                  <li>• 重要变更建议先与团队成员沟通</li>
                  <li>• 遇到问题可通过邮件或GitHub反馈</li>
                  <li>• 定期备份重要数据，确保数据安全</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* 底部操作区域 */}
        <div className="mt-6 pt-4 border-t border-white/20 flex justify-between items-center">
          <div className="text-sm text-white/60">
            管理规则 · 请仔细阅读并遵守
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