"use client";

import type { MouseEvent as ReactMouseEvent } from "react";
import { useCallback, useRef } from "react";

export function useMouseDragScroll<T extends HTMLElement>() {
  const containerRef = useRef<T>(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const hasDraggedRef = useRef(false);

  const handleMouseDown = useCallback((event: ReactMouseEvent<T>) => {
    const container = containerRef.current;
    if (!container) return;

    isDraggingRef.current = true;
    startXRef.current = event.pageX - container.offsetLeft;
    scrollLeftRef.current = container.scrollLeft;
    hasDraggedRef.current = false;
    container.style.cursor = "grabbing";
    container.style.userSelect = "none";
  }, []);

  const handleMouseMove = useCallback((event: ReactMouseEvent<T>) => {
    const container = containerRef.current;
    if (!isDraggingRef.current || !container) return;

    event.preventDefault();
    const x = event.pageX - container.offsetLeft;
    const walk = (x - startXRef.current) * 2;

    if (Math.abs(walk) > 5) {
      hasDraggedRef.current = true;
    }

    container.scrollLeft = scrollLeftRef.current - walk;
  }, []);

  const handleMouseUpOrLeave = useCallback(() => {
    isDraggingRef.current = false;

    const container = containerRef.current;
    if (container) {
      container.style.cursor = "grab";
      container.style.userSelect = "auto";
    }

    setTimeout(() => {
      hasDraggedRef.current = false;
    }, 50);
  }, []);

  return {
    containerRef,
    hasDraggedRef,
    dragHandlers: {
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUpOrLeave,
      onMouseLeave: handleMouseUpOrLeave,
    },
  };
}
