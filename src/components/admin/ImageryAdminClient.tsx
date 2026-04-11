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
import type { OccurrenceWithSong } from "@/lib/service-imagery";
import type { ImageryCategory, ImageryItem, ImageryMeaning } from "@/lib/types";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Edit2,
  FolderPlus,
  Home,
  Layers,
  ListTree,
  Loader2,
  Plus,
  Search,
  Tag,
  Trash2,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import React, { useCallback, useEffect, useMemo, useState } from "react";

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

const PAGE_SIZE = 20;
const SONG_PAGE_SIZE = 10;

interface Props {
  initialCategories: ImageryCategory[];
}

type Tab = "imagery" | "categories" | "meanings" | "occurrences";

type ModalState =
  | { type: "none" }
  | { type: "add-imagery" }
  | { type: "edit-imagery"; item: ImageryItem }
  | { type: "delete-imagery"; item: ImageryItem }
  | { type: "add-category"; parentId?: number }
  | { type: "edit-category"; category: ImageryCategory }
  | { type: "delete-category"; category: ImageryCategory };

type RelationEditor =
  | { type: "none" }
  | { type: "add"; songId: number }
  | { type: "edit"; songId: number; occurrence: OccurrenceWithSong };

type SongOption = {
  id: number;
  title: string;
  album?: string | null;
};

type CategoryNode = ImageryCategory & {
  children: CategoryNode[];
};

function buildTree(categories: ImageryCategory[]): CategoryNode[] {
  const map = new Map<number, CategoryNode>();
  categories.forEach((category) => {
    map.set(category.id, { ...category, children: [] });
  });

  const roots: CategoryNode[] = [];
  map.forEach((node) => {
    if (node.parent_id) {
      const parent = map.get(node.parent_id);
      if (parent) {
        parent.children.push(node);
        return;
      }
    }
    roots.push(node);
  });

  return roots;
}

function getCategoryPath(categoryId: number, categories: ImageryCategory[]): string {
  const category = categories.find((item) => item.id === categoryId);
  if (!category) return `分类 #${categoryId}`;

  const parts = [category.name];
  let currentParentId = category.parent_id;

  while (currentParentId) {
    const parent = categories.find((item) => item.id === currentParentId);
    if (!parent) break;
    parts.unshift(parent.name);
    currentParentId = parent.parent_id;
  }

  return parts.join(" / ");
}

function parseLyricTimetag(value: string) {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error("lyric_timetag 必须是合法的 JSON 数组。");
  }

  if (!Array.isArray(parsed) || parsed.some((item) => typeof item !== "object" || item === null || Array.isArray(item))) {
    throw new Error("lyric_timetag 必须是对象数组。");
  }

  return parsed as Record<string, unknown>[];
}

function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-3 pt-4">
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="px-3 py-1.5 rounded-lg text-sm border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
      >
        上一页
      </button>
      <span className="text-sm text-slate-500">
        {currentPage} / {totalPages}
      </span>
      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="px-3 py-1.5 rounded-lg text-sm border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
      >
        下一页
      </button>
    </div>
  );
}

