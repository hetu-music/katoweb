import React, { useState } from "react";
import type { ImageryCategory } from "@/lib/types";
import { ChevronDown, ChevronRight, Edit2, FolderPlus } from "lucide-react";
import { cn } from "./shared";
import type { CategoryNode } from "./types";

export const CategoryTreeNode = React.memo(function CategoryTreeNode({
  node,
  depth,
  imageryCountByCategory,
  onAddChild,
  onEdit,
}: {
  node: CategoryNode;
  depth: number;
  imageryCountByCategory: Map<number, number>;
  onAddChild: (parentId: number) => void;
  onEdit: (category: ImageryCategory) => void;
}) {
  // Default expanded at depth 0 (L2 nodes inside a L1 column)
  const [expanded, setExpanded] = useState(depth === 0);
  const hasChildren = node.children.length > 0;
  const count = imageryCountByCategory.get(node.id) ?? 0;
  const isLeaf = !hasChildren;

  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-2 rounded-xl px-2 py-2 text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50",
          depth > 0 && "ml-3",
        )}
      >
        {/* Expand toggle */}
        <button
          type="button"
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-white hover:text-slate-600 dark:hover:bg-slate-900 dark:hover:text-slate-200"
          onClick={() => {
            if (hasChildren) setExpanded((v) => !v);
          }}
        >
          {hasChildren ? (
            expanded ? (
              <ChevronDown size={13} />
            ) : (
              <ChevronRight size={13} />
            )
          ) : (
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-violet-400 dark:bg-violet-500" />
          )}
        </button>

        {/* Name */}
        <span
          className={cn(
            "flex-1 truncate",
            isLeaf
              ? "text-slate-600 dark:text-slate-400"
              : "font-medium text-slate-700 dark:text-slate-300",
          )}
        >
          {node.name}
        </span>

        {/* Count badge */}
        {count > 0 && (
          <span className="shrink-0 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            {count}
          </span>
        )}

        {/* Actions — visible on hover */}
        <div className="hidden shrink-0 items-center gap-0.5 group-hover:flex">
          {hasChildren && (
            <button
              type="button"
              onClick={() => onAddChild(node.id)}
              className="rounded-lg p-1 text-blue-400 transition-colors hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30"
              title="添加子分类"
            >
              <FolderPlus size={12} />
            </button>
          )}
          <button
            type="button"
            onClick={() => onEdit(node)}
            className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-900/20 dark:hover:text-emerald-400"
            title="编辑"
          >
            <Edit2 size={12} />
          </button>
        </div>
      </div>

      {/* Description — shown below name when leaf */}
      {isLeaf && node.description && (
        <p className={cn("mb-1 truncate px-2 text-xs text-slate-400 dark:text-slate-500", depth > 0 && "ml-3")}>
          {node.description}
        </p>
      )}

      {/* Children */}
      {hasChildren && expanded && (
        <div className="mt-0.5">
          {node.children.map((child) => (
            <CategoryTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              imageryCountByCategory={imageryCountByCategory}
              onAddChild={onAddChild}
              onEdit={onEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
});
