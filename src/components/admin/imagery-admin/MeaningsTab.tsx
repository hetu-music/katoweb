import {
  createMeaningFormValues,
  meaningFormSchema,
  type MeaningFormValues,
} from "@/lib/imagery-form";
import type { ImageryMeaning } from "@/lib/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { BookOpen, Edit2, Plus, Trash2 } from "lucide-react";
import { useEffect } from "react";
import { type Resolver, useForm } from "react-hook-form";
import {
  cardClassName,
  compactInputClassName,
  EmptyState,
  formLabelClassName,
  ghostButtonClassName,
  LoadingState,
  PaginationControls,
  primaryButtonClassName,
  SearchField,
  SectionIntro,
  StatPill,
} from "./shared";

function MeaningEditor({
  initialValues,
  submitting,
  saveLabel,
  onSave,
  onCancel,
  autoFocus,
}: {
  initialValues: MeaningFormValues;
  submitting: boolean;
  saveLabel: string;
  onSave: (values: MeaningFormValues) => void | Promise<void>;
  onCancel: () => void;
  autoFocus?: boolean;
}) {
  const form = useForm<MeaningFormValues>({
    resolver: zodResolver(meaningFormSchema) as Resolver<MeaningFormValues>,
    defaultValues: initialValues,
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  useEffect(() => {
    form.reset(initialValues);
  }, [form, initialValues]);

  return (
    <div className="rounded-3xl border border-slate-200/70 bg-slate-50/90 p-4 dark:border-slate-700 dark:bg-slate-950/30">
      <form
        onSubmit={form.handleSubmit((values) => onSave(values))}
        className="space-y-4"
      >
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <div>
            <label className={formLabelClassName()}>含义名称</label>
            <input
              type="text"
              placeholder="含义名称"
              autoFocus={autoFocus}
              {...form.register("label")}
              className={compactInputClassName()}
            />
            {form.formState.errors.label && (
              <p className="mt-2 text-xs text-red-500">
                {form.formState.errors.label.message}
              </p>
            )}
          </div>
          <div>
            <label className={formLabelClassName()}>描述</label>
            <textarea
              rows={3}
              placeholder="描述（可选）"
              {...form.register("description")}
              className={compactInputClassName()}
            />
            {form.formState.errors.description && (
              <p className="mt-2 text-xs text-red-500">
                {form.formState.errors.description.message}
              </p>
            )}
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className={ghostButtonClassName()}
          >
            取消
          </button>
          <button
            type="submit"
            disabled={submitting || form.formState.isSubmitting}
            className={primaryButtonClassName()}
          >
            {saveLabel}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function MeaningsTab({
  meaningsLoading,
  meaningsSearchTerm,
  filteredCount,
  pagedMeanings,
  addingMeaning,
  editingMeaning,
  meaningSubmitting,
  currentPage,
  totalPages,
  onSearchTermChange,
  onPageChange,
  onStartAdd,
  onStartEdit,
  onReset,
  onCreate,
  onUpdate,
  onDelete,
}: {
  meaningsLoading: boolean;
  meaningsSearchTerm: string;
  filteredCount: number;
  pagedMeanings: ImageryMeaning[];
  addingMeaning: boolean;
  editingMeaning: ImageryMeaning | null;
  meaningSubmitting: boolean;
  currentPage: number;
  totalPages: number;
  onSearchTermChange: (value: string) => void;
  onPageChange: (page: number) => void;
  onStartAdd: () => void;
  onStartEdit: (meaning: ImageryMeaning) => void;
  onReset: () => void;
  onCreate: (values: MeaningFormValues) => void | Promise<void>;
  onUpdate: (values: MeaningFormValues) => void | Promise<void>;
  onDelete: (meaning: ImageryMeaning) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionIntro
        eyebrow="Meaning Glossary"
        title="含义管理"
        description="这里仅维护 imagery_meanings 表中的名称和描述，作为全局含义词库使用，不再在该页面处理意象关系。"
        actions={
          <>
            <StatPill label="含义条目" value={`${filteredCount} 条`} />
            <button onClick={onStartAdd} className={primaryButtonClassName()}>
              <Plus size={14} />
              新增含义
            </button>
          </>
        }
      />

      <div className={cardClassName()}>
        <div className="border-b border-slate-200/70 px-6 py-5 dark:border-slate-800/70">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                全局含义词库
              </h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                名称与描述独立维护，供关系记录引用。
              </p>
            </div>
            <SearchField
              value={meaningsSearchTerm}
              onChange={onSearchTermChange}
              placeholder="搜索含义名称或描述…"
              className="w-full md:w-80"
            />
          </div>
        </div>

        <div className="space-y-3 px-6 py-5">
          {meaningsLoading ? (
            <LoadingState text="加载含义中…" />
          ) : (
            <>
              {addingMeaning && (
                <MeaningEditor
                  initialValues={createMeaningFormValues()}
                  submitting={meaningSubmitting}
                  saveLabel="创建"
                  onSave={onCreate}
                  onCancel={onReset}
                  autoFocus
                />
              )}

              {pagedMeanings.length === 0 && !addingMeaning ? (
                <EmptyState
                  icon={<BookOpen size={24} />}
                  title={meaningsSearchTerm ? "没有找到匹配的含义" : "暂无含义"}
                  description={
                    meaningsSearchTerm
                      ? "试试别的关键词。"
                      : "点击上方按钮创建第一条含义。"
                  }
                />
              ) : (
                pagedMeanings.map((meaning) =>
                  editingMeaning?.id === meaning.id ? (
                    <MeaningEditor
                      key={meaning.id}
                      initialValues={createMeaningFormValues(editingMeaning)}
                      submitting={meaningSubmitting}
                      saveLabel="保存"
                      onSave={onUpdate}
                      onCancel={onReset}
                      autoFocus
                    />
                  ) : (
                    <div
                      key={meaning.id}
                      className="group rounded-[24px] border border-slate-200/70 bg-white px-4 py-4 dark:border-slate-800/70 dark:bg-slate-900/60"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br from-violet-100 to-slate-100 text-violet-600 dark:from-violet-900/40 dark:to-slate-900 dark:text-violet-300">
                          <BookOpen size={18} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-base font-semibold text-slate-900 dark:text-slate-100">
                              {meaning.label}
                            </span>
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                              ID {meaning.id}
                            </span>
                          </div>
                          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-500 dark:text-slate-400">
                            {meaning.description || "暂无描述"}
                          </p>
                        </div>
                        <div className="hidden items-center gap-1 group-hover:flex">
                          <button
                            type="button"
                            onClick={() => onStartEdit(meaning)}
                            className="rounded-xl p-2 text-emerald-600 transition-colors hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(meaning)}
                            disabled={meaningSubmitting}
                            className="rounded-xl p-2 text-red-500 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ),
                )
              )}
            </>
          )}

          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </div>
      </div>
    </div>
  );
}
