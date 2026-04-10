"use client";

import ThemeToggle from "@/components/shared/ThemeToggle";
import { useUserContext } from "@/context/UserContext";
import type { ImageryCategory, ImageryItem, ImageryMeaning } from "@/lib/types";
import type { OccurrenceWithSong } from "@/lib/service-imagery";
import {
  apiCreateImagery,
  apiUpdateImagery,
  apiDeleteImagery,
  apiGetImageryOccurrences,
  apiCreateImageryCategory,
  apiUpdateImageryCategory,
  apiDeleteImageryCategory,
  apiGetImageryMeanings,
  apiCreateMeaning,
  apiUpdateMeaning,
  apiDeleteMeaning,
  apiSetImageryCategories,
} from "@/lib/client-api";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Edit2,
  FolderPlus,
  Hash,
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
  CheckCircle2,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import React, { useCallback, useEffect, useMemo, useState } from "react";

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

// ─── types ────────────────────────────────────────────────────────────────────

interface Props {
  initialItems: ImageryItem[];
  initialCategories: ImageryCategory[];
}

type ModalState =
  | { type: "none" }
  | { type: "add-imagery" }
  | { type: "edit-imagery"; item: ImageryItem }
  | { type: "delete-imagery"; item: ImageryItem }
  | { type: "add-category"; parentId?: number }
  | { type: "edit-category"; category: ImageryCategory }
  | { type: "delete-category"; category: ImageryCategory }
  | { type: "imagery-detail"; item: ImageryItem };

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

// ─── ImageryCard ──────────────────────────────────────────────────────────────

