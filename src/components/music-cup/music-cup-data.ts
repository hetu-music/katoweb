import type { Song } from "@/lib/types";

export const CURATED_SONGS = [
  [9, "倾尽天下", "倾尽天下", 2013],
  [21, "凤凰劫", "唱给你的歌", 2008],
  [302, "第三十八年夏至", "风起天阑", 2010],
  [18, "风起天阑", "倾尽天下", 2013],
  [297, "不见长安", "风起天阑", 2010],
  [20, "为龙", "唱给你的歌", 2009],
  [23, "如花", "唱给你的歌", 2008],
  [26, "阳关调", "唱给你的歌", 2008],
  [24, "拉萨乱雪", "唱给你的歌", 2008],
  [288, "寒衣调", "寒衣调", null],
  [298, "伶仃谣", "风起天阑", 2010],
  [301, "白衣", "风起天阑", 2010],
  [45, "华胥引", "华胥引", 2011],
  [44, "三世演义", "三世演义", 2011],
  [51, "荔枝春", "荔枝春", 2012],
  [48, "归墟·终极", "归墟·终极", 2013],
  [27, "雨碎江南·印象", "唱给你的歌", 2009],
  [52, "长安李白", "长安李白", 2007],
  [284, "再逢明月照九州", "再逢明月照九州", 2009],
  [12, "山河永慕", "倾尽天下", 2013],
  [14, "江山此夜", "倾尽天下", 2013],
  [13, "春风一顾", "倾尽天下", 2013],
  [15, "海棠酒满", "倾尽天下", 2013],
  [17, "陌上花早", "倾尽天下", 2013],
  [56, "寸缕", "寸缕", 2013],
  [305, "依山观澜", "千里丹心万里路", 2014],
  [67, "盲眼画师", "听文", 2014],
  [63, "古龙群侠传", "古龙群侠传", 2014],
  [75, "不良人", "不良人", 2015],
  [83, "狐言", "狐言", 2015],
  [65, "朝忆梨花暮忆雪", "朝忆梨花暮忆雪", 2015],
  [5, "越人歌", "NL不分", 2016],
  [2, "万人非你", "NL不分", 2016],
  [90, "东流", "东流", 2016],
  [130, "是风动", "蚍蜉渡海", 2017],
  [134, "云舒", "云舒", 2018],
  [137, "天光之外", "天光之外", 2018],
  [126, "若某日我封笔", "若某日我封笔", 2017],
  [111, "不见有情", "不见有情", 2017],
  [138, "宝塔镇河妖", "宝塔镇河妖", 2018],
  [159, "皎皎", "皎皎", 2019],
  [163, "赴约如期", "赴约如期", 2019],
  [152, "天命在我", "天命在我", 2019],
  [174, "听雨楼外", "听雨楼外", 2020],
  [201, "惘然记", "惘然记", 2021],
  [182, "无以为乡", "无以为乡", 2020],
  [236, "又惊春", "又惊春", 2023],
  [240, "明明明月是前身", "明明明月是前身", 2023],
] as const;

export const CURATED_SONG_IDS = CURATED_SONGS.map(([id]) => id);

// These catalog pages currently expose the site's generic OG cover.
const CURATED_SONGS_WITHOUT_COVER = new Set([
  52, 56, 126, 134, 137, 236, 240, 284, 288,
]);

export const FALLBACK_SONGS: Song[] = CURATED_SONGS.map(
  ([id, title, album, year]) => ({
    id,
    title,
    album,
    year,
    genre: null,
    lyricist: null,
    composer: null,
    arranger: null,
    artist: ["河图"],
    length: null,
    hascover: CURATED_SONGS_WITHOUT_COVER.has(id) ? null : true,
    date: null,
    type: ["原创"],
    updated_at: "",
    has_audio: true,
  }),
);

const FALLBACK_SONGS_BY_ID = new Map(
  FALLBACK_SONGS.map((song) => [song.id, song]),
);

function isHetuSong(song: Song) {
  return song.artist?.some((artist) => artist.includes("河图")) ?? false;
}

/**
 * Keep the editorial list stable while using live metadata whenever possible.
 * A partial catalog is filled by recent Hetu songs, then by bundled fallbacks.
 */
export function selectCupSongs(allSongs: Song[]): Song[] {
  if (allSongs.length === 0) return FALLBACK_SONGS;

  const byId = new Map(allSongs.map((song) => [song.id, song]));
  const selected = CURATED_SONG_IDS.flatMap((id) => {
    const song = byId.get(id);
    const fallback = FALLBACK_SONGS_BY_ID.get(id);
    if (!song || !fallback) return [];

    return [
      {
        ...song,
        album: song.album?.trim() ? song.album : fallback.album,
        year: song.year ?? fallback.year,
      },
    ];
  });
  const selectedIds = new Set(selected.map((song) => song.id));

  for (const song of allSongs) {
    if (selected.length >= 48) break;
    if (!selectedIds.has(song.id) && isHetuSong(song)) {
      selected.push(song);
      selectedIds.add(song.id);
    }
  }

  for (const song of FALLBACK_SONGS) {
    if (selected.length >= 48) break;
    if (!selectedIds.has(song.id)) {
      selected.push(song);
      selectedIds.add(song.id);
    }
  }

  return selected.slice(0, 48);
}
