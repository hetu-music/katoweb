import React, { useRef, useEffect, useState, useCallback } from "react";
import CustomSelect from "./CustomSelect";

interface SongFiltersProps {
  yearRangeIndices: [number, number];
  setYearRangeIndices: (range: [number, number]) => void;
  sliderYears: (string | number)[];
  selectedLyricist: string;
  setSelectedLyricist: (lyricist: string) => void;
  selectedComposer: string;
  setSelectedComposer: (composer: string) => void;
  selectedArranger: string;
  setSelectedArranger: (arranger: string) => void;
  filterOptions: {
    allTypes: string[];
    allYears: (string | number | null)[];
    allLyricists: string[];
    allComposers: string[];
    allArrangers: string[];
  };
}

const YearRangeSlider = ({
  range,
  setRange,
  values,
}: {
  range: [number, number];
  setRange: (range: [number, number]) => void;
  values: (string | number)[];
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<"left" | "right" | null>(null);

  // No local state needed if we update parent fast enough.
  // If performance is bad, we can re-introduce local state, but usually React is fast enough for this.

  const maxIndex = values.length - 1;

  // Calculate percentage for a given index
  const getPercent = (index: number) => {
    if (maxIndex === 0) return 0;
    return (index / maxIndex) * 100;
  };

  // Convert position (0-1) to nearest index
  const getIndexFromPos = useCallback(
    (pos: number) => {
      const idx = Math.round(pos * maxIndex);
      return Math.max(0, Math.min(maxIndex, idx));
    },
    [maxIndex],
  );

  useEffect(() => {
    const handleMove = (e: PointerEvent) => {
      if (!dragging || !containerRef.current) return;
      e.preventDefault();

      const rect = containerRef.current.getBoundingClientRect();
      const relativeX = (e.clientX - rect.left) / rect.width;
      // Clamp relativeX to 0-1 for safety, though getIndexFromPos handles indices
      const clampedRelativeX = Math.max(0, Math.min(1, relativeX));

      const newIndex = getIndexFromPos(clampedRelativeX);

      if (dragging === "left") {
        // Clamp to valid range (cannot cross right thumb)
        const clampedIndex = Math.min(newIndex, range[1]);
        if (clampedIndex !== range[0]) {
          setRange([clampedIndex, range[1]]);
        }
      } else {
        // Clamp to valid range (cannot cross left thumb)
        const clampedIndex = Math.max(newIndex, range[0]);
        if (clampedIndex !== range[1]) {
          setRange([range[0], clampedIndex]);
        }
      }
    };

    const handleUp = () => {
      setDragging(null);
    };

    if (dragging) {
      window.addEventListener("pointermove", handleMove);
      window.addEventListener("pointerup", handleUp);
      // Disable text selection while dragging
      document.body.style.userSelect = "none";
      document.body.style.cursor = "grabbing";
    }

    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
  }, [dragging, range, setRange, maxIndex, getIndexFromPos]);

  // Click on track to jump closest handle
  const handleTrackClick = (e: React.MouseEvent) => {
    // Only trigger if not dragging (though click usually fires after mouseup)
    // We prevent default on pointerdown to stop some clicks, but just in case
    if (dragging) return;

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relativeX = (e.clientX - rect.left) / rect.width;
    const targetIndex = getIndexFromPos(relativeX);

    const distLeft = Math.abs(targetIndex - range[0]);
    const distRight = Math.abs(targetIndex - range[1]);

    let newRange: [number, number];
    if (distLeft < distRight) {
      newRange = [Math.min(targetIndex, range[1]), range[1]];
    } else {
      newRange = [range[0], Math.max(targetIndex, range[0])];
    }
    setRange(newRange);
  };

  const leftPercent = getPercent(range[0]);
  const rightPercent = getPercent(range[1]);

  return (
    <div className="w-full px-3 py-4 select-none touch-none">
      <div className="flex justify-between items-end mb-2 h-5">
        <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
          {values[range[0]]}
        </span>
        <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
          {values[range[1]]}
        </span>
      </div>

      <div
        ref={containerRef}
        className="relative h-6 w-full flex items-center cursor-pointer group"
        onClick={handleTrackClick}
      >
        {/* Track Background */}
        <div className="absolute left-0 right-0 h-1.5 bg-slate-200 dark:bg-slate-700/50 rounded-full group-hover:bg-slate-300 dark:group-hover:bg-slate-600/50 transition-colors" />

        {/* Active Range */}
        <div
          className="absolute h-1.5 bg-blue-500 rounded-full pointer-events-none"
          style={{
            left: `${leftPercent}%`,
            width: `${rightPercent - leftPercent}%`,
          }}
        />

        {/* Left Thumb */}
        <div
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation(); // Prevent track click
            setDragging("left");
          }}
          className={`absolute top-1/2 -translate-y-1/2 -ml-3 w-6 h-6 bg-white dark:bg-slate-200 rounded-full shadow-md border border-slate-200 hover:scale-110 focus:outline-none z-10 flex items-center justify-center cursor-grab ${dragging === "left" ? "!scale-110 !cursor-grabbing ring-2 ring-blue-500/30" : ""} transition-transform`}
          style={{ left: `${leftPercent}%` }}
          role="slider"
          aria-label="Start Year"
          aria-valuenow={range[0]}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
        </div>

        {/* Right Thumb */}
        <div
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation(); // Prevent track click
            setDragging("right");
          }}
          className={`absolute top-1/2 -translate-y-1/2 -ml-3 w-6 h-6 bg-white dark:bg-slate-200 rounded-full shadow-md border border-slate-200 hover:scale-110 focus:outline-none z-10 flex items-center justify-center cursor-grab ${dragging === "right" ? "!scale-110 !cursor-grabbing ring-2 ring-blue-500/30" : ""} transition-transform`}
          style={{ left: `${rightPercent}%` }}
          role="slider"
          aria-label="End Year"
          aria-valuenow={range[1]}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
        </div>
      </div>

      <div className="flex justify-between mt-1 opacity-50 text-[10px] text-slate-400">
        <span>{values[0]}</span>
        <span>{values[values.length - 1]}</span>
      </div>
    </div>
  );
};

