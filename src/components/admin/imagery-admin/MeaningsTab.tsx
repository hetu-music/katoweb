import {
  createMeaningFormValues,
  meaningFormSchema,
  type MeaningFormValues,
} from "@/lib/imagery-form";
import type { ImageryMeaning } from "@/lib/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { BookOpen, Edit2, Trash2 } from "lucide-react";
import { useEffect } from "react";
import { type Resolver, useForm } from "react-hook-form";
import {
  compactInputClassName,
  EmptyState,
  formLabelClassName,
  ghostButtonClassName,
  LoadingState,
  PaginationControls,
  primaryButtonClassName,
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
  pagedMeanings,
  addingMeaning,
  editingMeaning,
  meaningSubmitting,
  currentPage,
  totalPages,
  onPageChange,
  onStartEdit,
  onReset,
  onCreate,
  onUpdate,
  onDelete,
}: {
  meaningsLoading: boolean;
  meaningsSearchTerm: string;
  pagedMeanings: ImageryMeaning[];
  addingMeaning: boolean;
  editingMeaning: ImageryMeaning | null;
  meaningSubmitting: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onStartEdit: (meaning: ImageryMeaning) => void;
  onReset: () => void;
  onCreate: (values: MeaningFormValues) => void | Promise<void>;
  onUpdate: (values: MeaningFormValues) => void | Promise<void>;
  onDelete: (meaning: ImageryMeaning) => void;
}) {
  return (
    <div className="space-y-3">
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
                      className="flex flex-col bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden transition-all hover:shadow-md hover:border-amber-200 dark:hover:border-amber-900/30 px-4 py-4 group"
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
  );
}
