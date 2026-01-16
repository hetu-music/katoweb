import React from "react";
import { Share, PlusSquare, X } from "lucide-react";

interface IOSInstallPromptProps {
    isOpen: boolean;
    onClose: () => void;
}

const IOSInstallPrompt: React.FC<IOSInstallPromptProps> = ({ isOpen, onClose }) => {
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
                        安装到主屏幕
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <p className="text-sm text-slate-500 dark:text-slate-400">
                    在 iOS 上安装应用以获得更好的体验：
                </p>

                {/* Steps */}
                <div className="flex flex-col gap-4 mt-2">
                    {/* Step 1 */}
                    <div className="flex items-center gap-4 text-slate-700 dark:text-slate-300">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-blue-500 shrink-0">
                            <Share size={20} />
                        </div>
                        <div className="flex-1">
                            <span className="text-sm font-medium">1. 点击底部的能够找到的</span>
                            <span className="font-bold mx-1">分享</span>
                            <span className="text-sm font-medium">按钮</span>
                        </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex items-center gap-4 text-slate-700 dark:text-slate-300">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-blue-500 shrink-0">
                            <PlusSquare size={20} />
                        </div>
                        <div className="flex-1">
                            <span className="text-sm font-medium">2. 向下滚动并选择</span>
                            <span className="font-bold mx-1">添加到主屏幕</span>
                        </div>
                    </div>
                </div>

                {/* Decorative arrow pointing down (only relevant for mobile potentially) */}
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-white dark:bg-slate-900 rotate-45 border-b border-r border-slate-200 dark:border-slate-800 hidden sm:hidden" />
            </div>
        </div>
    );
};

export default IOSInstallPrompt;