const SongFilters: React.FC<SongFiltersProps> = ({
  yearRangeIndices,
  setYearRangeIndices,
  sliderYears,
  selectedLyricist,
  setSelectedLyricist,
  selectedComposer,
  setSelectedComposer,
  selectedArranger,
  setSelectedArranger,
  filterOptions,
}) => {
  // 共享样式常量
  const labelStyle =
    "text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider";

  const triggerStyle =
    "!bg-white/50 dark:!bg-slate-900/50 hover:!bg-white dark:hover:!bg-slate-900 !border !border-slate-200 dark:!border-slate-800 !rounded-lg !text-slate-600 dark:!text-slate-300 !h-10 !px-3 !mx-0 transition-all duration-200 focus:!ring-1 focus:!ring-blue-500/20";

  const optionsStyle =
    "!bg-white dark:!bg-slate-900 !border !border-slate-100 dark:!border-slate-800 !rounded-xl !shadow-2xl !p-1";

  // If no years loaded yet, use dummy
  const displayYears =
    sliderYears.length > 0 ? sliderYears : [new Date().getFullYear(), "未知"];

  return (
    <div className="w-full flex flex-col gap-4 p-1">
      {/* Top Row: Year Slider */}
      <div className="w-full bg-white/30 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/50 rounded-xl p-3">
        <div className={`${labelStyle} mb-1`}>发行年份</div>
        <YearRangeSlider
          range={yearRangeIndices}
          setRange={setYearRangeIndices}
          values={displayYears}
        />
      </div>

      {/* Bottom Row: Other Filters */}
      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Lyricist Filter */}
        <div className="flex flex-col gap-1">
          <label className={`${labelStyle} ml-1`}>作词</label>
          <CustomSelect
            value={selectedLyricist}
            onChange={setSelectedLyricist}
            placeholder="Lyricist"
            options={filterOptions.allLyricists.map((lyricist) => ({
              value: lyricist,
              label: lyricist,
            }))}
            className="flex-1 w-full min-w-0"
            triggerClassName={triggerStyle}
            optionsClassName={optionsStyle}
          />
        </div>

        {/* Composer Filter */}
        <div className="flex flex-col gap-1">
          <label className={`${labelStyle} ml-1`}>作曲</label>
          <CustomSelect
            value={selectedComposer}
            onChange={setSelectedComposer}
            placeholder="Composer"
            options={filterOptions.allComposers.map((composer) => ({
              value: composer,
              label: composer,
            }))}
            className="flex-1 w-full min-w-0"
            triggerClassName={triggerStyle}
            optionsClassName={optionsStyle}
          />
        </div>

        {/* Arranger Filter */}
        <div className="flex flex-col gap-1">
          <label className={`${labelStyle} ml-1`}>编曲</label>
          <CustomSelect
            value={selectedArranger}
            onChange={setSelectedArranger}
            placeholder="Arranger"
            options={filterOptions.allArrangers.map((arranger) => ({
              value: arranger,
              label: arranger,
            }))}
            className="flex-1 w-full min-w-0"
            triggerClassName={triggerStyle}
            optionsClassName={optionsStyle}
          />
        </div>
      </div>
    </div>
  );
};

export default SongFilters;
