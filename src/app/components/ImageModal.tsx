"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import { X } from "lucide-react";

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  src: string;
  alt: string;
  title?: string;
}

const ImageModal: React.FC<ImageModalProps> = ({
  isOpen,
  onClose,
  src,
  alt,
  title,
}) => {
  // 处理 ESC 键关闭
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      // 防止背景滚动
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* 模态框内容 */}
      <div className="relative max-w-[95vw] max-h-[95vh] flex flex-col items-center">
        {/* 标题 */}
        {title && (
          <div className="mb-4 text-center">
            <h3 className="text-white text-lg font-semibold">{title}</h3>
          </div>
        )}

        {/* 图片容器 */}
        <div className="relative">
          {/* 关闭按钮 */}
          <button
            onClick={onClose}
            className="absolute -top-2 -right-2 z-10 p-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all duration-200"
            aria-label="关闭"
          >
            <X size={20} />
          </button>

          {/* 图片 */}
          <div className="relative bg-white/5 rounded-lg overflow-hidden shadow-2xl">
            <Image
              src={src}
              alt={alt}
              width={1200}
              height={800}
              className="max-w-full max-h-[80vh] object-contain"
              style={{ objectFit: "contain" }}
              priority
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageModal;