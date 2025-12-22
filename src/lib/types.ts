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

// Song 类型的数据库字段列表（用于 Supabase 查询）
// 注意：year 不是数据库字段，而是从 date 计算得出的，所以不包含在内
export const SONG_LIST_VIEW_FIELDS = [
  "id,title,album,genre,lyricist,composer,arranger,artist,length,hascover,date,type",
] as const;

// 详细歌曲类型（包含更多字段）
export type SongDetail = Song & {
  albumartist?: string[] | null;
  arranger?: string[] | null;
  comment?: string | null;
  discnumber?: number | null;
  disctotal?: number | null;
  lyrics?: string | null;
  normalLyrics?: string | null;
  track?: number | null;
  tracktotal?: number | null;
  kugolink?: string | null;
  qmlink?: string | null;
  nelink?: string | null;
  nmn_status?: boolean | null;
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
  allArrangers: string[];
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
  type: "text" | "number" | "array" | "boolean" | "date" | "textarea";
  required?: boolean;
  maxLength?: number;
  minLength?: number;
  min?: number;
  isUrl?: boolean;
  arrayMaxLength?: number;
};
