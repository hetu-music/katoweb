import { useState, useMemo } from "react";
import type { SongDetail } from "../lib/types";
import { mapAndSortSongs } from "../lib/utils";

export function useSongs(
  initialSongs: SongDetail[],
  initialError: string | null,
) {
  const [songs, setSongs] = useState<SongDetail[]>(initialSongs);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError);
  const [searchTerm, setSearchTerm] = useState("");

  // 过滤
  const filteredSongs = useMemo(() => {
    return songs.filter(
      (song) =>
        song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        song.album?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (song.lyricist &&
          song.lyricist.some((l) =>
            l.toLowerCase().includes(searchTerm.toLowerCase()),
          )) ||
        (song.composer &&
          song.composer.some((c) =>
            c.toLowerCase().includes(searchTerm.toLowerCase()),
          )),
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
