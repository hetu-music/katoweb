import type { ImageryCategory } from "@/lib/types";
import { FolderPlus, Layers, ListTree, Tag } from "lucide-react";
import { CategoryTreeNode } from "./CategoryTree";
import { cn } from "./shared";
import type { CategoryNode } from "./types";

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "cyan" | "violet" | "amber" | "slate";
}) {
  const colorMap = {
    cyan: "bg-cyan-50 text-cyan-700 border-cyan-100 dark:bg-cyan-900/20 dark:text-cyan-300 dark:border-cyan-800/50",
    violet:
      "bg-violet-50 text-violet-700 border-violet-100 dark:bg-violet-900/20 dark:text-violet-300 dark:border-violet-800/50",
    amber:
      "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800/50",
    slate:
      "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800/40 dark:text-slate-300 dark:border-slate-700/50",
  };
  return (
    <div
      className={cn(
        "flex flex-col gap-0.5 rounded-2xl border px-5 py-4",
        colorMap[color],
      )}
    >
      <span className="text-2xl font-bold tabular-nums">{value}</span>
      <span className="text-xs font-medium opacity-75">{label}</span>
    </div>
  );
}

export default function CategoriesTab({
  categoryTree,
  imageryCountByCategory,
  categories,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
}: {
  categoryTree: CategoryNode[];
  imageryCountByCategory: Map<number, number>;
  categories: ImageryCategory[];
  onAddCategory: (parentId?: number) => void;
  onEditCategory: (category: ImageryCategory) => void;
  onDeleteCategory: (category: ImageryCategory) => void;
}) {
  const l1Count = categories.filter((c) => (c.level ?? 0) === 0).length;
  const l2Count = categories.filter((c) => (c.level ?? 0) === 1).length;
  const leafCount = categories.filter((c) => {
    const hasChildren = categories.some((child) => child.parent_id === c.id);
    return !hasChildren;
  }).length;

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="总分类数" value={categories.length} color="slate" />
        <StatCard label="L1 顶级" value={l1Count} color="cyan" />
        <StatCard label="L2 二级" value={l2Count} color="violet" />
        <StatCard label="叶子节点" value={leafCount} color="amber" />
      </div>

      {/* Tree panel */}
      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/50">
        {/* Panel header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
            <ListTree size={15} />
            分类树
          </div>
          <button
            onClick={() => onAddCategory()}
            className="flex items-center gap-1.5 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-xs font-medium text-cyan-700 transition-colors hover:bg-cyan-100 dark:border-cyan-800/50 dark:bg-cyan-900/20 dark:text-cyan-300 dark:hover:bg-cyan-900/40"
            title="新增顶级分类"
          >
            <FolderPlus size={13} />
            新增顶级分类
          </button>
        </div>

        {/* Tree body — responsive columns */}
        {categoryTree.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-slate-400">
            <Layers size={32} className="opacity-30" />
            <p className="text-sm">暂无分类，点击右上角新增。</p>
          </div>
        ) : (
          <div className="grid gap-px bg-slate-100 dark:bg-slate-800 sm:grid-cols-2 xl:grid-cols-3">
            {categoryTree.map((node) => (
              <div
                key={node.id}
                className="bg-white px-4 py-4 dark:bg-slate-900/50"
              >
                {/* L1 header */}
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Tag
                      size={13}
                      className="shrink-0 text-cyan-500 dark:text-cyan-400"
                    />
                    <span className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {node.name}
                    </span>
                    {(imageryCountByCategory.get(node.id) ?? 0) > 0 && (
                      <span className="shrink-0 rounded-full bg-cyan-100 px-1.5 py-0.5 text-[10px] font-medium text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300">
                        {imageryCountByCategory.get(node.id)}
                      </span>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onAddCategory(node.id)}
                      className="rounded-lg p-1 text-blue-400 transition-colors hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30"
                      title="添加子分类"
                    >
                      <FolderPlus size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onEditCategory(node)}
                      className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-emerald-600 dark:hover:bg-slate-800 dark:hover:text-emerald-400"
                      title="编辑"
                    >
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Children */}
                {node.children.length > 0 && (
                  <div className="space-y-0.5 border-l-2 border-slate-100 pl-3 dark:border-slate-800">
                    {node.children.map((child) => (
                      <CategoryTreeNode
                        key={child.id}
                        node={child}
                        depth={0}
                        imageryCountByCategory={imageryCountByCategory}
                        onAddChild={onAddCategory}
                        onEdit={onEditCategory}
                        onDelete={onDeleteCategory}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
