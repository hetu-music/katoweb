'use client';
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Search, Plus, Edit, Save, X, Eye, EyeOff, ArrowUp } from 'lucide-react';
import type { Song, SongDetail } from '../lib/types';

// Define song fields configuration
const songFields: { key: keyof SongDetail; label: string; type: 'text' | 'number' | 'array' | 'boolean' | 'date' | 'textarea'; required?: boolean; maxLength?: number; minLength?: number; min?: number; isUrl?: boolean; arrayMaxLength?: number; }[] = [
  { key: 'title', label: '标题', type: 'text', required: true, minLength: 1, maxLength: 100 },
  { key: 'album', label: '专辑', type: 'text', maxLength: 100 },
  { key: 'genre', label: '流派', type: 'array', arrayMaxLength: 30 },
  { key: 'lyricist', label: '作词', type: 'array', arrayMaxLength: 30 },
  { key: 'composer', label: '作曲', type: 'array', arrayMaxLength: 30 },
  { key: 'artist', label: '演唱', type: 'array', arrayMaxLength: 30 },
  { key: 'length', label: '时长(秒)', type: 'number', min: 1 },
  { key: 'hascover', label: '封面', type: 'boolean' },
  { key: 'date', label: '日期', type: 'date', maxLength: 30 },
  { key: 'type', label: '类型', type: 'array', arrayMaxLength: 30 },
  { key: 'albumartist', label: '专辑创作', type: 'array', arrayMaxLength: 30 },
  { key: 'arranger', label: '编曲', type: 'array', arrayMaxLength: 30 },
  { key: 'comment', label: '备注', type: 'textarea', maxLength: 10000 },
  { key: 'discnumber', label: '碟号', type: 'number', min: 1 },
  { key: 'disctotal', label: '碟总数', type: 'number', min: 1 },
  { key: 'lyrics', label: '歌词', type: 'textarea', maxLength: 10000 },
  { key: 'track', label: '曲号', type: 'number', min: 1 },
  { key: 'tracktotal', label: '曲总数', type: 'number', min: 1 },
  { key: 'kugolink', label: '酷狗链接', type: 'text', maxLength: 200, isUrl: true },
  { key: 'qmlink', label: 'QQ音乐链接', type: 'text', maxLength: 200, isUrl: true },
  { key: 'nelink', label: '网易云链接', type: 'text', maxLength: 200, isUrl: true },
];

// Debounce utility
function debounce<T extends (...args: any[]) => void>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Memoized SongRow component
const SongRow = React.memo(({ song, idx, expandedRows, toggleRowExpansion, handleEdit }: {
  song: SongDetail;
  idx: number;
  expandedRows: Set<number>;
  toggleRowExpansion: (id: number) => void;
  handleEdit: (song: Song) => void;
}) => {
  return (
    <>
      <tr className="border-b border-white/10 hover:bg-white/5 transition-colors">
        <td className="py-4 px-4 text-white/90">{idx + 1}</td>
        <td className="py-4 px-4 text-white/90 font-medium">{song.title}</td>
        <td className="py-4 px-4 text-white/80">{song.album || '-'}</td>
        <td className="py-4 px-4 text-white/80">{Array.isArray(song.lyricist) ? song.lyricist.join(', ') : (song.lyricist || '-')}</td>
        <td className="py-4 px-4 text-white/80">{Array.isArray(song.composer) ? song.composer.join(', ') : (song.composer || '-')}</td>
        <td className="py-4 px-4 text-white/80">{Array.isArray(song.type) ? song.type.join(', ') : (song.type || '-')}</td>
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
          </div>
        </td>
      </tr>
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
    </>
  );
});

