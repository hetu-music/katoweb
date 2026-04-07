import React from "react";
import CustomSelect from "./CustomSelect";
import { Slider } from "@/components/ui/slider";

interface SongFiltersProps {
  yearRangeIndices: [number, number];
  setYearRangeIndices: (range: [number, number]) => void;
  sliderYears: (string | number)[];
  selectedLyricist: string[];
  setSelectedLyricist: (lyricist: string[]) => void;
  selectedComposer: string[];
  setSelectedComposer: (composer: string[]) => void;
  selectedArranger: string[];
  setSelectedArranger: (arranger: string[]) => void;
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
  const maxIndex = values.length - 1;

  return (
    <div className="px-1 py-1 select-none">
      {/* Selected range labels */}
      <div className="flex justify-between mb-3">
        <span className="text-xs font-mono font-semibold text-blue-500 dark:text-blue-400">
          {values[range[0]]}
        </span>
        <span className="text-xs font-mono font-semibold text-blue-500 dark:text-blue-400">
          {values[range[1]]}
        </span>
      </div>

      <Slider
        min={0}
        max={maxIndex}
        step={1}
        value={[range[0], range[1]]}
        onValueChange={(v) => setRange([v[0], v[1]] as [number, number])}
        minStepsBetweenThumbs={0}
        aria-label="Year range"
      />

      {/* Boundary labels */}
      <div className="flex justify-between mt-2 text-[10px] text-slate-400/60 font-mono">
        <span>{values[0]}</span>
        <span>{values[maxIndex]}</span>
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
    "text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest";

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
      <div className="w-full bg-white/30 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/50 rounded-xl p-3">
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Lyricist Filter */}
          <div className="flex flex-col gap-1">
            <label className={`${labelStyle} ml-1`}>作词</label>
            <CustomSelect
              value={selectedLyricist}
              onChange={setSelectedLyricist}
              placeholder="全部作词"
              options={filterOptions.allLyricists
                .filter((l) => l !== "全部")
                .map((lyricist) => ({ value: lyricist, label: lyricist }))}
            />
          </div>

          {/* Composer Filter */}
          <div className="flex flex-col gap-1">
            <label className={`${labelStyle} ml-1`}>作曲</label>
            <CustomSelect
              value={selectedComposer}
              onChange={setSelectedComposer}
              placeholder="全部作曲"
              options={filterOptions.allComposers
                .filter((c) => c !== "全部")
                .map((composer) => ({ value: composer, label: composer }))}
            />
          </div>

          {/* Arranger Filter */}
          <div className="flex flex-col gap-1">
            <label className={`${labelStyle} ml-1`}>编曲</label>
            <CustomSelect
              value={selectedArranger}
              onChange={setSelectedArranger}
              placeholder="全部编曲"
              options={filterOptions.allArrangers
                .filter((a) => a !== "全部")
                .map((arranger) => ({ value: arranger, label: arranger }))}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SongFilters;
