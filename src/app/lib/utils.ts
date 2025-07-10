import { Song, SongDetail, FilterOptions, SongInfo } from './types';

// 格式化时间
export function formatTime(seconds: number | null): string {
  if (!seconds || isNaN(seconds)) return '未知';
  const min = Math.floor(seconds / 60);
  const sec = (seconds % 60).toString().padStart(2, '0');
  return `${min}:${sec}`;
}

// 计算筛选选项
export function calculateFilterOptions(songsData: Song[]): FilterOptions {
  // 处理类型
  const typeSet = new Set<string>();
  let hasUnknownType = false;
  songsData.forEach(song => {
    if (!song.type || song.type.length === 0) {
      hasUnknownType = true;
    } else {
      song.type.forEach(t => typeSet.add(t));
    }
  });
  const allTypes = ['全部', ...Array.from(typeSet)];
  if (hasUnknownType) allTypes.push('未知');

  // 处理年份
  const yearSet = new Set<number>();
  let hasUnknownYear = false;
  songsData.forEach(song => {
    if (!song.year) {
      hasUnknownYear = true;
    } else {
      yearSet.add(song.year);
    }
  });
  const allYears = ['全部', ...Array.from(yearSet).sort((a, b) => (b as number) - (a as number))];
  if (hasUnknownYear) allYears.push('未知');

  // 处理作词
  const lyricistSet = new Set<string>();
  let hasUnknownLyricist = false;
  songsData.forEach(song => {
    if (!song.lyricist || song.lyricist.length === 0) {
      hasUnknownLyricist = true;
    } else {
      song.lyricist.forEach(l => lyricistSet.add(l));
    }
  });
  const allLyricists = ['全部', ...Array.from(lyricistSet)];
  if (hasUnknownLyricist) allLyricists.push('未知');

  // 处理作曲
  const composerSet = new Set<string>();
  let hasUnknownComposer = false;
  songsData.forEach(song => {
    if (!song.composer || song.composer.length === 0) {
      hasUnknownComposer = true;
    } else {
      song.composer.forEach(c => composerSet.add(c));
    }
  });
  const allComposers = ['全部', ...Array.from(composerSet)];
  if (hasUnknownComposer) allComposers.push('未知');

  return { allTypes, allYears, allLyricists, allComposers };
}

// 过滤歌曲
export function filterSongs(
  songsData: Song[],
  searchTerm: string,
  selectedType: string,
  selectedYear: string,
  selectedLyricist: string,
  selectedComposer: string
): Song[] {
  return songsData.filter(song => {
    const matchesSearch = !searchTerm ||
      song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (song.album && song.album.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (song.lyricist && song.lyricist.join(',').toLowerCase().includes(searchTerm.toLowerCase())) ||
      (song.composer && song.composer.join(',').toLowerCase().includes(searchTerm.toLowerCase()));

    // type 筛选
    const matchesType = selectedType === '全部' ||
      (selectedType === '未知' ? (!song.type || song.type.length === 0) : (song.type && song.type.includes(selectedType)));
    const matchesYear = selectedYear === '全部' ||
      (selectedYear === '未知' ? (!song.year) : (song.year && song.year.toString() === selectedYear));
    const matchesLyricist = selectedLyricist === '全部' ||
      (selectedLyricist === '未知' ? (!song.lyricist || song.lyricist.length === 0) : (song.lyricist && song.lyricist.includes(selectedLyricist)));
    const matchesComposer = selectedComposer === '全部' ||
      (selectedComposer === '未知' ? (!song.composer || song.composer.length === 0) : (song.composer && song.composer.includes(selectedComposer)));

    return matchesSearch && matchesType && matchesYear && matchesLyricist && matchesComposer;
  });
}

// 计算歌曲信息
export function calculateSongInfo(song: SongDetail): SongInfo {
  return {
    creativeInfo: [
      { label: '作词', value: (song.lyricist && song.lyricist.length > 0) ? song.lyricist.join(', ') : '未知' },
      { label: '作曲', value: (song.composer && song.composer.length > 0) ? song.composer.join(', ') : '未知' },
      { label: '编曲', value: (song.arranger && song.arranger.length > 0) ? song.arranger.join(', ') : '未知' },
      { label: '演唱', value: (song.artist && song.artist.length > 0) ? song.artist.join(', ') : '未知' },
    ],
    basicInfo: [
      { label: '专辑', value: song.album || '未知' },
      { label: '出品发行', value: (song.albumartist && song.albumartist.length > 0) ? song.albumartist.join(', ') : '未知' },
      { label: '发行日期', value: song.date || '未知' },
      { label: '时长', value: formatTime(song.length) },
      { label: '曲号', value: `${song.track || '未知'}/${song.tracktotal || '未知'}` },
      { label: '碟号', value: `${song.discnumber || '未知'}/${song.disctotal || '未知'}` },
      { label: '流派', value: (song.genre && song.genre.length > 0) ? song.genre.join(', ') : '未知' },
      { label: '类型', value: (song.type && song.type.length > 0) ? song.type.join(', ') : '原创' },
    ]
  };
}

// 数据映射和排序
export function mapAndSortSongs(data: SongDetail[]): SongDetail[] {
  const mapped = data.map((song) => ({
    ...song,
    year: song.date ? new Date(song.date).getFullYear() : null,
  }));

  return mapped.slice().sort((a, b) => {
    if (a.date && b.date) {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    } else if (a.date && !b.date) {
      return -1;
    } else if (!a.date && b.date) {
      return 1;
    } else {
      return 0;
    }
  });
}

// CSRF 相关工具

// 生成安全的 CSRF token
export function generateCSRFToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0')).join('');
}

