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
    <div className="w-full flex flex-col xl:flex-row gap-3">
      {/* 类型筛选 */}
      <div className="filter-container">
        <div className="filter-label flex items-center h-full px-4 py-0 rounded-l-2xl border-r-0 bg-white/10 border border-white/20 select-none min-w-[120px] max-w-[140px] w-[120px]">
          <span>类型</span>
          <button
            type="button"
            className="ml-1 w-4 h-4 flex items-center justify-center rounded-full bg-white/10 border border-white/20 text-xs text-white/70 hover:text-white hover:bg-white/20 transition-all duration-200 cursor-pointer"
            style={{ fontSize: "13px", lineHeight: "1", padding: 0 }}
            onClick={onTypeExplanationOpen}
            aria-label="类型说明"
            tabIndex={0}
          >
            ?
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
        <span className="filter-label">发行日期</span>
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
        <span className="filter-label">作词</span>
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
        <span className="filter-label">作曲</span>
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
        <span className="filter-label">编曲</span>
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
