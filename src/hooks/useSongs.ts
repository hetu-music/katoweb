import { useState, useMemo } from "react";
import type { SongDetail } from "@/lib/types";
import { mapAndSortSongs, filterSongs } from "@/lib/utils";

export function useSongs(
  initialSongs: SongDetail[],
  initialError: string | null,
  initialSearchTerm: string = "",
) {
  const [songs, setSongs] = useState<SongDetail[]>(initialSongs);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError);
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);

  // 使用统一的 filterSongs 函数，只传入搜索词，其他筛选条件设为默认值
  const filteredSongs = useMemo(() => {
    return filterSongs(
      songs,
      searchTerm,
      "全部", // selectedType
      "全部", // selectedYear
      "全部", // selectedLyricist
      "全部", // selectedComposer
      "全部", // selectedArranger
    );
  }, [songs, searchTerm]);

  // 排序
  const sortedSongs = useMemo(
    () => mapAndSortSongs(filteredSongs),
    [filteredSongs],
  );

  return {
    songs,
    setSongs,
    loading,
    setLoading,
    error,
    setError,
    searchTerm,
    setSearchTerm,
    filteredSongs,
    sortedSongs,
  };
}
