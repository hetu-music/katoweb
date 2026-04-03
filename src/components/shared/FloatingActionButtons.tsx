"use client";

import React, { useState } from "react";
import { ArrowUp, Download, Share2, Plus } from "lucide-react";
import { usePWAInstall } from "@/components/pwa/PWARegistration";
import IOSInstallPrompt from "@/components/pwa/IOSInstallPrompt";

interface FloatingActionButtonsProps {
  showScrollTop: boolean;
  onScrollToTop: () => void;
  onShare?: () => void;
  className?: string; // Add className prop for flexibility
  children?: React.ReactNode; // Extra buttons to render in the container
}

const FloatingActionButtons: React.FC<FloatingActionButtonsProps> = ({
  showScrollTop,
  onScrollToTop,
  onShare,
  className,
  children,
}) => {
  const { isInstallable, install, isIOS, isStandalone } = usePWAInstall();
  const [showIOSPrompt, setShowIOSPrompt] = React.useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const showInstallButton = isInstallable || (isIOS && !isStandalone);
  const hasSecondaryActions =
    Boolean(children) || showInstallButton || Boolean(onShare);

  const handleInstallClick = () => {
    if (isIOS) {
      setShowIOSPrompt(true);
    } else {
      install();
    }
    setIsMenuOpen(false);
  };

  const handleShareClick = () => {
    onShare?.();
    setIsMenuOpen(false);
  };

  const buttonClass =
    "p-3 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 shadow-lg shadow-slate-200/50 dark:shadow-black/50 ring-1 ring-slate-900/5 dark:ring-white/10 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center";

  return (
    <>
      <IOSInstallPrompt
        isOpen={showIOSPrompt}
        onClose={() => setShowIOSPrompt(false)}
      />
      <div
        className={`fixed bottom-8 right-8 z-50 flex flex-col gap-4 items-center ${className || ""}`}
      >
        {/* 二级菜单 */}
        {hasSecondaryActions && (
          <div className="relative flex flex-col items-center gap-4">
            <div
              className={`flex flex-col gap-4 absolute bottom-full mb-4 transition-all duration-300 origin-bottom right-0 items-center overflow-visible ${
                isMenuOpen
                  ? "scale-100 opacity-100 pointer-events-auto translate-y-0"
                  : "scale-50 opacity-0 pointer-events-none translate-y-8"
              }`}
            >
              {children}

              {showInstallButton && (
                <button
                  onClick={handleInstallClick}
                  className={buttonClass}
                  title="安装为PWA应用"
                  aria-label="安装为PWA应用"
                >
                  <Download size={20} />
                </button>
              )}

              {onShare && (
                <button
                  onClick={handleShareClick}
                  className={buttonClass}
                  title="分享"
                  aria-label="分享"
                >
                  <Share2 size={20} />
                </button>
              )}
            </div>

            {/* 菜单触发按钮 */}
            <button
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className={buttonClass}
              title="更多操作"
              aria-label="更多操作"
            >
              <Plus
                size={20}
                className={`transition-transform duration-300 ${
                  isMenuOpen ? "rotate-45" : ""
                }`}
              />
            </button>
          </div>
        )}

        {/* 返回顶部按钮 */}
        <button
          onClick={onScrollToTop}
          className={`${buttonClass} ${
            showScrollTop
              ? "translate-y-0 opacity-100"
              : "translate-y-8 opacity-0 pointer-events-none"
          }`}
          title="返回顶部"
          aria-label="返回顶部"
        >
          <ArrowUp size={20} />
        </button>
      </div>
    </>
  );
};

export default FloatingActionButtons;
