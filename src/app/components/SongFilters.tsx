import React from "react";

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
    <div className="w-full flex flex-col sm:flex-row gap-3">
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
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="filter-select"
        >
          {filterOptions.allTypes.map((type) => (
            <option key={type} value={type} className="filter-option">
              {type}
            </option>
          ))}
        </select>
      </div>
      {/* 发行日期筛选 */}
      <div className="filter-container">
        <span className="filter-label">发行日期</span>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="filter-select"
        >
          {filterOptions.allYears.map((year) => (
            <option
              key={year ?? ""}
              value={year === null ? "" : year}
              className="filter-option"
            >
              {year}
            </option>
          ))}
        </select>
      </div>
      {/* 作词筛选 */}
      <div className="filter-container">
        <span className="filter-label">作词</span>
        <select
          value={selectedLyricist}
          onChange={(e) => setSelectedLyricist(e.target.value)}
          className="filter-select"
        >
          {filterOptions.allLyricists.map((lyricist) => (
            <option key={lyricist} value={lyricist} className="filter-option">
              {lyricist}
            </option>
          ))}
        </select>
      </div>
      {/* 作曲筛选 */}
      <div className="filter-container">
        <span className="filter-label">作曲</span>
        <select
          value={selectedComposer}
          onChange={(e) => setSelectedComposer(e.target.value)}
          className="filter-select"
        >
          {filterOptions.allComposers.map((composer) => (
            <option key={composer} value={composer} className="filter-option">
              {composer}
            </option>
          ))}
        </select>
      </div>
      {/* 编曲筛选 */}
      <div className="filter-container">
        <span className="filter-label">编曲</span>
        <select
          value={selectedArranger}
          onChange={(e) => setSelectedArranger(e.target.value)}
          className="filter-select"
        >
          {filterOptions.allArrangers.map((arranger) => (
            <option key={arranger} value={arranger} className="filter-option">
              {arranger}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default SongFilters;
