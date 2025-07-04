// 基础歌曲类型
export type Song = {
  id: number;
  title: string;
  album: string | null;
  year: number | null;
  genre: string[] | null;
  lyricist: string[] | null;
  composer: string[] | null;
  artist: string[] | null;
  length: number | null;
  hascover?: boolean | null;
  date?: string | null;
  type?: string[] | null;
  updated_at: string;
};

// 详细歌曲类型（包含更多字段）
export type SongDetail = Song & {
  albumartist?: string[] | null;
  arranger?: string[] | null;
  comment?: string | null;
  discnumber?: number | null;
  disctotal?: number | null;
  lyrics?: string | null;
  track?: number | null;
  tracktotal?: number | null;
  kugolink?: string | null;
  qmlink?: string | null;
  nelink?: string | null;
};

// 音乐库客户端组件属性
export interface MusicLibraryClientProps {
  initialSongsData: Song[];
}

// 歌曲详情客户端组件属性
export interface SongDetailClientProps {
  song: SongDetail;
}

// 筛选选项类型
export interface FilterOptions {
  allTypes: string[];
  allYears: (string | number)[];
  allLyricists: string[];
  allComposers: string[];
}

// 歌曲信息类型
export interface SongInfo {
  creativeInfo: Array<{ label: string; value: string }>;
  basicInfo: Array<{ label: string; value: string }>;
}

// 歌曲字段配置类型（用于管理页面表单渲染和校验）
export type SongFieldConfig = {
  key: keyof SongDetail;
  label: string;
  type: 'text' | 'number' | 'array' | 'boolean' | 'date' | 'textarea';
  required?: boolean;
  maxLength?: number;
  minLength?: number;
  min?: number;
  isUrl?: boolean;
  arrayMaxLength?: number;
};
