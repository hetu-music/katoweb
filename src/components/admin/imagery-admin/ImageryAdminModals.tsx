import {
  type CategoryFormValues,
  createCategoryFormValues,
  createDeleteConfirmationFormValues,
  createImageryFormValues,
  deleteConfirmationFormSchema,
  imageryFormSchema,
  categoryFormSchema,
  type ImageryFormValues,
} from "@/lib/imagery-form";
import type { ImageryCategory } from "@/lib/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2, X } from "lucide-react";
import { useEffect } from "react";
import { type Resolver, useForm } from "react-hook-form";
import {
  compactInputClassName,
  formLabelClassName,
  ghostButtonClassName,
  ModalBackdrop,
  ModalCard,
  primaryButtonClassName,
} from "./shared";
import type { ModalState } from "./types";

export default function ImageryAdminModals({
  modal,
  categories,
  isSubmitting,
  onClose,
  onAddImagery,
  onEditImagery,
  onDeleteImagery,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
  onDeleteMeaning,
  onDeleteOccurrence,
  deleteSubmitting,
  getCategoryPath,
}: {
  modal: ModalState;
  categories: ImageryCategory[];
  isSubmitting: boolean;
  onClose: () => void;
  onAddImagery: (values: ImageryFormValues) => void | Promise<void>;
  onEditImagery: (values: ImageryFormValues) => void | Promise<void>;
  onDeleteImagery: () => void;
  onAddCategory: (values: CategoryFormValues) => void | Promise<void>;
  onEditCategory: (values: CategoryFormValues) => void | Promise<void>;
  onDeleteCategory: () => void;
  onDeleteMeaning: () => void;
  onDeleteOccurrence: () => void;
  deleteSubmitting: boolean;
  getCategoryPath: (categoryId: number) => string;
}) {
  const imageryForm = useForm<ImageryFormValues>({
    resolver: zodResolver(imageryFormSchema) as Resolver<ImageryFormValues>,
    defaultValues: createImageryFormValues(),
    mode: "onBlur",
    reValidateMode: "onChange",
  });
  const categoryForm = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema) as Resolver<CategoryFormValues>,
    defaultValues: createCategoryFormValues(),
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  useEffect(() => {
    if (modal.type === "add-imagery") {
      imageryForm.reset(createImageryFormValues());
    } else if (modal.type === "edit-imagery") {
      imageryForm.reset(createImageryFormValues(modal.item));
    }
  }, [imageryForm, modal]);

  useEffect(() => {
    if (modal.type === "add-category") {
      categoryForm.reset(
        createCategoryFormValues({ parent_id: modal.parentId ?? null }),
      );
    } else if (modal.type === "edit-category") {
      categoryForm.reset(createCategoryFormValues(modal.category));
    }
  }, [categoryForm, modal]);

  if (modal.type === "none") return null;

  if (modal.type === "add-imagery" || modal.type === "edit-imagery") {
    return (
      <ModalBackdrop onClose={onClose}>
        <ModalCard>
          <form
            onSubmit={imageryForm.handleSubmit((values) =>
              modal.type === "add-imagery"
                ? onAddImagery(values)
                : onEditImagery(values),
            )}
          >
            <div className="border-b border-slate-200/70 px-6 py-5 dark:border-slate-800/70">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.25em] text-violet-500">
                    Imagery Item
                  </div>
                  <h2 className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100">
                    {modal.type === "add-imagery"
                      ? "新增意象"
                      : `编辑意象 · ${modal.item.name}`}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="px-6 py-6">
              <label className={formLabelClassName()}>
                意象名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="如：明月、江水、枫叶…"
                maxLength={50}
                autoFocus
                {...imageryForm.register("name")}
                className={compactInputClassName()}
              />
              {imageryForm.formState.errors.name && (
                <p className="mt-2 text-xs text-red-500">
                  {imageryForm.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-200/70 px-6 py-5 dark:border-slate-800/70">
              <button
                type="button"
                onClick={onClose}
                className={ghostButtonClassName()}
              >
                取消
              </button>
              <button
                type="submit"
                disabled={isSubmitting || imageryForm.formState.isSubmitting}
                className={primaryButtonClassName()}
              >
                {(isSubmitting || imageryForm.formState.isSubmitting) && (
                  <Loader2 size={14} className="animate-spin" />
                )}
                {modal.type === "add-imagery" ? "创建" : "保存"}
              </button>
            </div>
          </form>
        </ModalCard>
      </ModalBackdrop>
    );
  }

  if (
    modal.type === "delete-imagery" ||
    modal.type === "delete-category" ||
    modal.type === "delete-meaning" ||
    modal.type === "delete-occurrence"
  ) {
    const title =
      modal.type === "delete-imagery"
        ? "确认删除意象"
        : modal.type === "delete-category"
          ? "确认删除分类"
          : modal.type === "delete-meaning"
            ? "确认删除含义"
            : "确认删除关系";
    const label =
      modal.type === "delete-imagery"
        ? modal.item.name
        : modal.type === "delete-category"
          ? modal.category.name
          : modal.label;
    const description =
      modal.type === "delete-imagery"
        ? `将删除意象「${label}」。${modal.item.count > 0 ? ` 当前已有 ${modal.item.count} 条关系记录。` : ""}`
        : modal.type === "delete-category"
          ? `将删除分类「${label}」。`
          : modal.type === "delete-meaning"
            ? `将删除含义「${label}」。`
            : `将删除关系记录「${label}」。`;
    const handleConfirm =
      modal.type === "delete-imagery"
        ? onDeleteImagery
        : modal.type === "delete-category"
          ? onDeleteCategory
          : modal.type === "delete-meaning"
            ? onDeleteMeaning
            : onDeleteOccurrence;

    return (
      <DeleteConfirmationModal
        key={`${modal.type}-${label}`}
        title={title}
        description={description}
        submitting={deleteSubmitting || isSubmitting}
        onClose={onClose}
        onConfirm={handleConfirm}
      />
    );
  }

  if (modal.type === "add-category" || modal.type === "edit-category") {
    return (
      <ModalBackdrop onClose={onClose}>
        <ModalCard>
          <form
            onSubmit={categoryForm.handleSubmit((values) =>
              modal.type === "add-category"
                ? onAddCategory(values)
                : onEditCategory(values),
            )}
          >
            <div className="border-b border-slate-200/70 px-6 py-5 dark:border-slate-800/70">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.25em] text-violet-500">
                    Category
                  </div>
                  <h2 className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100">
                    {modal.type === "add-category"
                      ? "新增分类"
                      : `编辑分类 · ${modal.category.name}`}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="space-y-4 px-6 py-6">
              <div>
                <label className={formLabelClassName()}>
                  分类名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  autoFocus
                  {...categoryForm.register("name")}
                  className={compactInputClassName()}
                />
                {categoryForm.formState.errors.name && (
                  <p className="mt-2 text-xs text-red-500">
                    {categoryForm.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label className={formLabelClassName()}>父分类</label>
                <select
                  {...categoryForm.register("parent_id", {
                    setValueAs: (value) => (value ? Number(value) : null),
                  })}
                  className={compactInputClassName()}
                >
                  <option value="">（顶级分类）</option>
                  {categories
                    .filter(
                      (category) =>
                        (modal.type !== "edit-category" ||
                          category.id !== modal.category.id) &&
                        (category.level ?? 0) < 3,
                    )
                    .map((category) => (
                      <option key={category.id} value={category.id}>
                        {getCategoryPath(category.id)}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className={formLabelClassName()}>描述</label>
                <textarea
                  rows={3}
                  maxLength={500}
                  {...categoryForm.register("description")}
                  className={compactInputClassName()}
                />
                {categoryForm.formState.errors.description && (
                  <p className="mt-2 text-xs text-red-500">
                    {categoryForm.formState.errors.description.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-200/70 px-6 py-5 dark:border-slate-800/70">
              <button
                type="button"
                onClick={onClose}
                className={ghostButtonClassName()}
              >
                取消
              </button>
              <button
                type="submit"
                disabled={isSubmitting || categoryForm.formState.isSubmitting}
                className={primaryButtonClassName()}
              >
                {(isSubmitting || categoryForm.formState.isSubmitting) && (
                  <Loader2 size={14} className="animate-spin" />
                )}
                保存
              </button>
            </div>
          </form>
        </ModalCard>
      </ModalBackdrop>
    );
  }

  return null;
}

function DeleteConfirmationModal({
  title,
  description,
  submitting,
  onClose,
  onConfirm,
}: {
  title: string;
  description: string;
  submitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const form = useForm({
    resolver:
      zodResolver(deleteConfirmationFormSchema) as Resolver<{
        confirmationText: string;
      }>,
    defaultValues: createDeleteConfirmationFormValues(),
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  useEffect(() => {
    form.reset(createDeleteConfirmationFormValues());
  }, [form, title]);

  return (
    <ModalBackdrop onClose={onClose}>
      <ModalCard>
        <form onSubmit={form.handleSubmit(() => onConfirm())}>
          <div className="px-6 py-6">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                <AlertCircle size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                  {description}
                </p>
                <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
                  请输入 <span className="font-semibold text-red-500">删除</span>{" "}
                  以完成二次确认。
                </p>
              </div>
            </div>
            <div className="mt-5">
              <input
                type="text"
                placeholder="输入“删除”确认"
                autoFocus
                {...form.register("confirmationText")}
                className={compactInputClassName()}
              />
              {form.formState.errors.confirmationText && (
                <p className="mt-2 text-xs text-red-500">
                  {form.formState.errors.confirmationText.message}
                </p>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-200/70 px-6 py-5 dark:border-slate-800/70">
            <button
              type="button"
              onClick={onClose}
              className={ghostButtonClassName()}
            >
              取消
            </button>
            <button
              type="submit"
              disabled={submitting || form.formState.isSubmitting}
              className="inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-500 disabled:opacity-50"
            >
              {(submitting || form.formState.isSubmitting) && (
                <Loader2 size={14} className="animate-spin" />
              )}
              确认删除
            </button>
          </div>
        </form>
      </ModalCard>
    </ModalBackdrop>
  );
}
