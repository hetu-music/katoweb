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
  const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null);
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
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 计算下拉选项位置
  useEffect(() => {
    if (isOpen && selectRef.current) {
      const rect = selectRef.current.getBoundingClientRect();
      setTriggerRect(rect);

      // 计算下拉选项的理想位置
      const optionHeight = 40; // 每个选项的高度
      // 移动端和桌面端使用不同的最大可见选项数
      const maxVisibleOptions = isMobile ? 10 : 7.5; // 移动端显示10个选项，桌面端7.5个
      const dropdownHeight = Math.min(options.length * optionHeight, maxVisibleOptions * optionHeight);
      
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
        maxHeight: dropdownHeight
      });
    }
  }, [isOpen, options.length]);

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
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };

    // 同时监听鼠标和触摸事件，确保移动端也能正常工作
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

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
        break;
      case "ArrowDown":
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setFocusedIndex((prev) =>
            prev < options.length - 1 ? prev + 1 : prev
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

  // 选择选项
  const handleOptionClick = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setFocusedIndex(-1);
    // 选择后让组件失去焦点
    setTimeout(() => {
      if (selectRef.current) {
        selectRef.current.blur();
      }
    }, 100);
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
      aria-label="自定义选择框"
    >
      {/* 选择框主体 */}
      <div
        className="custom-select-trigger"
        onClick={(e) => {
          e.stopPropagation();
          if (!disabled) setIsOpen(!isOpen);
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
          className="fixed inset-0 bg-black/30 z-40"
          onClick={() => {
            setIsOpen(false);
            setFocusedIndex(-1);
          }}
          onTouchStart={(e) => {
            // 防止触摸事件冒泡
            e.stopPropagation();
          }}
        />
      )}

      {/* 下拉选项 */}
      {isOpen && (
        <div 
          ref={optionsRef} 
          className="custom-select-options" 
          role="listbox"
          onClick={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          style={isMobile && dropdownPosition ? {
            position: 'fixed',
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`,
            maxHeight: `${dropdownPosition.maxHeight}px`,
            transform: 'none',
            zIndex: 50
          } : {}}
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