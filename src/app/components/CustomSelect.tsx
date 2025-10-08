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

  // 触摸事件状态
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);

  // 检测是否为移动端
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // 桌面端位置计算（移动端位置在 handleOpen 中预先计算）
  useEffect(() => {
    if (isOpen && !isMobile && selectRef.current) {
      const calculatePosition = () => {
        const rect = selectRef.current!.getBoundingClientRect();

        // 桌面端计算（保持原有逻辑）
        const optionHeight = 40;
        const borderAndPadding = 10;
        const maxVisibleOptions = 12;
        const dropdownHeight = Math.min(
          options.length * optionHeight + borderAndPadding,
          maxVisibleOptions * optionHeight + borderAndPadding,
        );

        const viewportHeight = window.innerHeight;
        const idealTop = rect.top + rect.height / 2 - dropdownHeight / 2;

        let finalTop = idealTop;
        if (idealTop < 10) {
          finalTop = 10;
        } else if (idealTop + dropdownHeight > viewportHeight - 10) {
          finalTop = viewportHeight - dropdownHeight - 10;
        }

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

      calculatePosition();
    }
  }, [isOpen, options.length, isMobile]);

  // 获取当前选中项的显示文本
  const selectedOption = options.find((option) => option.value === value);
  const displayText = selectedOption ? selectedOption.label : placeholder;

  // 下拉选项内部的触摸事件处理函数
  const handleOptionsTouch = {
    start: (event: React.TouchEvent) => {
      const touch = event.touches[0];
      setTouchStart({ x: touch.clientX, y: touch.clientY });
    },

    move: (event: React.TouchEvent) => {
      if (!touchStart) return;

      const touch = event.touches[0];
      const deltaX = Math.abs(touch.clientX - touchStart.x);
      const deltaY = Math.abs(touch.clientY - touchStart.y);

      // 如果水平移动距离大于垂直移动距离，且超过阈值，则阻止水平拖动
      if (deltaX > deltaY && deltaX > 10) {
        event.preventDefault();
        return;
      }
    },

    end: () => {
      setTouchStart(null);
    }
  };

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

    // 同时监听鼠标和触摸事件，确保移动端也能正常工作
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
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
  const handleOpen = async () => {
    if (disabled) return;

    setIsAnimating(true);

    // 如果是移动端，先计算位置再显示
    if (isMobile && selectRef.current) {
      const calculatePosition = () => {
        const rect = selectRef.current!.getBoundingClientRect();

        // 计算下拉选项位置
        const optionHeight = 40; // 每个选项的高度
        const borderAndPadding = 10; // 边框和间距的额外高度
        const maxVisibleOptions = 11; // 移动端最大可见选项数
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
          finalTop = 10;
        } else if (idealTop + dropdownHeight > viewportHeight - 10) {
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

        return {
          top: finalTop,
          left: finalLeft,
          width: rect.width,
          maxHeight: dropdownHeight,
        };
      };

      // 先设置位置，再显示下拉框
      const position = calculatePosition();
      setDropdownPosition(position);

      // 使用 requestAnimationFrame 确保位置设置完成后再显示
      requestAnimationFrame(() => {
        setIsOpen(true);
        setTimeout(() => setIsAnimating(false), 150);
      });
    } else {
      // 桌面端直接显示
      setIsOpen(true);
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  // 关闭下拉框
  const handleClose = () => {
    setIsAnimating(true);
    setIsOpen(false);
    setFocusedIndex(-1);
    // 立即开始关闭，只在动画完成后重置状态
    setTimeout(() => {
      setIsAnimating(false);
      setDropdownPosition(null); // 清理位置状态
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
            // 记录触摸开始位置
            const touch = e.touches[0];
            setTouchStart({ x: touch.clientX, y: touch.clientY });
          }}
          onTouchMove={(e) => {
            // 检测是否有明显的滑动动作
            if (touchStart) {
              const touch = e.touches[0];
              const deltaX = Math.abs(touch.clientX - touchStart.x);
              const deltaY = Math.abs(touch.clientY - touchStart.y);

              // 如果有明显的滑动动作（垂直或水平），关闭下拉框
              if (deltaY > 15 || deltaX > 15) {
                handleClose();
                // 不调用 preventDefault()，让屏幕可以正常滚动
              }
            }
          }}
          onTouchEnd={() => {
            setTouchStart(null);
          }}
        />
      )}

      {/* 下拉选项 */}
      {isOpen && ((!isMobile) || (isMobile && dropdownPosition)) && (
        <div
          ref={optionsRef}
          id="custom-select-options"
          className={`custom-select-options ${isMobile ? 'mobile' : 'desktop'} ${isAnimating && !isOpen ? 'closing' : ''}`}
          role="listbox"
          onClick={(e) => e.stopPropagation()}
          onTouchStart={(e) => {
            e.stopPropagation();
            if (isMobile) {
              handleOptionsTouch.start(e);
            }
          }}
          onTouchMove={(e) => {
            if (isMobile) {
              handleOptionsTouch.move(e);
            }
          }}
          onTouchEnd={() => {
            if (isMobile) {
              handleOptionsTouch.end();
            }
          }}
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
