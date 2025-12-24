import { useState, useMemo } from "react";
import type { SongDetail } from "@/lib/types";
import { mapAndSortSongs, filterSongs, createFuseInstance } from "@/lib/utils-song";
import { useDebounce } from "./useDebounce";

export function useSongs(
  initialSongs: SongDetail[],
  initialError: string | null,
  initialSearchTerm: string = "",
) {
  const [songs, setSongs] = useState<SongDetail[]>(initialSongs);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError);
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);

  // 防抖处理搜索词，300ms 延迟，空字符串立即生效
  const debouncedSearchTerm = useDebounce(
    searchTerm,
    300,
    (val) => val === "",
  );

  // 缓存 Fuse 实例，只在歌曲数据变化时重新创建
  const fuseInstance = useMemo(() => {
    return createFuseInstance(songs);
  }, [songs]);

  // 使用统一的 filterSongs 函数，只传入搜索词，其他筛选条件设为默认值
  const filteredSongs = useMemo(() => {
    return filterSongs(
      songs,
      debouncedSearchTerm,
      "全部", // selectedType
      "全部", // selectedYear
      "全部", // selectedLyricist
      "全部", // selectedComposer
      "全部", // selectedArranger
      fuseInstance, // 使用缓存的 Fuse 实例
    );
  }, [songs, debouncedSearchTerm, fuseInstance]);

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
