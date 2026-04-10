"use client";

import ThemeToggle from "@/components/shared/ThemeToggle";
import { useUserContext } from "@/context/UserContext";
import {
  apiCreateImagery,
  apiCreateImageryCategory,
  apiCreateMeaning,
  apiCreateOccurrence,
  apiDeleteImagery,
  apiDeleteImageryCategory,
  apiDeleteMeaning,
  apiDeleteOccurrence,
  apiGetImageryItems,
  apiGetImageryMeanings,
  apiGetOccurrencesForImagery,
  apiGetSongs,
  apiUpdateImagery,
  apiUpdateImageryCategory,
  apiUpdateMeaning,
  apiUpdateOccurrence,
} from "@/lib/client-api";
import type { OccurrenceWithSong } from "@/lib/service-imagery";
import type { ImageryCategory, ImageryItem, ImageryMeaning } from "@/lib/types";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Edit2,
  FolderPlus,
  Home,
  Layers,
  Link2,
  ListTree,
  Loader2,
  Plus,
  Search,
  Tag,
  Trash2,
  User,
  X,
  XCircle
} from "lucide-react";
import Link from "next/link";
import React, { useCallback, useEffect, useMemo, useState } from "react";

// Suppress unused import warning for icons that may be used conditionally
void Link2;

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

const PAGE_SIZE = 20;

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  initialCategories: ImageryCategory[];
}

// ─── Category tree helpers ────────────────────────────────────────────────────

interface CategoryNode extends ImageryCategory {
  children: CategoryNode[];
}

function buildTree(categories: ImageryCategory[]): CategoryNode[] {
  const map = new Map<number, CategoryNode>();
  categories.forEach((c) => map.set(c.id, { ...c, children: [] }));
  const roots: CategoryNode[] = [];
  map.forEach((node) => {
    if (node.parent_id && map.has(node.parent_id)) {
      map.get(node.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}

function getDescendantIds(catId: number, cats: ImageryCategory[]): number[] {
  const ids: number[] = [catId];
  const children = cats.filter((c) => c.parent_id === catId);
  for (const child of children) {
    ids.push(...getDescendantIds(child.id, cats));
  }
  return ids;
}

function getCategoryPath(catId: number, cats: ImageryCategory[]): string {
  const cat = cats.find((c) => c.id === catId);
  if (!cat) return String(catId);
  const parts: string[] = [cat.name];
  let current = cat;
  while (current.parent_id) {
    const parent = cats.find((c) => c.id === current.parent_id);
    if (!parent) break;
    parts.unshift(parent.name);
    current = parent;
  }
  return parts.join(" › ");
}

// ─── CategoryTreeNode ─────────────────────────────────────────────────────────

const CategoryTreeNode = React.memo(function CategoryTreeNode({
  node,
  selectedId,
  onSelect,
  onEdit,
  onDelete,
  onAddChild,
  imageryCountByCategory,
  depth,
}: {
  node: CategoryNode;
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  onEdit: (cat: ImageryCategory) => void;
  onDelete: (cat: ImageryCategory) => void;
  onAddChild: (parentId: number) => void;
  imageryCountByCategory: Map<number, number>;
  depth: number;
}) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = node.children.length > 0;
  const isSelected = selectedId === node.id;
  const isLeaf = node.level === 3;
  const count = imageryCountByCategory.get(node.id) ?? 0;

  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-1 rounded-lg px-2 py-1.5 cursor-pointer transition-colors text-sm",
          isSelected
            ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
            : "hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300",
        )}
        style={{ paddingLeft: `${0.5 + depth * 1.25}rem` }}
        onClick={() => onSelect(isSelected ? null : node.id)}
      >
        <button
          className="w-4 h-4 flex items-center justify-center shrink-0 text-slate-400"
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) setExpanded((v) => !v);
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

        <div
          className="hidden group-hover:flex items-center gap-0.5 shrink-0 ml-1"
          onClick={(e) => e.stopPropagation()}
        >
          {!isLeaf && (
            <button
              onClick={() => onAddChild(node.id)}
              className="p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-500 dark:text-blue-400"
              title="添加子分类"
            >
              <FolderPlus size={12} />
            </button>
          )}
          <button
            onClick={() => onEdit(node)}
            className="p-1 rounded hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
            title="编辑分类"
          >
            <Edit2 size={12} />
          </button>
          <button
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
              selectedId={selectedId}
              onSelect={onSelect}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
              imageryCountByCategory={imageryCountByCategory}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
});

// ─── Modal helpers ────────────────────────────────────────────────────────────

function ModalBackdrop({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  );
}

