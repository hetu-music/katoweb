"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

const Slider = React.forwardRef<
  React.ComponentRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => {
  // Derive thumb count from value or defaultValue so we render the correct number of thumbs
  const thumbCount = (props.value ?? props.defaultValue ?? [0]).length;

  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn(
        "relative flex w-full touch-none select-none items-center",
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700/50">
        <SliderPrimitive.Range className="absolute h-full bg-blue-500" />
      </SliderPrimitive.Track>

      {Array.from({ length: thumbCount }).map((_, i) => (
        <SliderPrimitive.Thumb
          key={i}
          className={cn(
            "flex h-5 w-5 items-center justify-center",
            "rounded-full bg-white dark:bg-slate-100",
            "border border-slate-200 shadow-md",
            "transition-transform hover:scale-110 active:scale-110 active:cursor-grabbing",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30",
            "disabled:pointer-events-none disabled:opacity-50",
            "cursor-grab",
          )}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500 pointer-events-none" />
        </SliderPrimitive.Thumb>
      ))}
    </SliderPrimitive.Root>
  );
});
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
