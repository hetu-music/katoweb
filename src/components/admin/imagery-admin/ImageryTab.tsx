import type { ImageryCategory, ImageryItem } from "@/lib/types";
import { Edit2, Tag, Trash2 } from "lucide-react";
import {
  EmptyState,
  LoadingState,
  PaginationControls,
} from "./shared";

export default function ImageryTab({
  categories,
  itemsLoading,
  itemsError,
  searchTerm,
  filteredCount,
  pagedItems,
  currentPage,
  totalPages,
  onSearchTermChange,
  onPageChange,
  onAdd,
  onEdit,
  onDelete,
}: {
  categories: ImageryCategory[];
  itemsLoading: boolean;
  itemsError: string | null;
  searchTerm: string;
  filteredCount: number;
  pagedItems: ImageryItem[];
  currentPage: number;
  totalPages: number;
  onSearchTermChange: (value: string) => void;
  onPageChange: (page: number) => void;
  onAdd: () => void;
  onEdit: (item: ImageryItem) => void;
  onDelete: (item: ImageryItem) => void;
}) {
  return (
    <div className="space-y-3">
      {itemsLoading ? (
        <LoadingState text="加载意象中…" />
      ) : itemsError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-600 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-400">
          {itemsError}
        </div>
      ) : pagedItems.length === 0 ? (
        <EmptyState
          icon={<Tag size={24} />}
          title={searchTerm ? "没有找到匹配的意象" : "暂无意象"}
          description={
            searchTerm
              ? "试试别的关键词。"
              : "点击右上角的按钮创建第一条意象。"
          }
        />
      ) : (
        <div className="space-y-3">
          {pagedItems.map((item) => {
            const categoryNames = item.categoryIds
              .map(
                (categoryId) =>
                  categories.find((category) => category.id === categoryId)
                    ?.name,
              )
              .filter((value): value is string => Boolean(value));

            return (
              <div
                key={item.id}
                className="flex flex-col bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden transition-all hover:shadow-md hover:border-violet-200 dark:hover:border-violet-900/30 px-4 py-4 group"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br from-violet-100 to-fuchsia-50 text-violet-600 dark:from-violet-900/40 dark:to-slate-900 dark:text-violet-300">
                    <Tag size={18} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-semibold text-slate-900 dark:text-slate-100">
                        {item.name}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                        ID {item.id}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[11px] text-violet-700 dark:bg-violet-900/20 dark:text-violet-300">
                        出现 {item.count} 次
                      </span>
                      {categoryNames.length > 0 ? (
                        categoryNames.slice(0, 4).map((name) => (
                          <span
                            key={name}
                            className="rounded-full border border-violet-100 bg-violet-50 px-2.5 py-1 text-[11px] text-violet-600 dark:border-violet-900/30 dark:bg-violet-900/20 dark:text-violet-300"
                          >
                            {name}
                          </span>
                        ))
                      ) : (
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                          尚未关联分类
                        </span>
                      )}
                      {categoryNames.length > 4 && (
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                          +{categoryNames.length - 4}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="hidden items-center gap-1 group-hover:flex">
                    <button
                      onClick={() => onEdit(item)}
                      className="rounded-xl p-2 text-emerald-600 transition-colors hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
                      title="编辑"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => onDelete(item)}
                      className="rounded-xl p-2 text-red-500 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                      title="删除"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
}