const CategoryTreeNode = React.memo(function CategoryTreeNode({
  node,
  depth,
  imageryCountByCategory,
  onAddChild,
  onEdit,
  onDelete,
}: {
  node: CategoryNode;
  depth: number;
  imageryCountByCategory: Map<number, number>;
  onAddChild: (parentId: number) => void;
  onEdit: (category: ImageryCategory) => void;
  onDelete: (category: ImageryCategory) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = node.children.length > 0;
  const count = imageryCountByCategory.get(node.id) ?? 0;
  const isLeaf = !hasChildren;

  return (
    <div>
      <div
        className="group flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
        style={{ paddingLeft: `${0.5 + depth * 1.25}rem` }}
      >
        <button
          type="button"
          className="w-4 h-4 flex items-center justify-center shrink-0 text-slate-400"
          onClick={() => {
            if (hasChildren) setExpanded((value) => !value);
          }}
        >
          {hasChildren ? (
            expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />
          ) : isLeaf ? (
            <span className="w-2 h-2 rounded-full bg-violet-400 dark:bg-violet-500 inline-block" />
          ) : (
            <span className="w-3 h-3 rounded-full border border-slate-300 dark:border-slate-600 inline-block" />
          )}
        </button>

        <span className="flex-1 truncate font-medium">{node.name}</span>

        {count > 0 && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 shrink-0">
            {count}
          </span>
        )}

        <div className="hidden group-hover:flex items-center gap-0.5 shrink-0 ml-1">
          {depth < 3 && (
            <button
              type="button"
              onClick={() => onAddChild(node.id)}
              className="p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-500 dark:text-blue-400"
              title="添加子分类"
            >
              <FolderPlus size={12} />
            </button>
          )}
          <button
            type="button"
            onClick={() => onEdit(node)}
            className="p-1 rounded hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
            title="编辑分类"
          >
            <Edit2 size={12} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(node)}
            className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 dark:text-red-400"
            title="删除分类"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {hasChildren && expanded && (
        <div>
          {node.children.map((child) => (
            <CategoryTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              imageryCountByCategory={imageryCountByCategory}
              onAddChild={onAddChild}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
});

function ModalBackdrop({
  onClose,
  children,
}: {
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div onClick={(event) => event.stopPropagation()}>{children}</div>
    </div>
  );
}

function ModalCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md",
        className,
      )}
    >
      {children}
    </div>
  );
}

export default function ImageryAdminClient({ initialCategories }: Props) {
  const [csrfToken, setCsrfToken] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("imagery");
  const [modal, setModal] = useState<ModalState>({ type: "none" });
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [items, setItems] = useState<ImageryItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [imagerySearchTerm, setImagerySearchTerm] = useState("");
  const [imageryPage, setImageryPage] = useState(1);
  const [imageryFormName, setImageryFormName] = useState("");

  const [categories, setCategories] = useState<ImageryCategory[]>(initialCategories);
  const [categoryPage, setCategoryPage] = useState(1);
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    parent_id: null as number | null,
    level: null as number | null,
    description: "",
  });

  const [meanings, setMeanings] = useState<ImageryMeaning[]>([]);
  const [meaningsLoading, setMeaningsLoading] = useState(false);
  const [meaningsSearchTerm, setMeaningsSearchTerm] = useState("");
  const [meaningsPage, setMeaningsPage] = useState(1);
  const [addingMeaning, setAddingMeaning] = useState(false);
  const [editingMeaningId, setEditingMeaningId] = useState<number | null>(null);
  const [meaningForm, setMeaningForm] = useState({ label: "", description: "" });
  const [meaningSubmitting, setMeaningSubmitting] = useState(false);

  const [allSongs, setAllSongs] = useState<SongOption[]>([]);
  const [songsLoading, setSongsLoading] = useState(false);
  const [songSearchTerm, setSongSearchTerm] = useState("");
  const [songsPage, setSongsPage] = useState(1);
  const [expandedSongId, setExpandedSongId] = useState<number | null>(null);
  const [relationEditor, setRelationEditor] = useState<RelationEditor>({ type: "none" });
  const [relationForm, setRelationForm] = useState({
    imagery_id: 0,
    category_id: 0,
    meaning_id: null as number | null,
    lyric_timetag: "[]",
  });
  const [occurrencesBySong, setOccurrencesBySong] = useState<Record<number, OccurrenceWithSong[]>>({});
  const [occurrenceLoadingSongId, setOccurrenceLoadingSongId] = useState<number | null>(null);
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
      showToast("error", error instanceof Error ? error.message : "加载含义失败");
    } finally {
      setMeaningsLoading(false);
    }
  }, [showToast]);

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
        showToast("error", error instanceof Error ? error.message : "加载歌曲失败");
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
          const currentCategory = categories.find((category) => category.id === currentId);
          currentId = currentCategory?.parent_id ?? null;
        }
      });
    });

    return counts;
  }, [categories, items]);

  const leafCategories = useMemo(() => {
    const parentIds = new Set(categories.map((category) => category.parent_id).filter((value): value is number => value !== null));
    return categories.filter((category) => !parentIds.has(category.id));
  }, [categories]);

  const filteredItems = useMemo(() => {
    if (!imagerySearchTerm.trim()) return items;
    const query = imagerySearchTerm.trim().toLowerCase();
    return items.filter((item) => item.name.toLowerCase().includes(query));
  }, [imagerySearchTerm, items]);

  const pagedItems = useMemo(
    () => filteredItems.slice((imageryPage - 1) * PAGE_SIZE, imageryPage * PAGE_SIZE),
    [filteredItems, imageryPage],
  );
  const imageryTotalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));

  const sortedCategories = useMemo(
    () =>
      [...categories].sort((left, right) =>
        getCategoryPath(left.id, categories).localeCompare(getCategoryPath(right.id, categories), "zh-CN"),
      ),
    [categories],
  );

  const pagedCategories = useMemo(
    () => sortedCategories.slice((categoryPage - 1) * PAGE_SIZE, categoryPage * PAGE_SIZE),
    [categoryPage, sortedCategories],
  );
  const categoryTotalPages = Math.max(1, Math.ceil(sortedCategories.length / PAGE_SIZE));

  const filteredMeanings = useMemo(() => {
    if (!meaningsSearchTerm.trim()) return meanings;
    const query = meaningsSearchTerm.trim().toLowerCase();
    return meanings.filter((meaning) =>
      `${meaning.label} ${meaning.description ?? ""}`.toLowerCase().includes(query),
    );
  }, [meanings, meaningsSearchTerm]);

  const pagedMeanings = useMemo(
    () => filteredMeanings.slice((meaningsPage - 1) * PAGE_SIZE, meaningsPage * PAGE_SIZE),
    [filteredMeanings, meaningsPage],
  );
  const meaningsTotalPages = Math.max(1, Math.ceil(filteredMeanings.length / PAGE_SIZE));

  const filteredSongs = useMemo(() => {
    if (!songSearchTerm.trim()) return allSongs;
    const query = songSearchTerm.trim().toLowerCase();
    return allSongs.filter((song) =>
      `${song.id} ${song.title} ${song.album ?? ""}`.toLowerCase().includes(query),
    );
  }, [allSongs, songSearchTerm]);

  const pagedSongs = useMemo(
    () => filteredSongs.slice((songsPage - 1) * SONG_PAGE_SIZE, songsPage * SONG_PAGE_SIZE),
    [filteredSongs, songsPage],
  );
  const songsTotalPages = Math.max(1, Math.ceil(filteredSongs.length / SONG_PAGE_SIZE));

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
    setImageryFormName("");
    setModal({ type: "add-imagery" });
  };

  const openEditImagery = (item: ImageryItem) => {
    setImageryFormName(item.name);
    setModal({ type: "edit-imagery", item });
  };

  const openDeleteImagery = (item: ImageryItem) => {
    setModal({ type: "delete-imagery", item });
  };

  const openAddCategory = (parentId?: number) => {
    const parent = typeof parentId === "number" ? categories.find((category) => category.id === parentId) : undefined;
    setCategoryForm({
      name: "",
      parent_id: parentId ?? null,
      level: parent ? (parent.level ?? 0) + 1 : 0,
      description: "",
    });
    setModal({ type: "add-category", parentId });
  };

  const openEditCategory = (category: ImageryCategory) => {
    setCategoryForm({
      name: category.name,
      parent_id: category.parent_id,
      level: category.level,
      description: category.description ?? "",
    });
    setModal({ type: "edit-category", category });
  };

  const openDeleteCategory = (category: ImageryCategory) => {
    setModal({ type: "delete-category", category });
  };

  const closeModal = () => setModal({ type: "none" });

  const handleAddImagery = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!imageryFormName.trim()) return;

    setIsSubmitting(true);
    try {
      const created = await apiCreateImagery(imageryFormName.trim(), csrfToken);
      setItems((current) => [...current, { ...created, count: 0, categoryIds: [], meaningCount: 0 }]);
      showToast("success", `意象「${created.name}」已创建`);
      closeModal();
    } catch (error) {
      showToast("error", error instanceof Error ? error.message : "创建意象失败");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditImagery = async (event: React.FormEvent) => {
    event.preventDefault();
    if (modal.type !== "edit-imagery" || !imageryFormName.trim()) return;

    setIsSubmitting(true);
    try {
      await apiUpdateImagery(modal.item.id, imageryFormName.trim(), csrfToken);
      setItems((current) =>
        current.map((item) => (item.id === modal.item.id ? { ...item, name: imageryFormName.trim() } : item)),
      );
      showToast("success", "意象已更新");
      closeModal();
    } catch (error) {
      showToast("error", error instanceof Error ? error.message : "更新意象失败");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteImagery = async () => {
    if (modal.type !== "delete-imagery") return;

    setIsSubmitting(true);
    try {
      await apiDeleteImagery(modal.item.id, csrfToken);
      setItems((current) => current.filter((item) => item.id !== modal.item.id));
      showToast("success", `意象「${modal.item.name}」已删除`);
      closeModal();
    } catch (error) {
      showToast("error", error instanceof Error ? error.message : "删除意象失败");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddCategory = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!categoryForm.name.trim()) return;

    setIsSubmitting(true);
    try {
      const created = await apiCreateImageryCategory(
        {
          name: categoryForm.name.trim(),
          parent_id: categoryForm.parent_id,
          level: categoryForm.level,
          description: categoryForm.description.trim() || null,
        },
        csrfToken,
      );
      setCategories((current) => [...current, created]);
      showToast("success", `分类「${created.name}」已创建`);
      closeModal();
    } catch (error) {
      showToast("error", error instanceof Error ? error.message : "创建分类失败");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditCategory = async (event: React.FormEvent) => {
    event.preventDefault();
    if (modal.type !== "edit-category" || !categoryForm.name.trim()) return;

    setIsSubmitting(true);
    try {
      const updated = await apiUpdateImageryCategory(
        modal.category.id,
        {
          name: categoryForm.name.trim(),
          parent_id: categoryForm.parent_id,
          level: categoryForm.level,
          description: categoryForm.description.trim() || null,
        },
        csrfToken,
      );
      setCategories((current) => current.map((category) => (category.id === updated.id ? updated : category)));
      showToast("success", "分类已更新");
      closeModal();
    } catch (error) {
      showToast("error", error instanceof Error ? error.message : "更新分类失败");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (modal.type !== "delete-category") return;

    setIsSubmitting(true);
    try {
      await apiDeleteImageryCategory(modal.category.id, csrfToken);
      setCategories((current) => current.filter((category) => category.id !== modal.category.id));
      showToast("success", `分类「${modal.category.name}」已删除`);
      closeModal();
    } catch (error) {
      showToast("error", error instanceof Error ? error.message : "删除分类失败");
    } finally {
      setIsSubmitting(false);
    }
  };

  const startAddMeaning = () => {
    setAddingMeaning(true);
    setEditingMeaningId(null);
    setMeaningForm({ label: "", description: "" });
  };

  const startEditMeaning = (meaning: ImageryMeaning) => {
    setAddingMeaning(false);
    setEditingMeaningId(meaning.id);
    setMeaningForm({ label: meaning.label, description: meaning.description ?? "" });
  };

  const resetMeaningEditor = () => {
    setAddingMeaning(false);
    setEditingMeaningId(null);
    setMeaningForm({ label: "", description: "" });
  };

  const handleCreateMeaning = async () => {
    if (!meaningForm.label.trim() || meaningSubmitting) return;

    setMeaningSubmitting(true);
    try {
      const created = await apiCreateGlobalMeaning(
        {
          label: meaningForm.label.trim(),
          description: meaningForm.description.trim() || null,
        },
        csrfToken,
      );
      setMeanings((current) => [...current, created].sort((left, right) => left.label.localeCompare(right.label, "zh-CN")));
      resetMeaningEditor();
      showToast("success", `含义「${created.label}」已创建`);
    } catch (error) {
      showToast("error", error instanceof Error ? error.message : "创建含义失败");
    } finally {
      setMeaningSubmitting(false);
    }
  };

  const handleUpdateMeaning = async () => {
    if (!editingMeaningId || !meaningForm.label.trim() || meaningSubmitting) return;

    setMeaningSubmitting(true);
    try {
      const updated = await apiUpdateGlobalMeaning(
        editingMeaningId,
        {
          label: meaningForm.label.trim(),
          description: meaningForm.description.trim() || null,
        },
        csrfToken,
      );
      setMeanings((current) =>
        current
          .map((meaning) => (meaning.id === editingMeaningId ? updated : meaning))
          .sort((left, right) => left.label.localeCompare(right.label, "zh-CN")),
      );
      resetMeaningEditor();
      showToast("success", "含义已更新");
    } catch (error) {
      showToast("error", error instanceof Error ? error.message : "更新含义失败");
    } finally {
      setMeaningSubmitting(false);
    }
  };

  const handleDeleteMeaning = async (meaningId: number) => {
    if (meaningSubmitting) return;

    setMeaningSubmitting(true);
    try {
      await apiDeleteGlobalMeaning(meaningId, csrfToken);
      setMeanings((current) => current.filter((meaning) => meaning.id !== meaningId));
      if (editingMeaningId === meaningId) resetMeaningEditor();
      showToast("success", "含义已删除");
    } catch (error) {
      showToast("error", error instanceof Error ? error.message : "删除含义失败");
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
    setRelationForm({
      imagery_id: 0,
      category_id: 0,
      meaning_id: null,
      lyric_timetag: "[]",
    });
    await loadOccurrencesForSong(songId);
  };

  const startEditRelation = (songId: number, occurrence: OccurrenceWithSong) => {
    setExpandedSongId(songId);
    setRelationEditor({ type: "edit", songId, occurrence });
    setRelationForm({
      imagery_id: occurrence.imagery_id,
      category_id: occurrence.category_id,
      meaning_id: occurrence.meaning_id,
      lyric_timetag: JSON.stringify(occurrence.lyric_timetag, null, 2),
    });
  };

  const resetRelationEditor = () => {
    setRelationEditor({ type: "none" });
    setRelationForm({
      imagery_id: 0,
      category_id: 0,
      meaning_id: null,
      lyric_timetag: "[]",
    });
  };

  const handleSaveRelation = async () => {
    if (relationEditor.type === "none" || occurrenceSubmitting) return;
    if (!relationForm.imagery_id || !relationForm.category_id) {
      showToast("error", "请先选择意象和分类。");
      return;
    }

    let lyricTimetag: Record<string, unknown>[];
    try {
      lyricTimetag = parseLyricTimetag(relationForm.lyric_timetag);
    } catch (error) {
      showToast("error", error instanceof Error ? error.message : "lyric_timetag 格式错误");
      return;
    }

    setOccurrenceSubmitting(true);
    try {
      if (relationEditor.type === "add") {
        await apiCreateOccurrence(
          {
            song_id: relationEditor.songId,
            imagery_id: relationForm.imagery_id,
            category_id: relationForm.category_id,
            meaning_id: relationForm.meaning_id,
            lyric_timetag: lyricTimetag,
          },
          csrfToken,
        );
        showToast("success", "关系已创建");
      } else {
        await apiUpdateOccurrence(
          relationEditor.occurrence.id,
          {
            imagery_id: relationForm.imagery_id,
            category_id: relationForm.category_id,
            meaning_id: relationForm.meaning_id,
            lyric_timetag: lyricTimetag,
          },
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
      showToast("error", error instanceof Error ? error.message : "保存关系失败");
    } finally {
      setOccurrenceSubmitting(false);
    }
  };

  const handleDeleteRelation = async (songId: number, occurrenceId: number) => {
    if (occurrenceSubmitting) return;

    setOccurrenceSubmitting(true);
    try {
      await apiDeleteOccurrence(occurrenceId, csrfToken);
      await Promise.all([loadOccurrencesForSong(songId), refreshImageryItems()]);
      if (relationEditor.type === "edit" && relationEditor.occurrence.id === occurrenceId) {
        resetRelationEditor();
      }
      showToast("success", "关系已删除");
    } catch (error) {
      showToast("error", error instanceof Error ? error.message : "删除关系失败");
    } finally {
      setOccurrenceSubmitting(false);
    }
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "imagery", label: "意象管理", icon: <Tag size={14} /> },
    { key: "categories", label: "分类管理", icon: <ListTree size={14} /> },
    { key: "meanings", label: "含义管理", icon: <BookOpen size={14} /> },
    { key: "occurrences", label: "关系管理", icon: <Layers size={14} /> },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0B0F19] transition-colors duration-500 font-sans">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#FAFAFA]/80 dark:bg-[#0B0F19]/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              title="返回主后台"
            >
              <ArrowLeft size={18} />
            </Link>
            <div className="text-2xl font-bold tracking-tight flex items-center gap-1 font-serif text-slate-900 dark:text-white">
              勘鉴
              <span className="w-[2px] h-5 bg-violet-600 mx-2 rounded-full translate-y-[1.5px]" />
              意象管理
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle className="p-2 rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400" />
            <Link
              href="/profile"
              className="p-2 rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400"
              title="个人中心"
            >
              <User size={20} />
            </Link>
            <Link
              href="/"
              className="p-2 rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400"
              title="返回主页"
            >
              <Home size={20} />
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-28 pb-20 max-w-7xl mx-auto px-6">
        <div className="flex gap-1 mb-8 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-1.5 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                activeTab === tab.key
                  ? "bg-violet-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800",
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "imagery" && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={imagerySearchTerm}
                    onChange={(event) => {
                      setImagerySearchTerm(event.target.value);
                      setImageryPage(1);
                    }}
                    placeholder="搜索意象名称…"
                    className="pl-8 pr-4 py-2 rounded-xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-colors"
                  />
                  {imagerySearchTerm && (
                    <button
                      type="button"
                      onClick={() => setImagerySearchTerm("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
                <span className="text-sm text-slate-400">{filteredItems.length} 个</span>
              </div>

              <button
                onClick={openAddImagery}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium shadow-sm transition-all"
              >
                <Plus size={14} />
                新增意象
              </button>
            </div>

            {itemsLoading ? (
              <div className="flex items-center justify-center py-16 text-slate-400">
                <Loader2 className="animate-spin mr-2" size={18} />
                加载中…
              </div>
            ) : itemsError ? (
              <div className="flex items-center gap-2 p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 text-sm">
                <AlertCircle size={16} />
                {itemsError}
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <Tag size={32} className="mx-auto mb-3 opacity-30" />
                <p>{imagerySearchTerm ? "没有找到匹配的意象" : "暂无意象，点击「新增意象」添加"}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pagedItems.map((item) => {
                  const categoryNames = item.categoryIds
                    .map((categoryId) => categories.find((category) => category.id === categoryId)?.name)
                    .filter((value): value is string => Boolean(value));

                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 p-3 rounded-xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 hover:border-violet-200 dark:hover:border-violet-900/40 transition-all group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center shrink-0">
                        <Tag size={13} className="text-violet-400" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-sm text-slate-900 dark:text-slate-100">{item.name}</span>
                        {categoryNames.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {categoryNames.slice(0, 3).map((name) => (
                              <span
                                key={name}
                                className="text-[10px] px-1.5 py-0.5 rounded-md bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 border border-violet-100 dark:border-violet-900/30"
                              >
                                {name}
                              </span>
                            ))}
                            {categoryNames.length > 3 && (
                              <span className="text-[10px] text-slate-400">+{categoryNames.length - 3}</span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="text-xs text-slate-400 shrink-0 font-mono">{item.count}次</div>

                      <div className="hidden group-hover:flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => openEditImagery(item)}
                          className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 transition-colors"
                          title="编辑"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => openDeleteImagery(item)}
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 dark:text-red-400 transition-colors"
                          title="删除"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}

                <PaginationControls
                  currentPage={imageryPage}
                  totalPages={imageryTotalPages}
                  onPageChange={setImageryPage}
                />
              </div>
            )}
          </div>
        )}

        {activeTab === "categories" && (
          <div className="flex gap-6 items-start">
            <aside className="w-80 shrink-0 sticky top-28">
              <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                    <ListTree size={14} />
                    分类树（默认折叠）
                  </div>
                  <button
                    onClick={() => openAddCategory()}
                    className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-blue-500 transition-colors"
                    title="新增顶级分类"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <div className="p-2 max-h-[calc(100vh-14rem)] overflow-y-auto">
                  {categoryTree.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4 px-3">暂无分类，点击 + 新增</p>
                  ) : (
                    categoryTree.map((node) => (
                      <CategoryTreeNode
                        key={node.id}
                        node={node}
                        depth={0}
                        imageryCountByCategory={imageryCountByCategory}
                        onAddChild={openAddCategory}
                        onEdit={openEditCategory}
                        onDelete={openDeleteCategory}
                      />
                    ))
                  )}
                </div>
              </div>
            </aside>

            <div className="flex-1">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">分类列表</h2>
                  <p className="text-sm text-slate-400 mt-1">{sortedCategories.length} 个分类，按路径分页展示</p>
                </div>
                <button
                  onClick={() => openAddCategory()}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium shadow-sm transition-all"
                >
                  <FolderPlus size={14} />
                  新增顶级分类
                </button>
              </div>

              <div className="space-y-2">
                {pagedCategories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-start gap-3 p-4 rounded-xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm text-slate-800 dark:text-slate-200">{category.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-400">
                          L{category.level ?? 0}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400">
                          {imageryCountByCategory.get(category.id) ?? 0} 个意象
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{getCategoryPath(category.id, categories)}</p>
                      {category.description && (
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{category.description}</p>
                      )}
                    </div>

                    <div className="hidden group-hover:flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => openEditCategory(category)}
                        className="p-1.5 rounded hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => openDeleteCategory(category)}
                        className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 dark:text-red-400"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}

                <PaginationControls
                  currentPage={categoryPage}
                  totalPages={categoryTotalPages}
                  onPageChange={setCategoryPage}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === "meanings" && (
          <div>
            <div className="flex items-center justify-between mb-5 gap-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={meaningsSearchTerm}
                    onChange={(event) => {
                      setMeaningsSearchTerm(event.target.value);
                      setMeaningsPage(1);
                    }}
                    placeholder="搜索含义名称或描述…"
                    className="pl-8 pr-4 py-2 rounded-xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-colors"
                  />
                </div>
                <span className="text-sm text-slate-400">{filteredMeanings.length} 条</span>
              </div>

              <button
                onClick={startAddMeaning}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium shadow-sm transition-all"
              >
                <Plus size={14} />
                新增含义
              </button>
            </div>

            {meaningsLoading ? (
              <div className="flex items-center gap-2 text-sm text-slate-400 py-8">
                <Loader2 className="animate-spin" size={16} />
                加载中…
              </div>
            ) : (
              <div className="space-y-2">
                {addingMeaning && (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3">
                    <input
                      type="text"
                      value={meaningForm.label}
                      onChange={(event) => setMeaningForm((current) => ({ ...current, label: event.target.value }))}
                      placeholder="含义名称"
                      autoFocus
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                    />
                    <textarea
                      value={meaningForm.description}
                      onChange={(event) => setMeaningForm((current) => ({ ...current, description: event.target.value }))}
                      placeholder="描述（可选）"
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 resize-none"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={resetMeaningEditor}
                        className="px-3 py-1.5 rounded-lg text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                      >
                        取消
                      </button>
                      <button
                        type="button"
                        onClick={handleCreateMeaning}
                        disabled={meaningSubmitting || !meaningForm.label.trim()}
                        className="px-3 py-1.5 rounded-lg text-xs bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-50 flex items-center gap-1"
                      >
                        {meaningSubmitting && <Loader2 size={11} className="animate-spin" />}
                        保存
                      </button>
                    </div>
                  </div>
                )}

                {pagedMeanings.map((meaning) =>
                  editingMeaningId === meaning.id ? (
                    <div
                      key={meaning.id}
                      className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3"
                    >
                      <input
                        type="text"
                        value={meaningForm.label}
                        onChange={(event) => setMeaningForm((current) => ({ ...current, label: event.target.value }))}
                        placeholder="含义名称"
                        autoFocus
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                      />
                      <textarea
                        value={meaningForm.description}
                        onChange={(event) => setMeaningForm((current) => ({ ...current, description: event.target.value }))}
                        placeholder="描述（可选）"
                        rows={3}
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 resize-none"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={resetMeaningEditor}
                          className="px-3 py-1.5 rounded-lg text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                        >
                          取消
                        </button>
                        <button
                          type="button"
                          onClick={handleUpdateMeaning}
                          disabled={meaningSubmitting || !meaningForm.label.trim()}
                          className="px-3 py-1.5 rounded-lg text-xs bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-50 flex items-center gap-1"
                        >
                          {meaningSubmitting && <Loader2 size={11} className="animate-spin" />}
                          保存
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      key={meaning.id}
                      className="flex items-start gap-3 p-4 rounded-xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-800 dark:text-slate-200">{meaning.label}</div>
                        {meaning.description ? (
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 whitespace-pre-wrap">
                            {meaning.description}
                          </p>
                        ) : (
                          <p className="text-xs text-slate-400 mt-1">暂无描述</p>
                        )}
                      </div>

                      <div className="hidden group-hover:flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => startEditMeaning(meaning)}
                          className="p-1 rounded hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteMeaning(meaning.id)}
                          disabled={meaningSubmitting}
                          className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 dark:text-red-400"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ),
                )}

                {!addingMeaning && pagedMeanings.length === 0 && (
                  <div className="text-center py-16 text-slate-400">
                    <BookOpen size={32} className="mx-auto mb-3 opacity-30" />
                    <p>{meaningsSearchTerm ? "没有找到匹配的含义" : "暂无含义，点击「新增含义」添加"}</p>
                  </div>
                )}

                <PaginationControls
                  currentPage={meaningsPage}
                  totalPages={meaningsTotalPages}
                  onPageChange={setMeaningsPage}
                />
              </div>
            )}
          </div>
        )}

        {activeTab === "occurrences" && (
          <div>
            <div className="flex items-center justify-between mb-5 gap-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={songSearchTerm}
                    onChange={(event) => {
                      setSongSearchTerm(event.target.value);
                      setSongsPage(1);
                    }}
                    placeholder="搜索歌曲名、专辑或 song_id…"
                    className="pl-8 pr-4 py-2 rounded-xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-colors"
                  />
                </div>
                <span className="text-sm text-slate-400">{filteredSongs.length} 首歌</span>
              </div>
              <p className="text-sm text-slate-400">按歌曲分页展示，每首歌下管理 imagery_id / category_id / meaning_id / lyric_timetag</p>
            </div>

            {songsLoading ? (
              <div className="flex items-center gap-2 text-sm text-slate-400 py-8">
                <Loader2 className="animate-spin" size={16} />
                加载歌曲中…
              </div>
            ) : (
              <div className="space-y-3">
                {pagedSongs.map((song) => {
                  const occurrences = occurrencesBySong[song.id] ?? [];
                  const isExpanded = expandedSongId === song.id;
                  const isLoadingOccurrences = occurrenceLoadingSongId === song.id;
                  const isAddingHere = relationEditor.type === "add" && relationEditor.songId === song.id;

                  return (
                    <div
                      key={song.id}
                      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 overflow-hidden"
                    >
                      <div className="px-4 py-3 flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => void toggleSongPanel(song.id)}
                          className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                        >
                          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-slate-900 dark:text-slate-100">{song.title}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                              song_id {song.id}
                            </span>
                            {song.album && (
                              <span className="text-xs text-slate-500 dark:text-slate-400">{song.album}</span>
                            )}
                            {occurrencesBySong[song.id] && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400">
                                {occurrences.length} 条关系
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => void startAddRelation(song.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-colors"
                        >
                          <Plus size={12} />
                          新增关系
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="px-4 pb-4 border-t border-slate-100 dark:border-slate-800">
                          {isLoadingOccurrences ? (
                            <div className="flex items-center gap-2 text-sm text-slate-400 py-6">
                              <Loader2 className="animate-spin" size={14} />
                              加载中…
                            </div>
                          ) : (
                            <div className="space-y-3 pt-4">
                              {isAddingHere && (
                                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3">
                                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">新增到歌曲 #{song.id}</p>

                                  <select
                                    value={relationForm.imagery_id}
                                    onChange={(event) =>
                                      setRelationForm((current) => ({
                                        ...current,
                                        imagery_id: parseInt(event.target.value, 10) || 0,
                                      }))
                                    }
                                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm"
                                  >
                                    <option value={0}>— 选择意象 —</option>
                                    {items.map((item) => (
                                      <option key={item.id} value={item.id}>
                                        {item.name}（ID: {item.id}）
                                      </option>
                                    ))}
                                  </select>

                                  <select
                                    value={relationForm.category_id}
                                    onChange={(event) =>
                                      setRelationForm((current) => ({
                                        ...current,
                                        category_id: parseInt(event.target.value, 10) || 0,
                                      }))
                                    }
                                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm"
                                  >
                                    <option value={0}>— 选择分类 —</option>
                                    {leafCategories.map((category) => (
                                      <option key={category.id} value={category.id}>
                                        {getCategoryPath(category.id, categories)}
                                      </option>
                                    ))}
                                  </select>

                                  <select
                                    value={relationForm.meaning_id ?? ""}
                                    onChange={(event) =>
                                      setRelationForm((current) => ({
                                        ...current,
                                        meaning_id: event.target.value ? parseInt(event.target.value, 10) : null,
                                      }))
                                    }
                                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm"
                                  >
                                    <option value="">— 选择含义（可选）—</option>
                                    {meanings.map((meaning) => (
                                      <option key={meaning.id} value={meaning.id}>
                                        {meaning.label}（ID: {meaning.id}）
                                      </option>
                                    ))}
                                  </select>

                                  <textarea
                                    value={relationForm.lyric_timetag}
                                    onChange={(event) =>
                                      setRelationForm((current) => ({ ...current, lyric_timetag: event.target.value }))
                                    }
                                    rows={4}
                                    placeholder='lyric_timetag JSON，如：[{"start": 12.4, "end": 14.8}]'
                                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono resize-none"
                                  />

                                  <div className="flex justify-end gap-2">
                                    <button
                                      type="button"
                                      onClick={resetRelationEditor}
                                      className="px-3 py-1.5 rounded-lg text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                                    >
                                      取消
                                    </button>
                                    <button
                                      type="button"
                                      onClick={handleSaveRelation}
                                      disabled={occurrenceSubmitting}
                                      className="px-3 py-1.5 rounded-lg text-xs bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-50 flex items-center gap-1"
                                    >
                                      {occurrenceSubmitting && <Loader2 size={11} className="animate-spin" />}
                                      保存
                                    </button>
                                  </div>
                                </div>
                              )}

                              {occurrences.map((occurrence) => {
                                const isEditingThis =
                                  relationEditor.type === "edit" && relationEditor.occurrence.id === occurrence.id;

                                return isEditingThis ? (
                                  <div
                                    key={occurrence.id}
                                    className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3"
                                  >
                                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                      编辑关系 #{occurrence.id}
                                    </p>

                                    <select
                                      value={relationForm.imagery_id}
                                      onChange={(event) =>
                                        setRelationForm((current) => ({
                                          ...current,
                                          imagery_id: parseInt(event.target.value, 10) || 0,
                                        }))
                                      }
                                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm"
                                    >
                                      <option value={0}>— 选择意象 —</option>
                                      {items.map((item) => (
                                        <option key={item.id} value={item.id}>
                                          {item.name}（ID: {item.id}）
                                        </option>
                                      ))}
                                    </select>

                                    <select
                                      value={relationForm.category_id}
                                      onChange={(event) =>
                                        setRelationForm((current) => ({
                                          ...current,
                                          category_id: parseInt(event.target.value, 10) || 0,
                                        }))
                                      }
                                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm"
                                    >
                                      <option value={0}>— 选择分类 —</option>
                                      {leafCategories.map((category) => (
                                        <option key={category.id} value={category.id}>
                                          {getCategoryPath(category.id, categories)}
                                        </option>
                                      ))}
                                    </select>

                                    <select
                                      value={relationForm.meaning_id ?? ""}
                                      onChange={(event) =>
                                        setRelationForm((current) => ({
                                          ...current,
                                          meaning_id: event.target.value ? parseInt(event.target.value, 10) : null,
                                        }))
                                      }
                                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm"
                                    >
                                      <option value="">— 选择含义（可选）—</option>
                                      {meanings.map((meaning) => (
                                        <option key={meaning.id} value={meaning.id}>
                                          {meaning.label}（ID: {meaning.id}）
                                        </option>
                                      ))}
                                    </select>

                                    <textarea
                                      value={relationForm.lyric_timetag}
                                      onChange={(event) =>
                                        setRelationForm((current) => ({ ...current, lyric_timetag: event.target.value }))
                                      }
                                      rows={4}
                                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono resize-none"
                                    />

                                    <div className="flex justify-end gap-2">
                                      <button
                                        type="button"
                                        onClick={resetRelationEditor}
                                        className="px-3 py-1.5 rounded-lg text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                                      >
                                        取消
                                      </button>
                                      <button
                                        type="button"
                                        onClick={handleSaveRelation}
                                        disabled={occurrenceSubmitting}
                                        className="px-3 py-1.5 rounded-lg text-xs bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-50 flex items-center gap-1"
                                      >
                                        {occurrenceSubmitting && <Loader2 size={11} className="animate-spin" />}
                                        保存
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div
                                    key={occurrence.id}
                                    className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 group"
                                  >
                                    <div className="flex items-start gap-3">
                                      <div className="flex-1 min-w-0 space-y-2">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className="font-medium text-slate-800 dark:text-slate-200">
                                            {occurrence.imagery_name ?? `意象 #${occurrence.imagery_id}`}
                                          </span>
                                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                            imagery_id {occurrence.imagery_id}
                                          </span>
                                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400">
                                            category_id {occurrence.category_id}
                                          </span>
                                          {occurrence.meaning_id && (
                                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
                                              meaning_id {occurrence.meaning_id}
                                            </span>
                                          )}
                                        </div>

                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                          分类：{getCategoryPath(occurrence.category_id, categories)}
                                        </p>

                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                          含义：{occurrence.meaning_label ?? "未设置"}
                                        </p>

                                        <div>
                                          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                                            lyric_timetag
                                          </div>
                                          <pre className="text-[11px] whitespace-pre-wrap rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-2 text-slate-600 dark:text-slate-300 overflow-x-auto">
                                            {JSON.stringify(occurrence.lyric_timetag, null, 2)}
                                          </pre>
                                        </div>
                                      </div>

                                      <div className="hidden group-hover:flex items-center gap-1 shrink-0">
                                        <button
                                          type="button"
                                          onClick={() => startEditRelation(song.id, occurrence)}
                                          className="p-1 rounded hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-600"
                                        >
                                          <Edit2 size={12} />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => void handleDeleteRelation(song.id, occurrence.id)}
                                          disabled={occurrenceSubmitting}
                                          className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500"
                                        >
                                          <Trash2 size={12} />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}

                              {occurrences.length === 0 && !isAddingHere && (
                                <p className="text-xs text-slate-400 text-center py-6">当前歌曲暂无关系记录</p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {!songsLoading && pagedSongs.length === 0 && (
                  <div className="text-center py-16 text-slate-400">
                    <Layers size={32} className="mx-auto mb-3 opacity-30" />
                    <p>{songSearchTerm ? "没有找到匹配的歌曲" : "暂无歌曲可用于关系管理"}</p>
                  </div>
                )}

                <PaginationControls
                  currentPage={songsPage}
                  totalPages={songsTotalPages}
                  onPageChange={setSongsPage}
                />
              </div>
            )}
          </div>
        )}
      </main>

      {modal.type === "add-imagery" && (
        <ModalBackdrop onClose={closeModal}>
          <ModalCard>
            <form onSubmit={handleAddImagery}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">新增意象</h2>
                  <button type="button" onClick={closeModal} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
                    <X size={18} />
                  </button>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5">
                    意象名称 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={imageryFormName}
                    onChange={(event) => setImageryFormName(event.target.value)}
                    placeholder="如：明月、江水、枫叶…"
                    maxLength={50}
                    required
                    autoFocus
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-300 dark:focus:border-violet-700 transition-colors"
                  />
                </div>
              </div>
              <div className="px-6 pb-6 flex justify-end gap-3">
                <button type="button" onClick={closeModal} className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  取消
                </button>
                <button type="submit" disabled={isSubmitting || !imageryFormName.trim()} className="px-5 py-2 rounded-xl text-sm font-medium bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white flex items-center gap-2 transition-colors">
                  {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                  创建
                </button>
              </div>
            </form>
          </ModalCard>
        </ModalBackdrop>
      )}

      {modal.type === "edit-imagery" && (
        <ModalBackdrop onClose={closeModal}>
          <ModalCard>
            <form onSubmit={handleEditImagery}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">编辑意象 · 「{modal.item.name}」</h2>
                  <button type="button" onClick={closeModal} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
                    <X size={18} />
                  </button>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5">
                    意象名称 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={imageryFormName}
                    onChange={(event) => setImageryFormName(event.target.value)}
                    maxLength={50}
                    required
                    autoFocus
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-300 dark:focus:border-violet-700 transition-colors"
                  />
                </div>
              </div>
              <div className="px-6 pb-6 flex justify-end gap-3">
                <button type="button" onClick={closeModal} className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  取消
                </button>
                <button type="submit" disabled={isSubmitting || !imageryFormName.trim()} className="px-5 py-2 rounded-xl text-sm font-medium bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white flex items-center gap-2 transition-colors">
                  {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                  保存
                </button>
              </div>
            </form>
          </ModalCard>
        </ModalBackdrop>
      )}

      {modal.type === "delete-imagery" && (
        <ModalBackdrop onClose={closeModal}>
          <ModalCard>
            <div className="p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                  <AlertCircle size={20} className="text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">确认删除</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    将删除意象「<strong className="text-slate-700 dark:text-slate-200">{modal.item.name}</strong>」。
                    {modal.item.count > 0 && (
                      <span className="text-red-600 dark:text-red-400 ml-1">该意象已有 {modal.item.count} 条关系记录。</span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={closeModal} className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  取消
                </button>
                <button onClick={handleDeleteImagery} disabled={isSubmitting} className="px-5 py-2 rounded-xl text-sm font-medium bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white flex items-center gap-2 transition-colors">
                  {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                  确认删除
                </button>
              </div>
            </div>
          </ModalCard>
        </ModalBackdrop>
      )}

      {(modal.type === "add-category" || modal.type === "edit-category") && (
        <ModalBackdrop onClose={closeModal}>
          <ModalCard>
            <form onSubmit={modal.type === "add-category" ? handleAddCategory : handleEditCategory}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {modal.type === "add-category" ? "新增分类" : "编辑分类"}
                  </h2>
                  <button type="button" onClick={closeModal} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
                    <X size={18} />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5">
                      分类名称 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={categoryForm.name}
                      onChange={(event) => setCategoryForm((current) => ({ ...current, name: event.target.value }))}
                      maxLength={50}
                      required
                      autoFocus
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-300 dark:focus:border-blue-700 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5">父分类</label>
                    <select
                      value={categoryForm.parent_id ?? ""}
                      onChange={(event) => {
                        const nextParentId = event.target.value ? parseInt(event.target.value, 10) : null;
                        const parent = nextParentId
                          ? categories.find((category) => category.id === nextParentId)
                          : null;
                        setCategoryForm((current) => ({
                          ...current,
                          parent_id: nextParentId,
                          level: parent ? (parent.level ?? 0) + 1 : 0,
                        }));
                      }}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-300 dark:focus:border-blue-700 transition-colors"
                    >
                      <option value="">（顶级分类）</option>
                      {categories
                        .filter((category) => (modal.type !== "edit-category" || category.id !== modal.category.id) && (category.level ?? 0) < 3)
                        .map((category) => (
                          <option key={category.id} value={category.id}>
                            {getCategoryPath(category.id, categories)}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5">描述</label>
                    <textarea
                      value={categoryForm.description}
                      onChange={(event) =>
                        setCategoryForm((current) => ({ ...current, description: event.target.value }))
                      }
                      rows={3}
                      maxLength={500}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-300 dark:focus:border-blue-700 transition-colors resize-none"
                    />
                  </div>
                </div>
              </div>
              <div className="px-6 pb-6 flex justify-end gap-3">
                <button type="button" onClick={closeModal} className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  取消
                </button>
                <button type="submit" disabled={isSubmitting || !categoryForm.name.trim()} className="px-5 py-2 rounded-xl text-sm font-medium bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white flex items-center gap-2 transition-colors">
                  {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                  保存
                </button>
              </div>
            </form>
          </ModalCard>
        </ModalBackdrop>
      )}

      {modal.type === "delete-category" && (
        <ModalBackdrop onClose={closeModal}>
          <ModalCard>
            <div className="p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                  <AlertCircle size={20} className="text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">确认删除分类</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    将删除分类「<strong className="text-slate-700 dark:text-slate-200">{modal.category.name}</strong>」。
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={closeModal} className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  取消
                </button>
                <button onClick={handleDeleteCategory} disabled={isSubmitting} className="px-5 py-2 rounded-xl text-sm font-medium bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white flex items-center gap-2 transition-colors">
                  {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                  确认删除
                </button>
              </div>
            </div>
          </ModalCard>
        </ModalBackdrop>
      )}

      {toast && (
        <div
          className={cn(
            "fixed right-6 bottom-6 z-[60] px-4 py-3 rounded-xl border shadow-lg text-sm",
            toast.type === "success"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800"
              : "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800",
          )}
        >
          {toast.text}
        </div>
      )}
    </div>
  );
}
