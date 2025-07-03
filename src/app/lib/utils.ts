import { Song, SongDetail, FilterOptions, SongInfo } from './types';

// 格式化时间
export function formatTime(seconds: number | null): string {
  if (!seconds || isNaN(seconds)) return '未知';
  const min = Math.floor(seconds / 60);
  const sec = (seconds % 60).toString().padStart(2, '0');
  return `${min}:${sec}`;
}

// 类型标签颜色映射
export const typeColorMap: Record<string, string> = {
  '翻唱': 'bg-green-500/20 text-green-300 border-green-400/30',
  '合作': 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30',
  '原创': 'bg-purple-500/20 text-purple-300 border-purple-400/30',
  '商业': 'bg-orange-500/20 text-orange-300 border-orange-400/30',
  '墨宝': 'bg-red-500/20 text-red-300 border-red-400/30',
};

// 流派标签颜色映射
export const genreColorMap: Record<string, string> = {
  '流行': 'bg-red-500/20 text-red-300 border-red-400/30',
  '古风': 'bg-blue-500/20 text-blue-300 border-blue-400/30',
  '摇滚': 'bg-gray-500/20 text-gray-300 border-gray-400/30',
  '民谣': 'bg-green-500/20 text-green-300 border-green-400/30',
  '电子': 'bg-purple-500/20 text-purple-300 border-purple-400/30',
  '说唱': 'bg-orange-500/20 text-orange-300 border-orange-400/30',
  '爵士': 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30',
  '古典': 'bg-indigo-500/20 text-indigo-300 border-indigo-400/30',
  '其他': 'bg-pink-500/20 text-pink-300 border-pink-400/30',
};

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
      { label: '专辑创作', value: (song.albumartist && song.albumartist.length > 0) ? song.albumartist.join(', ') : '未知' },
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
export function mapAndSortSongs(data: SongDetail[]): Song[] {
  // 数据映射
  const mapped = data.map((song) => ({
    id: song.id,
    title: song.title,
    album: song.album,
    year: song.date ? new Date(song.date).getFullYear() : null,
    genre: song.genre,
    lyricist: song.lyricist,
    composer: song.composer,
    artist: song.artist,
    length: song.length,
    hascover: song.hascover,
    date: song.date,
    type: song.type,
    kugolink: song.kugolink ?? null,
    qmlink: song.qmlink ?? null,
    nelink: song.nelink ?? null,
  }));

  // 排序：有日期的按日期从新到旧，无日期的排在后面并保持原顺序
  return mapped.slice().sort((a: Song, b: Song) => {
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

// 获取 cookie 中的 CSRF token
export async function getCSRFCookie(): Promise<string | undefined> {
  // 依赖 next/headers 的实现
  return undefined;
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
