import type { ImageryCategory } from "@/lib/types";
import { FolderPlus, ListTree } from "lucide-react";
import { CategoryTreeNode } from "./CategoryTree";
import { PaginationControls } from "./shared";
import type { CategoryNode } from "./types";

export default function CategoriesTab({
  categoryTree,
  imageryCountByCategory,
  sortedCategoriesLength,
  pagedCategories,
  currentPage,
  totalPages,
  getCategoryPath,
  onPageChange,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
}: {
  categoryTree: CategoryNode[];
  imageryCountByCategory: Map<number, number>;
  sortedCategoriesLength: number;
  pagedCategories: ImageryCategory[];
  currentPage: number;
  totalPages: number;
  getCategoryPath: (categoryId: number) => string;
  onPageChange: (page: number) => void;
  onAddCategory: (parentId?: number) => void;
  onEditCategory: (category: ImageryCategory) => void;
  onDeleteCategory: (category: ImageryCategory) => void;
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)] items-start">
      <aside className="sticky top-40 h-fit bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
            <ListTree size={14} />
            分类树（默认折叠）
          </div>
          <button
            onClick={() => onAddCategory()}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-cyan-500 dark:hover:bg-slate-800"
            title="新增顶级分类"
          >
            <FolderPlus size={14} />
          </button>
        </div>
        <div className="max-h-[calc(100vh-14rem)] overflow-y-auto px-3 py-3">
          {categoryTree.length === 0 ? (
            <p className="py-8 text-center text-xs text-slate-400">
              暂无分类，点击此处或右上角新增。
            </p>
          ) : (
            categoryTree.map((node) => (
              <CategoryTreeNode
                key={node.id}
                node={node}
                depth={0}
                imageryCountByCategory={imageryCountByCategory}
                onAddChild={onAddCategory}
                onEdit={onEditCategory}
                onDelete={onDeleteCategory}
              />
            ))
          )}
        </div>
      </aside>

      <div className="space-y-3">
        {pagedCategories.map((category) => (
          <div
            key={category.id}
            className="flex flex-col bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden transition-all hover:shadow-md hover:border-cyan-200 dark:hover:border-cyan-900/30 px-4 py-4 group"
          >
                <div className="flex items-start gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-semibold text-slate-900 dark:text-slate-100">
                        {category.name}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                        L{category.level ?? 0}
                      </span>
                      <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[11px] text-violet-700 dark:bg-violet-900/20 dark:text-violet-300">
                        {imageryCountByCategory.get(category.id) ?? 0} 个意象
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                      {getCategoryPath(category.id)}
                    </p>
                    {category.description && (
                      <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
                        {category.description}
                      </p>
                    )}
                  </div>

                  <div className="hidden items-center gap-1 group-hover:flex">
                    <button
                      onClick={() => onEditCategory(category)}
                      className="rounded-xl px-2 py-2 text-xs text-emerald-600 transition-colors hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => onDeleteCategory(category)}
                      className="rounded-xl px-2 py-2 text-xs text-red-500 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            ))}
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={onPageChange}
            />
      </div>
    </div>
  );
}
