"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

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
  triggerClassName?: string;
  optionsClassName?: string;
  disabled?: boolean;
}

// 下拉框配置 - 在这里修改显示的选项数量和框的长度
const DROPDOWN_CONFIG = {
  // 每个选项的高度（px）- 包括 padding (py-2.5 = 20px) + margin (0.125rem * 2 = 4px) + line-height (1.25rem = 20px) ≈ 44px
  optionHeight: 44,
  // 边框和间距的额外高度（px）- 包括容器的 padding (0.375rem * 2 = 12px)
  borderAndPadding: 12,
  // 桌面端设置
  desktop: {
    maxVisibleOptions: 12, // 桌面端最多显示12个选项
  },
  // 移动端设置
  mobile: {
    maxVisibleOptions: 15, // 移动端最多显示15个选项
  },
};

const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = "请选择",
  className = "",
  triggerClassName = "",
  optionsClassName = "",
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

  // 位置重新计算（用于窗口大小变化或选项数量变化时）
  useEffect(() => {
    if (isOpen && selectRef.current) {
      const calculatePosition = () => {
        const rect = selectRef.current?.getBoundingClientRect();
        if (!rect) return;

        // 根据设备类型选择最大可见选项数
        const maxVisibleOptions = isMobile
          ? DROPDOWN_CONFIG.mobile.maxVisibleOptions
          : DROPDOWN_CONFIG.desktop.maxVisibleOptions;

        // 计算下拉选项位置
        const dropdownHeight = Math.min(
          options.length * DROPDOWN_CONFIG.optionHeight +
          DROPDOWN_CONFIG.borderAndPadding,
          maxVisibleOptions * DROPDOWN_CONFIG.optionHeight +
          DROPDOWN_CONFIG.borderAndPadding,
        );

        // 计算垂直位置 - 优先在下方显示，如果空间不够则在上方显示
        const viewportHeight = window.innerHeight;
        const spaceBelow = viewportHeight - rect.bottom;
        const spaceAbove = rect.top;
        const minSpace = 10; // 最小边距

        let finalTop: number;

        // 优先在下方显示
        if (spaceBelow >= dropdownHeight + minSpace) {
          // 下方空间足够，在触发按钮下方显示
          finalTop = rect.bottom + 4; // 4px 间距
        } else if (spaceAbove >= dropdownHeight + minSpace) {
          // 下方空间不够，但上方空间足够，在上方显示
          finalTop = rect.top - dropdownHeight - 4; // 4px 间距
        } else {
          // 上下空间都不够，选择空间更大的一侧
          if (spaceBelow >= spaceAbove) {
            // 下方空间更大，尽量显示在下方
            finalTop = Math.max(
              minSpace,
              viewportHeight - dropdownHeight - minSpace,
            );
          } else {
            // 上方空间更大，尽量显示在上方
            finalTop = Math.min(rect.top - 4, minSpace);
            // 如果还是超出，则固定在顶部
            if (finalTop < minSpace) {
              finalTop = minSpace;
            }
          }
        }

        // 最终边界检查
        if (finalTop < minSpace) {
          finalTop = minSpace;
        }
        if (finalTop + dropdownHeight > viewportHeight - minSpace) {
          finalTop = viewportHeight - dropdownHeight - minSpace;
        }

        const viewportWidth = window.innerWidth;
        // 下拉菜单宽度为触发按钮宽度的三分之二
        const dropdownWidth = rect.width * 0.67;
        // 保持右侧对齐，从左侧缩短
        let finalLeft = rect.left + rect.width - dropdownWidth;
        if (finalLeft + dropdownWidth > viewportWidth - 10) {
          finalLeft = viewportWidth - dropdownWidth - 10;
        }
        if (finalLeft < 10) {
          finalLeft = 10;
        }

        setDropdownPosition({
          top: finalTop,
          left: finalLeft,
          width: dropdownWidth,
          maxHeight: dropdownHeight,
        });
      };

      calculatePosition();

      // 监听窗口大小变化，重新计算位置
      const handleResize = () => {
        calculatePosition();
      };
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
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
      const target = event.target as Node;
      // 检查点击是否在触发按钮或下拉菜单内部
      const isClickInsideTrigger = selectRef.current?.contains(target);
      const isClickInsideOptions = optionsRef.current?.contains(target);

      // 如果点击在外部，关闭下拉框
      if (!isClickInsideTrigger && !isClickInsideOptions) {
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

    // 计算位置（桌面端和移动端都需要）
    if (selectRef.current) {
      const calculatePosition = () => {
        const rect = selectRef.current?.getBoundingClientRect();
        if (!rect) return null;

        // 根据设备类型选择最大可见选项数
        const maxVisibleOptions = isMobile
          ? DROPDOWN_CONFIG.mobile.maxVisibleOptions
          : DROPDOWN_CONFIG.desktop.maxVisibleOptions;

        // 计算下拉选项位置
        const dropdownHeight = Math.min(
          options.length * DROPDOWN_CONFIG.optionHeight +
          DROPDOWN_CONFIG.borderAndPadding,
          maxVisibleOptions * DROPDOWN_CONFIG.optionHeight +
          DROPDOWN_CONFIG.borderAndPadding,
        );

        // 计算垂直位置 - 优先在下方显示，如果空间不够则在上方显示
        const viewportHeight = window.innerHeight;
        const spaceBelow = viewportHeight - rect.bottom;
        const spaceAbove = rect.top;
        const minSpace = 10; // 最小边距

        let finalTop: number;

        // 优先在下方显示
        if (spaceBelow >= dropdownHeight + minSpace) {
          // 下方空间足够，在触发按钮下方显示
          finalTop = rect.bottom + 4; // 4px 间距
        } else if (spaceAbove >= dropdownHeight + minSpace) {
          // 下方空间不够，但上方空间足够，在上方显示
          finalTop = rect.top - dropdownHeight - 4; // 4px 间距
        } else {
          // 上下空间都不够，选择空间更大的一侧
          if (spaceBelow >= spaceAbove) {
            // 下方空间更大，尽量显示在下方
            finalTop = Math.max(
              minSpace,
              viewportHeight - dropdownHeight - minSpace,
            );
          } else {
            // 上方空间更大，尽量显示在上方
            finalTop = Math.min(rect.top - 4, minSpace);
            // 如果还是超出，则固定在顶部
            if (finalTop < minSpace) {
              finalTop = minSpace;
            }
          }
        }

        // 最终边界检查
        if (finalTop < minSpace) {
          finalTop = minSpace;
        }
        if (finalTop + dropdownHeight > viewportHeight - minSpace) {
          finalTop = viewportHeight - dropdownHeight - minSpace;
        }

        // 计算水平位置
        const viewportWidth = window.innerWidth;
        // 下拉菜单宽度为触发按钮宽度的三分之二
        const dropdownWidth = rect.width * 0.67;
        // 保持右侧对齐，从左侧缩短
        let finalLeft = rect.left + rect.width - dropdownWidth;
        if (finalLeft + dropdownWidth > viewportWidth - 10) {
          finalLeft = viewportWidth - dropdownWidth - 10;
        }
        if (finalLeft < 10) {
          finalLeft = 10;
        }

        return {
          top: finalTop,
          left: finalLeft,
          width: dropdownWidth,
          maxHeight: dropdownHeight,
        };
      };

      // 先设置位置，再显示下拉框
      const position = calculatePosition();
      setDropdownPosition(position);

      // 显示下拉框
      setIsOpen(true);
      setTimeout(() => setIsAnimating(false), isMobile ? 50 : 100);
    } else {
      // 如果无法获取引用，直接显示（回退方案）
      setIsOpen(true);
      setTimeout(() => setIsAnimating(false), isMobile ? 50 : 100);
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
        className={`custom-select-trigger ${triggerClassName}`}
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

      {/* 下拉选项 - 使用 Portal 渲染到 body，避免父容器影响 */}
      {isOpen &&
        dropdownPosition &&
        typeof window !== "undefined" &&
        createPortal(
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

                  el.addEventListener("scroll", handleScroll, {
                    passive: true,
                  });

                  // 清理函数
                  return () => {
                    el.removeEventListener("scroll", handleScroll);
                    clearTimeout(scrollTimeout);
                  };
                }
              }
            }}
            id="custom-select-options"
            className={`custom-select-options ${isMobile ? "mobile" : "desktop"} ${isAnimating && !isOpen ? "closing" : ""} ${optionsClassName}`}
            role="listbox"
            onClick={(e) => {
              // 如果点击的是容器本身（空白区域），阻止事件冒泡
              if (e.target === e.currentTarget) {
                e.stopPropagation();
              }
            }}
            onTouchStart={(e) => {
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
              dropdownPosition
                ? {
                  position: "fixed",
                  top: `${dropdownPosition.top}px`,
                  left: `${dropdownPosition.left}px`,
                  width: `${dropdownPosition.width}px`,
                  maxHeight: `${dropdownPosition.maxHeight}px`,
                  zIndex: 9999,
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
                  e.preventDefault();
                  e.stopPropagation();
                  handleOptionClick(option.value);
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onTouchStart={(e) => {
                  e.stopPropagation();
                }}
                role="option"
                aria-selected={option.value === value}
              >
                {option.label}
              </div>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
};

export default CustomSelect;
