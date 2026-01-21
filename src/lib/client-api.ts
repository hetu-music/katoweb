// Admin 管理页面 API 封装
import type { Song } from "./types";

// 新增歌曲
export async function apiCreateSong(song: Partial<Song>, csrfToken: string) {
  const res = await fetch("/api/admin/edit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-csrf-token": csrfToken,
    },
    body: JSON.stringify(song),
  });
  if (!res.ok) throw new Error("新增失败");
  return res.json();
}

// 更新歌曲
export async function apiUpdateSong(
  id: number,
  song: Partial<Song>,
  csrfToken: string,
) {
  const res = await fetch("/api/admin/edit", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "x-csrf-token": csrfToken,
    },
    body: JSON.stringify({ id, ...song }),
  });
  if (res.status === 409) {
    throw new Error("数据已被他人修改，请刷新页面后重试");
  }
  if (!res.ok) throw new Error("更新失败");
  return res.json();
}

// 修改密码
export async function apiChangePassword(
  oldPassword: string,
  newPassword: string,
  csrfToken: string,
) {
  const res = await fetch("/api/auth/change-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-csrf-token": csrfToken,
    },
    body: JSON.stringify({ oldPassword, newPassword }),
  });
  return res.json();
}

// 获取 display name
export async function apiGetDisplayName() {
  const res = await fetch("/api/auth/account");
  return res.json();
}

// 更新 display name
export async function apiUpdateDisplayName(
  displayName: string,
  csrfToken: string,
  display?: boolean,
) {
  const body: { displayName: string; display?: boolean } = { displayName };
  if (typeof display === "boolean") body.display = display;
  const res = await fetch("/api/auth/account", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-csrf-token": csrfToken,
    },
    body: JSON.stringify(body),
  });
  return res.json();
}

// 获取账号信息（含 displayName, display, intro）
export async function apiGetAccountInfo() {
  const res = await fetch("/api/auth/account");
  return res.json();
}

// 更新账号信息（displayName, display, intro）
export async function apiUpdateAccountInfo(
  displayName: string,
  csrfToken: string,
  display?: boolean,
  intro?: string | null,
) {
  const body: {
    displayName: string;
    display?: boolean;
    intro?: string | null;
  } = { displayName };
  if (typeof display === "boolean") body.display = display;
  if (typeof intro === "string" || intro === null) body.intro = intro;
  const res = await fetch("/api/auth/account", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-csrf-token": csrfToken,
    },
    body: JSON.stringify(body),
  });
  return res.json();
}

// 检查文件是否存在
export async function apiCheckFileExists(
  songId: number,
  fileType: "cover" | "score",
  csrfToken: string,
) {
  const res = await fetch(
    `/api/admin/check-file?songId=${songId}&type=${fileType}`,
    {
      method: "GET",
      headers: {
        "x-csrf-token": csrfToken,
      },
    },
  );
  if (!res.ok) throw new Error("Failed to check file existence");
  return res.json();
}

// Auto-complete logic has been moved to src/lib/api-auto-complete.ts
