"use client";

import React, { useState, useRef, useEffect } from "react";

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = "请选择",
  className = "",
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [isMobile, setIsMobile] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
    width: number;
    maxHeight: number;
  } | null>(null);
  const selectRef = useRef<HTMLDivElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);

  // 检测是否为移动端
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // 计算下拉选项位置
  useEffect(() => {
    if (isOpen && selectRef.current) {
      const calculatePosition = () => {
        const rect = selectRef.current!.getBoundingClientRect();

        // 计算下拉选项位置
        const optionHeight = 40; // 每个选项的高度
        const borderAndPadding = 10; // 边框和间距的额外高度
        // 移动端和桌面端使用不同的最大可见选项数，与CSS保持一致
        const maxVisibleOptions = isMobile ? 11 : 12; // 移动端：桌面端
        const dropdownHeight = Math.min(
          options.length * optionHeight + borderAndPadding,
          maxVisibleOptions * optionHeight + borderAndPadding,
        );

        // 计算垂直位置 - 以筛选框为中心
        const viewportHeight = window.innerHeight;
        const idealTop = rect.top + rect.height / 2 - dropdownHeight / 2;

        // 确保不超出屏幕边界
        let finalTop = idealTop;
        if (idealTop < 10) {
          // 如果超出顶部，调整到顶部留10px边距
          finalTop = 10;
        } else if (idealTop + dropdownHeight > viewportHeight - 10) {
          // 如果超出底部，调整到底部留10px边距
          finalTop = viewportHeight - dropdownHeight - 10;
        }

        // 计算水平位置
        const viewportWidth = window.innerWidth;
        let finalLeft = rect.left;
        if (rect.left + rect.width > viewportWidth - 10) {
          finalLeft = viewportWidth - rect.width - 10;
        }
        if (finalLeft < 10) {
          finalLeft = 10;
        }

        setDropdownPosition({
          top: finalTop,
          left: finalLeft,
          width: rect.width,
          maxHeight: dropdownHeight,
        });
      };

      if (isMobile) {
        // 移动端添加微小延迟确保DOM完全更新
        requestAnimationFrame(() => {
          requestAnimationFrame(calculatePosition);
        });
      } else {
        calculatePosition();
      }
    }
  }, [isOpen, options.length, isMobile]);

  // 获取当前选中项的显示文本
  const selectedOption = options.find((option) => option.value === value);
  const displayText = selectedOption ? selectedOption.label : placeholder;

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        selectRef.current &&
        !selectRef.current.contains(event.target as Node)
      ) {
        handleClose();
      }
    };

    const handleTouchMove = (event: TouchEvent) => {
      // 如果下拉框打开且是移动端，检测滑动行为
      if (isOpen && isMobile) {
        // 检查触摸目标是否在下拉框内
        const target = event.target as Node;
        if (optionsRef.current && !optionsRef.current.contains(target)) {
          handleClose();
        }
      }
    };

    // 同时监听鼠标和触摸事件，确保移动端也能正常工作
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    
    // 监听触摸移动事件
    if (isOpen && isMobile) {
      document.addEventListener("touchmove", handleTouchMove, { passive: true });
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("touchmove", handleTouchMove);
    };
  }, [isOpen, isMobile]);

  // 键盘导航
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (disabled) return;

    switch (event.key) {
      case "Enter":
      case " ":
        event.preventDefault();
        if (isOpen && focusedIndex >= 0) {
          onChange(options[focusedIndex].value);
          setIsOpen(false);
          setFocusedIndex(-1);
        } else {
          setIsOpen(!isOpen);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setFocusedIndex(-1);
        // 让组件失去焦点，移除选中动画
        if (selectRef.current) {
          selectRef.current.blur();
        }
        break;
      case "ArrowDown":
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setFocusedIndex((prev) =>
            prev < options.length - 1 ? prev + 1 : prev,
          );
        }
        break;
      case "ArrowUp":
        event.preventDefault();
        if (isOpen) {
          setFocusedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        }
        break;
    }
  };

  // 打开下拉框
  const handleOpen = () => {
    if (disabled) return;
    setIsAnimating(true);
    setIsOpen(true);
    setTimeout(() => setIsAnimating(false), isMobile ? 150 : 300);
  };

  // 关闭下拉框
  const handleClose = () => {
    setIsAnimating(true);
    setIsOpen(false);
    setFocusedIndex(-1);
    // 立即开始关闭，只在动画完成后重置状态
    setTimeout(() => {
      setIsAnimating(false);
      if (selectRef.current) {
        selectRef.current.blur();
      }
    }, isMobile ? 50 : 100);
  };

  // 选择选项
  const handleOptionClick = (optionValue: string) => {
    setIsAnimating(true);
    onChange(optionValue);
    setIsOpen(false);
    setFocusedIndex(-1);
    
    // 立即开始关闭，只在动画完成后重置状态
    setTimeout(() => {
      setIsAnimating(false);
      // 选择后让组件失去焦点
      if (selectRef.current) {
        selectRef.current.blur();
      }
    }, isMobile ? 50 : 100);
  };

  // 滚动到焦点项
  useEffect(() => {
    if (isOpen && focusedIndex >= 0 && optionsRef.current) {
      const focusedElement = optionsRef.current.children[
        focusedIndex
      ] as HTMLElement;
      if (focusedElement) {
        focusedElement.scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        });
      }
    }
  }, [focusedIndex, isOpen]);

  return (
    <div
      ref={selectRef}
      className={`custom-select ${className} ${disabled ? "disabled" : ""}`}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={handleKeyDown}
      role="combobox"
      aria-expanded={isOpen}
      aria-haspopup="listbox"
      aria-controls="custom-select-options"
      aria-label="自定义选择框"
    >
      {/* 选择框主体 */}
      <div
        className="custom-select-trigger"
        onClick={(e) => {
          e.stopPropagation();
          if (!disabled) {
            if (isOpen) {
              handleClose();
            } else {
              handleOpen();
            }
          }
        }}
        onTouchStart={(e) => {
          // 防止触摸事件冒泡到外部
          e.stopPropagation();
        }}
      >
        <span className="custom-select-value">{displayText}</span>
      </div>

      {/* 移动端背景遮罩 */}
      {isOpen && isMobile && (
        <div
          className="fixed bg-black/30 z-40"
          style={{
            top: 0,
            left: 0,
            width: '100vw',
            height: '100lvh',
          }}
          onClick={handleClose}
          onTouchStart={(e) => {
            // 防止触摸事件冒泡
            e.stopPropagation();
          }}
          onTouchMove={(e) => {
            // 检测滑动行为并关闭下拉框
            e.preventDefault();
            handleClose();
          }}
        />
      )}

      {/* 下拉选项 */}
      {isOpen && (!isMobile || dropdownPosition) && (
        <div
          ref={optionsRef}
          id="custom-select-options"
          className={`custom-select-options ${isMobile ? 'mobile' : 'desktop'} ${isAnimating && !isOpen ? 'closing' : ''}`}
          role="listbox"
          onClick={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          style={
            isMobile && dropdownPosition
              ? {
                position: "fixed",
                top: `${dropdownPosition.top}px`,
                left: `${dropdownPosition.left}px`,
                width: `${dropdownPosition.width}px`,
                maxHeight: `${dropdownPosition.maxHeight}px`,
                transform: "none",
                zIndex: 50,
              }
              : {}
          }
        >
          {options.map((option, index) => (
            <div
              key={option.value}
              className={`custom-select-option ${option.value === value ? "selected" : ""
                } ${index === focusedIndex ? "focused" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                handleOptionClick(option.value);
              }}
              onTouchStart={(e) => e.stopPropagation()}
              role="option"
              aria-selected={option.value === value}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomSelect;
