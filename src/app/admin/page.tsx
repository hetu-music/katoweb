"use client";
import { useEffect, useState } from "react";
import type { Song, SongDetail } from "../lib/types";

const songFields: { key: keyof SongDetail; label: string; type: 'text'|'number'|'array'|'boolean'|'date'; }[] = [
  { key: 'title', label: '标题', type: 'text' },
  { key: 'album', label: '专辑', type: 'text' },
  { key: 'year', label: '年份', type: 'number' },
  { key: 'genre', label: '流派', type: 'array' },
  { key: 'lyricist', label: '作词', type: 'array' },
  { key: 'composer', label: '作曲', type: 'array' },
  { key: 'artist', label: '演唱', type: 'array' },
  { key: 'length', label: '时长(秒)', type: 'number' },
  { key: 'hascover', label: '有封面', type: 'boolean' },
  { key: 'date', label: '日期', type: 'date' },
  { key: 'type', label: '类型', type: 'array' },
  { key: 'albumartist', label: '专辑艺人', type: 'array' },
  { key: 'arranger', label: '编曲', type: 'array' },
  { key: 'comment', label: '备注', type: 'text' },
  { key: 'discnumber', label: '碟号', type: 'number' },
  { key: 'disctotal', label: '碟总数', type: 'number' },
  { key: 'lyrics', label: '歌词', type: 'text' },
  { key: 'track', label: '曲号', type: 'number' },
  { key: 'tracktotal', label: '曲总数', type: 'number' },
  { key: 'kugolink', label: '酷狗链接', type: 'text' },
  { key: 'qmlink', label: 'QQ音乐链接', type: 'text' },
  { key: 'nelink', label: '网易云链接', type: 'text' },
];

export default function AdminPage() {
  const [songs, setSongs] = useState<SongDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newSong, setNewSong] = useState<Partial<Song>>({ title: "", album: "", year: undefined });
  const [editSong, setEditSong] = useState<SongDetail | null>(null);
  const [editForm, setEditForm] = useState<Partial<Song>>({});

  useEffect(() => {
    fetchSongs()
      .then(setSongs)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm("确定要删除这首歌曲吗？")) return;
    try {
      setLoading(true);
      await apiDeleteSong(id);
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
      const created = await apiCreateSong(newSong);
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
      const updated = await apiUpdateSong(editSong.id, editForm);
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
      <table className="admin-table">
        <thead>
          <tr>
            <th>序号</th>
            {songFields.slice(0, 5).map(f => <th key={f.key}>{f.label}</th>)}
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {[...songs].sort((a, b) => a.id - b.id).map((song, idx) => (
            <tr key={song.id} title={songFields.slice(5).map(f => `${f.label}: ${formatField(song[f.key], f.type)}`).join('\n')}>
              <td>{idx + 1}</td>
              {songFields.slice(0, 5).map(f => <td key={f.key}>{formatField(song[f.key], f.type)}</td>)}
              <td>
                <button className="admin-btn" onClick={() => handleEdit(song)}>编辑</button>
                <button className="admin-btn admin-btn-danger" onClick={() => handleDelete(song.id)}>删除</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button style={{ padding: "8px 16px", fontSize: 16 }} onClick={() => setShowAdd(true)}>新增歌曲</button>
      {(showAdd || editSong) && (
        <form onSubmit={showAdd ? handleAdd : handleEditSubmit} className="admin-form">
          <h2>{showAdd ? '新增' : '编辑'}歌曲</h2>
          {songFields.map(f => (
            <div className="admin-form-row" key={f.key}>
              <label>{f.label}:</label>
              {renderInput(f, showAdd ? newSong : editForm, showAdd ? setNewSong : setEditForm)}
            </div>
          ))}
          <div style={{ marginTop: 16 }}>
            <button type="submit" className="admin-btn" style={{ marginRight: 8 }}>{showAdd ? '提交' : '保存'}</button>
            <button type="button" className="admin-btn" onClick={() => { setShowAdd(false); setEditSong(null); }}>取消</button>
          </div>
        </form>
      )}
    </div>
  );
}

async function fetchSongs() {
  const res = await fetch("/api/admin-music");
  if (!res.ok) throw new Error("获取歌曲失败");
  return res.json();
}

async function apiCreateSong(song: Partial<Song>) {
  const res = await fetch("/api/admin-music", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(song),
  });
  if (!res.ok) throw new Error("新增失败");
  return res.json();
}

async function apiUpdateSong(id: number, song: Partial<Song>) {
  const res = await fetch("/api/admin-music", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, ...song }),
  });
  if (!res.ok) throw new Error("更新失败");
  return res.json();
}

async function apiDeleteSong(id: number) {
  const res = await fetch("/api/admin-music", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
  if (!res.ok) throw new Error("删除失败");
}

function formatField(val: any, type: string) {
  if (val == null) return '';
  if (type === 'array') return Array.isArray(val) ? val.join(', ') : val;
  if (type === 'boolean') return val ? '是' : '否';
  if (type === 'date') return val ? String(val).slice(0, 10) : '';
  return val;
}

function renderInput(f: any, state: any, setState: any) {
  const v = state[f.key];
  if (f.type === 'array') return <input value={Array.isArray(v) ? v.join(',') : v || ''} onChange={e => setState((s: any) => ({ ...s, [f.key]: e.target.value.split(',').map((x: string) => x.trim()).filter(Boolean) }))} />;
  if (f.type === 'boolean') return <select value={v === true ? 'true' : v === false ? 'false' : ''} onChange={e => setState((s: any) => ({ ...s, [f.key]: e.target.value === 'true' ? true : e.target.value === 'false' ? false : null }))}><option value="">未设置</option><option value="true">是</option><option value="false">否</option></select>;
  if (f.type === 'number') return <input type="number" value={v ?? ''} onChange={e => setState((s: any) => ({ ...s, [f.key]: e.target.value === '' ? null : Number(e.target.value) }))} />;
  if (f.type === 'date') return <input type="date" value={v ? String(v).slice(0, 10) : ''} onChange={e => setState((s: any) => ({ ...s, [f.key]: e.target.value }))} />;
  return <input value={v ?? ''} onChange={e => setState((s: any) => ({ ...s, [f.key]: e.target.value }))} />;
}

<style jsx global>{`
.admin-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; background: #fff; box-shadow: 0 2px 8px #eee; }
.admin-table th, .admin-table td { border: 1px solid #eee; padding: 8px 12px; text-align: left; }
.admin-table th { background: #f5f6fa; }
.admin-table tr:hover { background: #f0f7ff; }
.admin-btn { padding: 4px 12px; border: none; border-radius: 4px; background: #3b82f6; color: #fff; cursor: pointer; font-size: 14px; }
.admin-btn-danger { background: #ef4444; }
.admin-btn + .admin-btn { margin-left: 8px; }
.admin-form { background: #fff; padding: 24px; border-radius: 8px; box-shadow: 0 2px 8px #eee; margin-top: 24px; max-width: 600px; }
.admin-form-row { display: flex; align-items: center; margin-bottom: 12px; }
.admin-form-row label { width: 120px; color: #333; font-weight: 500; }
.admin-form-row input, .admin-form-row select { flex: 1; padding: 6px 8px; border: 1px solid #ddd; border-radius: 4px; }
`}</style> 