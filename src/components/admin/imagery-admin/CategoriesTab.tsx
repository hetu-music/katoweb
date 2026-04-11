import type { ImageryCategory } from "@/lib/types";
import { FolderPlus, ListTree } from "lucide-react";
import { CategoryTreeNode } from "./CategoryTree";
import {
  cardClassName,
  cn,
  PaginationControls,
  primaryButtonClassName,
  SectionIntro,
  StatPill,
} from "./shared";
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
    <div className="space-y-6">
      <SectionIntro
        eyebrow="Category Structure"
        title="分类管理"
        description="左侧保留默认折叠的分类树，右侧以分页列表进行批量维护，层级、路径与意象数量一目了然。"
        actions={
          <>
            <StatPill label="分类总数" value={sortedCategoriesLength} />
            <button
              onClick={() => onAddCategory()}
              className={primaryButtonClassName()}
            >
              <FolderPlus size={14} />
              新增顶级分类
            </button>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside
          className={cn(cardClassName(), "sticky top-28 h-fit overflow-hidden")}
        >
          <div className="flex items-center justify-between border-b border-slate-200/70 px-5 py-4 dark:border-slate-800/70">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
              <ListTree size={14} />
              分类树（默认折叠）
            </div>
            <button
              onClick={() => onAddCategory()}
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-blue-500 dark:hover:bg-slate-800"
              title="新增顶级分类"
            >
              <FolderPlus size={14} />
            </button>
          </div>
          <div className="max-h-[calc(100vh-14rem)] overflow-y-auto px-3 py-3">
            {categoryTree.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400">
                暂无分类，点击右上角新增。
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

        <div className={cn(cardClassName(), "overflow-hidden")}>
          <div className="border-b border-slate-200/70 px-6 py-5 dark:border-slate-800/70">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              分类列表
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              分页展示所有分类，方便按路径核对层级和挂载数量。
            </p>
          </div>

          <div className="space-y-3 px-6 py-5">
            {pagedCategories.map((category) => (
              <div
                key={category.id}
                className="group rounded-[24px] border border-slate-200/70 bg-white px-4 py-4 dark:border-slate-800/70 dark:bg-slate-900/60"
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
      </div>
    </div>
  );
}
