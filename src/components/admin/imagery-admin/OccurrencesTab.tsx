import {
  createRelationFormValues,
  relationFormSchema,
  type RelationFormValues,
} from "@/lib/forms/imagery-form";
import type { OccurrenceWithSong } from "@/lib/server/service-imagery";
import type { ImageryCategory, ImageryItem, ImageryMeaning } from "@/lib/types";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ChevronDown,
  ChevronRight,
  Edit2,
  Layers,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useEffect } from "react";
import { type Resolver, useFieldArray, useForm } from "react-hook-form";
import {
  compactInputClassName,
  EmptyState,
  ghostButtonClassName,
  LoadingState,
  PaginationControls,
  primaryButtonClassName,
} from "./shared";
import type { RelationEditor, SongOption } from "./types";

function RelationEditorCard({
  title,
  items,
  leafCategories,
  meanings,
  categories,
  initialValues,
  submitting,
  onSave,
  onCancel,
  getCategoryPath,
}: {
  title: string;
  items: ImageryItem[];
  leafCategories: ImageryCategory[];
  meanings: ImageryMeaning[];
  categories: ImageryCategory[];
  initialValues: RelationFormValues;
  submitting: boolean;
  onSave: (values: RelationFormValues) => void | Promise<void>;
  onCancel: () => void;
  getCategoryPath: (
    categoryId: number,
    categories: ImageryCategory[],
  ) => string;
}) {
  const form = useForm<RelationFormValues>({
    resolver: zodResolver(relationFormSchema) as Resolver<RelationFormValues>,
    defaultValues: initialValues,
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lyric_timetag",
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
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          {title}
        </p>
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <select
              {...form.register("imagery_id", {
                setValueAs: (value) => Number(value) || 0,
              })}
              className={compactInputClassName()}
            >
              <option value={0}>— 选择意象 —</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}（ID: {item.id}）
                </option>
              ))}
            </select>
            {form.formState.errors.imagery_id && (
              <p className="mt-2 text-xs text-red-500">
                {form.formState.errors.imagery_id.message}
              </p>
            )}
          </div>

          <div>
            <select
              {...form.register("category_id", {
                setValueAs: (value) => Number(value) || 0,
              })}
              className={compactInputClassName()}
            >
              <option value={0}>— 选择分类 —</option>
              {leafCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {getCategoryPath(category.id, categories)}
                </option>
              ))}
            </select>
            {form.formState.errors.category_id && (
              <p className="mt-2 text-xs text-red-500">
                {form.formState.errors.category_id.message}
              </p>
            )}
          </div>

          <div>
            <select
              {...form.register("meaning_id", {
                setValueAs: (value) => (value ? Number(value) : null),
              })}
              className={compactInputClassName()}
            >
              <option value="">— 选择含义（可选）—</option>
              {meanings.map((meaning) => (
                <option key={meaning.id} value={meaning.id}>
                  {meaning.label}（ID: {meaning.id}）
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            Lyric Timetag
          </label>
          <div className="space-y-2">
            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-2">
                <input
                  {...form.register(`lyric_timetag.${index}.value`)}
                  placeholder="01:26.04 或 01:26.040"
                  className={`flex-1 font-mono text-xs ${compactInputClassName()}`}
                />
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="rounded-lg p-2 text-red-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            {fields.map((_, index) =>
              form.formState.errors.lyric_timetag?.[index]?.value ? (
                <p key={index} className="text-xs text-red-500">
                  第 {index + 1} 项：
                  {form.formState.errors.lyric_timetag[index]?.value?.message}
                </p>
              ) : null,
            )}
            <button
              type="button"
              onClick={() => append({ value: "" })}
              className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
            >
              <Plus size={13} />
              添加一项
            </button>
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
            保存
          </button>
        </div>
      </form>
    </div>
  );
}

