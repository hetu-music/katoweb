"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  RefreshCw,
} from "lucide-react";

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
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLDivElement>(null);

  // 重置状态
  const resetTransform = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setRotation(0);
  }, []);

  // 缩放控制
  const zoomIn = useCallback(() => {
    setScale((prev) => Math.min(prev * 1.5, 5));
  }, []);

  const zoomOut = useCallback(() => {
    setScale((prev) => Math.max(prev / 1.5, 0.5));
  }, []);

  // 旋转控制
  const rotateClockwise = useCallback(() => {
    setRotation((prev) => (prev + 90) % 360);
  }, []);

  const rotateCounterClockwise = useCallback(() => {
    setRotation((prev) => (prev - 90 + 360) % 360);
  }, []);

  // 处理键盘事件
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      } else if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        zoomIn();
      } else if (event.key === "-") {
        event.preventDefault();
        zoomOut();
      } else if (event.key === "0") {
        event.preventDefault();
        resetTransform();
      } else if (event.key === "r" || event.key === "R") {
        event.preventDefault();
        rotateClockwise();
      } else if (event.key === "l" || event.key === "L") {
        event.preventDefault();
        rotateCounterClockwise();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [
    isOpen,
    onClose,
    zoomIn,
    zoomOut,
    resetTransform,
    rotateClockwise,
    rotateCounterClockwise,
  ]);

  // 重置状态当模态框打开时
  useEffect(() => {
    if (isOpen) {
      resetTransform();
    }
  }, [isOpen, resetTransform]);

  // 鼠标拖拽
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (scale > 1) {
        setIsDragging(true);
        setDragStart({
          x: e.clientX - position.x,
          y: e.clientY - position.y,
        });
      }
    },
    [scale, position],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging && scale > 1) {
        setPosition({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        });
      }
    },
    [isDragging, scale, dragStart],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 滚轮缩放处理
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (isOpen && imageRef.current?.contains(e.target as Node)) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setScale((prev) => Math.min(Math.max(prev * delta, 0.5), 5));
      }
    };

    if (isOpen) {
      // 使用 passive: false 来允许 preventDefault
      document.addEventListener("wheel", handleWheel, { passive: false });
    }

    return () => {
      document.removeEventListener("wheel", handleWheel);
    };
  }, [isOpen]);

  // 双击重置
  const handleDoubleClick = useCallback(() => {
    if (scale === 1) {
      setScale(2);
    } else {
      resetTransform();
    }
  }, [scale, resetTransform]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 图片标题 - 左上角 */}
      {title && (
        <div className="absolute top-4 left-4 z-10">
          <h3 className="text-white text-lg font-semibold bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full">
            {title}
          </h3>
        </div>
      )}

      {/* 控制按钮组 - 右上角 */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <button
          onClick={zoomOut}
          className="p-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all duration-200"
          aria-label="缩小"
          title="缩小 (-)"
        >
          <ZoomOut size={16} />
        </button>

        <span className="text-white text-sm min-w-[3rem] text-center">
          {Math.round(scale * 100)}%
        </span>

        <button
          onClick={zoomIn}
          className="p-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all duration-200"
          aria-label="放大"
          title="放大 (+)"
        >
          <ZoomIn size={16} />
        </button>

        <button
          onClick={rotateCounterClockwise}
          className="p-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all duration-200"
          aria-label="逆时针旋转"
          title="逆时针旋转 (L)"
        >
          <RotateCcw size={16} />
        </button>

        <button
          onClick={rotateClockwise}
          className="p-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all duration-200"
          aria-label="顺时针旋转"
          title="顺时针旋转 (R)"
        >
          <RotateCw size={16} />
        </button>

        <button
          onClick={resetTransform}
          className="p-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all duration-200"
          aria-label="重置"
          title="重置 (0)"
        >
          <RefreshCw size={16} />
        </button>

        <button
          onClick={onClose}
          className="p-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all duration-200"
          aria-label="关闭"
          title="关闭 (ESC)"
        >
          <X size={16} />
        </button>
      </div>

      {/* 图片容器 - 占满整个屏幕 */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
        <div
          ref={imageRef}
          className="relative select-none flex items-center justify-center w-full h-full"
          style={{
            transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px) rotate(${rotation}deg)`,
            transition: isDragging ? "none" : "transform 0.2s ease-out",
            cursor: scale > 1 ? (isDragging ? "grabbing" : "grab") : "default",
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onDoubleClick={handleDoubleClick}
        >
          <Image
            src={src}
            alt={alt}
            width={1200}
            height={800}
            className="max-w-full max-h-full object-contain"
            style={{ objectFit: "contain" }}
            priority
            draggable={false}
          />
        </div>
      </div>

      {/* 操作提示 - 左下角 */}
      <div className="absolute bottom-4 left-4 z-10">
        <p className="text-white/70 text-sm bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full">
          滚轮缩放 • 双击重置 • 拖拽移动
        </p>
      </div>
    </div>
  );
};

export default ImageModal;