const ImageryCard = React.memo(function ImageryCard({
  item,
  categories,
  onEdit,
  onDelete,
  onViewDetail,
}: {
  item: ImageryItem;
  categories: ImageryCategory[];
  onEdit: (item: ImageryItem) => void;
  onDelete: (item: ImageryItem) => void;
  onViewDetail: (item: ImageryItem) => void;
}) {
  const catNames = item.categoryIds
    .map((id) => categories.find((c) => c.id === id)?.name)
    .filter(Boolean) as string[];

  return (
    <div
      className="group flex flex-col gap-2 p-3 rounded-xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900/40 hover:shadow-sm transition-all cursor-pointer"
      onClick={() => onViewDetail(item)}
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-700 mt-0.5">
          <Tag size={14} className="text-slate-400" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate">
            {item.name}
          </div>
          {catNames.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {catNames.slice(0, 3).map((name) => (
                <span
                  key={name}
                  className="text-[10px] px-1.5 py-0.5 rounded-md bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 border border-violet-100 dark:border-violet-900/30"
                >
                  {name}
                </span>
              ))}
              {catNames.length > 3 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                  +{catNames.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        <div
          className="hidden group-hover:flex items-center gap-1 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => onEdit(item)}
            className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 transition-colors"
            title="编辑"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={() => onDelete(item)}
            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 dark:text-red-400 transition-colors"
            title="删除"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 pl-11 text-xs text-slate-400 dark:text-slate-500">
        <span className="font-mono">{item.count}次</span>
        {item.meaningCount > 0 && (
          <span className="flex items-center gap-1">
            <BookOpen size={10} />
            {item.meaningCount}含义
          </span>
        )}
      </div>
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

// ─── Category selection checkboxes ───────────────────────────────────────────

function CategoryCheckboxes({
  categories,
  selectedIds,
  onToggle,
}: {
  categories: ImageryCategory[];
  selectedIds: number[];
  onToggle: (id: number) => void;
}) {
  const level3 = useMemo(() => categories.filter((c) => c.level === 3), [categories]);

  if (level3.length === 0) {
    return (
      <p className="text-xs text-slate-400 text-center py-3">
        暂无叶子分类（level=3），请先在分类树中创建
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
      {level3.map((cat) => {
        const checked = selectedIds.includes(cat.id);
        const path = getCategoryPath(cat.id, categories);
        return (
          <label
            key={cat.id}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer border transition-colors text-sm",
              checked
                ? "bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800"
                : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600",
            )}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => onToggle(cat.id)}
              className="sr-only"
            />
            <div
              className={cn(
                "w-4 h-4 rounded flex items-center justify-center border shrink-0",
                checked
                  ? "bg-violet-600 border-violet-600"
                  : "border-slate-300 dark:border-slate-600",
              )}
            >
              {checked && <Check size={10} className="text-white" />}
            </div>
            <span
              className={cn(
                "truncate text-xs",
                checked
                  ? "text-violet-800 dark:text-violet-200"
                  : "text-slate-600 dark:text-slate-300",
              )}
              title={path}
            >
              {path}
            </span>
          </label>
        );
      })}
    </div>
  );
}

// ─── Meanings manager (inline within edit modal) ──────────────────────────────

function MeaningsManager({
  imageryId,
  meanings,
  loading,
  csrfToken,
  onMeaningsChange,
  onMeaningCountChange,
}: {
  imageryId: number;
  meanings: ImageryMeaning[];
  loading: boolean;
  csrfToken: string;
  onMeaningsChange: (fn: (prev: ImageryMeaning[]) => ImageryMeaning[]) => void;
  onMeaningCountChange: (delta: number) => void;
}) {
  const [addingMeaning, setAddingMeaning] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ label: "", description: "" });
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setForm({ label: "", description: "" });
    setAddingMeaning(false);
    setEditingId(null);
  };

  const startAdd = () => {
    setEditingId(null);
    setForm({ label: "", description: "" });
    setAddingMeaning(true);
  };

  const startEdit = (m: ImageryMeaning) => {
    setAddingMeaning(false);
    setEditingId(m.id);
    setForm({ label: m.label, description: m.description ?? "" });
  };

  const handleAdd = async () => {
    if (!form.label.trim() || submitting) return;
    setSubmitting(true);
    try {
      const created = await apiCreateMeaning(
        imageryId,
        { label: form.label.trim(), description: form.description.trim() || null },
        csrfToken,
      );
      onMeaningsChange((prev) => [...prev, created]);
      onMeaningCountChange(1);
      resetForm();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingId || !form.label.trim() || submitting) return;
    setSubmitting(true);
    try {
      const updated = await apiUpdateMeaning(
        imageryId,
        editingId,
        { label: form.label.trim(), description: form.description.trim() || null },
        csrfToken,
      );
      onMeaningsChange((prev) => prev.map((m) => (m.id === editingId ? updated : m)));
      resetForm();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (meaningId: number) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await apiDeleteMeaning(imageryId, meaningId, csrfToken);
      onMeaningsChange((prev) => prev.filter((m) => m.id !== meaningId));
      onMeaningCountChange(-1);
      if (editingId === meaningId) resetForm();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const InlineForm = ({ onSubmit, onCancel }: { onSubmit: () => void; onCancel: () => void }) => (
    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
      <input
        type="text"
        value={form.label}
        onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
        placeholder="含义标签，如：思乡、爱情…"
        maxLength={100}
        autoFocus
        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-300 dark:focus:border-violet-700 transition-colors"
      />
      <textarea
        value={form.description}
        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        placeholder="含义描述（可选）…"
        rows={2}
        maxLength={500}
        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-300 dark:focus:border-violet-700 transition-colors resize-none"
      />
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          取消
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={!form.label.trim() || submitting}
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white flex items-center gap-1.5 transition-colors"
        >
          {submitting && <Loader2 size={12} className="animate-spin" />}
          确认
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-2">
      {loading ? (
        <div className="flex items-center justify-center py-6 text-slate-400">
          <Loader2 className="animate-spin mr-2" size={16} />
          加载中…
        </div>
      ) : meanings.length === 0 && !addingMeaning ? (
        <p className="text-xs text-slate-400 text-center py-3">暂无含义，点击「新增含义」添加</p>
      ) : (
        <div className="space-y-2">
          {meanings.map((m) =>
            editingId === m.id ? (
              <InlineForm key={m.id} onSubmit={handleUpdate} onCancel={resetForm} />
            ) : (
              <div
                key={m.id}
                className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 group/meaning"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    {m.label}
                  </div>
                  {m.description && (
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                      {m.description}
                    </div>
                  )}
                </div>
                <div className="hidden group-hover/meaning:flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => startEdit(m)}
                    className="p-1 rounded hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 transition-colors"
                    title="编辑"
                  >
                    <Edit2 size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(m.id)}
                    disabled={submitting}
                    className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 dark:text-red-400 transition-colors"
                    title="删除"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ),
          )}
        </div>
      )}

      {addingMeaning && (
        <InlineForm onSubmit={handleAdd} onCancel={resetForm} />
      )}

      {!addingMeaning && editingId === null && (
        <button
          type="button"
          onClick={startAdd}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 hover:border-violet-300 dark:hover:border-violet-700 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
        >
          <Plus size={12} />
          新增含义
        </button>
      )}
    </div>
  );
}

// ─── Imagery detail modal (occurrences) ──────────────────────────────────────

function ImageryDetailModal({
  item,
  categories,
  onClose,
}: {
  item: ImageryItem;
  categories: ImageryCategory[];
  onClose: () => void;
}) {
  const [occurrences, setOccurrences] = useState<OccurrenceWithSong[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiGetImageryOccurrences(item.id)
      .then(setOccurrences)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [item.id]);

  const catNames = item.categoryIds
    .map((id) => categories.find((c) => c.id === id)?.name)
    .filter(Boolean) as string[];

  return (
    <ModalBackdrop onClose={onClose}>
      <ModalCard className="max-w-lg">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{item.name}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                共出现 {item.count} 次 · {item.meaningCount} 个含义
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {catNames.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-5">
              {catNames.map((name) => (
                <span
                  key={name}
                  className="text-xs px-2.5 py-1 rounded-full bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 border border-violet-100 dark:border-violet-900/30"
                >
                  {name}
                </span>
              ))}
            </div>
          )}

          <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
              出现记录
            </h3>
            {loading ? (
              <div className="flex items-center justify-center py-8 text-slate-400">
                <Loader2 className="animate-spin mr-2" size={16} />
                加载中…
              </div>
            ) : occurrences.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">暂无出现记录</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {occurrences.map((occ) => {
                  const cat = categories.find((c) => c.id === occ.category_id);
                  return (
                    <div
                      key={occ.id}
                      className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                          {occ.song_title}
                        </div>
                        {occ.song_album && (
                          <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {occ.song_album}
                          </div>
                        )}
                      </div>
                      {cat && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 border border-violet-100 dark:border-violet-800 shrink-0">
                          {cat.name}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </ModalCard>
    </ModalBackdrop>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ImageryAdminClient({ initialItems, initialCategories }: Props) {
  const { logout: _logout, loggingOut: _loggingOut } = useUserContext();
  const [csrfToken, setCsrfToken] = useState("");
  const [items, setItems] = useState<ImageryItem[]>(initialItems);
  const [categories, setCategories] = useState<ImageryCategory[]>(initialCategories);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [modal, setModal] = useState<ModalState>({ type: "none" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Imagery form state
  const [imageryFormName, setImageryFormName] = useState("");
  const [addImageryCategoryIds, setAddImageryCategoryIds] = useState<number[]>([]);
  const [editCategoryIds, setEditCategoryIds] = useState<number[]>([]);

  // Category form state
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    parent_id: null as number | null,
    level: null as number | null,
    description: "",
  });

  // Meanings for edit modal
  const [editMeanings, setEditMeanings] = useState<ImageryMeaning[]>([]);
  const [meaningsLoading, setMeaningsLoading] = useState(false);

  useEffect(() => {
    fetch("/api/public/csrf-token")
      .then((r) => r.json())
      .then((d) => setCsrfToken(d.csrfToken || ""));
  }, []);

  const showToast = useCallback((type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // ─── computed ─────────────────────────────────────────────────────────────

  const categoryTree = useMemo(() => buildTree(categories), [categories]);

  const imageryCountByCategory = useMemo(() => {
    const map = new Map<number, number>();
    items.forEach((item) => {
      item.categoryIds.forEach((cid) => {
        // count for the direct category and all ancestors
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
    let result = items;
    if (selectedCategoryId !== null) {
      const descendantIds = new Set(getDescendantIds(selectedCategoryId, categories));
      result = result.filter((item) =>
        item.categoryIds.some((cid) => descendantIds.has(cid)),
      );
    }
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      result = result.filter((item) => item.name.toLowerCase().includes(q));
    }
    return result.sort((a, b) => b.count - a.count);
  }, [items, selectedCategoryId, searchTerm, categories]);

  // ─── modal openers ────────────────────────────────────────────────────────

  const openAddImagery = () => {
    setImageryFormName("");
    setAddImageryCategoryIds([]);
    setModal({ type: "add-imagery" });
  };

  const openEditImagery = (item: ImageryItem) => {
    setImageryFormName(item.name);
    setEditCategoryIds([...item.categoryIds]);
    setEditMeanings([]);
    setMeaningsLoading(true);
    setModal({ type: "edit-imagery", item });
    apiGetImageryMeanings(item.id)
      .then(setEditMeanings)
      .catch(console.error)
      .finally(() => setMeaningsLoading(false));
  };

  const openDeleteImagery = (item: ImageryItem) => {
    setModal({ type: "delete-imagery", item });
  };

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

  const closeModal = () => setModal({ type: "none" });

  // ─── handlers ─────────────────────────────────────────────────────────────

  const handleAddImagery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageryFormName.trim()) return;
    setIsSubmitting(true);
    try {
      const created = await apiCreateImagery(imageryFormName.trim(), csrfToken);
      if (addImageryCategoryIds.length > 0) {
        await apiSetImageryCategories(created.id, addImageryCategoryIds, csrfToken);
      }
      setItems((prev) => [
        ...prev,
        { ...created, count: 0, categoryIds: [...addImageryCategoryIds], meaningCount: 0 },
      ]);
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
      await apiSetImageryCategories(modal.item.id, editCategoryIds, csrfToken);
      setItems((prev) =>
        prev.map((i) =>
          i.id === modal.item.id
            ? { ...i, name: imageryFormName.trim(), categoryIds: [...editCategoryIds] }
            : i,
        ),
      );
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

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) return;
    setIsSubmitting(true);
    try {
      const created = await apiCreateImageryCategory(
        {
          name: categoryForm.name.trim(),
          parent_id: categoryForm.parent_id,
          level: categoryForm.level,
          description: categoryForm.description || null,
        },
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
        {
          name: categoryForm.name.trim(),
          parent_id: categoryForm.parent_id,
          level: categoryForm.level,
          description: categoryForm.description || null,
        },
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
      if (selectedCategoryId === modal.category.id) setSelectedCategoryId(null);
      showToast("success", `分类「${modal.category.name}」已删除`);
      closeModal();
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "删除失败");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMeaningsChange = useCallback(
    (fn: (prev: ImageryMeaning[]) => ImageryMeaning[]) => {
      setEditMeanings(fn);
    },
    [],
  );

  const handleMeaningCountChange = useCallback(
    (delta: number) => {
      if (modal.type !== "edit-imagery") return;
      const id = modal.item.id;
      setItems((prev) =>
        prev.map((i) =>
          i.id === id ? { ...i, meaningCount: Math.max(0, i.meaningCount + delta) } : i,
        ),
      );
    },
    [modal],
  );

  // ─── render ───────────────────────────────────────────────────────────────

  const selectedCategoryName = selectedCategoryId
    ? categories.find((c) => c.id === selectedCategoryId)?.name
    : null;

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
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-50 mb-3">意象库</h1>
            <div className="flex flex-wrap gap-2">
              <div className="px-3 py-1 bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 rounded-full text-sm font-medium border border-violet-100 dark:border-violet-800 flex items-center gap-1.5">
                <Tag size={12} />
                {items.length} 个意象
              </div>
              <div className="px-3 py-1 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-full text-sm font-medium border border-blue-100 dark:border-blue-800 flex items-center gap-1.5">
                <Layers size={12} />
                {categories.length} 个分类
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => openAddCategory()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm transition-all hover:-translate-y-0.5"
            >
              <FolderPlus size={16} />
              新增分类
            </button>
            <button
              onClick={openAddImagery}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-sm bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/20 transition-all hover:-translate-y-0.5"
            >
              <Plus size={16} />
              新增意象
            </button>
          </div>
        </div>

        {/* Main Layout */}
        <div className="flex gap-6">
          {/* Left: Category Tree */}
          <aside className="w-64 shrink-0 sticky top-24 self-start">
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

              <div className="p-2 max-h-[calc(100vh-12rem)] overflow-y-auto">
                <button
                  onClick={() => setSelectedCategoryId(null)}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    selectedCategoryId === null
                      ? "bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60",
                  )}
                >
                  <Hash size={13} />
                  全部意象
                  <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500">
                    {items.length}
                  </span>
                </button>

                {categoryTree.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4 px-3">
                    暂无分类，点击 + 新增
                  </p>
                ) : (
                  categoryTree.map((node) => (
                    <CategoryTreeNode
                      key={node.id}
                      node={node}
                      selectedId={selectedCategoryId}
                      onSelect={setSelectedCategoryId}
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

          {/* Right: Imagery List */}
          <div className="flex-1 min-w-0">
            {/* Search & Filter Bar */}
            <div className="flex items-center gap-3 mb-5">
              <div className="relative flex-1">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="搜索意象名称…"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-300 dark:focus:border-violet-700 transition-colors"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {selectedCategoryName && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-900/30 text-sm text-violet-700 dark:text-violet-300 shrink-0">
                  <Layers size={13} />
                  {selectedCategoryName}
                  <button
                    onClick={() => setSelectedCategoryId(null)}
                    className="text-violet-400 hover:text-violet-600 ml-1"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}

              <span className="text-sm text-slate-400 shrink-0">{filteredItems.length} 个</span>
            </div>

            {/* Imagery Grid */}
            {filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                  <Tag size={28} className="text-slate-300 dark:text-slate-600" />
                </div>
                <p className="text-slate-500 dark:text-slate-400 font-medium">
                  {searchTerm || selectedCategoryId ? "没有找到匹配的意象" : "暂无意象"}
                </p>
                <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                  {!searchTerm && !selectedCategoryId && "点击「新增意象」开始添加"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredItems.map((item) => (
                  <ImageryCard
                    key={item.id}
                    item={item}
                    categories={categories}
                    onEdit={openEditImagery}
                    onDelete={openDeleteImagery}
                    onViewDetail={(i) => setModal({ type: "imagery-detail", item: i })}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ─── Modals ─────────────────────────────────────────────────────────── */}

      {/* Add Imagery */}
      {modal.type === "add-imagery" && (
        <ModalBackdrop onClose={closeModal}>
          <ModalCard className="max-w-lg">
            <form onSubmit={handleAddImagery}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">新增意象</h2>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-5">
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

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">
                      所属分类（叶子分类）
                    </label>
                    <CategoryCheckboxes
                      categories={categories}
                      selectedIds={addImageryCategoryIds}
                      onToggle={(id) =>
                        setAddImageryCategoryIds((prev) =>
                          prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
                        )
                      }
                    />
                  </div>
                </div>
              </div>
              <div className="px-6 pb-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !imageryFormName.trim()}
                  className="px-5 py-2 rounded-xl text-sm font-medium bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white flex items-center gap-2 transition-colors"
                >
                  {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                  创建
                </button>
              </div>
            </form>
          </ModalCard>
        </ModalBackdrop>
      )}

      {/* Edit Imagery */}
      {modal.type === "edit-imagery" && (
        <ModalBackdrop onClose={closeModal}>
          <ModalCard className="max-w-2xl">
            <form onSubmit={handleEditImagery}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    编辑意象 · 「{modal.item.name}」
                  </h2>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-1">
                  {/* Name */}
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

                  {/* Category assignment */}
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-5">
                    <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">
                      所属分类（叶子分类）
                    </label>
                    <CategoryCheckboxes
                      categories={categories}
                      selectedIds={editCategoryIds}
                      onToggle={(id) =>
                        setEditCategoryIds((prev) =>
                          prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
                        )
                      }
                    />
                  </div>

                  {/* Meanings */}
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-5">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <BookOpen size={12} />
                        意象含义
                      </label>
                    </div>
                    <MeaningsManager
                      imageryId={modal.item.id}
                      meanings={editMeanings}
                      loading={meaningsLoading}
                      csrfToken={csrfToken}
                      onMeaningsChange={handleMeaningsChange}
                      onMeaningCountChange={handleMeaningCountChange}
                    />
                  </div>
                </div>
              </div>
              <div className="px-6 pb-6 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !imageryFormName.trim()}
                  className="px-5 py-2 rounded-xl text-sm font-medium bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white flex items-center gap-2 transition-colors"
                >
                  {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                  保存
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
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">
                    确认删除
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    将删除意象「
                    <strong className="text-slate-700 dark:text-slate-200">
                      {modal.item.name}
                    </strong>
                    」。
                    {modal.item.count > 0 && (
                      <span className="text-red-600 dark:text-red-400 ml-1">
                        该意象有 {modal.item.count} 条出现记录，删除后相关记录也将受影响。
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleDeleteImagery}
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl text-sm font-medium bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white flex items-center gap-2 transition-colors"
                >
                  {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                  确认删除
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
            <form
              onSubmit={modal.type === "add-category" ? handleAddCategory : handleEditCategory}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {modal.type === "add-category" ? "新增分类" : "编辑分类"}
                  </h2>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                  >
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
                      onChange={(e) => setCategoryForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="如：自然意象、时令意象…"
                      maxLength={50}
                      required
                      autoFocus
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-300 dark:focus:border-blue-700 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5">
                      父分类
                    </label>
                    <select
                      value={categoryForm.parent_id ?? ""}
                      onChange={(e) => {
                        const val = e.target.value ? parseInt(e.target.value) : null;
                        const parent = val ? categories.find((c) => c.id === val) : null;
                        setCategoryForm((f) => ({
                          ...f,
                          parent_id: val,
                          level: parent ? (parent.level ?? 0) + 1 : 0,
                        }));
                      }}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-300 dark:focus:border-blue-700 transition-colors"
                    >
                      <option value="">（顶级分类）</option>
                      {categories
                        .filter(
                          (c) =>
                            (modal.type !== "edit-category" || c.id !== modal.category.id) &&
                            (c.level ?? 0) < 3,
                        )
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {getCategoryPath(c.id, categories)}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5">
                      描述
                    </label>
                    <textarea
                      value={categoryForm.description}
                      onChange={(e) =>
                        setCategoryForm((f) => ({ ...f, description: e.target.value }))
                      }
                      placeholder="可选的分类说明…"
                      rows={3}
                      maxLength={500}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-300 dark:focus:border-blue-700 transition-colors resize-none"
                    />
                  </div>

                  {categoryForm.level !== null && (
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      层级：{categoryForm.level}
                      {categoryForm.level === 3 && " · 叶子分类，意象可挂载于此"}
                    </p>
                  )}
                </div>
              </div>
              <div className="px-6 pb-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !categoryForm.name.trim()}
                  className="px-5 py-2 rounded-xl text-sm font-medium bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white flex items-center gap-2 transition-colors"
                >
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
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">
                    确认删除分类
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    将删除分类「
                    <strong className="text-slate-700 dark:text-slate-200">
                      {modal.category.name}
                    </strong>
                    」。子分类和关联的出现记录可能受到影响。
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleDeleteCategory}
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl text-sm font-medium bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white flex items-center gap-2 transition-colors"
                >
                  {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                  确认删除
                </button>
              </div>
            </div>
          </ModalCard>
        </ModalBackdrop>
      )}

      {/* Imagery Detail */}
      {modal.type === "imagery-detail" && (
        <ImageryDetailModal item={modal.item} categories={categories} onClose={closeModal} />
      )}

      {/* Toast */}
      {toast && (
        <div
          className={cn(
            "fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 px-5 py-3 rounded-2xl shadow-xl text-sm font-medium transition-all",
            toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white",
          )}
        >
          {toast.type === "success" ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
          {toast.text}
        </div>
      )}
    </div>
  );
}
