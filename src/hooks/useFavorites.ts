"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useUserContext } from "@/context/UserContext";
import type { Song } from "@/lib/types";

export function useFavorites() {
  const { user, loaded: userLoaded } = useUserContext();
  const [favorites, setFavorites] = useState<number[]>([]);
  const [favoriteSongs, setFavoriteSongs] = useState<Song[]>([]);
  const [loaded, setLoaded] = useState(false);
  const csrfRef = useRef<string>("");
  const prevUserIdRef = useRef<string | null>(null);

  const fetchCsrf = useCallback(async () => {
    if (csrfRef.current) return csrfRef.current;
    const res = await fetch("/api/public/csrf-token");
    const data = await res.json();
    csrfRef.current = data.csrfToken || "";
    return csrfRef.current;
  }, []);

  // 用户变化时重新加载收藏
  useEffect(() => {
    if (!userLoaded) return;

    const currentId = user?.id ?? null;

    // 用户没变化，跳过
    if (currentId === prevUserIdRef.current) return;
    prevUserIdRef.current = currentId;

    if (!user) {
      requestAnimationFrame(() => {
        setFavorites([]);
        setFavoriteSongs([]);
        setLoaded(true);
      });
      return;
    }

    let ignore = false;
    requestAnimationFrame(() => {
      setLoaded(false);
    });

    fetch("/api/public/collections")
      .then((res) => res.ok ? res.json() : { songIds: [], songs: [] })
      .then((data) => {
        if (!ignore) {
          setFavorites(data.songIds ?? []);
          setFavoriteSongs(Array.isArray(data.songs) ? data.songs : []);
          setLoaded(true);
        }
      })
      .catch(() => {
        if (!ignore) setLoaded(true);
      });

    return () => { ignore = true; };
  }, [user, userLoaded]);

  const toggleFavorite = useCallback(
    async (id: number) => {
      if (!user) return;

      const isCurrentlyFav = favorites.includes(id);
      // 乐观更新
      setFavorites((prev) =>
        isCurrentlyFav ? prev.filter((x) => x !== id) : [...prev, id],
      );

      try {
        const csrf = await fetchCsrf();
        const res = await fetch("/api/public/collections", {
          method: isCurrentlyFav ? "DELETE" : "POST",
          headers: { "Content-Type": "application/json", "x-csrf-token": csrf },
          body: JSON.stringify({ songId: id }),
        });
        if (!res.ok) {
          // 回滚
          setFavorites((prev) =>
            isCurrentlyFav ? [...prev, id] : prev.filter((x) => x !== id),
          );
          csrfRef.current = "";
        }
      } catch {
        setFavorites((prev) =>
          isCurrentlyFav ? [...prev, id] : prev.filter((x) => x !== id),
        );
      }
    },
    [user, favorites, fetchCsrf],
  );

  const isFavorite = useCallback(
    (id: number) => favorites.includes(id),
    [favorites],
  );

  const clearFavorites = useCallback(async () => {
    if (!user || favorites.length === 0) return;
    const prev = favorites;
    setFavorites([]);
    try {
      const csrf = await fetchCsrf();
      await Promise.all(
        prev.map((id) =>
          fetch("/api/public/collections", {
            method: "DELETE",
            headers: { "Content-Type": "application/json", "x-csrf-token": csrf },
            body: JSON.stringify({ songId: id }),
          }),
        ),
      );
    } catch {
      setFavorites(prev);
    }
  }, [user, favorites, fetchCsrf]);

  return {
    favorites,
    favoriteSongs,
    toggleFavorite,
    isFavorite,
    clearFavorites,
    loaded: userLoaded && loaded,
    isLoggedIn: !!user,
  };
}
