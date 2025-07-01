"use client";
import React from "react";
import { useEffect, useState } from "react";
import { Search, Plus, Edit, Trash2, Save, X, Eye, EyeOff, ArrowUp } from "lucide-react";
import type { Song, SongDetail } from "../lib/types";

const songFields: { key: keyof SongDetail; label: string; type: 'text'|'number'|'array'|'boolean'|'date'|'textarea'; }[] = [
  { key: 'title', label: '标题', type: 'text' },
  { key: 'album', label: '专辑', type: 'text' },
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
  { key: 'comment', label: '备注', type: 'textarea' },
  { key: 'discnumber', label: '碟号', type: 'number' },
  { key: 'disctotal', label: '碟总数', type: 'number' },
  { key: 'lyrics', label: '歌词', type: 'textarea' },
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
  const [newSong, setNewSong] = useState<Partial<Song>>({ title: "", album: "" });
  const [editSong, setEditSong] = useState<SongDetail | null>(null);
  const [editForm, setEditForm] = useState<Partial<Song>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchSongs()
      .then(setSongs)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // 滚动监听
  useEffect(() => {
    const onScroll = () => {
      setShowScrollTop(window.scrollY > 200);
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 过滤歌曲
  const filteredSongs = songs.filter(song =>
    song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    song.album?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (song.lyricist && song.lyricist.some(l => l.toLowerCase().includes(searchTerm.toLowerCase()))) ||
    (song.composer && song.composer.some(c => c.toLowerCase().includes(searchTerm.toLowerCase())))
  );

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
      setNewSong({ title: "", album: "" });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (song: Song) => {
    setEditSong(song);
    setEditForm({ ...song });
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

  const toggleRowExpansion = (id: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* 头部区域 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-6">管理后台</h1>
          
          {/* 搜索和新增按钮 */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 flex items-center relative">
              <div className="h-[48px] flex items-center justify-center bg-white/10 backdrop-blur-sm border border-white/20 border-r-0 text-white rounded-l-2xl select-none min-w-[60px] max-w-[60px] w-[60px]">
                <Search size={20} />
              </div>
              <input
                type="text"
                placeholder="搜索歌曲、专辑、作词、作曲..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-[48px] w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent focus:bg-white/15 transition-all duration-200 rounded-r-2xl border-l-0 min-w-0"
                style={{ marginLeft: '-1px' }}
              />
            </div>
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30 text-green-200 hover:from-green-500/30 hover:to-emerald-500/30 hover:text-green-100 transition-all duration-200 shadow-sm font-medium whitespace-nowrap"
            >
              <Plus size={20} />
              新增歌曲
            </button>
          </div>

          {/* 统计信息 */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 shadow-sm">
              <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-pulse"></div>
              <span className="text-white font-medium text-sm">
                总计 <span className="text-blue-200 font-semibold">{songs.length}</span> 首
              </span>
            </div>
            <div className="flex items-center gap-2 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 shadow-sm">
              <div className="w-2 h-2 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full"></div>
              <span className="text-white font-medium text-sm">
                已显示 <span className="text-purple-200 font-semibold">{filteredSongs.length}</span> 首
              </span>
            </div>
          </div>
        </div>

        {/* 加载和错误状态 */}
        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            <p className="text-white mt-2">加载中...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-500/20 border border-red-400/30 rounded-xl p-4 mb-6">
            <p className="text-red-200">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="mt-2 text-red-300 hover:text-red-100 text-sm underline"
            >
              关闭
            </button>
          </div>
        )}

        {/* 歌曲表格 */}
        {!loading && (
          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 shadow-2xl border border-white/20 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left py-4 px-4 text-white font-semibold">序号</th>
                    <th className="text-left py-4 px-4 text-white font-semibold">标题</th>
                    <th className="text-left py-4 px-4 text-white font-semibold">专辑</th>
                    <th className="text-left py-4 px-4 text-white font-semibold">年份</th>
                    <th className="text-left py-4 px-4 text-white font-semibold">流派</th>
                    <th className="text-left py-4 px-4 text-white font-semibold">作词</th>
                    <th className="text-left py-4 px-4 text-white font-semibold">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {[...filteredSongs].sort((a, b) => a.id - b.id).map((song, idx) => (
                    <React.Fragment key={song.id}>
                      <tr className="border-b border-white/10 hover:bg-white/5 transition-colors">
                        <td className="py-4 px-4 text-white/90">{idx + 1}</td>
                        <td className="py-4 px-4 text-white/90 font-medium">{song.title}</td>
                        <td className="py-4 px-4 text-white/80">{song.album || '-'}</td>
                        <td className="py-4 px-4 text-white/80">{song.year || '-'}</td>
                        <td className="py-4 px-4 text-white/80">
                          {Array.isArray(song.genre) ? song.genre.join(', ') : (song.genre || '-')}
                        </td>
                        <td className="py-4 px-4 text-white/80">
                          {Array.isArray(song.lyricist) ? song.lyricist.join(', ') : (song.lyricist || '-')}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleRowExpansion(song.id)}
                              className="p-2 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 hover:text-blue-200 transition-all duration-200"
                              title="查看详情"
                            >
                              {expandedRows.has(song.id) ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                            <button
                              onClick={() => handleEdit(song)}
                              className="p-2 rounded-lg bg-green-500/20 text-green-300 hover:bg-green-500/30 hover:text-green-200 transition-all duration-200"
                              title="编辑"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(song.id)}
                              className="p-2 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 hover:text-red-200 transition-all duration-200"
                              title="删除"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {/* 展开的详情行 */}
                      {expandedRows.has(song.id) && (
                        <tr>
                          <td colSpan={7} className="py-4 px-4 bg-white/5">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {songFields.slice(5).map(field => (
                                <div key={field.key} className="flex flex-col">
                                  <span className="text-blue-300 text-sm font-medium mb-1">{field.label}:</span>
                                  <span className="text-white/80 text-sm break-words">
                                    {formatField(song[field.key], field.type)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 无结果提示 */}
        {!loading && filteredSongs.length === 0 && (
          <div className="text-center py-16">
            <div className="text-gray-400 text-lg mb-2">没有找到匹配的歌曲</div>
            <div className="text-gray-500 text-sm">尝试调整搜索条件</div>
          </div>
        )}
      </div>

      {/* 新增/编辑表单弹窗 */}
      {(showAdd || editSong) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-gradient-to-br from-purple-800 via-blue-900 to-indigo-900 border border-white/20 rounded-2xl shadow-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">{showAdd ? '新增' : '编辑'}歌曲</h2>
              <button
                onClick={() => { setShowAdd(false); setEditSong(null); }}
                className="p-2 rounded-lg bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition-all duration-200"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={showAdd ? handleAdd : handleEditSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {songFields.map(field => (
                  <div key={field.key} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                    <label className="block text-white font-medium mb-2">{field.label}:</label>
                    {renderInput(field, showAdd ? newSong : editForm, showAdd ? setNewSong : setEditForm)}
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-4 pt-6 border-t border-white/20">
                <button
                  type="button"
                  onClick={() => { setShowAdd(false); setEditSong(null); }}
                  className="px-6 py-3 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all duration-200"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30 text-green-200 hover:from-green-500/30 hover:to-emerald-500/30 hover:text-green-100 transition-all duration-200 font-medium"
                >
                  <Save size={18} />
                  {showAdd ? '提交' : '保存'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 返回顶部按钮 */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-40 p-3 rounded-full bg-gradient-to-br from-purple-700 via-blue-700 to-indigo-700 text-white shadow-lg border border-white/20 backdrop-blur-md hover:scale-110 transition-all duration-200"
          aria-label="返回顶部"
        >
          <ArrowUp size={24} />
        </button>
      )}
    </div>
  );
}

// API 函数保持不变
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
  if (val == null) return '-';
  if (type === 'array') return Array.isArray(val) ? val.join(', ') : val;
  if (type === 'boolean') return val ? '是' : '否';
  if (type === 'date') return val ? String(val).slice(0, 10) : '-';
  if (type === 'textarea' && typeof val === 'string' && val.length > 50) {
    return val.substring(0, 50) + '...';
  }
  return val;
}

function renderInput(f: any, state: any, setState: any) {
  const v = state[f.key];
  const baseInputClass = "w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent focus:bg-white/15 transition-all duration-200 rounded-xl";
  
  if (f.type === 'textarea') {
    return (
      <textarea
        value={v || ''}
        onChange={e => setState((s: any) => ({ ...s, [f.key]: e.target.value }))}
        rows={4}
        className={baseInputClass + " resize-vertical"}
        placeholder={`请输入${f.label}`}
      />
    );
  }
  
  if (f.type === 'array') {
    return (
      <input
        value={Array.isArray(v) ? v.join(',') : v || ''}
        onChange={e => setState((s: any) => ({ ...s, [f.key]: e.target.value.split(',').map((x: string) => x.trim()).filter(Boolean) }))}
        className={baseInputClass}
        placeholder={`请输入${f.label}，多个用逗号分隔`}
      />
    );
  }
  
  if (f.type === 'boolean') {
    return (
      <select
        value={v === true ? 'true' : v === false ? 'false' : ''}
        onChange={e => setState((s: any) => ({ ...s, [f.key]: e.target.value === 'true' ? true : e.target.value === 'false' ? false : null }))}
        className={baseInputClass}
      >
        <option value="">未设置</option>
        <option value="true">是</option>
        <option value="false">否</option>
      </select>
    );
  }
  
  if (f.type === 'number') {
    return (
      <input
        type="number"
        value={v ?? ''}
        onChange={e => setState((s: any) => ({ ...s, [f.key]: e.target.value === '' ? null : Number(e.target.value) }))}
        className={baseInputClass}
        placeholder={`请输入${f.label}`}
      />
    );
  }
  
  if (f.type === 'date') {
    return (
      <input
        type="date"
        value={v ? String(v).slice(0, 10) : ''}
        onChange={e => setState((s: any) => ({ ...s, [f.key]: e.target.value }))}
        className={baseInputClass}
      />
    );
  }
  
  return (
    <input
      value={v ?? ''}
      onChange={e => setState((s: any) => ({ ...s, [f.key]: e.target.value }))}
      className={baseInputClass}
      placeholder={`请输入${f.label}`}
    />
  );
}