import React from "react";
import { Share, PlusSquare, X } from "lucide-react";

interface IOSInstallPromptProps {
  isOpen: boolean;
  onClose: () => void;
}

const IOSInstallPrompt: React.FC<IOSInstallPromptProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center pointer-events-none">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto transition-opacity animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-sm m-4 p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl pointer-events-auto animate-in slide-in-from-bottom-8 duration-300 flex flex-col gap-4 border border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            如何安装 PWA 应用
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-sm text-slate-500 dark:text-slate-400">
          由于 iOS 系统的限制，需要您手动安装：
        </p>

        {/* Steps */}
        <div className="flex flex-col gap-4 mt-2">
          {/* Step 1 */}
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <span className="text-sm font-medium">1. 点击浏览器底部的</span>
            <Share size={18} className="text-blue-500" />
            <span className="text-sm font-bold">分享</span>
            <span className="text-sm font-medium">按钮</span>
          </div>

          {/* Step 2 */}
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <span className="text-sm font-medium">2. 向下滚动并选择</span>
            <PlusSquare
              size={18}
              className="text-slate-500 dark:text-slate-400"
            />
            <span className="text-sm font-bold">添加到主屏幕</span>
          </div>
        </div>

        {/* Decorative arrow pointing down (only relevant for mobile potentially) */}
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-white dark:bg-slate-900 rotate-45 border-b border-r border-slate-200 dark:border-slate-800 hidden sm:hidden" />
      </div>
    </div>
  );
};

export default IOSInstallPrompt;
