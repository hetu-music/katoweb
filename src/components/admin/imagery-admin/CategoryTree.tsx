import React, { useState } from "react";
import type { ImageryCategory } from "@/lib/types";
import {
  ChevronDown,
  ChevronRight,
  Edit2,
  FolderPlus,
  Trash2,
} from "lucide-react";
import { cn } from "./shared";
import type { CategoryNode } from "./types";

export const CategoryTreeNode = React.memo(function CategoryTreeNode({
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

  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-2 rounded-xl px-2 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/70",
        )}
        style={{ paddingLeft: `${0.5 + depth * 1.1}rem` }}
      >
        <button
          type="button"
          className="flex h-5 w-5 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-white hover:text-slate-600 dark:hover:bg-slate-900 dark:hover:text-slate-200"
          onClick={() => {
            if (hasChildren) setExpanded((value) => !value);
          }}
        >
          {hasChildren ? (
            expanded ? (
              <ChevronDown size={13} />
            ) : (
              <ChevronRight size={13} />
            )
          ) : (
            <span className="inline-block h-2 w-2 rounded-full bg-violet-400 dark:bg-violet-500" />
          )}
        </button>

        <span className="flex-1 truncate font-medium">{node.name}</span>

        {count > 0 && (
          <span className="rounded-full bg-slate-200/70 px-1.5 py-0.5 text-[10px] text-slate-500 dark:bg-slate-700 dark:text-slate-300">
            {count}
          </span>
        )}

        <div className="hidden items-center gap-1 group-hover:flex">
          {depth < 3 && (
            <button
              type="button"
              onClick={() => onAddChild(node.id)}
              className="rounded-lg p-1 text-blue-500 transition-colors hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/30"
              title="添加子分类"
            >
              <FolderPlus size={12} />
            </button>
          )}
          <button
            type="button"
            onClick={() => onEdit(node)}
            className="rounded-lg p-1 text-emerald-600 transition-colors hover:bg-emerald-100 dark:text-emerald-400 dark:hover:bg-emerald-900/30"
            title="编辑分类"
          >
            <Edit2 size={12} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(node)}
            className="rounded-lg p-1 text-red-500 transition-colors hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30"
            title="删除分类"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {hasChildren && expanded && (
        <div className="mt-1">
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