function OccurrenceRow({
  songId,
  occurrence,
  categories,
  getCategoryPath,
  onEdit,
  onDelete,
}: {
  songId: number;
  occurrence: OccurrenceWithSong;
  categories: ImageryCategory[];
  getCategoryPath: (
    categoryId: number,
    categories: ImageryCategory[],
  ) => string;
  onEdit: (songId: number, occurrence: OccurrenceWithSong) => void;
  onDelete: (occurrenceId: number, songId: number, label: string) => void;
}) {
  return (
    <div className="flex flex-col bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden transition-all hover:shadow-md hover:border-blue-200 dark:hover:border-blue-900/30 px-4 py-4 group">
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {occurrence.imagery_name ?? `意象 #${occurrence.imagery_id}`}
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500 dark:bg-slate-800 dark:text-slate-300">
              imagery_id {occurrence.imagery_id}
            </span>
            <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[11px] text-violet-700 dark:bg-violet-900/20 dark:text-violet-300">
              category_id {occurrence.category_id}
            </span>
            {occurrence.meaning_id && (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
                meaning_id {occurrence.meaning_id}
              </span>
            )}
          </div>

          <div className="mt-3 grid gap-2 text-sm text-slate-500 dark:text-slate-400 md:grid-cols-2">
            <p>分类：{getCategoryPath(occurrence.category_id, categories)}</p>
            <p>含义：{occurrence.meaning_label ?? "未设置"}</p>
          </div>

          <div className="mt-3">
            <div className="mb-1 text-xs uppercase tracking-[0.2em] text-slate-400">
              lyric_timetag
            </div>
            <div className="flex flex-wrap gap-1.5">
              {occurrence.lyric_timetag.length > 0 ? (
                occurrence.lyric_timetag.map((t, i) => (
                  <span
                    key={i}
                    className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-[11px] text-slate-600 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-300"
                  >
                    {t}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400">（无）</span>
              )}
            </div>
          </div>
        </div>

        <div className="invisible flex items-center gap-1 group-hover:visible">
          <button
            type="button"
            onClick={() => onEdit(songId, occurrence)}
            className="rounded-xl p-2 text-emerald-600 transition-colors hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
          >
            <Edit2 size={13} />
          </button>
          <button
            type="button"
            onClick={() =>
              onDelete(
                occurrence.id,
                songId,
                occurrence.imagery_name ?? `意象 #${occurrence.imagery_id}`,
              )
            }
            className="rounded-xl p-2 text-red-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OccurrencesTab({
  songSearchTerm,
  songsLoading,
  pagedSongs,
  occurrencesBySong,
  expandedSongId,
  occurrenceLoadingSongId,
  relationEditor,
  occurrenceSubmitting,
  items,
  categories,
  leafCategories,
  meanings,
  currentPage,
  totalPages,
  onPageChange,
  onToggleSongPanel,
  onStartAddRelation,
  onStartEditRelation,
  onResetRelationEditor,
  onSaveRelation,
  onDeleteRelation,
  getCategoryPath,
}: {
  songSearchTerm: string;
  songsLoading: boolean;
  pagedSongs: SongOption[];
  occurrencesBySong: Record<number, OccurrenceWithSong[]>;
  expandedSongId: number | null;
  occurrenceLoadingSongId: number | null;
  relationEditor: RelationEditor;
  occurrenceSubmitting: boolean;
  items: ImageryItem[];
  categories: ImageryCategory[];
  leafCategories: ImageryCategory[];
  meanings: ImageryMeaning[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onToggleSongPanel: (songId: number) => Promise<void>;
  onStartAddRelation: (songId: number) => Promise<void>;
  onStartEditRelation: (songId: number, occurrence: OccurrenceWithSong) => void;
  onResetRelationEditor: () => void;
  onSaveRelation: (values: RelationFormValues) => void | Promise<void>;
  onDeleteRelation: (
    occurrenceId: number,
    songId: number,
    label: string,
  ) => void;
  getCategoryPath: (
    categoryId: number,
    categories: ImageryCategory[],
  ) => string;
}) {
  return (
    <div className="space-y-3">
      {songsLoading ? (
        <LoadingState text="加载歌曲中…" />
      ) : pagedSongs.length === 0 ? (
        <EmptyState
          icon={<Layers size={24} />}
          title={songSearchTerm ? "没有找到匹配的歌曲" : "暂无歌曲"}
          description={
            songSearchTerm ? "试试别的关键词。" : "当前没有可管理关系的歌曲。"
          }
        />
      ) : (
        <>
          {pagedSongs.map((song) => {
            const occurrences = occurrencesBySong[song.id] ?? [];
            const isExpanded = expandedSongId === song.id;
            const isLoadingOccurrences = occurrenceLoadingSongId === song.id;
            const isAddingHere =
              relationEditor.type === "add" &&
              relationEditor.songId === song.id;

            return (
              <div
                key={song.id}
                className="flex flex-col bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden transition-all hover:shadow-md hover:border-blue-200 dark:hover:border-blue-900/30"
              >
                <div className="flex items-center gap-3 px-4 py-4">
                  <button
                    type="button"
                    onClick={() => void onToggleSongPanel(song.id)}
                    className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    {isExpanded ? (
                      <ChevronDown size={16} />
                    ) : (
                      <ChevronRight size={16} />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-semibold text-slate-900 dark:text-slate-100">
                        {song.title}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                        song_id {song.id}
                      </span>
                      {song.album && (
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                          {song.album}
                        </span>
                      )}
                      {occurrencesBySong[song.id] && (
                        <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[11px] text-violet-700 dark:bg-violet-900/20 dark:text-violet-300">
                          {occurrences.length} 条关系
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => void onStartAddRelation(song.id)}
                    className={primaryButtonClassName()}
                  >
                    <Plus size={12} />
                    新增关系
                  </button>
                </div>

                {isExpanded && (
                  <div className="border-t border-slate-200/70 px-4 py-4 dark:border-slate-800/70">
                    {isLoadingOccurrences ? (
                      <LoadingState text="加载关系中…" />
                    ) : (
                      <div className="space-y-3">
                        {isAddingHere && (
                          <RelationEditorCard
                            title={`新增到歌曲 #${song.id}`}
                            items={items}
                            leafCategories={leafCategories}
                            meanings={meanings}
                            categories={categories}
                            initialValues={createRelationFormValues()}
                            submitting={occurrenceSubmitting}
                            onSave={onSaveRelation}
                            onCancel={onResetRelationEditor}
                            getCategoryPath={getCategoryPath}
                          />
                        )}

                        {occurrences.map((occurrence) => {
                          const isEditingThis =
                            relationEditor.type === "edit" &&
                            relationEditor.occurrence.id === occurrence.id;

                          return isEditingThis ? (
                            <RelationEditorCard
                              key={occurrence.id}
                              title={`编辑关系 #${occurrence.id}`}
                              items={items}
                              leafCategories={leafCategories}
                              meanings={meanings}
                              categories={categories}
                              initialValues={createRelationFormValues(
                                relationEditor.occurrence,
                              )}
                              submitting={occurrenceSubmitting}
                              onSave={onSaveRelation}
                              onCancel={onResetRelationEditor}
                              getCategoryPath={getCategoryPath}
                            />
                          ) : (
                            <OccurrenceRow
                              key={occurrence.id}
                              songId={song.id}
                              occurrence={occurrence}
                              categories={categories}
                              getCategoryPath={getCategoryPath}
                              onEdit={onStartEditRelation}
                              onDelete={onDeleteRelation}
                            />
                          );
                        })}

                        {occurrences.length === 0 && !isAddingHere && (
                          <EmptyState
                            icon={<Layers size={20} />}
                            title="暂无关系"
                            description="点击右上角“新增关系”创建第一条记录。"
                          />
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </>
      )}
    </div>
  );
}
