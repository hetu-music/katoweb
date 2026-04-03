"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useUserContext } from "@/context/UserContext";
import type { Song } from "@/lib/types";

interface FavoritesContextValue {
  /** Array of favorited song IDs */
  favorites: number[];
  /** Full Song objects for favorited songs (populated on load) */
  favoriteSongs: Song[];
  /** Toggle favorite state for a given song ID */
  toggleFavorite: (id: number) => void;
  /** Check if a song is in favorites */
  isFavorite: (id: number) => boolean;
  /** Clear all favorites */
  clearFavorites: () => Promise<void>;
  /** Whether favorites data has been loaded */
  loaded: boolean;
  /** Whether the current user is logged in */
  isLoggedIn: boolean;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
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

  // Reload favorites when user changes
  const fetchFavorites = useCallback(async () => {
    try {
      const res = await fetch("/api/public/collections");
      if (!res.ok) {
        setFavorites([]);
        setFavoriteSongs([]);
        return;
      }
      const data = await res.json();
      setFavorites(data.songIds ?? []);
      setFavoriteSongs(Array.isArray(data.songs) ? data.songs : []);
    } catch {
      // silently fail
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!userLoaded) return;

    const currentId = user?.id ?? null;

    // Skip if user hasn't changed
    if (currentId === prevUserIdRef.current) return;
    prevUserIdRef.current = currentId;

    if (!user) {
      setFavorites([]);
      setFavoriteSongs([]);
      setLoaded(true);
      return;
    }

    setLoaded(false);
    fetchFavorites();
  }, [user, userLoaded, fetchFavorites]);

  const toggleFavorite = useCallback(
    async (id: number) => {
      if (!user) return;

      // Read current state via functional update pattern to avoid stale closure
      let isCurrentlyFav = false;

      setFavorites((prev) => {
        isCurrentlyFav = prev.includes(id);
        // Optimistic update
        return isCurrentlyFav ? prev.filter((x) => x !== id) : [...prev, id];
      });

      // Also optimistically remove from favoriteSongs if unfavoriting
      // (we don't need to add song data on favorite — it'll be there on next full fetch)
      if (isCurrentlyFav) {
        setFavoriteSongs((prev) => prev.filter((s) => s.id !== id));
      }

      try {
        const csrf = await fetchCsrf();
        const res = await fetch("/api/public/collections", {
          method: isCurrentlyFav ? "DELETE" : "POST",
          headers: {
            "Content-Type": "application/json",
            "x-csrf-token": csrf,
          },
          body: JSON.stringify({ songId: id }),
        });

        if (!res.ok) {
          // Rollback
          setFavorites((prev) =>
            isCurrentlyFav ? [...prev, id] : prev.filter((x) => x !== id),
          );
          csrfRef.current = "";
          // Re-fetch to get consistent state
          fetchFavorites();
          return;
        }

        // After a successful add, re-fetch to get the full song data
        // so that the profile page shows the correct song info
        if (!isCurrentlyFav) {
          fetchFavorites();
        }
      } catch {
        // Rollback on network error
        setFavorites((prev) =>
          isCurrentlyFav ? [...prev, id] : prev.filter((x) => x !== id),
        );
      }
    },
    [user, fetchCsrf, fetchFavorites],
  );

  const isFavorite = useCallback(
    (id: number) => favorites.includes(id),
    [favorites],
  );

  const clearFavorites = useCallback(async () => {
    if (!user || favorites.length === 0) return;
    const prevFavs = favorites;
    const prevSongs = favoriteSongs;
    setFavorites([]);
    setFavoriteSongs([]);

    try {
      const csrf = await fetchCsrf();
      await Promise.all(
        prevFavs.map((id) =>
          fetch("/api/public/collections", {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              "x-csrf-token": csrf,
            },
            body: JSON.stringify({ songId: id }),
          }),
        ),
      );
    } catch {
      // Rollback
      setFavorites(prevFavs);
      setFavoriteSongs(prevSongs);
    }
  }, [user, favorites, favoriteSongs, fetchCsrf]);

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        favoriteSongs,
        toggleFavorite,
        isFavorite,
        clearFavorites,
        loaded: userLoaded && loaded,
        isLoggedIn: !!user,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites(): FavoritesContextValue {
  const ctx = useContext(FavoritesContext);
  if (!ctx) {
    throw new Error("useFavorites must be used within FavoritesProvider");
  }
  return ctx;
}
