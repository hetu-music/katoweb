import type { ImageryCategory, ImageryItem } from "@/lib/types";
import { Edit2, Plus, Tag, Trash2 } from "lucide-react";
import {
  cardClassName,
  cn,
  EmptyState,
  LoadingState,
  PaginationControls,
  primaryButtonClassName,
  SearchField,
  SectionIntro,
  StatPill,
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
    <div className="space-y-6">
      <SectionIntro
        eyebrow="Imagery Library"
        title="意象管理"
        description="维护意象基础词表，并快速查看每个意象目前挂接的分类和出现次数。样式统一为后台主面板的圆角、浮层和搜索输入语言。"
        actions={
          <>
            <StatPill label="当前结果" value={`${filteredCount} 个`} />
            <button onClick={onAdd} className={primaryButtonClassName()}>
              <Plus size={14} />
              新增意象
            </button>
          </>
        }
      />

      <div className={cn(cardClassName(), "overflow-hidden")}>
        <div className="border-b border-slate-200/70 px-6 py-5 dark:border-slate-800/70">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                意象总览
              </h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                搜索、浏览并维护意象词条。
              </p>
            </div>
            <SearchField
              value={searchTerm}
              onChange={onSearchTermChange}
              placeholder="搜索意象名称…"
              className="w-full md:w-80"
            />
          </div>
        </div>

        <div className="px-6 py-5">
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
              description={searchTerm ? "试试别的关键词。" : "点击右上角的按钮创建第一条意象。"}
            />
          ) : (
            <div className="space-y-3">
              {pagedItems.map((item) => {
                const categoryNames = item.categoryIds
                  .map((categoryId) => categories.find((category) => category.id === categoryId)?.name)
                  .filter((value): value is string => Boolean(value));

                return (
                  <div
                    key={item.id}
                    className="group rounded-[24px] border border-slate-200/70 bg-white px-4 py-4 transition-all hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-lg hover:shadow-violet-500/5 dark:border-slate-800/70 dark:bg-slate-900/60 dark:hover:border-violet-900/40"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-fuchsia-50 text-violet-600 dark:from-violet-900/40 dark:to-slate-900 dark:text-violet-300">
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
      </div>
    </div>
  );
}
