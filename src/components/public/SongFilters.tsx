import React from "react";
import CustomSelect from "./CustomSelect";

interface SongFiltersProps {
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
}

const SongFilters: React.FC<SongFiltersProps> = ({
  selectedYear,
  setSelectedYear,
  selectedLyricist,
  setSelectedLyricist,
  selectedComposer,
  setSelectedComposer,
  selectedArranger,
  setSelectedArranger,
  filterOptions,
}) => {
  // Flatter design: removed shadow, transparent background in inactive state (or minimal white), clean borders
  const triggerStyle =
    "!bg-white/50 dark:!bg-slate-900/50 hover:!bg-white dark:hover:!bg-slate-900 !border !border-slate-200 dark:!border-slate-800 !rounded-lg !text-slate-600 dark:!text-slate-300 !h-10 !px-3 !mx-0 transition-all duration-200 focus:!ring-1 focus:!ring-blue-500/20";

  const optionsStyle =
    "!bg-white dark:!bg-slate-900 !border !border-slate-100 dark:!border-slate-800 !rounded-xl !shadow-2xl !p-1";

  return (
    <div className="w-full grid grid-cols-2 lg:grid-cols-4 gap-3 p-1">

      {/* Year Filter */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 ml-1 uppercase tracking-widest">
          Year
        </label>
        <CustomSelect
          value={selectedYear}
          onChange={setSelectedYear}
          placeholder="Year"
          options={filterOptions.allYears.map((year) => ({
            value: year === null ? "" : String(year),
            label: String(year),
          }))}
          className="flex-1 w-full min-w-0"
          triggerClassName={triggerStyle}
          optionsClassName={optionsStyle}
        />
      </div>

      {/* Lyricist Filter */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 ml-1 uppercase tracking-widest">
          Lyricist
        </label>
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
        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 ml-1 uppercase tracking-widest">
          Composer
        </label>
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
        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 ml-1 uppercase tracking-widest">
          Arranger
        </label>
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
  );
};

export default SongFilters;
