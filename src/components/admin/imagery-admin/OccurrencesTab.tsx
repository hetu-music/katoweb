import type { OccurrenceWithSong } from "@/lib/service-imagery";
import type { ImageryCategory, ImageryItem, ImageryMeaning } from "@/lib/types";
import {
  ChevronDown,
  ChevronRight,
  Edit2,
  Layers,
  Plus,
  Trash2,
} from "lucide-react";
import {
  cardClassName,
  compactInputClassName,
  EmptyState,
  ghostButtonClassName,
  LoadingState,
  PaginationControls,
  primaryButtonClassName,
  SearchField,
  SectionIntro,
  StatPill,
} from "./shared";
import type {
  RelationEditor,
  RelationFormState,
  SetRelationForm,
  SongOption,
} from "./types";

function RelationEditorCard({
  title,
  items,
  leafCategories,
  meanings,
  categories,
  relationForm,
  setRelationForm,
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
  relationForm: RelationFormState;
  setRelationForm: SetRelationForm;
  submitting: boolean;
  onSave: () => void;
  onCancel: () => void;
  getCategoryPath: (
    categoryId: number,
    categories: ImageryCategory[],
  ) => string;
}) {
  void categories;
  return (
    <div className="rounded-3xl border border-slate-200/70 bg-slate-50/90 p-4 dark:border-slate-700 dark:bg-slate-950/30">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
        {title}
      </p>
      <div className="grid gap-3 md:grid-cols-3">
        <select
          value={relationForm.imagery_id}
          onChange={(event) =>
            setRelationForm((current) => ({
              ...current,
              imagery_id: parseInt(event.target.value, 10) || 0,
            }))
          }
          className={compactInputClassName()}
        >
          <option value={0}>— 选择意象 —</option>
          {items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}（ID: {item.id}）
            </option>
          ))}
        </select>

        <select
          value={relationForm.category_id}
          onChange={(event) =>
            setRelationForm((current) => ({
              ...current,
              category_id: parseInt(event.target.value, 10) || 0,
            }))
          }
          className={compactInputClassName()}
        >
          <option value={0}>— 选择分类 —</option>
          {leafCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {getCategoryPath(category.id, categories)}
            </option>
          ))}
        </select>

        <select
          value={relationForm.meaning_id ?? ""}
          onChange={(event) =>
            setRelationForm((current) => ({
              ...current,
              meaning_id: event.target.value
                ? parseInt(event.target.value, 10)
                : null,
            }))
          }
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

      <textarea
        value={relationForm.lyric_timetag}
        onChange={(event) =>
          setRelationForm((current) => ({
            ...current,
            lyric_timetag: event.target.value,
          }))
        }
        rows={4}
        placeholder='lyric_timetag JSON，如：[{"start": 12.4, "end": 14.8}]'
        className={`mt-3 w-full ${compactInputClassName()} text-xs font-mono`}
      />

      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className={ghostButtonClassName()}
        >
          取消
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={submitting}
          className={primaryButtonClassName()}
        >
          保存
        </button>
      </div>
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
  onDelete: (songId: number, occurrence: OccurrenceWithSong) => void;
}) {
  return (
    <div className="group rounded-[24px] border border-slate-200/70 bg-white px-4 py-4 dark:border-slate-800/70 dark:bg-slate-900/60">
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
            <pre className="overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-600 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-300">
              {JSON.stringify(occurrence.lyric_timetag, null, 2)}
            </pre>
          </div>
        </div>

        <div className="hidden items-center gap-1 group-hover:flex">
          <button
            type="button"
            onClick={() => onEdit(songId, occurrence)}
            className="rounded-xl p-2 text-emerald-600 transition-colors hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
          >
            <Edit2 size={13} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(songId, occurrence)}
            className="rounded-xl p-2 text-red-500 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
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
  filteredCount,
  songsLoading,
  pagedSongs,
  occurrencesBySong,
  expandedSongId,
  occurrenceLoadingSongId,
  relationEditor,
  relationForm,
  setRelationForm,
  occurrenceSubmitting,
  items,
  categories,
  leafCategories,
  meanings,
  currentPage,
  totalPages,
  onSearchTermChange,
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
  filteredCount: number;
  songsLoading: boolean;
  pagedSongs: SongOption[];
  occurrencesBySong: Record<number, OccurrenceWithSong[]>;
  expandedSongId: number | null;
  occurrenceLoadingSongId: number | null;
  relationEditor: RelationEditor;
  relationForm: RelationFormState;
  setRelationForm: SetRelationForm;
  occurrenceSubmitting: boolean;
  items: ImageryItem[];
  categories: ImageryCategory[];
  leafCategories: ImageryCategory[];
  meanings: ImageryMeaning[];
  currentPage: number;
  totalPages: number;
  onSearchTermChange: (value: string) => void;
  onPageChange: (page: number) => void;
  onToggleSongPanel: (songId: number) => Promise<void>;
  onStartAddRelation: (songId: number) => Promise<void>;
  onStartEditRelation: (songId: number, occurrence: OccurrenceWithSong) => void;
  onResetRelationEditor: () => void;
  onSaveRelation: () => void;
  onDeleteRelation: (songId: number, occurrence: OccurrenceWithSong) => void;
  getCategoryPath: (
    categoryId: number,
    categories: ImageryCategory[],
  ) => string;
}) {
  return (
    <div className="space-y-6">
      <SectionIntro
        eyebrow="Song Relations"
        title="关系管理"
        description="按歌曲分页展示并展开维护每条关系记录；每条记录都聚焦 imagery_id、category_id、meaning_id 与 lyric_timetag。"
        actions={<StatPill label="歌曲结果" value={`${filteredCount} 首`} />}
      />

      <div className={cardClassName()}>
        <div className="border-b border-slate-200/70 px-6 py-5 dark:border-slate-800/70">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                按歌曲维护关系
              </h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                搜索歌曲后展开对应面板，即可查看和编辑该 song_id
                下的全部意象关系。
              </p>
            </div>
            <SearchField
              value={songSearchTerm}
              onChange={onSearchTermChange}
              placeholder="搜索歌曲名、专辑或 song_id…"
              className="w-full md:w-80"
            />
          </div>
        </div>

        <div className="space-y-3 px-6 py-5">
          {songsLoading ? (
            <LoadingState text="加载歌曲中…" />
          ) : pagedSongs.length === 0 ? (
            <EmptyState
              icon={<Layers size={24} />}
              title={songSearchTerm ? "没有找到匹配的歌曲" : "暂无歌曲"}
              description={
                songSearchTerm
                  ? "试试别的关键词。"
                  : "当前没有可管理关系的歌曲。"
              }
            />
          ) : (
            <>
              {pagedSongs.map((song) => {
                const occurrences = occurrencesBySong[song.id] ?? [];
                const isExpanded = expandedSongId === song.id;
                const isLoadingOccurrences =
                  occurrenceLoadingSongId === song.id;
                const isAddingHere =
                  relationEditor.type === "add" &&
                  relationEditor.songId === song.id;

                return (
                  <div
                    key={song.id}
                    className="overflow-hidden rounded-[24px] border border-slate-200/70 bg-white dark:border-slate-800/70 dark:bg-slate-900/60"
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
                                relationForm={relationForm}
                                setRelationForm={setRelationForm}
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
                                  relationForm={relationForm}
                                  setRelationForm={setRelationForm}
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
                              <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-400 dark:border-slate-800">
                                当前歌曲暂无关系记录
                              </div>
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
      </div>
    </div>
  );
}
