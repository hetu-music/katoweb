import { z } from "zod";
import type { OccurrenceWithSong } from "./service-imagery";
import type { ImageryCategory, ImageryItem, ImageryMeaning } from "./types";

const normalizeString = (value: unknown) =>
  typeof value === "string" ? value : value == null ? "" : String(value);

export function parseLyricTimetag(value: string) {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error("lyric_timetag 必须是正确的 JSON 数组。");
  }

  if (
    !Array.isArray(parsed) ||
    parsed.some(
      (item) =>
        typeof item !== "object" || item === null || Array.isArray(item),
    )
  ) {
    throw new Error("lyric_timetag 必须是对象数组。");
  }

  return parsed as Record<string, unknown>[];
}

export const imageryFormSchema = z.object({
  name: z.preprocess(
    normalizeString,
    z
      .string()
      .trim()
      .min(1, "意象名称不能为空")
      .max(50, "意象名称不能超过50个字符"),
  ),
});

export const categoryFormSchema = z.object({
  name: z.preprocess(
    normalizeString,
    z.string().trim().min(1, "分类名称不能为空"),
  ),
  parent_id: z.number().int().positive().nullable(),
  description: z.preprocess(
    normalizeString,
    z.string().max(500, "描述不能超过500个字符"),
  ),
});

export const meaningFormSchema = z.object({
  label: z.preprocess(
    normalizeString,
    z.string().trim().min(1, "含义名称不能为空"),
  ),
  description: z.preprocess(normalizeString, z.string()),
});

export const relationFormSchema = z.object({
  imagery_id: z.number().int().positive("请先选择意象"),
  category_id: z.number().int().positive("请先选择分类"),
  meaning_id: z.number().int().positive().nullable(),
  lyric_timetag: z.preprocess(
    normalizeString,
    z.string().superRefine((value, context) => {
      try {
        parseLyricTimetag(value);
      } catch (error) {
        context.addIssue({
          code: "custom",
          message:
            error instanceof Error ? error.message : "lyric_timetag 格式错误",
        });
      }
    }),
  ),
});

export const deleteConfirmationFormSchema = z.object({
  confirmationText: z
    .string()
    .trim()
    .refine((value) => value === "删除", "请输入“删除”以确认操作"),
});

export type ImageryFormValues = z.infer<typeof imageryFormSchema>;
export type CategoryFormValues = z.infer<typeof categoryFormSchema>;
export type MeaningFormValues = z.infer<typeof meaningFormSchema>;
export type RelationFormValues = z.infer<typeof relationFormSchema>;
export type DeleteConfirmationFormValues = z.input<
  typeof deleteConfirmationFormSchema
>;

export function createImageryFormValues(
  item?: Pick<ImageryItem, "name">,
): ImageryFormValues {
  return {
    name: item?.name ?? "",
  };
}

export function createCategoryFormValues(
  category?: Partial<ImageryCategory>,
): CategoryFormValues {
  return {
    name: category?.name ?? "",
    parent_id:
      typeof category?.parent_id === "number" ? category.parent_id : null,
    description: category?.description ?? "",
  };
}

export function createMeaningFormValues(
  meaning?: Partial<ImageryMeaning>,
): MeaningFormValues {
  return {
    label: meaning?.label ?? "",
    description: meaning?.description ?? "",
  };
}

export function createRelationFormValues(
  occurrence?: Partial<OccurrenceWithSong>,
): RelationFormValues {
  return {
    imagery_id:
      typeof occurrence?.imagery_id === "number" ? occurrence.imagery_id : 0,
    category_id:
      typeof occurrence?.category_id === "number" ? occurrence.category_id : 0,
    meaning_id:
      typeof occurrence?.meaning_id === "number" ? occurrence.meaning_id : null,
    lyric_timetag: occurrence?.lyric_timetag
      ? JSON.stringify(occurrence.lyric_timetag, null, 2)
      : "[]",
  };
}

export function createDeleteConfirmationFormValues(): DeleteConfirmationFormValues {
  return {
    confirmationText: "",
  };
}

export function toCategoryPayload(
  values: CategoryFormValues,
  categories: ImageryCategory[],
) {
  const parent = values.parent_id
    ? categories.find((category) => category.id === values.parent_id)
    : null;

  return {
    name: values.name.trim(),
    parent_id: values.parent_id,
    level: parent ? (parent.level ?? 0) + 1 : 0,
    description: values.description.trim() || null,
  };
}

export function toMeaningPayload(values: MeaningFormValues) {
  return {
    label: values.label.trim(),
    description: values.description.trim() || null,
  };
}

export function toRelationPayload(values: RelationFormValues) {
  return {
    imagery_id: values.imagery_id,
    category_id: values.category_id,
    meaning_id: values.meaning_id,
    lyric_timetag: parseLyricTimetag(values.lyric_timetag),
  };
}
