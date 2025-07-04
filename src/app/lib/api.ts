// Admin 管理页面 API 封装
import type { Song } from './types';

// 新增歌曲
export async function apiCreateSong(song: Partial<Song>, csrfToken: string) {
  const res = await fetch('/api/admin', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-csrf-token': csrfToken,
    },
    body: JSON.stringify(song),
  });
  if (!res.ok) throw new Error('新增失败');
  return res.json();
}

// 更新歌曲
export async function apiUpdateSong(id: number, song: Partial<Song>, csrfToken: string) {
  const res = await fetch('/api/admin', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-csrf-token': csrfToken,
    },
    body: JSON.stringify({ id, ...song }),
  });
  if (!res.ok) throw new Error('更新失败');
  return res.json();
}
