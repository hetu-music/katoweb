"use client";

import {
  apiCreateOccurrence,
  apiDeleteOccurrence,
  apiGetOccurrencesForSong,
  apiGetSongs,
  apiUpdateOccurrence,
} from "@/lib/client-api";
import { toRelationPayload } from "@/lib/imagery-form";
import type { RelationFormValues } from "@/lib/imagery-form";
import type { OccurrenceWithSong } from "@/lib/service-imagery";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ModalState, RelationEditor, SongOption } from "./types";

const SONG_PAGE_SIZE = 10;

export function useOccurrencesTab(
  csrfToken: string,
  showToast: (type: "success" | "error", text: string) => void,
  refreshImageryItems: () => Promise<unknown>,
) {
  const [allSongs, setAllSongs] = useState<SongOption[]>([]);
  const [songsLoading, setSongsLoading] = useState(true);
  const [songSearchTerm, setSongSearchTerm] = useState("");
  const [songsPage, setSongsPage] = useState(1);
  const [expandedSongId, setExpandedSongId] = useState<number | null>(null);
  const [relationEditor, setRelationEditor] = useState<RelationEditor>({ type: "none" });
  const [occurrencesBySong, setOccurrencesBySong] = useState<
    Record<number, OccurrenceWithSong[]>
  >({});
  const [occurrenceLoadingSongId, setOccurrenceLoadingSongId] = useState<number | null>(null);
  const [occurrenceSubmitting, setOccurrenceSubmitting] = useState(false);
  const [modal, setModal] = useState<ModalState>({ type: "none" });

  useEffect(() => {
    void apiGetSongs()
      .then((songs) => setAllSongs(songs))
      .catch((error: unknown) => {
        showToast("error", error instanceof Error ? error.message : "加载歌曲失败");
      })
      .finally(() => setSongsLoading(false));
  }, [showToast]);

  const filteredSongs = useMemo(() => {
    if (!songSearchTerm.trim()) return allSongs;
    const query = songSearchTerm.trim().toLowerCase();
    return allSongs.filter((song) =>
      `${song.id} ${song.title} ${song.album ?? ""}`.toLowerCase().includes(query),
    );
  }, [allSongs, songSearchTerm]);

  const songsTotalPages = Math.max(1, Math.ceil(filteredSongs.length / SONG_PAGE_SIZE));
  const currentSongsPage = Math.min(songsPage, songsTotalPages);
  const pagedSongs = useMemo(
    () =>
      filteredSongs.slice(
        (currentSongsPage - 1) * SONG_PAGE_SIZE,
        currentSongsPage * SONG_PAGE_SIZE,
      ),
    [currentSongsPage, filteredSongs],
  );

  const loadOccurrencesForSong = useCallback(
    async (songId: number) => {
      setOccurrenceLoadingSongId(songId);
      try {
        const occurrences = await apiGetOccurrencesForSong(songId);
        setOccurrencesBySong((current) => ({ ...current, [songId]: occurrences }));
        return occurrences;
      } catch (error) {
        showToast("error", error instanceof Error ? error.message : "加载关系失败");
        return [];
      } finally {
        setOccurrenceLoadingSongId((current) => (current === songId ? null : current));
      }
    },
    [showToast],
  );

  const toggleSongPanel = async (songId: number) => {
    if (expandedSongId === songId) {
      setExpandedSongId(null);
      if (relationEditor.type !== "none" && relationEditor.songId === songId) {
        setRelationEditor({ type: "none" });
      }
      return;
    }
    setExpandedSongId(songId);
    await loadOccurrencesForSong(songId);
  };

  const startAddRelation = async (songId: number) => {
    setExpandedSongId(songId);
    setRelationEditor({ type: "add", songId });
    await loadOccurrencesForSong(songId);
  };

  const startEditRelation = (songId: number, occurrence: OccurrenceWithSong) => {
    setExpandedSongId(songId);
    setRelationEditor({ type: "edit", songId, occurrence });
  };

  const resetRelationEditor = () => setRelationEditor({ type: "none" });
  const closeModal = () => setModal({ type: "none" });

  const handleSaveRelation = async (values: RelationFormValues) => {
    if (relationEditor.type === "none" || occurrenceSubmitting) return;
    const payload = toRelationPayload(values);

    setOccurrenceSubmitting(true);
    try {
      if (relationEditor.type === "add") {
        await apiCreateOccurrence(
          { song_id: relationEditor.songId, ...payload },
          csrfToken,
        );
        showToast("success", "关系已创建");
      } else {
        await apiUpdateOccurrence(relationEditor.occurrence.id, payload, csrfToken);
        showToast("success", "关系已更新");
      }

      await Promise.all([
        loadOccurrencesForSong(relationEditor.songId),
        refreshImageryItems(),
      ]);
      resetRelationEditor();
    } catch (error) {
      showToast("error", error instanceof Error ? error.message : "保存关系失败");
    } finally {
      setOccurrenceSubmitting(false);
    }
  };

  const handleDeleteRelation = async () => {
    if (modal.type !== "delete-occurrence" || occurrenceSubmitting) return;
    setOccurrenceSubmitting(true);
    try {
      await apiDeleteOccurrence(modal.occurrenceId, csrfToken);
      await Promise.all([
        loadOccurrencesForSong(modal.songId),
        refreshImageryItems(),
      ]);
      if (
        relationEditor.type === "edit" &&
        relationEditor.occurrence.id === modal.occurrenceId
      ) {
        resetRelationEditor();
      }
      closeModal();
      showToast("success", "关系已删除");
    } catch (error) {
      showToast("error", error instanceof Error ? error.message : "删除关系失败");
    } finally {
      setOccurrenceSubmitting(false);
    }
  };

  return {
    allSongs,
    songsLoading,
    songSearchTerm,
    setSongSearchTerm,
    songsPage,
    setSongsPage,
    expandedSongId,
    relationEditor,
    occurrencesBySong,
    occurrenceLoadingSongId,
    occurrenceSubmitting,
    modal,
    setModal,
    pagedSongs,
    currentSongsPage,
    songsTotalPages,
    loadOccurrencesForSong,
    toggleSongPanel,
    startAddRelation,
    startEditRelation,
    resetRelationEditor,
    closeModal,
    handleSaveRelation,
    handleDeleteRelation,
    /** 触发删除确认 modal */
    openDeleteOccurrenceModal: (occurrenceId: number, songId: number, label: string) =>
      setModal({ type: "delete-occurrence", occurrenceId, songId, label }),
  };
}
