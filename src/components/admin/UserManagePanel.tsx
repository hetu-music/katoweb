"use client";

import { apiGetUsers, apiUpdateUser } from "@/lib/client-api";
import type { UserRecord, UserUpdatePayload } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Loader2,
  Pencil,
  RefreshCw,
  Shield,
  ShieldOff,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface UserManagePanelProps {
  csrfToken: string;
}

interface EditState {
  name: string;
  display: boolean;
  intro: string;
  is_admin: boolean;
  navid_id: string;
  navid_pw: string; // write-only, empty = no change
}

function buildEditState(user: UserRecord): EditState {
  return {
    name: user.name,
    display: user.display,
    intro: user.intro ?? "",
    is_admin: user.is_admin,
    navid_id: user.navid_id ?? "",
    navid_pw: "",
  };
}

export default function UserManagePanel({ csrfToken }: UserManagePanelProps) {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { users: data } = await apiGetUsers();
      setUsers(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const startEdit = useCallback((user: UserRecord) => {
    setEditingId(user.id);
    setEditState(buildEditState(user));
    setExpandedId(user.id);
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditState(null);
  }, []);

  const handleSave = useCallback(
    async (userId: string) => {
      if (!editState) return;
      setSaving(true);
      setSaveMsg(null);
      try {
        const payload: UserUpdatePayload = {
          id: userId,
          name: editState.name,
          display: editState.display,
          intro: editState.intro || null,
          is_admin: editState.is_admin,
          navid_id: editState.navid_id || null,
        };
        // Only send navid_pw when user typed something
        if (editState.navid_pw) {
          payload.navid_pw = editState.navid_pw;
        }
        await apiUpdateUser(payload, csrfToken);
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId
              ? {
                  ...u,
                  name: editState.name,
                  display: editState.display,
                  intro: editState.intro || null,
                  is_admin: editState.is_admin,
                  navid_id: editState.navid_id || null,
                }
              : u,
          ),
        );
        setSaveMsg("已保存");
        setEditingId(null);
        setEditState(null);
      } catch (e) {
        setSaveMsg(e instanceof Error ? e.message : "保存失败");
      } finally {
        setSaving(false);
        setTimeout(() => setSaveMsg(null), 3000);
      }
    },
    [editState, csrfToken],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={28} className="animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-slate-500">
        <p className="text-sm">{error}</p>
        <button
          onClick={loadUsers}
          className="flex items-center gap-1.5 text-xs font-bold text-blue-500 hover:text-blue-600"
        >
          <RefreshCw size={13} />
          重试
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
          共 {users.length} 位用户
        </span>
        <div className="flex items-center gap-2">
          {saveMsg && (
            <span
              className={cn(
                "text-xs font-bold px-2 py-1 rounded-md",
                saveMsg === "已保存"
                  ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10"
                  : "text-rose-500 bg-rose-50 dark:bg-rose-500/10",
              )}
            >
              {saveMsg}
            </span>
          )}
          <button
            onClick={loadUsers}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="刷新"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* User List */}
      <div className="space-y-2">
        {users.map((user) => {
          const isEditing = editingId === user.id;
          const isExpanded = expandedId === user.id;

          return (
            <div
              key={user.id}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800/60 overflow-hidden transition-all"
            >
              {/* Row Header */}
              <div className="flex items-center gap-3 px-4 py-3">
                {/* Avatar initial */}
                <div className="w-9 h-9 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 p-[1.5px] shrink-0">
                  <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 flex items-center justify-center text-sm font-bold text-blue-600 dark:text-blue-400">
                    {user.name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                      {user.name}
                    </span>
                    {user.is_admin && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400">
                        <Shield size={10} />
                        管理员
                      </span>
                    )}
                    {user.sort_order === 1 && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400">
                        超管
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate font-mono">
                    {user.id}
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {!isEditing && (
                    <button
                      onClick={() => startEdit(user)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                      title="编辑"
                    >
                      <Pencil size={14} />
                    </button>
                  )}
                  <button
                    onClick={() =>
                      setExpandedId((prev) =>
                        prev === user.id ? null : user.id,
                      )
                    }
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title={isExpanded ? "收起" : "展开"}
                  >
                    {isExpanded ? (
                      <ChevronUp size={14} />
                    ) : (
                      <ChevronDown size={14} />
                    )}
                  </button>
                </div>
              </div>

              {/* Expanded Detail / Edit Form */}
              {isExpanded && (
                <div className="border-t border-slate-100 dark:border-slate-800 px-4 py-3 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                  {isEditing && editState ? (
                    <>
                      {/* Edit Fields */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Name */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                            用户名
                          </label>
                          <input
                            type="text"
                            value={editState.name}
                            onChange={(e) =>
                              setEditState((s) =>
                                s ? { ...s, name: e.target.value } : s,
                              )
                            }
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                          />
                        </div>

                        {/* navid_id */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                            Navid ID
                          </label>
                          <input
                            type="text"
                            value={editState.navid_id}
                            onChange={(e) =>
                              setEditState((s) =>
                                s ? { ...s, navid_id: e.target.value } : s,
                              )
                            }
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                          />
                        </div>

                        {/* navid_pw — write-only */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                            Navid 密码{" "}
                            <span className="text-slate-400 normal-case font-normal">
                              (留空=不修改)
                            </span>
                          </label>
                          <input
                            type="password"
                            value={editState.navid_pw}
                            onChange={(e) =>
                              setEditState((s) =>
                                s ? { ...s, navid_pw: e.target.value } : s,
                              )
                            }
                            placeholder="输入新密码"
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                          />
                        </div>

                        {/* intro */}
                        <div className="space-y-1 sm:col-span-2">
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                            简介
                          </label>
                          <textarea
                            value={editState.intro}
                            onChange={(e) =>
                              setEditState((s) =>
                                s ? { ...s, intro: e.target.value } : s,
                              )
                            }
                            rows={2}
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none"
                          />
                        </div>
                      </div>

                      {/* Toggles */}
                      <div className="flex flex-wrap gap-3">
                        {/* display toggle */}
                        <label className="flex items-center gap-2 cursor-pointer">
                          <div
                            onClick={() =>
                              setEditState((s) =>
                                s ? { ...s, display: !s.display } : s,
                              )
                            }
                            className={cn(
                              "w-9 h-5 rounded-full transition-colors relative",
                              editState.display
                                ? "bg-blue-500"
                                : "bg-slate-300 dark:bg-slate-700",
                            )}
                          >
                            <div
                              className={cn(
                                "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform",
                                editState.display
                                  ? "translate-x-4"
                                  : "translate-x-0.5",
                              )}
                            />
                          </div>
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                            公开展示
                          </span>
                        </label>

                        {/* is_admin toggle — disabled for sort_order=1 */}
                        <label className="flex items-center gap-2 cursor-pointer">
                          <div
                            onClick={() => {
                              if (user.sort_order === 1) return;
                              setEditState((s) =>
                                s ? { ...s, is_admin: !s.is_admin } : s,
                              );
                            }}
                            className={cn(
                              "w-9 h-5 rounded-full transition-colors relative",
                              user.sort_order === 1
                                ? "opacity-50 cursor-not-allowed"
                                : "cursor-pointer",
                              editState.is_admin
                                ? "bg-blue-500"
                                : "bg-slate-300 dark:bg-slate-700",
                            )}
                          >
                            <div
                              className={cn(
                                "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform",
                                editState.is_admin
                                  ? "translate-x-4"
                                  : "translate-x-0.5",
                              )}
                            />
                          </div>
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                            {editState.is_admin ? (
                              <Shield size={12} className="text-blue-500" />
                            ) : (
                              <ShieldOff size={12} />
                            )}
                            管理员权限
                            {user.sort_order === 1 && (
                              <span className="text-amber-500">(锁定)</span>
                            )}
                          </span>
                        </label>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => handleSave(user.id)}
                          disabled={saving}
                          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold transition-colors disabled:opacity-60"
                        >
                          {saving ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Check size={12} />
                          )}
                          保存
                        </button>
                        <button
                          onClick={cancelEdit}
                          disabled={saving}
                          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 text-xs font-bold transition-colors"
                        >
                          <X size={12} />
                          取消
                        </button>
                      </div>
                    </>
                  ) : (
                    /* Read-only detail view */
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 text-xs">
                      <div>
                        <span className="text-slate-400 font-bold uppercase tracking-wide text-[10px]">
                          公开展示
                        </span>
                        <p className="text-slate-700 dark:text-slate-300 mt-0.5">
                          {user.display ? "是" : "否"}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold uppercase tracking-wide text-[10px]">
                          管理员
                        </span>
                        <p className="text-slate-700 dark:text-slate-300 mt-0.5">
                          {user.is_admin ? "是" : "否"}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold uppercase tracking-wide text-[10px]">
                          Sort Order
                        </span>
                        <p className="text-slate-700 dark:text-slate-300 mt-0.5">
                          {user.sort_order ?? "—"}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold uppercase tracking-wide text-[10px]">
                          Navid ID
                        </span>
                        <p className="text-slate-700 dark:text-slate-300 mt-0.5 font-mono">
                          {user.navid_id || "—"}
                        </p>
                      </div>
                      {user.intro && (
                        <div className="col-span-2 sm:col-span-3">
                          <span className="text-slate-400 font-bold uppercase tracking-wide text-[10px]">
                            简介
                          </span>
                          <p className="text-slate-700 dark:text-slate-300 mt-0.5 leading-relaxed">
                            {user.intro}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