export default function AdminClientComponent({ initialSongs, initialError }: { initialSongs: SongDetail[], initialError: string | null }) {
  const [songs, setSongs] = useState<SongDetail[]>(initialSongs);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError);
  const [showAdd, setShowAdd] = useState(false);
  const [newSong, setNewSong] = useState<Partial<Song>>({ title: "", album: "" });
  const [addFormErrors, setAddFormErrors] = useState<Record<string, string>>({});
  const [editSong, setEditSong] = useState<SongDetail | null>(null);
  const [editForm, setEditForm] = useState<Partial<Song>>({});
  const [editFormErrors, setEditFormErrors] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [csrfToken, setCsrfToken] = useState('');

  // Scroll listener
  React.useEffect(() => {
    const onScroll = () => {
      setShowScrollTop(window.scrollY > 200);
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    fetch('/api/auth/csrf-token')
      .then(res => res.json())
      .then(data => setCsrfToken(data.csrfToken || ''));
  }, []);

  // Debounced search handler
  const debouncedSetSearchTerm = useCallback(
    debounce((value: string) => setSearchTerm(value), 300),
    []
  );

  // Memoized filtered songs
  const filteredSongs = useMemo(() => {
    return songs.filter(song =>
      song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      song.album?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (song.lyricist && song.lyricist.some(l => l.toLowerCase().includes(searchTerm.toLowerCase()))) ||
      (song.composer && song.composer.some(c => c.toLowerCase().includes(searchTerm.toLowerCase())))
    );
  }, [songs, searchTerm]);

  // Memoized sorted songs
  const sortedSongs = useMemo(() => {
    return [...filteredSongs].sort((a, b) => a.id - b.id);
  }, [filteredSongs]);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleAdd = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    // 校验所有字段
    const errors: Record<string, string> = {};
    songFields.forEach(f => {
      errors[f.key] = validateField(f, (newSong as any)[f.key]);
    });
    setAddFormErrors(errors);
    const firstErrorKey = Object.keys(errors).find(k => errors[k]);
    if (firstErrorKey) {
      // 尝试聚焦第一个有错的字段
      const el = document.querySelector(`[name='${firstErrorKey}']`);
      if (el && 'focus' in el) (el as HTMLElement).focus();
      return;
    }
    try {
      setLoading(true);
      const { year, ...songWithoutYear } = newSong;
      const created = await apiCreateSong(songWithoutYear, csrfToken);
      setSongs(prev => [...prev, created]);
      setShowAdd(false);
      setNewSong({ title: "", album: "" });
      setAddFormErrors({});
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [newSong, csrfToken]);

  const handleEdit = useCallback((song: Song) => {
    setEditSong(song);
    setEditForm({ ...song });
  }, []);

  const handleEditSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editSong) return;
    // 校验所有字段
    const errors: Record<string, string> = {};
    songFields.forEach(f => {
      errors[f.key] = validateField(f, (editForm as any)[f.key]);
    });
    setEditFormErrors(errors);
    const firstErrorKey = Object.keys(errors).find(k => errors[k]);
    if (firstErrorKey) {
      const el = document.querySelector(`[name='${firstErrorKey}']`);
      if (el && 'focus' in el) (el as HTMLElement).focus();
      return;
    }
    try {
      setLoading(true);
      const { year, ...formWithoutYear } = editForm;
      const updated = await apiUpdateSong(editSong.id, formWithoutYear, csrfToken);
      setSongs(prev => prev.map(s => s.id === updated.id ? updated : s));
      setEditSong(null);
      setEditFormErrors({});
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [editSong, editForm, csrfToken]);

  const toggleRowExpansion = useCallback((id: number) => {
    setExpandedRows(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(id)) {
        newExpanded.delete(id);
      } else {
        newExpanded.add(id);
      }
      return newExpanded;
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-6">管理页面</h1>
          
          {/* Search and Add Button */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 flex items-center relative">
              <div className="h-[48px] flex items-center justify-center bg-white/10 backdrop-blur-sm border border-white/20 border-r-0 text-white rounded-l-2xl select-none min-w-[60px] max-w-[60px] w-[60px]">
                <Search size={20} />
              </div>
              <input
                type="text"
                placeholder="搜索歌曲、专辑、作词、作曲..."
                onChange={(e) => debouncedSetSearchTerm(e.target.value)}
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

          {/* Stats */}
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

        {/* Loading and Error States */}
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

        {/* Songs Table */}
        {!loading && (
          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 shadow-2xl border border-white/20 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left py-4 px-4 text-white font-semibold">序号</th>
                    <th className="text-left py-4 px-4 text-white font-semibold">标题</th>
                    <th className="text-left py-4 px-4 text-white font-semibold">专辑</th>
                    <th className="text-left py-4 px-4 text-white font-semibold">作词</th>
                    <th className="text-left py-4 px-4 text-white font-semibold">作曲</th>
                    <th className="text-left py-4 px-4 text-white font-semibold">类型</th>
                    <th className="text-left py-4 px-4 text-white font-semibold">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedSongs.map((song, idx) => (
                    <SongRow
                      key={song.id}
                      song={song}
                      idx={idx}
                      expandedRows={expandedRows}
                      toggleRowExpansion={toggleRowExpansion}
                      handleEdit={handleEdit}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* No Results */}
        {!loading && filteredSongs.length === 0 && (
          <div className="text-center py-16">
            <div className="text-gray-400 text-lg mb-2">没有找到匹配的歌曲</div>
            <div className="text-gray-500 text-sm">尝试调整搜索条件</div>
          </div>
        )}
      </div>

      {/* Add/Edit Form Modal */}
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

            <form onSubmit={showAdd ? handleAdd : handleEditSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {songFields.map(field => (
                  <div key={field.key} className={(field.type === 'textarea' ? 'md:col-span-2' : '') + ' flex flex-col gap-2 bg-white/5 rounded-xl p-4 border border-white/10 shadow-sm'}>
                    <label className="block text-blue-100 font-semibold mb-1 text-sm tracking-wide">{field.label}:</label>
                    {renderInput(field, showAdd ? newSong : editForm, showAdd ? setNewSong : setEditForm, showAdd ? addFormErrors : editFormErrors, showAdd ? setAddFormErrors : setEditFormErrors)}
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-4 pt-8 border-t border-white/20 mt-4">
                <button
                  type="button"
                  onClick={() => { setShowAdd(false); setEditSong(null); }}
                  className="px-6 py-3 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all duration-200 font-medium"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30 text-green-200 hover:from-green-500/30 hover:to-emerald-500/30 hover:text-green-100 transition-all duration-200 font-semibold shadow-sm"
                >
                  <Save size={18} />
                  {showAdd ? '提交' : '保存'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Scroll to Top Button */}
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

// API Functions
async function apiCreateSong(song: Partial<Song>, csrfToken: string) {
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

async function apiUpdateSong(id: number, song: Partial<Song>, csrfToken: string) {
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

function validateField(f: any, value: any): string {
  if (f.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
    return `${f.label}为必填项`;
  }
  if (f.type === 'text' || f.type === 'textarea' || f.type === 'date') {
    if (f.minLength && value && value.length < f.minLength) {
      return `${f.label}最少${f.minLength}个字符`;
    }
    if (f.maxLength && value && value.length > f.maxLength) {
      return `${f.label}不能超过${f.maxLength}个字符`;
    }
    if (f.isUrl && value) {
      try {
        new URL(value);
      } catch {
        return `${f.label}必须为合法的URL`;
      }
    }
  }
  if (f.type === 'array' && Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      if (f.arrayMaxLength && value[i] && value[i].length > f.arrayMaxLength) {
        return `${f.label}第${i + 1}项不能超过${f.arrayMaxLength}个字符`;
      }
    }
  }
  if (f.type === 'number') {
    if (value !== null && value !== undefined && value !== '') {
      if (isNaN(value)) return `${f.label}必须为数字`;
      if (f.min !== undefined && value < f.min) {
        return `${f.label}不能小于${f.min}`;
      }
      if (!Number.isInteger(value)) {
        return `${f.label}必须为整数`;
      }
    }
  }
  return '';
}

function renderInput(f: any, state: any, setState: any, errors: Record<string, string>, setErrors: (e: Record<string, string>) => void) {
  const v = state[f.key];
  const baseInputClass = 'w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent focus:bg-white/15 transition-all duration-200 rounded-xl';
  const errorMsg = errors[f.key];

  const handleChange = (val: any) => {
    setState((s: any) => ({ ...s, [f.key]: val }));
    const err = validateField(f, val);
    setErrors({ ...errors, [f.key]: err });
  };

  if (f.type === 'textarea') {
    return (
      <>
        <textarea
          value={v || ''}
          onChange={e => handleChange(e.target.value)}
          rows={4}
          className={baseInputClass + ' resize-vertical'}
          placeholder={`请输入${f.label}`}
          maxLength={f.maxLength}
        />
        {errorMsg && <div className="text-red-400 text-xs mt-1">{errorMsg}</div>}
      </>
    );
  }
  if (f.type === 'array') {
    const arr: string[] = Array.isArray(v) ? v : v ? [v] : [];
    return (
      <>
        <div className="space-y-2">
          {arr.length === 0 && (
            <div className="text-gray-400 text-xs mb-2 pl-1">暂无{f.label}</div>
          )}
          {arr.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 mb-1 group">
              <input
                value={item}
                onChange={e => {
                  const newArr = [...arr];
                  newArr[idx] = e.target.value;
                  handleChange(newArr);
                }}
                className={baseInputClass + ' flex-1 border-l-4 border-transparent group-hover:border-blue-400 focus:border-blue-400 bg-white/15'}
                placeholder={`请输入${f.label}`}
                maxLength={f.arrayMaxLength}
              />
              <button
                type="button"
                onClick={() => {
                  const newArr = arr.filter((_, i) => i !== idx);
                  handleChange(newArr);
                }}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-red-500/20 text-red-200 hover:bg-red-500/60 hover:text-white transition-all duration-200 focus:outline-none"
                title="删除"
              >
                <svg width="16" height="16" fill="none" viewBox="0 0 16 16"><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M4 4l8 8M12 4l-8 8"/></svg>
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => handleChange([...arr, ''])}
            className="mt-1 flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-500/20 text-blue-200 hover:bg-blue-500/40 hover:text-white transition-all duration-200 text-xs font-medium"
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 14 14"><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M7 2v10M2 7h10"/></svg>
            添加{f.label}
          </button>
        </div>
        {errorMsg && <div className="text-red-400 text-xs mt-1">{errorMsg}</div>}
      </>
    );
  }
  if (f.type === 'boolean') {
    return (
      <>
        <select
          value={v === true ? 'true' : v === false ? 'false' : ''}
          onChange={e => handleChange(e.target.value === 'true' ? true : e.target.value === 'false' ? false : null)}
          className={baseInputClass}
        >
          <option value="">白底狐狸（默认）</option>
          <option value="false">初号机（黑底机器人）</option>
          <option value="true">定制封面</option>
        </select>
        {errorMsg && <div className="text-red-400 text-xs mt-1">{errorMsg}</div>}
      </>
    );
  }
  if (f.type === 'number') {
    return (
      <>
        <input
          type="number"
          value={v ?? ''}
          onChange={e => handleChange(e.target.value === '' ? null : Number(e.target.value))}
          className={baseInputClass}
          placeholder={`请输入${f.label}`}
          min={f.min}
          step={1}
        />
        {errorMsg && <div className="text-red-400 text-xs mt-1">{errorMsg}</div>}
      </>
    );
  }
  if (f.type === 'date') {
    return (
      <>
        <input
          type="date"
          value={v ? String(v).slice(0, 10) : ''}
          onChange={e => handleChange(e.target.value)}
          className={baseInputClass}
          maxLength={f.maxLength}
        />
        {errorMsg && <div className="text-red-400 text-xs mt-1">{errorMsg}</div>}
      </>
    );
  }
  return (
    <>
      <input
        value={v ?? ''}
        onChange={e => handleChange(e.target.value)}
        className={baseInputClass}
        placeholder={`请输入${f.label}`}
        maxLength={f.maxLength}
        type={f.isUrl ? 'url' : 'text'}
      />
      {errorMsg && <div className="text-red-400 text-xs mt-1">{errorMsg}</div>}
    </>
  );
}