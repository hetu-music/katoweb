import React from "react";
import CustomSelect from "./CustomSelect";

interface SongFiltersProps {
  selectedType: string;
  setSelectedType: (type: string) => void;
  selectedYear: string;
  setSelectedYear: (year: string) => void;
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
  onTypeExplanationOpen: () => void;
}

const SongFilters: React.FC<SongFiltersProps> = ({
  selectedType,
  setSelectedType,
  selectedYear,
  setSelectedYear,
  selectedLyricist,
  setSelectedLyricist,
  selectedComposer,
  setSelectedComposer,
  selectedArranger,
  setSelectedArranger,
  filterOptions,
  onTypeExplanationOpen,
}) => {
  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {/* 类型筛选 */}
      <div className="filter-container relative group">
        <div className="filter-label">
          类型
          <button
            type="button"
            className="ml-2 w-4 h-4 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/40 text-xs text-white transition-all cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onTypeExplanationOpen();
            }}
            aria-label="类型说明"
            title="查看类型说明"
          >
            <span className="font-bold">?</span>
          </button>
        </div>
        <CustomSelect
          value={selectedType}
          onChange={setSelectedType}
          options={filterOptions.allTypes.map((type) => ({
            value: type,
            label: type,
          }))}
          className="flex-1"
        />
      </div>
      {/* 发行日期筛选 */}
      <div className="filter-container">
        <div className="filter-label">年份</div>
        <CustomSelect
          value={selectedYear}
          onChange={setSelectedYear}
          options={filterOptions.allYears.map((year) => ({
            value: year === null ? "" : String(year),
            label: String(year),
          }))}
          className="flex-1"
        />
      </div>
      {/* 作词筛选 */}
      <div className="filter-container">
        <div className="filter-label">作词</div>
        <CustomSelect
          value={selectedLyricist}
          onChange={setSelectedLyricist}
          options={filterOptions.allLyricists.map((lyricist) => ({
            value: lyricist,
            label: lyricist,
          }))}
          className="flex-1"
        />
      </div>
      {/* 作曲筛选 */}
      <div className="filter-container">
        <div className="filter-label">作曲</div>
        <CustomSelect
          value={selectedComposer}
          onChange={setSelectedComposer}
          options={filterOptions.allComposers.map((composer) => ({
            value: composer,
            label: composer,
          }))}
          className="flex-1"
        />
      </div>
      {/* 编曲筛选 */}
      <div className="filter-container">
        <div className="filter-label">编曲</div>
        <CustomSelect
          value={selectedArranger}
          onChange={setSelectedArranger}
          options={filterOptions.allArrangers.map((arranger) => ({
            value: arranger,
            label: arranger,
          }))}
          className="flex-1"
        />
      </div>
    </div>
  );
};

export default SongFilters;