export function getCoverUrl(song: Song | SongDetail): string {
  if (song.hascover === true) {
    return `https://cover.hetu-music.com/${song.id}.jpg`;
  } else if (song.hascover === false) {
    return 'https://cover.hetu-music.com/proto.jpg';
  } else {
    return 'https://cover.hetu-music.com/default.jpg';
  }
}

// admin 页面函数
// 通用防抖函数（适用于回调/输入等场景）
export function debounce<Args extends unknown[]>(func: (...args: Args) => void, wait: number): (...args: Args) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// 工具函数：将对象中的空字符串转为 null
export function convertEmptyStringToNull<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj.map(convertEmptyStringToNull) as T;
  } else if (obj && typeof obj === 'object') {
    const newObj: Record<string, unknown> = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const val = (obj as Record<string, unknown>)[key];
        if (val === '') {
          newObj[key] = null;
        } else if (Array.isArray(val)) {
          newObj[key] = val.map(item => item === '' ? null : item);
        } else {
          newObj[key] = val;
        }
      }
    }
    return newObj as T;
  }
  return obj;
}

// 字段格式化工具（用于表格/详情展示）
export function formatField(val: unknown, type: 'text' | 'number' | 'array' | 'boolean' | 'date' | 'textarea'): string {
  if (val == null) return '-';
  if (type === 'array') return Array.isArray(val) ? (val as string[]).join(', ') : String(val);
  if (type === 'boolean') return val ? '是' : '否';
  if (type === 'date') return val ? String(val).slice(0, 10) : '-';
  if (type === 'textarea' && typeof val === 'string' && val.length > 50) {
    return val.substring(0, 50) + '...';
  }
  return String(val);
}

// 字段校验工具（用于表单校验）
import type { SongFieldConfig } from './types';
export function validateField(f: SongFieldConfig, value: unknown): string {
  if (f.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
    return `${f.label}为必填项`;
  }
  if ((f.type === 'text' || f.type === 'textarea' || f.type === 'date') && typeof value === 'string') {
    if (f.minLength && value.length < f.minLength) {
      return `${f.label}最少${f.minLength}个字符`;
    }
    if (f.maxLength && value.length > f.maxLength) {
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
      if (typeof value !== 'number' || isNaN(value)) return `${f.label}必须为数字`;
      if (f.min !== undefined && (value as number) < f.min) {
        return `${f.label}不能小于${f.min}`;
      }
      if (!Number.isInteger(value)) {
        return `${f.label}必须为整数`;
      }
    }
  }
  return '';
}
