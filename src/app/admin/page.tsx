"use client";
import { useEffect, useState } from "react";
import { getSongs, createSupabaseClient, deleteSong, createSong, updateSong } from "../lib/supabase";
import type { Song } from "../lib/types";

export default function AdminPage() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newSong, setNewSong] = useState<Partial<Song>>({ title: "", album: "", year: undefined });
  const [editSong, setEditSong] = useState<Song | null>(null);
  const [editForm, setEditForm] = useState<Partial<Song>>({});

  useEffect(() => {
    getSongs()
      .then(setSongs)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm("确定要删除这首歌曲吗？")) return;
    try {
      setLoading(true);
      await deleteSong(id);
      setSongs((prev) => prev.filter((s) => s.id !== id));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const created = await createSong(newSong);
      setSongs((prev) => [...prev, created]);
      setShowAdd(false);
      setNewSong({ title: "", album: "", year: undefined });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (song: Song) => {
    setEditSong(song);
    setEditForm({ title: song.title, album: song.album, year: song.year });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editSong) return;
    try {
      setLoading(true);
      const updated = await updateSong(editSong.id, editForm);
      setSongs((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      setEditSong(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: 24 }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 24 }}>管理后台</h1>
      {loading && <p>加载中...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 24 }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>标题</th>
            <th>专辑</th>
            <th>年份</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {songs.map((song) => (
            <tr key={song.id}>
              <td>{song.id}</td>
              <td>{song.title}</td>
              <td>{song.album}</td>
              <td>{song.year}</td>
              <td>
                <button style={{ marginRight: 8 }} onClick={() => handleEdit(song)}>编辑</button>
                <button style={{ color: "red" }} onClick={() => handleDelete(song.id)}>删除</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button style={{ padding: "8px 16px", fontSize: 16 }} onClick={() => setShowAdd(true)}>新增歌曲</button>
      {showAdd && (
        <form onSubmit={handleAdd} style={{ marginTop: 24, background: "#fafbfc", padding: 16, borderRadius: 8, boxShadow: "0 2px 8px #eee" }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>新增歌曲</h2>
          <div style={{ marginBottom: 8 }}>
            <label>标题: <input required value={newSong.title || ""} onChange={e => setNewSong(s => ({ ...s, title: e.target.value }))} /></label>
          </div>
          <div style={{ marginBottom: 8 }}>
            <label>专辑: <input value={newSong.album || ""} onChange={e => setNewSong(s => ({ ...s, album: e.target.value }))} /></label>
          </div>
          <div style={{ marginBottom: 8 }}>
            <label>年份: <input type="number" value={newSong.year || ""} onChange={e => setNewSong(s => ({ ...s, year: e.target.value ? Number(e.target.value) : undefined }))} /></label>
          </div>
          <button type="submit" style={{ marginRight: 8 }}>提交</button>
          <button type="button" onClick={() => setShowAdd(false)}>取消</button>
        </form>
      )}
      {editSong && (
        <form onSubmit={handleEditSubmit} style={{ marginTop: 24, background: "#fafbfc", padding: 16, borderRadius: 8, boxShadow: "0 2px 8px #eee" }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>编辑歌曲</h2>
          <div style={{ marginBottom: 8 }}>
            <label>标题: <input required value={editForm.title || ""} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} /></label>
          </div>
          <div style={{ marginBottom: 8 }}>
            <label>专辑: <input value={editForm.album || ""} onChange={e => setEditForm(f => ({ ...f, album: e.target.value }))} /></label>
          </div>
          <div style={{ marginBottom: 8 }}>
            <label>年份: <input type="number" value={editForm.year || ""} onChange={e => setEditForm(f => ({ ...f, year: e.target.value ? Number(e.target.value) : undefined }))} /></label>
          </div>
          <button type="submit" style={{ marginRight: 8 }}>保存</button>
          <button type="button" onClick={() => setEditSong(null)}>取消</button>
        </form>
      )}
    </div>
  );
} 