import type { SongFieldConfig } from './types';

// 歌曲字段配置
export const songFields: SongFieldConfig[] = [
  { key: 'title', label: '标题', type: 'text', required: true, minLength: 1, maxLength: 100 },
  { key: 'album', label: '专辑', type: 'text', maxLength: 100 },
  { key: 'lyricist', label: '作词', type: 'array', arrayMaxLength: 30 },
  { key: 'composer', label: '作曲', type: 'array', arrayMaxLength: 30 },
  { key: 'arranger', label: '编曲', type: 'array', arrayMaxLength: 30 },
  { key: 'artist', label: '演唱', type: 'array', arrayMaxLength: 30 },
  { key: 'type', label: '类型', type: 'array', arrayMaxLength: 30 },
  { key: 'genre', label: '流派', type: 'array', arrayMaxLength: 30 },
  { key: 'length', label: '时长(秒)', type: 'number', min: 1 },
  { key: 'hascover', label: '封面', type: 'boolean' },
  { key: 'date', label: '日期', type: 'date', maxLength: 30 },
  { key: 'albumartist', label: '出品发行', type: 'array', arrayMaxLength: 30 },
  { key: 'comment', label: '备注', type: 'textarea', maxLength: 10000 },
  { key: 'lyrics', label: 'LRC歌词', type: 'textarea', maxLength: 10000 },
  { key: 'track', label: '曲号', type: 'number', min: 1 },
  { key: 'tracktotal', label: '曲总数', type: 'number', min: 1 },
  { key: 'discnumber', label: '碟号', type: 'number', min: 1 },
  { key: 'disctotal', label: '碟总数', type: 'number', min: 1 },
  { key: 'kugolink', label: '酷狗链接', type: 'text', maxLength: 200, isUrl: true },
  { key: 'nelink', label: '网易云链接', type: 'text', maxLength: 200, isUrl: true },
  { key: 'qmlink', label: 'QQ音乐链接', type: 'text', maxLength: 200, isUrl: true },
];

// 类型标签颜色映射
export const typeColorMap: Record<string, string> = {
    '原创': 'bg-purple-500/20 text-purple-300 border-purple-400/30',
    '翻唱': 'bg-green-500/20 text-green-300 border-green-400/30',
    '合作': 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30',
    '商业': 'bg-orange-500/20 text-orange-300 border-orange-400/30',
    '墨宝': 'bg-red-500/20 text-red-300 border-red-400/30',
    '参与': 'bg-pink-500/20 text-pink-300 border-pink-400/30',
  };
  
  // 流派标签颜色映射
  export const genreColorMap: Record<string, string> = {
    '流行': 'bg-red-500/20 text-red-300 border-red-400/30',
    '古风': 'bg-blue-500/20 text-blue-300 border-blue-400/30',
    '摇滚': 'bg-gray-500/20 text-gray-300 border-gray-400/30',
    '民谣': 'bg-green-500/20 text-green-300 border-green-400/30',
    '电子': 'bg-purple-500/20 text-purple-300 border-purple-400/30',
    '说唱': 'bg-orange-500/20 text-orange-300 border-orange-400/30',
    '民族': 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30',
    '古典': 'bg-indigo-500/20 text-indigo-300 border-indigo-400/30',
    '其他': 'bg-pink-500/20 text-pink-300 border-pink-400/30',
    '布鲁斯': 'bg-cyan-500/20 text-cyan-300 border-cyan-400/30',
    '新世纪': 'bg-slate-500/20 text-slate-300 border-slate-400/30',
  };