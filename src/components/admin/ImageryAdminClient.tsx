"use client";

import ThemeToggle from "@/components/shared/ThemeToggle";
import {
  apiCreateGlobalMeaning,
  apiCreateImagery,
  apiCreateImageryCategory,
  apiCreateOccurrence,
  apiDeleteGlobalMeaning,
  apiDeleteImagery,
  apiDeleteImageryCategory,
  apiDeleteOccurrence,
  apiGetImageryItems,
  apiGetMeanings,
  apiGetOccurrencesForSong,
  apiGetSongs,
  apiUpdateGlobalMeaning,
  apiUpdateImagery,
  apiUpdateImageryCategory,
  apiUpdateOccurrence,
} from "@/lib/client-api";
import {
  type CategoryFormValues,
  type ImageryFormValues,
  type MeaningFormValues,
  type RelationFormValues,
  toCategoryPayload,
  toMeaningPayload,
  toRelationPayload,
} from "@/lib/imagery-form";
import type { OccurrenceWithSong } from "@/lib/service-imagery";
import type { ImageryCategory, ImageryItem, ImageryMeaning } from "@/lib/types";
import {
  ArrowLeft,
  BookOpen,
  Home,
  Layers,
  ListTree,
  Tag,
  User,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import CategoriesTab from "./imagery-admin/CategoriesTab";
import ImageryAdminModals from "./imagery-admin/ImageryAdminModals";
import ImageryTab from "./imagery-admin/ImageryTab";
import MeaningsTab from "./imagery-admin/MeaningsTab";
import OccurrencesTab from "./imagery-admin/OccurrencesTab";
import { cn } from "./imagery-admin/shared";
import type {
  ModalState,
  RelationEditor,
  SongOption,
  Tab,
} from "./imagery-admin/types";
import { buildTree, getCategoryPath } from "./imagery-admin/utils";
import { Search, XCircle, Plus } from "lucide-react";

const PAGE_SIZE = 20;
const SONG_PAGE_SIZE = 10;

interface Props {
  initialCategories: ImageryCategory[];
}

export default function ImageryAdminClient({ initialCategories }: Props) {
  const [csrfToken, setCsrfToken] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("imagery");
  const [modal, setModal] = useState<ModalState>({ type: "none" });
  const [toast, setToast] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [items, setItems] = useState<ImageryItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [imagerySearchTerm, setImagerySearchTerm] = useState("");
  const [imageryPage, setImageryPage] = useState(1);

  const [categories, setCategories] =
    useState<ImageryCategory[]>(initialCategories);
  const [categoryPage, setCategoryPage] = useState(1);

  const [meanings, setMeanings] = useState<ImageryMeaning[]>([]);
  const [meaningsLoading, setMeaningsLoading] = useState(false);
  const [meaningsSearchTerm, setMeaningsSearchTerm] = useState("");
  const [meaningsPage, setMeaningsPage] = useState(1);
  const [addingMeaning, setAddingMeaning] = useState(false);
  const [editingMeaningId, setEditingMeaningId] = useState<number | null>(null);
  const [meaningSubmitting, setMeaningSubmitting] = useState(false);

  const [allSongs, setAllSongs] = useState<SongOption[]>([]);
  const [songsLoading, setSongsLoading] = useState(false);
  const [songSearchTerm, setSongSearchTerm] = useState("");
  const [songsPage, setSongsPage] = useState(1);
  const [expandedSongId, setExpandedSongId] = useState<number | null>(null);
  const [relationEditor, setRelationEditor] = useState<RelationEditor>({
    type: "none",
  });
  const [occurrencesBySong, setOccurrencesBySong] = useState<
    Record<number, OccurrenceWithSong[]>
  >({});
  const [occurrenceLoadingSongId, setOccurrenceLoadingSongId] = useState<
    number | null
  >(null);
  const [occurrenceSubmitting, setOccurrenceSubmitting] = useState(false);

  const showToast = useCallback((type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const refreshImageryItems = useCallback(async () => {
    setItemsLoading(true);
    setItemsError(null);
    try {
      const nextItems = await apiGetImageryItems();
      setItems(nextItems);
    } catch (error) {
      setItemsError(error instanceof Error ? error.message : "加载意象失败");
    } finally {
      setItemsLoading(false);
    }
  }, []);

  const loadMeanings = useCallback(async () => {
    setMeaningsLoading(true);
    try {
      const nextMeanings = await apiGetMeanings();
      setMeanings(nextMeanings);
    } catch (error) {
      showToast(
        "error",
        error instanceof Error ? error.message : "加载含义失败",
      );
    } finally {
      setMeaningsLoading(false);
    }
  }, [showToast]);

  const loadOccurrencesForSong = useCallback(
    async (songId: number) => {
      setOccurrenceLoadingSongId(songId);
      try {
        const occurrences = await apiGetOccurrencesForSong(songId);
        setOccurrencesBySong((current) => ({
          ...current,
          [songId]: occurrences,
        }));
        return occurrences;
      } catch (error) {
        showToast(
          "error",
          error instanceof Error ? error.message : "加载关系失败",
        );
        return [];
      } finally {
        setOccurrenceLoadingSongId((current) =>
          current === songId ? null : current,
        );
      }
    },
    [showToast],
  );

  useEffect(() => {
    fetch("/api/public/csrf-token")
      .then((response) => response.json())
      .then((data) => setCsrfToken(data.csrfToken || ""));
  }, []);

  useEffect(() => {
    void refreshImageryItems();
    void loadMeanings();

    setSongsLoading(true);
    apiGetSongs()
      .then(setAllSongs)
      .catch((error: unknown) => {
        showToast(
          "error",
          error instanceof Error ? error.message : "加载歌曲失败",
        );
      })
      .finally(() => setSongsLoading(false));
  }, [loadMeanings, refreshImageryItems, showToast]);

  const categoryTree = useMemo(() => buildTree(categories), [categories]);

  const imageryCountByCategory = useMemo(() => {
    const counts = new Map<number, number>();
    items.forEach((item) => {
      item.categoryIds.forEach((categoryId) => {
        let currentId: number | null = categoryId;
        while (currentId) {
          counts.set(currentId, (counts.get(currentId) ?? 0) + 1);
          const currentCategory = categories.find(
            (category) => category.id === currentId,
          );
          currentId = currentCategory?.parent_id ?? null;
        }
      });
    });
    return counts;
  }, [categories, items]);

  const leafCategories = useMemo(() => {
    const parentIds = new Set(
      categories
        .map((category) => category.parent_id)
        .filter((value): value is number => value !== null),
    );
    return categories.filter((category) => !parentIds.has(category.id));
  }, [categories]);

  const filteredItems = useMemo(() => {
    if (!imagerySearchTerm.trim()) return items;
    const query = imagerySearchTerm.trim().toLowerCase();
    return items.filter((item) => item.name.toLowerCase().includes(query));
  }, [imagerySearchTerm, items]);
  const imageryTotalPages = Math.max(
    1,
    Math.ceil(filteredItems.length / PAGE_SIZE),
  );
  const pagedItems = useMemo(
    () =>
      filteredItems.slice(
        (imageryPage - 1) * PAGE_SIZE,
        imageryPage * PAGE_SIZE,
      ),
    [filteredItems, imageryPage],
  );

  const sortedCategories = useMemo(
    () =>
      [...categories].sort((left, right) =>
        getCategoryPath(left.id, categories).localeCompare(
          getCategoryPath(right.id, categories),
          "zh-CN",
        ),
      ),
    [categories],
  );
  const categoryTotalPages = Math.max(
    1,
    Math.ceil(sortedCategories.length / PAGE_SIZE),
  );
  const pagedCategories = useMemo(
    () =>
      sortedCategories.slice(
        (categoryPage - 1) * PAGE_SIZE,
        categoryPage * PAGE_SIZE,
      ),
    [categoryPage, sortedCategories],
  );

  const filteredMeanings = useMemo(() => {
    if (!meaningsSearchTerm.trim()) return meanings;
    const query = meaningsSearchTerm.trim().toLowerCase();
    return meanings.filter((meaning) =>
      `${meaning.label} ${meaning.description ?? ""}`
        .toLowerCase()
        .includes(query),
    );
  }, [meanings, meaningsSearchTerm]);
  const meaningsTotalPages = Math.max(
    1,
    Math.ceil(filteredMeanings.length / PAGE_SIZE),
  );
  const pagedMeanings = useMemo(
    () =>
      filteredMeanings.slice(
        (meaningsPage - 1) * PAGE_SIZE,
        meaningsPage * PAGE_SIZE,
      ),
    [filteredMeanings, meaningsPage],
  );

  const filteredSongs = useMemo(() => {
    if (!songSearchTerm.trim()) return allSongs;
    const query = songSearchTerm.trim().toLowerCase();
    return allSongs.filter((song) =>
      `${song.id} ${song.title} ${song.album ?? ""}`
        .toLowerCase()
        .includes(query),
    );
  }, [allSongs, songSearchTerm]);
  const songsTotalPages = Math.max(
    1,
    Math.ceil(filteredSongs.length / SONG_PAGE_SIZE),
  );
  const pagedSongs = useMemo(
    () =>
      filteredSongs.slice(
        (songsPage - 1) * SONG_PAGE_SIZE,
        songsPage * SONG_PAGE_SIZE,
      ),
    [filteredSongs, songsPage],
  );
  const editingMeaning = useMemo(
    () =>
      editingMeaningId
        ? (meanings.find((meaning) => meaning.id === editingMeaningId) ?? null)
        : null,
    [editingMeaningId, meanings],
  );

  useEffect(() => {
    setImageryPage((current) => Math.min(current, imageryTotalPages));
  }, [imageryTotalPages]);
  useEffect(() => {
    setCategoryPage((current) => Math.min(current, categoryTotalPages));
  }, [categoryTotalPages]);
  useEffect(() => {
    setMeaningsPage((current) => Math.min(current, meaningsTotalPages));
  }, [meaningsTotalPages]);
  useEffect(() => {
    setSongsPage((current) => Math.min(current, songsTotalPages));
  }, [songsTotalPages]);

  const openAddImagery = () => {
    setModal({ type: "add-imagery" });
  };
  const openEditImagery = (item: ImageryItem) =>
    setModal({ type: "edit-imagery", item });
  const openDeleteImagery = (item: ImageryItem) =>
    setModal({ type: "delete-imagery", item });

  const openAddCategory = (parentId?: number) =>
    setModal({ type: "add-category", parentId });

  const openEditCategory = (category: ImageryCategory) =>
    setModal({ type: "edit-category", category });

  const openDeleteCategory = (category: ImageryCategory) =>
    setModal({ type: "delete-category", category });
  const openDeleteMeaning = (meaning: ImageryMeaning) =>
    setModal({
      type: "delete-meaning",
      meaningId: meaning.id,
      label: meaning.label,
    });
  const openDeleteOccurrence = (
    songId: number,
    occurrence: OccurrenceWithSong,
  ) =>
    setModal({
      type: "delete-occurrence",
      songId,
      occurrenceId: occurrence.id,
      label: occurrence.imagery_name ?? `关系 #${occurrence.id}`,
    });

  const closeModal = () => setModal({ type: "none" });

  const handleAddImagery = async ({ name }: ImageryFormValues) => {
    setIsSubmitting(true);
    try {
      const created = await apiCreateImagery(name.trim(), csrfToken);
      setItems((current) => [
        ...current,
        { ...created, count: 0, categoryIds: [], meaningCount: 0 },
      ]);
      showToast("success", `意象「${created.name}」已创建`);
      closeModal();
    } catch (error) {
      showToast(
        "error",
        error instanceof Error ? error.message : "创建意象失败",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditImagery = async ({ name }: ImageryFormValues) => {
    if (modal.type !== "edit-imagery") return;
    setIsSubmitting(true);
    try {
      await apiUpdateImagery(modal.item.id, name.trim(), csrfToken);
      setItems((current) =>
        current.map((item) =>
          item.id === modal.item.id ? { ...item, name: name.trim() } : item,
        ),
      );
      showToast("success", "意象已更新");
      closeModal();
    } catch (error) {
      showToast(
        "error",
        error instanceof Error ? error.message : "更新意象失败",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteImagery = async () => {
    if (modal.type !== "delete-imagery") return;
    setIsSubmitting(true);
    try {
      await apiDeleteImagery(modal.item.id, csrfToken);
      setItems((current) =>
        current.filter((item) => item.id !== modal.item.id),
      );
      showToast("success", `意象「${modal.item.name}」已删除`);
      closeModal();
    } catch (error) {
      showToast(
        "error",
        error instanceof Error ? error.message : "删除意象失败",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddCategory = async (values: CategoryFormValues) => {
    setIsSubmitting(true);
    try {
      const created = await apiCreateImageryCategory(
        toCategoryPayload(values, categories),
        csrfToken,
      );
      setCategories((current) => [...current, created]);
      showToast("success", `分类「${created.name}」已创建`);
      closeModal();
    } catch (error) {
      showToast(
        "error",
        error instanceof Error ? error.message : "创建分类失败",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditCategory = async (values: CategoryFormValues) => {
    if (modal.type !== "edit-category") return;
    setIsSubmitting(true);
    try {
      const updated = await apiUpdateImageryCategory(
        modal.category.id,
        toCategoryPayload(values, categories),
        csrfToken,
      );
      setCategories((current) =>
        current.map((category) =>
          category.id === updated.id ? updated : category,
        ),
      );
      showToast("success", "分类已更新");
      closeModal();
    } catch (error) {
      showToast(
        "error",
        error instanceof Error ? error.message : "更新分类失败",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (modal.type !== "delete-category") return;
    setIsSubmitting(true);
    try {
      await apiDeleteImageryCategory(modal.category.id, csrfToken);
      setCategories((current) =>
        current.filter((category) => category.id !== modal.category.id),
      );
      showToast("success", `分类「${modal.category.name}」已删除`);
      closeModal();
    } catch (error) {
      showToast(
        "error",
        error instanceof Error ? error.message : "删除分类失败",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const startAddMeaning = () => {
    setAddingMeaning(true);
    setEditingMeaningId(null);
  };
  const startEditMeaning = (meaning: ImageryMeaning) => {
    setAddingMeaning(false);
    setEditingMeaningId(meaning.id);
  };
  const resetMeaningEditor = () => {
    setAddingMeaning(false);
    setEditingMeaningId(null);
  };

  const handleCreateMeaning = async (values: MeaningFormValues) => {
    if (meaningSubmitting) return;
    setMeaningSubmitting(true);
    try {
      const created = await apiCreateGlobalMeaning(
        toMeaningPayload(values),
        csrfToken,
      );
      setMeanings((current) =>
        [...current, created].sort((left, right) =>
          left.label.localeCompare(right.label, "zh-CN"),
        ),
      );
      resetMeaningEditor();
      showToast("success", `含义「${created.label}」已创建`);
    } catch (error) {
      showToast(
        "error",
        error instanceof Error ? error.message : "创建含义失败",
      );
    } finally {
      setMeaningSubmitting(false);
    }
  };

  const handleUpdateMeaning = async (values: MeaningFormValues) => {
    if (!editingMeaningId || meaningSubmitting) return;
    setMeaningSubmitting(true);
    try {
      const updated = await apiUpdateGlobalMeaning(
        editingMeaningId,
        toMeaningPayload(values),
        csrfToken,
      );
      setMeanings((current) =>
        current
          .map((meaning) =>
            meaning.id === editingMeaningId ? updated : meaning,
          )
          .sort((left, right) =>
            left.label.localeCompare(right.label, "zh-CN"),
          ),
      );
      resetMeaningEditor();
      showToast("success", "含义已更新");
    } catch (error) {
      showToast(
        "error",
        error instanceof Error ? error.message : "更新含义失败",
      );
    } finally {
      setMeaningSubmitting(false);
    }
  };

  const handleDeleteMeaning = async () => {
    if (modal.type !== "delete-meaning" || meaningSubmitting) return;
    setMeaningSubmitting(true);
    try {
      await apiDeleteGlobalMeaning(modal.meaningId, csrfToken);
      setMeanings((current) =>
        current.filter((meaning) => meaning.id !== modal.meaningId),
      );
      if (editingMeaningId === modal.meaningId) resetMeaningEditor();
      closeModal();
      showToast("success", "含义已删除");
    } catch (error) {
      showToast(
        "error",
        error instanceof Error ? error.message : "删除含义失败",
      );
    } finally {
      setMeaningSubmitting(false);
    }
  };

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

  const startEditRelation = (
    songId: number,
    occurrence: OccurrenceWithSong,
  ) => {
    setExpandedSongId(songId);
    setRelationEditor({ type: "edit", songId, occurrence });
  };

  const resetRelationEditor = () => {
    setRelationEditor({ type: "none" });
  };

  const handleSaveRelation = async (values: RelationFormValues) => {
    if (relationEditor.type === "none" || occurrenceSubmitting) return;
    const payload = toRelationPayload(values);

    setOccurrenceSubmitting(true);
    try {
      if (relationEditor.type === "add") {
        await apiCreateOccurrence(
          {
            song_id: relationEditor.songId,
            ...payload,
          },
          csrfToken,
        );
        showToast("success", "关系已创建");
      } else {
        await apiUpdateOccurrence(
          relationEditor.occurrence.id,
          payload,
          csrfToken,
        );
        showToast("success", "关系已更新");
      }

      await Promise.all([
        loadOccurrencesForSong(relationEditor.songId),
        refreshImageryItems(),
      ]);
      resetRelationEditor();
    } catch (error) {
      showToast(
        "error",
        error instanceof Error ? error.message : "保存关系失败",
      );
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
      showToast(
        "error",
        error instanceof Error ? error.message : "删除关系失败",
      );
    } finally {
      setOccurrenceSubmitting(false);
    }
  };

  const tabs: { key: Tab; label: string; icon: ReactNode; hint: string }[] = [
    {
      key: "imagery",
      label: "意象管理",
      icon: <Tag size={14} />,
      hint: "词条与概览",
    },
    {
      key: "categories",
      label: "分类管理",
      icon: <ListTree size={14} />,
      hint: "树形与分页",
    },
    {
      key: "meanings",
      label: "含义管理",
      icon: <BookOpen size={14} />,
      hint: "全局含义库",
    },
    {
      key: "occurrences",
      label: "关系管理",
      icon: <Layers size={14} />,
      hint: "按歌曲维护",
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans transition-colors duration-500 dark:bg-[#0B0F19]">
      <nav className="fixed left-0 right-0 top-0 z-50 border-b border-slate-200/50 bg-[#FAFAFA]/80 backdrop-blur-md dark:border-slate-800/50 dark:bg-[#0B0F19]/80">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
              title="返回主后台"
            >
              <ArrowLeft size={18} />
            </Link>
            <div className="flex items-center gap-1 font-serif text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              勘鉴
              <span className="mx-2 h-5 w-[2px] translate-y-[1.5px] rounded-full bg-violet-600" />
              意象管理
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle className="rounded-full p-2 text-slate-600 transition-colors hover:bg-slate-200/50 dark:text-slate-400 dark:hover:bg-slate-800" />
            <Link
              href="/profile"
              className="rounded-full p-2 text-slate-600 transition-colors hover:bg-slate-200/50 dark:text-slate-400 dark:hover:bg-slate-800"
              title="个人中心"
            >
              <User size={20} />
            </Link>
            <Link
              href="/"
              className="rounded-full p-2 text-slate-600 transition-colors hover:bg-slate-200/50 dark:text-slate-400 dark:hover:bg-slate-800"
              title="返回主页"
            >
              <Home size={20} />
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-20 max-w-7xl mx-auto px-6">
        {/* Header & Stats */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-50 mb-4">
              意象管理
            </h1>
            <div className="flex flex-wrap gap-3">
              <div className="px-3 py-1 bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 rounded-full text-sm font-medium border border-violet-100 dark:border-violet-800">
                总计意象 {items.length} 个
              </div>
              <div className="px-3 py-1 bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 rounded-full text-sm font-medium border border-amber-100 dark:border-amber-800">
                分类 {categories.length} 个
              </div>
              <div className="px-3 py-1 bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300 rounded-full text-sm font-medium border border-cyan-100 dark:border-cyan-800">
                含义 {meanings.length} 条
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {activeTab === "imagery" && (
              <button
                onClick={openAddImagery}
                className="flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-full font-medium shadow-lg shadow-violet-500/20 transition-all hover:-translate-y-0.5"
              >
                <Plus size={20} />
                <span>新增意象</span>
              </button>
            )}
            {activeTab === "categories" && (
              <button
                onClick={() => openAddCategory()}
                className="flex items-center gap-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-full font-medium shadow-lg shadow-cyan-500/20 transition-all hover:-translate-y-0.5"
              >
                <Plus size={20} />
                <span>新增顶级分类</span>
              </button>
            )}
            {activeTab === "meanings" && (
              <button
                onClick={startAddMeaning}
                className="flex items-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-full font-medium shadow-lg shadow-amber-500/20 transition-all hover:-translate-y-0.5"
              >
                <Plus size={20} />
                <span>新增含义</span>
              </button>
            )}
          </div>
        </div>

        {/* Controls Bar */}
        <div className="sticky top-20 z-40 bg-[#FAFAFA]/95 dark:bg-[#0B0F19]/95 backdrop-blur-sm py-4 mb-8 -mx-6 px-6 border-y border-transparent data-[scrolled=true]:border-slate-100">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Filter Pills */}
            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto no-scrollbar">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-sm border transition-all whitespace-nowrap flex items-center gap-1.5",
                    activeTab === tab.key
                      ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white"
                      : "bg-transparent text-slate-500 border-slate-200 dark:border-slate-800 hover:border-slate-300 hover:text-slate-900 dark:hover:text-slate-300",
                  )}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search */}
            {(activeTab === "imagery" ||
              activeTab === "meanings" ||
              activeTab === "occurrences") && (
              <div className="relative group w-full md:w-64">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={16}
                />
                <input
                  type="text"
                  placeholder={
                    activeTab === "imagery"
                      ? "搜索意象名称..."
                      : activeTab === "meanings"
                        ? "搜索含义标签或描述..."
                        : "搜索歌曲标题、专辑..."
                  }
                  value={
                    activeTab === "imagery"
                      ? imagerySearchTerm
                      : activeTab === "meanings"
                        ? meaningsSearchTerm
                        : songSearchTerm
                  }
                  onChange={(e) => {
                    const value = e.target.value;
                    if (activeTab === "imagery") {
                      setImagerySearchTerm(value);
                      setImageryPage(1);
                    } else if (activeTab === "meanings") {
                      setMeaningsSearchTerm(value);
                      setMeaningsPage(1);
                    } else if (activeTab === "occurrences") {
                      setSongSearchTerm(value);
                      setSongsPage(1);
                    }
                  }}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full py-2 pl-9 pr-8 text-sm outline-none focus:border-violet-500 transition-colors"
                />
                {((activeTab === "imagery" && imagerySearchTerm) ||
                  (activeTab === "meanings" && meaningsSearchTerm) ||
                  (activeTab === "occurrences" && songSearchTerm)) && (
                  <button
                    onClick={() => {
                      if (activeTab === "imagery") {
                        setImagerySearchTerm("");
                        setImageryPage(1);
                      } else if (activeTab === "meanings") {
                        setMeaningsSearchTerm("");
                        setMeaningsPage(1);
                      } else if (activeTab === "occurrences") {
                        setSongSearchTerm("");
                        setSongsPage(1);
                      }
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-300 hover:text-slate-500"
                  >
                    <XCircle size={14} />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4 min-h-[50vh]">
          {activeTab === "imagery" && (
            <ImageryTab
              categories={categories}
              itemsLoading={itemsLoading}
              itemsError={itemsError}
              searchTerm={imagerySearchTerm}
              pagedItems={pagedItems}
              currentPage={imageryPage}
              totalPages={imageryTotalPages}
              onPageChange={setImageryPage}
              onEdit={openEditImagery}
              onDelete={openDeleteImagery}
            />
          )}

          {activeTab === "categories" && (
            <CategoriesTab
              categoryTree={categoryTree}
              imageryCountByCategory={imageryCountByCategory}
              pagedCategories={pagedCategories}
              currentPage={categoryPage}
              totalPages={categoryTotalPages}
              getCategoryPath={(categoryId) =>
                getCategoryPath(categoryId, categories)
              }
              onPageChange={setCategoryPage}
              onAddCategory={openAddCategory}
              onEditCategory={openEditCategory}
              onDeleteCategory={openDeleteCategory}
            />
          )}

          {activeTab === "meanings" && (
            <MeaningsTab
              meaningsLoading={meaningsLoading}
              meaningsSearchTerm={meaningsSearchTerm}
              pagedMeanings={pagedMeanings}
              addingMeaning={addingMeaning}
              editingMeaning={editingMeaning}
              meaningSubmitting={meaningSubmitting}
              currentPage={meaningsPage}
              totalPages={meaningsTotalPages}
              onPageChange={setMeaningsPage}
              onStartEdit={startEditMeaning}
              onReset={resetMeaningEditor}
              onCreate={handleCreateMeaning}
              onUpdate={handleUpdateMeaning}
              onDelete={openDeleteMeaning}
            />
          )}

          {activeTab === "occurrences" && (
            <OccurrencesTab
              songSearchTerm={songSearchTerm}
              songsLoading={songsLoading}
              pagedSongs={pagedSongs}
              occurrencesBySong={occurrencesBySong}
              expandedSongId={expandedSongId}
              occurrenceLoadingSongId={occurrenceLoadingSongId}
              relationEditor={relationEditor}
              occurrenceSubmitting={occurrenceSubmitting}
              items={items}
              categories={categories}
              leafCategories={leafCategories}
              meanings={meanings}
              currentPage={songsPage}
              totalPages={songsTotalPages}
              onPageChange={setSongsPage}
              onToggleSongPanel={toggleSongPanel}
              onStartAddRelation={startAddRelation}
              onStartEditRelation={startEditRelation}
              onResetRelationEditor={resetRelationEditor}
              onSaveRelation={handleSaveRelation}
              onDeleteRelation={openDeleteOccurrence}
              getCategoryPath={getCategoryPath}
            />
          )}
        </div>
      </main>

      <ImageryAdminModals
        modal={modal}
        categories={categories}
        isSubmitting={isSubmitting}
        onClose={closeModal}
        onAddImagery={handleAddImagery}
        onEditImagery={handleEditImagery}
        onDeleteImagery={handleDeleteImagery}
        onAddCategory={handleAddCategory}
        onEditCategory={handleEditCategory}
        onDeleteCategory={handleDeleteCategory}
        onDeleteMeaning={handleDeleteMeaning}
        onDeleteOccurrence={handleDeleteRelation}
        deleteSubmitting={meaningSubmitting || occurrenceSubmitting}
        getCategoryPath={(categoryId) =>
          getCategoryPath(categoryId, categories)
        }
      />

      {toast && (
        <div
          className={cn(
            "fixed bottom-6 right-6 z-60 rounded-2xl border px-4 py-3 text-sm shadow-lg",
            toast.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300"
              : "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300",
          )}
        >
          {toast.text}
        </div>
      )}
    </div>
  );
}