function ModalCard({ children, className }: { children: React.ReactNode; className?: string }) {
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

// ─── Main Component ───────────────────────────────────────────────────────────

type Tab = "imagery" | "categories" | "meanings" | "occurrences";

type ModalState =
  | { type: "none" }
  | { type: "add-imagery" }
  | { type: "edit-imagery"; item: ImageryItem }
  | { type: "delete-imagery"; item: ImageryItem }
  | { type: "add-category"; parentId?: number }
  | { type: "edit-category"; category: ImageryCategory }
  | { type: "delete-category"; category: ImageryCategory };

export default function ImageryAdminClient({ initialCategories }: Props) {
  const { logout: _logout, loggingOut: _loggingOut } = useUserContext();
  const [csrfToken, setCsrfToken] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("imagery");
  const [categories, setCategories] = useState<ImageryCategory[]>(initialCategories);
  const [modal, setModal] = useState<ModalState>({ type: "none" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // ─── Tab 1: 意象管理 ─────────────────────────────────────────────────────
  const [items, setItems] = useState<ImageryItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [imageryFormName, setImageryFormName] = useState("");

  // ─── Tab 2: 分类管理 ─────────────────────────────────────────────────────
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    parent_id: null as number | null,
    level: null as number | null,
    description: "",
  });

  // ─── Tab 3: 含义管理 ─────────────────────────────────────────────────────
  const [selectedImageryForMeanings, setSelectedImageryForMeanings] = useState<ImageryItem | null>(null);
  const [meanings, setMeanings] = useState<ImageryMeaning[]>([]);
  const [meaningsLoading, setMeaningsLoading] = useState(false);
  const [meaningSearchTerm, setMeaningSearchTerm] = useState("");
  const [addingMeaning, setAddingMeaning] = useState(false);
  const [editingMeaningId, setEditingMeaningId] = useState<number | null>(null);
  const [meaningForm, setMeaningForm] = useState({ label: "", description: "" });
  const [meaningSubmitting, setMeaningSubmitting] = useState(false);

  // ─── Tab 4: 关系管理 ─────────────────────────────────────────────────────
  const [selectedImageryForOcc, setSelectedImageryForOcc] = useState<ImageryItem | null>(null);
  const [occurrences, setOccurrences] = useState<OccurrenceWithSong[]>([]);
  const [occLoading, setOccLoading] = useState(false);
  const [showAddOcc, setShowAddOcc] = useState(false);
  const [editingOccId, setEditingOccId] = useState<number | null>(null);
  const [occForm, setOccForm] = useState({ category_id: 0, meaning_id: null as number | null, lyric_timetag: "[]" });
  const [addOccForm, setAddOccForm] = useState({ imagery_id: 0, song_id: 0, category_id: 0, meaning_id: null as number | null, lyric_timetag: "[]" });
  const [occMeanings, setOccMeanings] = useState<ImageryMeaning[]>([]);
  const [occSubmitting, setOccSubmitting] = useState(false);
  const [allSongs, setAllSongs] = useState<{ id: number; title: string; album?: string | null }[]>([]);

  // ─── Init ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    fetch("/api/public/csrf-token")
      .then((r) => r.json())
      .then((d) => setCsrfToken(d.csrfToken || ""));
  }, []);

  useEffect(() => {
    apiGetSongs().then(setAllSongs).catch(console.error);
  }, []);

  useEffect(() => {
    setItemsLoading(true);
    setItemsError(null);
    apiGetImageryItems()
      .then(setItems)
      .catch((e: unknown) => setItemsError(e instanceof Error ? e.message : "加载失败"))
      .finally(() => setItemsLoading(false));
  }, []);

  // ─── Computed ─────────────────────────────────────────────────────────────

  const showToast = useCallback((type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const categoryTree = useMemo(() => buildTree(categories), [categories]);

  const imageryCountByCategory = useMemo(() => {
    const map = new Map<number, number>();
    items.forEach((item) => {
      item.categoryIds.forEach((cid) => {
        const allAncestors = [cid];
        let current = categories.find((c) => c.id === cid);
        while (current?.parent_id) {
          allAncestors.push(current.parent_id);
          current = categories.find((c) => c.id === current!.parent_id);
        }
        allAncestors.forEach((aid) => {
          map.set(aid, (map.get(aid) ?? 0) + 1);
        });
      });
    });
    return map;
  }, [items, categories]);

  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items;
    const q = searchTerm.trim().toLowerCase();
    return items.filter((item) => item.name.toLowerCase().includes(q));
  }, [items, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const pagedItems = filteredItems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // ─── Imagery handlers ─────────────────────────────────────────────────────

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

  const closeModal = () => setModal({ type: "none" });

  const handleAddImagery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageryFormName.trim()) return;
    setIsSubmitting(true);
    try {
      const created = await apiCreateImagery(imageryFormName.trim(), csrfToken);
      setItems((prev) => [...prev, { ...created, count: 0, categoryIds: [], meaningCount: 0 }]);
      showToast("success", `意象「${created.name}」已创建`);
      closeModal();
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "创建失败");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditImagery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (modal.type !== "edit-imagery" || !imageryFormName.trim()) return;
    setIsSubmitting(true);
    try {
      await apiUpdateImagery(modal.item.id, imageryFormName.trim(), csrfToken);
      setItems((prev) => prev.map((i) => i.id === modal.item.id ? { ...i, name: imageryFormName.trim() } : i));
      showToast("success", "意象已更新");
      closeModal();
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "更新失败");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteImagery = async () => {
    if (modal.type !== "delete-imagery") return;
    setIsSubmitting(true);
    try {
      await apiDeleteImagery(modal.item.id, csrfToken);
      setItems((prev) => prev.filter((i) => i.id !== modal.item.id));
      showToast("success", `意象「${modal.item.name}」已删除`);
      closeModal();
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "删除失败");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Category handlers ────────────────────────────────────────────────────

  const openAddCategory = (parentId?: number) => {
    const parent = parentId ? categories.find((c) => c.id === parentId) : undefined;
    setCategoryForm({
      name: "",
      parent_id: parentId ?? null,
      level: parent ? (parent.level ?? 0) + 1 : 0,
      description: "",
    });
    setModal({ type: "add-category", parentId });
  };

  const openEditCategory = (cat: ImageryCategory) => {
    setCategoryForm({
      name: cat.name,
      parent_id: cat.parent_id,
      level: cat.level,
      description: cat.description ?? "",
    });
    setModal({ type: "edit-category", category: cat });
  };

  const openDeleteCategory = (cat: ImageryCategory) => {
    setModal({ type: "delete-category", category: cat });
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) return;
    setIsSubmitting(true);
    try {
      const created = await apiCreateImageryCategory(
        { name: categoryForm.name.trim(), parent_id: categoryForm.parent_id, level: categoryForm.level, description: categoryForm.description || null },
        csrfToken,
      );
      setCategories((prev) => [...prev, created]);
      showToast("success", `分类「${created.name}」已创建`);
      closeModal();
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "创建失败");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (modal.type !== "edit-category" || !categoryForm.name.trim()) return;
    setIsSubmitting(true);
    try {
      const updated = await apiUpdateImageryCategory(
        modal.category.id,
        { name: categoryForm.name.trim(), parent_id: categoryForm.parent_id, level: categoryForm.level, description: categoryForm.description || null },
        csrfToken,
      );
      setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      showToast("success", "分类已更新");
      closeModal();
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "更新失败");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (modal.type !== "delete-category") return;
    setIsSubmitting(true);
    try {
      await apiDeleteImageryCategory(modal.category.id, csrfToken);
      setCategories((prev) => prev.filter((c) => c.id !== modal.category.id));
      showToast("success", `分类「${modal.category.name}」已删除`);
      closeModal();
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "删除失败");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Meanings handlers ────────────────────────────────────────────────────

  const handleSelectImageryForMeanings = (item: ImageryItem | null) => {
    setSelectedImageryForMeanings(item);
    setMeanings([]);
    setAddingMeaning(false);
    setEditingMeaningId(null);
    if (!item) return;
    setMeaningsLoading(true);
    apiGetImageryMeanings(item.id)
      .then(setMeanings)
      .catch(console.error)
      .finally(() => setMeaningsLoading(false));
  };

  const handleAddMeaning = async () => {
    if (!selectedImageryForMeanings || !meaningForm.label.trim() || meaningSubmitting) return;
    setMeaningSubmitting(true);
    try {
      const created = await apiCreateMeaning(
        selectedImageryForMeanings.id,
        { label: meaningForm.label.trim(), description: meaningForm.description.trim() || null },
        csrfToken,
      );
      setMeanings((prev) => [...prev, created]);
      setItems((prev) => prev.map((i) => i.id === selectedImageryForMeanings.id ? { ...i, meaningCount: i.meaningCount + 1 } : i));
      setMeaningForm({ label: "", description: "" });
      setAddingMeaning(false);
    } catch (e) {
      console.error(e);
    } finally {
      setMeaningSubmitting(false);
    }
  };

  const handleUpdateMeaning = async () => {
    if (!selectedImageryForMeanings || !editingMeaningId || !meaningForm.label.trim() || meaningSubmitting) return;
    setMeaningSubmitting(true);
    try {
      const updated = await apiUpdateMeaning(
        selectedImageryForMeanings.id,
        editingMeaningId,
        { label: meaningForm.label.trim(), description: meaningForm.description.trim() || null },
        csrfToken,
      );
      setMeanings((prev) => prev.map((m) => (m.id === editingMeaningId ? updated : m)));
      setEditingMeaningId(null);
      setMeaningForm({ label: "", description: "" });
    } catch (e) {
      console.error(e);
    } finally {
      setMeaningSubmitting(false);
    }
  };

  const handleDeleteMeaning = async (meaningId: number) => {
    if (!selectedImageryForMeanings || meaningSubmitting) return;
    setMeaningSubmitting(true);
    try {
      await apiDeleteMeaning(selectedImageryForMeanings.id, meaningId, csrfToken);
      setMeanings((prev) => prev.filter((m) => m.id !== meaningId));
      setItems((prev) => prev.map((i) => i.id === selectedImageryForMeanings.id ? { ...i, meaningCount: Math.max(0, i.meaningCount - 1) } : i));
      if (editingMeaningId === meaningId) { setEditingMeaningId(null); setMeaningForm({ label: "", description: "" }); }
    } catch (e) {
      console.error(e);
    } finally {
      setMeaningSubmitting(false);
    }
  };

  // ─── Occurrences handlers ─────────────────────────────────────────────────

  useEffect(() => {
    if (!addOccForm.imagery_id) { setOccMeanings([]); return; }
    apiGetImageryMeanings(addOccForm.imagery_id).then(setOccMeanings).catch(console.error);
  }, [addOccForm.imagery_id]);

  const handleSelectImageryForOcc = (item: ImageryItem | null) => {
    setSelectedImageryForOcc(item);
    setOccurrences([]);
    setShowAddOcc(false);
    setEditingOccId(null);
    if (!item) return;
    setOccLoading(true);
    apiGetOccurrencesForImagery(item.id)
      .then(setOccurrences)
      .catch(console.error)
      .finally(() => setOccLoading(false));
  };

  const handleAddOcc = async () => {
    if (!selectedImageryForOcc || !addOccForm.song_id || !addOccForm.imagery_id || !addOccForm.category_id || occSubmitting) return;
    setOccSubmitting(true);
    try {
      let timetag: Record<string, unknown>[] = [];
      try { timetag = JSON.parse(addOccForm.lyric_timetag); } catch { timetag = []; }
      const created = await apiCreateOccurrence({
        song_id: addOccForm.song_id,
        imagery_id: addOccForm.imagery_id,
        category_id: addOccForm.category_id,
        meaning_id: addOccForm.meaning_id,
        lyric_timetag: timetag,
      }, csrfToken);
      setOccurrences((prev) => [...prev, created]);
      setShowAddOcc(false);
      setAddOccForm({ imagery_id: selectedImageryForOcc.id, song_id: 0, category_id: 0, meaning_id: null, lyric_timetag: "[]" });
    } catch (e) { console.error(e); } finally { setOccSubmitting(false); }
  };

  const handleUpdateOcc = async () => {
    if (!editingOccId || occSubmitting) return;
    setOccSubmitting(true);
    try {
      let timetag: Record<string, unknown>[] = [];
      try { timetag = JSON.parse(occForm.lyric_timetag); } catch { timetag = []; }
      const updated = await apiUpdateOccurrence(editingOccId, {
        category_id: occForm.category_id || undefined,
        meaning_id: occForm.meaning_id,
        lyric_timetag: timetag,
      }, csrfToken);
      setOccurrences((prev) => prev.map((o) => o.id === editingOccId ? updated : o));
      setEditingOccId(null);
      setOccForm({ category_id: 0, meaning_id: null, lyric_timetag: "[]" });
    } catch (e) { console.error(e); } finally { setOccSubmitting(false); }
  };

  const handleDeleteOcc = async (occId: number) => {
    if (occSubmitting) return;
    setOccSubmitting(true);
    try {
      await apiDeleteOccurrence(occId, csrfToken);
      setOccurrences((prev) => prev.filter((o) => o.id !== occId));
    } catch (e) { console.error(e); } finally { setOccSubmitting(false); }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "imagery", label: "意象管理", icon: <Tag size={14} /> },
    { key: "categories", label: "分类管理", icon: <ListTree size={14} /> },
    { key: "meanings", label: "含义管理", icon: <BookOpen size={14} /> },
    { key: "occurrences", label: "关系管理", icon: <Layers size={14} /> },
  ];

  const filteredMeaningsItems = useMemo(() => {
    if (!meaningSearchTerm.trim()) return items;
    const q = meaningSearchTerm.trim().toLowerCase();
    return items.filter((i) => i.name.toLowerCase().includes(q));
  }, [items, meaningSearchTerm]);

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0B0F19] transition-colors duration-500 font-sans">
      {/* Navbar */}
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
        {/* Tab Navigation */}
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

        {/* ─── Tab 1: 意象管理 ─────────────────────────────────────────────── */}
        {activeTab === "imagery" && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    placeholder="搜索意象名称…"
                    className="pl-8 pr-4 py-2 rounded-xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-colors"
                  />
                  {searchTerm && (
                    <button onClick={() => setSearchTerm("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
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
                <Loader2 className="animate-spin mr-2" size={18} />加载中…
              </div>
            ) : itemsError ? (
              <div className="flex items-center gap-2 p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 text-sm">
                <AlertCircle size={16} />{itemsError}
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <Tag size={32} className="mx-auto mb-3 opacity-30" />
                <p>{searchTerm ? "没有找到匹配的意象" : "暂无意象，点击「新增意象」添加"}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pagedItems.map((item) => {
                  const catNames = item.categoryIds
                    .map((id) => categories.find((c) => c.id === id)?.name)
                    .filter(Boolean) as string[];
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
                        {catNames.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {catNames.slice(0, 3).map((name) => (
                              <span key={name} className="text-[10px] px-1.5 py-0.5 rounded-md bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 border border-violet-100 dark:border-violet-900/30">
                                {name}
                              </span>
                            ))}
                            {catNames.length > 3 && <span className="text-[10px] text-slate-400">+{catNames.length - 3}</span>}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400 shrink-0">
                        <span className="font-mono">{item.count}次</span>
                        {item.meaningCount > 0 && (
                          <span className="flex items-center gap-1">
                            <BookOpen size={10} />{item.meaningCount}
                          </span>
                        )}
                      </div>
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

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-3 pt-4">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 rounded-lg text-sm border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
                    >
                      上一页
                    </button>
                    <span className="text-sm text-slate-500">{currentPage} / {totalPages}</span>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 rounded-lg text-sm border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
                    >
                      下一页
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ─── Tab 2: 分类管理 ─────────────────────────────────────────────── */}
        {activeTab === "categories" && (
          <div className="flex gap-6">
            <aside className="w-72 shrink-0">
              <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                    <ListTree size={14} />
                    分类树
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
                        selectedId={null}
                        onSelect={() => { }}
                        onEdit={openEditCategory}
                        onDelete={openDeleteCategory}
                        onAddChild={openAddCategory}
                        imageryCountByCategory={imageryCountByCategory}
                        depth={0}
                      />
                    ))
                  )}
                </div>
              </div>
            </aside>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-4">
                <button
                  onClick={() => openAddCategory()}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium shadow-sm transition-all"
                >
                  <FolderPlus size={14} />
                  新增顶级分类
                </button>
                <span className="text-sm text-slate-400">{categories.length} 个分类</span>
              </div>
              <div className="space-y-2">
                {categories.map((cat) => (
                  <div key={cat.id} className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 group">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-slate-800 dark:text-slate-200">{cat.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-400">L{cat.level ?? 0}</span>
                      </div>
                      {cat.description && <p className="text-xs text-slate-400 mt-0.5 truncate">{cat.description}</p>}
                    </div>
                    <div className="hidden group-hover:flex items-center gap-1 shrink-0">
                      <button onClick={() => openEditCategory(cat)} className="p-1.5 rounded hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                        <Edit2 size={13} />
                      </button>
                      <button onClick={() => openDeleteCategory(cat)} className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 dark:text-red-400">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── Tab 3: 含义管理 ─────────────────────────────────────────────── */}
        {activeTab === "meanings" && (
          <div>
            <div className="mb-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="relative flex-1 max-w-xs">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={meaningSearchTerm}
                    onChange={(e) => setMeaningSearchTerm(e.target.value)}
                    placeholder="搜索意象…"
                    className="w-full pl-8 pr-4 py-2 rounded-xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-colors"
                  />
                </div>
                <select
                  value={selectedImageryForMeanings?.id ?? ""}
                  onChange={(e) => {
                    const item = items.find((i) => i.id === parseInt(e.target.value));
                    handleSelectImageryForMeanings(item ?? null);
                  }}
                  className="px-4 py-2 rounded-xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-colors"
                >
                  <option value="">— 选择意象 —</option>
                  {filteredMeaningsItems.map((item) => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {selectedImageryForMeanings ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <BookOpen size={14} className="text-violet-500" />
                    {selectedImageryForMeanings.name} 的含义
                  </h3>
                  <button
                    onClick={() => { setAddingMeaning(true); setEditingMeaningId(null); setMeaningForm({ label: "", description: "" }); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-colors"
                  >
                    <Plus size={12} />新增含义
                  </button>
                </div>

                {meaningsLoading ? (
                  <div className="flex items-center gap-2 text-sm text-slate-400 py-4">
                    <Loader2 className="animate-spin" size={14} />加载中…
                  </div>
                ) : (
                  <div className="space-y-2">
                    {meanings.map((m) =>
                      editingMeaningId === m.id ? (
                        <div key={m.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
                          <input
                            type="text"
                            value={meaningForm.label}
                            onChange={(e) => setMeaningForm((f) => ({ ...f, label: e.target.value }))}
                            placeholder="含义标签"
                            autoFocus
                            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                          />
                          <textarea
                            value={meaningForm.description}
                            onChange={(e) => setMeaningForm((f) => ({ ...f, description: e.target.value }))}
                            placeholder="描述（可选）"
                            rows={2}
                            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 resize-none"
                          />
                          <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setEditingMeaningId(null)} className="px-3 py-1.5 rounded-lg text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700">取消</button>
                            <button type="button" onClick={handleUpdateMeaning} disabled={meaningSubmitting || !meaningForm.label.trim()} className="px-3 py-1.5 rounded-lg text-xs bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-50 flex items-center gap-1">
                              {meaningSubmitting && <Loader2 size={11} className="animate-spin" />}保存
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div key={m.id} className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 group/meaning">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-slate-800 dark:text-slate-200">{m.label}</div>
                            {m.description && <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{m.description}</div>}
                          </div>
                          <div className="hidden group-hover/meaning:flex items-center gap-1 shrink-0">
                            <button type="button" onClick={() => { setEditingMeaningId(m.id); setAddingMeaning(false); setMeaningForm({ label: m.label, description: m.description ?? "" }); }} className="p-1 rounded hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                              <Edit2 size={12} />
                            </button>
                            <button type="button" onClick={() => handleDeleteMeaning(m.id)} disabled={meaningSubmitting} className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 dark:text-red-400">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      )
                    )}
                    {meanings.length === 0 && !addingMeaning && (
                      <p className="text-xs text-slate-400 text-center py-3">暂无含义，点击「新增含义」添加</p>
                    )}
                    {addingMeaning && (
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
                        <input
                          type="text"
                          value={meaningForm.label}
                          onChange={(e) => setMeaningForm((f) => ({ ...f, label: e.target.value }))}
                          placeholder="含义标签，如：思乡、爱情…"
                          autoFocus
                          className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                        />
                        <textarea
                          value={meaningForm.description}
                          onChange={(e) => setMeaningForm((f) => ({ ...f, description: e.target.value }))}
                          placeholder="含义描述（可选）"
                          rows={2}
                          className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 resize-none"
                        />
                        <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => setAddingMeaning(false)} className="px-3 py-1.5 rounded-lg text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700">取消</button>
                          <button type="button" onClick={handleAddMeaning} disabled={meaningSubmitting || !meaningForm.label.trim()} className="px-3 py-1.5 rounded-lg text-xs bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-50 flex items-center gap-1">
                            {meaningSubmitting && <Loader2 size={11} className="animate-spin" />}确认
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-16 text-slate-400">
                <BookOpen size={32} className="mx-auto mb-3 opacity-30" />
                <p>请先选择一个意象以管理其含义</p>
              </div>
            )}
          </div>
        )}

        {/* ─── Tab 4: 关系管理 ─────────────────────────────────────────────── */}
        {activeTab === "occurrences" && (
          <div>
            <div className="flex items-center gap-3 mb-5">
              <select
                value={selectedImageryForOcc?.id ?? ""}
                onChange={(e) => {
                  const item = items.find((i) => i.id === parseInt(e.target.value));
                  handleSelectImageryForOcc(item ?? null);
                  if (item) setAddOccForm((f) => ({ ...f, imagery_id: item.id }));
                }}
                className="px-4 py-2 rounded-xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-colors"
              >
                <option value="">— 选择意象 —</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
              {selectedImageryForOcc && (
                <button
                  onClick={() => { setShowAddOcc(true); setEditingOccId(null); setAddOccForm({ imagery_id: selectedImageryForOcc.id, song_id: 0, category_id: 0, meaning_id: null, lyric_timetag: "[]" }); }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-colors"
                >
                  <Plus size={14} />新增关系
                </button>
              )}
            </div>

            {selectedImageryForOcc ? (
              occLoading ? (
                <div className="flex items-center gap-2 text-sm text-slate-400 py-8">
                  <Loader2 className="animate-spin" size={16} />加载中…
                </div>
              ) : (
                <div className="space-y-2">
                  {showAddOcc && (
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2 mb-3">
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">新增关系</p>
                      <select
                        value={addOccForm.song_id}
                        onChange={(e) => setAddOccForm((f) => ({ ...f, song_id: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm"
                      >
                        <option value={0}>— 选择歌曲 —</option>
                        {allSongs.map((s) => (
                          <option key={s.id} value={s.id}>{s.title}{s.album ? ` · ${s.album}` : ""}</option>
                        ))}
                      </select>
                      <select
                        value={addOccForm.category_id}
                        onChange={(e) => setAddOccForm((f) => ({ ...f, category_id: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm"
                      >
                        <option value={0}>— 选择分类 —</option>
                        {categories.filter((c) => c.level === 3).map((c) => (
                          <option key={c.id} value={c.id}>{getCategoryPath(c.id, categories)}</option>
                        ))}
                      </select>
                      <select
                        value={addOccForm.meaning_id ?? ""}
                        onChange={(e) => setAddOccForm((f) => ({ ...f, meaning_id: e.target.value ? parseInt(e.target.value) : null }))}
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm"
                      >
                        <option value="">— 含义（可选）—</option>
                        {occMeanings.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
                      </select>
                      <textarea
                        value={addOccForm.lyric_timetag}
                        onChange={(e) => setAddOccForm((f) => ({ ...f, lyric_timetag: e.target.value }))}
                        rows={2}
                        placeholder="lyric_timetag JSON，如：[]"
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono resize-none"
                      />
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setShowAddOcc(false)} className="px-3 py-1.5 rounded-lg text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700">取消</button>
                        <button type="button" onClick={handleAddOcc} disabled={occSubmitting || !addOccForm.song_id || !addOccForm.category_id} className="px-3 py-1.5 rounded-lg text-xs bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-50 flex items-center gap-1">
                          {occSubmitting && <Loader2 size={11} className="animate-spin" />}确认添加
                        </button>
                      </div>
                    </div>
                  )}

                  {occurrences.map((occ) =>
                    editingOccId === occ.id ? (
                      <div key={occ.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
                        <select
                          value={occForm.category_id}
                          onChange={(e) => setOccForm((f) => ({ ...f, category_id: parseInt(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm"
                        >
                          <option value={0}>— 选择分类 —</option>
                          {categories.filter((c) => c.level === 3).map((c) => (
                            <option key={c.id} value={c.id}>{getCategoryPath(c.id, categories)}</option>
                          ))}
                        </select>
                        <select
                          value={occForm.meaning_id ?? ""}
                          onChange={(e) => setOccForm((f) => ({ ...f, meaning_id: e.target.value ? parseInt(e.target.value) : null }))}
                          className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm"
                        >
                          <option value="">— 含义（可选）—</option>
                          {occMeanings.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
                        </select>
                        <textarea
                          value={occForm.lyric_timetag}
                          onChange={(e) => setOccForm((f) => ({ ...f, lyric_timetag: e.target.value }))}
                          rows={2}
                          placeholder="lyric_timetag JSON"
                          className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono resize-none"
                        />
                        <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => setEditingOccId(null)} className="px-3 py-1.5 rounded-lg text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700">取消</button>
                          <button type="button" onClick={handleUpdateOcc} disabled={occSubmitting} className="px-3 py-1.5 rounded-lg text-xs bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-50 flex items-center gap-1">
                            {occSubmitting && <Loader2 size={11} className="animate-spin" />}保存
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div key={occ.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 group">
                        <div className="flex-1 min-w-0 text-sm">
                          <span className="font-medium text-slate-800 dark:text-slate-200">{occ.song_title || `Song ID:${occ.song_id}`}</span>
                          {occ.song_album && <span className="ml-2 text-xs text-slate-400">{occ.song_album}</span>}
                          {occ.category_name && (
                            <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 border border-violet-100 dark:border-violet-800">
                              {occ.category_name}
                            </span>
                          )}
                          {occ.meaning_label && <span className="ml-1 text-xs text-slate-500 dark:text-slate-400">· {occ.meaning_label}</span>}
                        </div>
                        <div className="hidden group-hover:flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingOccId(occ.id);
                              setShowAddOcc(false);
                              setOccForm({ category_id: occ.category_id, meaning_id: occ.meaning_id, lyric_timetag: JSON.stringify(occ.lyric_timetag, null, 2) });
                              apiGetImageryMeanings(occ.imagery_id).then(setOccMeanings).catch(console.error);
                            }}
                            className="p-1 rounded hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-600"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteOcc(occ.id)}
                            disabled={occSubmitting}
                            className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                    )
                  )}
                  {occurrences.length === 0 && !showAddOcc && (
                    <p className="text-xs text-slate-400 text-center py-8">暂无关系记录，点击「新增关系」添加</p>
                  )}
                </div>
              )
            ) : (
              <div className="text-center py-16 text-slate-400">
                <Layers size={32} className="mx-auto mb-3 opacity-30" />
                <p>请先选择一个意象以管理其关系</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ─── Modals ─────────────────────────────────────────────────────────── */}

      {/* Add Imagery */}
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
                    onChange={(e) => setImageryFormName(e.target.value)}
                    placeholder="如：明月、江水、枫叶…"
                    maxLength={50}
                    required
                    autoFocus
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-300 dark:focus:border-violet-700 transition-colors"
                  />
                </div>
              </div>
              <div className="px-6 pb-6 flex justify-end gap-3">
                <button type="button" onClick={closeModal} className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">取消</button>
                <button type="submit" disabled={isSubmitting || !imageryFormName.trim()} className="px-5 py-2 rounded-xl text-sm font-medium bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white flex items-center gap-2 transition-colors">
                  {isSubmitting && <Loader2 size={14} className="animate-spin" />}创建
                </button>
              </div>
            </form>
          </ModalCard>
        </ModalBackdrop>
      )}

      {/* Edit Imagery */}
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
                    onChange={(e) => setImageryFormName(e.target.value)}
                    maxLength={50}
                    required
                    autoFocus
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-300 dark:focus:border-violet-700 transition-colors"
                  />
                </div>
              </div>
              <div className="px-6 pb-6 flex justify-end gap-3">
                <button type="button" onClick={closeModal} className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">取消</button>
                <button type="submit" disabled={isSubmitting || !imageryFormName.trim()} className="px-5 py-2 rounded-xl text-sm font-medium bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white flex items-center gap-2 transition-colors">
                  {isSubmitting && <Loader2 size={14} className="animate-spin" />}保存
                </button>
              </div>
            </form>
          </ModalCard>
        </ModalBackdrop>
      )}

      {/* Delete Imagery */}
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
                      <span className="text-red-600 dark:text-red-400 ml-1">该意象有 {modal.item.count} 条出现记录，删除后相关记录也将受影响。</span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={closeModal} className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">取消</button>
                <button onClick={handleDeleteImagery} disabled={isSubmitting} className="px-5 py-2 rounded-xl text-sm font-medium bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white flex items-center gap-2 transition-colors">
                  {isSubmitting && <Loader2 size={14} className="animate-spin" />}确认删除
                </button>
              </div>
            </div>
          </ModalCard>
        </ModalBackdrop>
      )}

      {/* Add / Edit Category */}
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
                    <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5">分类名称 <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="如：自然意象、时令意象…"
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
                      onChange={(e) => {
                        const val = e.target.value ? parseInt(e.target.value) : null;
                        const parent = val ? categories.find((c) => c.id === val) : null;
                        setCategoryForm((f) => ({ ...f, parent_id: val, level: parent ? (parent.level ?? 0) + 1 : 0 }));
                      }}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-300 dark:focus:border-blue-700 transition-colors"
                    >
                      <option value="">（顶级分类）</option>
                      {categories
                        .filter((c) => (modal.type !== "edit-category" || c.id !== modal.category.id) && (c.level ?? 0) < 3)
                        .map((c) => (
                          <option key={c.id} value={c.id}>{getCategoryPath(c.id, categories)}</option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5">描述</label>
                    <textarea
                      value={categoryForm.description}
                      onChange={(e) => setCategoryForm((f) => ({ ...f, description: e.target.value }))}
                      placeholder="可选的分类说明…"
                      rows={3}
                      maxLength={500}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-300 dark:focus:border-blue-700 transition-colors resize-none"
                    />
                  </div>
                  {categoryForm.level !== null && (
                    <p className="text-xs text-slate-400 dark:text-slate-500">层级：{categoryForm.level}{categoryForm.level === 3 && " · 叶子分类，意象可挂载于此"}</p>
                  )}
                </div>
              </div>
              <div className="px-6 pb-6 flex justify-end gap-3">
                <button type="button" onClick={closeModal} className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">取消</button>
                <button type="submit" disabled={isSubmitting || !categoryForm.name.trim()} className="px-5 py-2 rounded-xl text-sm font-medium bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white flex items-center gap-2 transition-colors">
                  {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                  {modal.type === "add-category" ? "创建" : "保存"}
                </button>
              </div>
            </form>
          </ModalCard>
        </ModalBackdrop>
      )}

      {/* Delete Category */}
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
                    将删除分类「<strong className="text-slate-700 dark:text-slate-200">{modal.category.name}</strong>」。子分类和关联的出现记录可能受到影响。
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={closeModal} className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">取消</button>
                <button onClick={handleDeleteCategory} disabled={isSubmitting} className="px-5 py-2 rounded-xl text-sm font-medium bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white flex items-center gap-2 transition-colors">
                  {isSubmitting && <Loader2 size={14} className="animate-spin" />}确认删除
                </button>
              </div>
            </div>
          </ModalCard>
        </ModalBackdrop>
      )}

      {/* Toast */}
      {toast && (
        <div className={cn(
          "fixed bottom-6 left-1/2 -translate-x-1/2 z-60 flex items-center gap-2 px-5 py-3 rounded-2xl shadow-xl text-sm font-medium transition-all",
          toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white",
        )}>
          {toast.type === "success" ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
          {toast.text}
        </div>
      )}
    </div>
  );
}
