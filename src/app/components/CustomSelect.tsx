"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";

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

// 下拉框配置 - 在这里修改显示的选项数量和框的长度
const DROPDOWN_CONFIG = {
  // 每个选项的高度（px）
  optionHeight: 40,
  // 边框和间距的额外高度（px）
  borderAndPadding: 10,
  // 桌面端设置
  desktop: {
    maxVisibleOptions: 12, // 桌面端最多显示12个选项
  },
  // 移动端设置
  mobile: {
    maxVisibleOptions: 15, // 移动端最多显示11个选项
  },
};

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

  // 触摸事件状态（仅用于下拉选项内部）
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(
    null,
  );

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

        // 桌面端计算
        const dropdownHeight = Math.min(
          options.length * DROPDOWN_CONFIG.optionHeight +
            DROPDOWN_CONFIG.borderAndPadding,
          DROPDOWN_CONFIG.desktop.maxVisibleOptions *
            DROPDOWN_CONFIG.optionHeight +
            DROPDOWN_CONFIG.borderAndPadding,
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

  // 关闭下拉框
  const handleClose = useCallback(() => {
    setIsAnimating(true);
    setIsOpen(false);
    setFocusedIndex(-1);
    // 立即开始关闭，只在动画完成后重置状态
    setTimeout(
      () => {
        setIsAnimating(false);
        setDropdownPosition(null); // 清理位置状态
        if (selectRef.current) {
          selectRef.current.blur();
        }
      },
      isMobile ? 50 : 100,
    );
  }, [isMobile]);

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
    },
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
  }, [handleClose]);

  // 监听页面滚动，滚动时关闭下拉框
  useEffect(() => {
    if (!isOpen) return;

    const handlePageScroll = () => {
      handleClose();
    };

    // 监听页面滚动事件
    window.addEventListener("scroll", handlePageScroll, { passive: true });
    document.addEventListener("scroll", handlePageScroll, { passive: true });

    // 监听触摸滚动事件（移动端）
    const handleTouchMove = (event: TouchEvent) => {
      // 检查触摸事件是否来自下拉选项内部
      if (
        optionsRef.current &&
        event.target &&
        optionsRef.current.contains(event.target as Node)
      ) {
        return; // 如果是下拉选项内部的滚动，不关闭
      }

      // 如果是页面其他地方的触摸滚动，关闭下拉框
      handleClose();
    };

    document.addEventListener("touchmove", handleTouchMove, { passive: true });

    return () => {
      window.removeEventListener("scroll", handlePageScroll);
      document.removeEventListener("scroll", handlePageScroll);
      document.removeEventListener("touchmove", handleTouchMove);
    };
  }, [isOpen, handleClose]);

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

    // 如果是移动端，先计算位置再显示
    if (isMobile && selectRef.current) {
      const calculatePosition = () => {
        const rect = selectRef.current!.getBoundingClientRect();

        // 计算下拉选项位置
        const dropdownHeight = Math.min(
          options.length * DROPDOWN_CONFIG.optionHeight +
            DROPDOWN_CONFIG.borderAndPadding,
          DROPDOWN_CONFIG.mobile.maxVisibleOptions *
            DROPDOWN_CONFIG.optionHeight +
            DROPDOWN_CONFIG.borderAndPadding,
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

      // 立即显示，不需要 requestAnimationFrame 延迟
      setIsOpen(true);
      setTimeout(() => setIsAnimating(false), 50);
    } else {
      // 桌面端直接显示
      setIsOpen(true);
      setTimeout(() => setIsAnimating(false), 100); // 桌面端保持稍慢的动画
    }
  };

  // 选择选项
  const handleOptionClick = (optionValue: string) => {
    setIsAnimating(true);
    onChange(optionValue);
    setIsOpen(false);
    setFocusedIndex(-1);

    // 立即开始关闭，只在动画完成后重置状态
    setTimeout(
      () => {
        setIsAnimating(false);
        // 选择后让组件失去焦点
        if (selectRef.current) {
          selectRef.current.blur();
        }
      },
      isMobile ? 50 : 100,
    );
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

  // 计算选中项的滚动位置
  const calculateScrollPosition = useCallback(
    (selectedIndex: number, container: HTMLDivElement) => {
      const itemHeight = DROPDOWN_CONFIG.optionHeight;
      const containerHeight = container.clientHeight;

      // 使用实际的 scrollHeight 而不是理论计算值
      const totalHeight = container.scrollHeight;

      // 如果总内容高度小于等于容器高度，不需要滚动
      if (totalHeight <= containerHeight) {
        return 0;
      }

      // 计算实际的最大滚动距离
      const maxScrollTop = totalHeight - containerHeight;

      // 计算可见选项数量
      const visibleItemsCount = Math.floor(containerHeight / itemHeight);

      // 计算选中项的顶部位置
      const itemTop = selectedIndex * itemHeight;

      // 简单而有效的逻辑：
      // 1. 如果是前面五分之四的选项，scrollTop = 0（从顶部显示）
      // 2. 如果是最后五分之四的选项，scrollTop = maxScrollTop（滚动到底部）
      // 3. 其他情况，让选中项居中显示

      const fourFifthsVisible = Math.floor((visibleItemsCount * 4) / 5);

      if (selectedIndex < fourFifthsVisible) {
        // 前面五分之四的选项：从顶部显示
        return 0;
      } else if (selectedIndex >= options.length - fourFifthsVisible) {
        // 最后五分之四的选项：滚动到底部，使用实际的 maxScrollTop
        return maxScrollTop;
      } else {
        // 中间选项：让选项的底部居中显示
        // 使用实际的 DOM 元素位置而不是理论计算
        const selectedElement = container.children[
          selectedIndex
        ] as HTMLElement;
        if (selectedElement) {
          // 获取选中项相对于容器的实际位置
          const elementTop = selectedElement.offsetTop;
          const elementHeight = selectedElement.offsetHeight;
          const elementBottom = elementTop + elementHeight;

          // 让选中项的底部位于容器的中心
          const idealScrollTop = elementBottom - containerHeight / 2;
          return Math.max(0, Math.min(idealScrollTop, maxScrollTop));
        } else {
          // 如果无法获取实际元素，回退到理论计算
          const itemBottom = itemTop + itemHeight;
          const idealScrollTop = itemBottom - containerHeight / 2;
          return Math.max(0, Math.min(idealScrollTop, maxScrollTop));
        }
      }
    },
    [options.length],
  );

  // 设置下拉框的初始滚动位置（延迟执行以避免阻塞动画）
  const setInitialScrollPosition = useCallback(
    (container: HTMLDivElement) => {
      if (value) {
        const selectedIndex = options.findIndex(
          (option) => option.value === value,
        );
        if (selectedIndex >= 0) {
          // 使用 requestAnimationFrame 确保在下一帧执行，不阻塞当前动画
          requestAnimationFrame(() => {
            // 再次检查容器是否还存在（防止快速开关导致的错误）
            if (container && container.parentNode) {
              const scrollTop = calculateScrollPosition(
                selectedIndex,
                container,
              );
              container.scrollTop = scrollTop;
            }
          });
        }
      }
    },
    [value, options, calculateScrollPosition],
  );

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
          className="fixed bg-transparent z-40"
          style={{
            top: 0,
            left: 0,
            width: "100vw",
            height: "100lvh",
          }}
          onClick={handleClose}
        />
      )}

      {/* 下拉选项 */}
      {isOpen && (!isMobile || (isMobile && dropdownPosition)) && (
        <div
          ref={(el) => {
            optionsRef.current = el;
            // 在元素创建时立即设置滚动位置，避免用户看到跳跃
            if (el) {
              setInitialScrollPosition(el);

              // 移动端：添加iOS风格的滚动条行为
              if (isMobile) {
                let scrollTimeout: NodeJS.Timeout;

                const handleScroll = () => {
                  // 滚动时显示滚动条
                  el.classList.add("scrolling");

                  // 清除之前的定时器
                  clearTimeout(scrollTimeout);

                  // 滚动停止1秒后隐藏滚动条
                  scrollTimeout = setTimeout(() => {
                    el.classList.remove("scrolling");
                  }, 1000);
                };

                el.addEventListener("scroll", handleScroll, { passive: true });

                // 清理函数
                return () => {
                  el.removeEventListener("scroll", handleScroll);
                  clearTimeout(scrollTimeout);
                };
              }
            }
          }}
          id="custom-select-options"
          className={`custom-select-options ${isMobile ? "mobile" : "desktop"} ${isAnimating && !isOpen ? "closing" : ""}`}
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
                  zIndex: 50,
                }
              : {}
          }
        >
          {options.map((option, index) => (
            <div
              key={option.value}
              className={`custom-select-option ${
                option.value === value ? "selected" : ""
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
