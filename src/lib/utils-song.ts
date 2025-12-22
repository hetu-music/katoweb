import { Song, SongDetail, FilterOptions, SongInfo, SongFieldConfig } from "./types";
import { TYPE_ORDER } from "./constants";
import Fuse from "fuse.js";
import { formatDate, formatTime } from "./utils-common";

// 判断字符串首字母是否为英文
function startsWithEnglish(str: string): boolean {
  return /^[a-zA-Z]/.test(str);
}

// 优化的排序函数：首字母英文的在前按字母表排序，首字母中文的在后按拼音排序
function sortNamesOptimized(names: string[]): string[] {
  const englishStartNames: string[] = [];
  const chineseStartNames: string[] = [];

  names.forEach((name) => {
    if (startsWithEnglish(name)) {
      englishStartNames.push(name);
    } else {
      chineseStartNames.push(name);
    }
  });

  // 首字母英文的按字母表排序
  englishStartNames.sort((a, b) =>
    a.localeCompare(b, "en", { sensitivity: "base" }),
  );

  // 首字母中文的按拼音排序
  chineseStartNames.sort((a, b) =>
    a.localeCompare(b, "zh-CN", { sensitivity: "base" }),
  );

  return [...englishStartNames, ...chineseStartNames];
}

// 计算筛选选项
export function calculateFilterOptions(songsData: Song[]): FilterOptions {
  // 处理类型
  const typeSet = new Set<string>();
  let hasUnknownType = false;
  songsData.forEach((song) => {
    if (!song.type || song.type.length === 0) {
      hasUnknownType = true;
    } else {
      song.type.forEach((t) => typeSet.add(t));
    }
  });
  // 按 TYPE_ORDER 顺序排序
  const preferredOrder = TYPE_ORDER;
  let allTypes = Array.from(typeSet);
  allTypes = preferredOrder
    .filter((t) => allTypes.includes(t))
    .concat(allTypes.filter((t) => !preferredOrder.includes(t)));
  allTypes = ["全部", ...allTypes];
  if (hasUnknownType) allTypes.push("未知");

  // 处理年份
  const yearSet = new Set<number>();
  let hasUnknownYear = false;
  songsData.forEach((song) => {
    if (!song.year) {
      hasUnknownYear = true;
    } else {
      yearSet.add(song.year);
    }
  });
  const allYears = [
    "全部",
    ...Array.from(yearSet).sort((a, b) => (b as number) - (a as number)),
  ];
  if (hasUnknownYear) allYears.push("未知");

  // 处理作词
  const lyricistSet = new Set<string>();
  let hasUnknownLyricist = false;
  songsData.forEach((song) => {
    if (!song.lyricist || song.lyricist.length === 0) {
      hasUnknownLyricist = true;
    } else {
      song.lyricist.forEach((l) => lyricistSet.add(l));
    }
  });
  const sortedLyricists = sortNamesOptimized(Array.from(lyricistSet));
  const allLyricists = ["全部", ...sortedLyricists];
  if (hasUnknownLyricist) allLyricists.push("未知");

  // 处理作曲
  const composerSet = new Set<string>();
  let hasUnknownComposer = false;
  songsData.forEach((song) => {
    if (!song.composer || song.composer.length === 0) {
      hasUnknownComposer = true;
    } else {
      song.composer.forEach((c) => composerSet.add(c));
    }
  });
  const sortedComposers = sortNamesOptimized(Array.from(composerSet));
  const allComposers = ["全部", ...sortedComposers];
  if (hasUnknownComposer) allComposers.push("未知");

  // 处理编曲
  const arrangerSet = new Set<string>();
  let hasUnknownArranger = false;
  songsData.forEach((song) => {
    // 需要检查 arranger 字段，如果 Song 类型没有，则从 SongDetail 获取
    const songDetail = song as SongDetail;
    if (!songDetail.arranger || songDetail.arranger.length === 0) {
      hasUnknownArranger = true;
    } else {
      songDetail.arranger.forEach((a) => arrangerSet.add(a));
    }
  });
  const sortedArrangers = sortNamesOptimized(Array.from(arrangerSet));
  const allArrangers = ["全部", ...sortedArrangers];
  if (hasUnknownArranger) allArrangers.push("未知");

  return { allTypes, allYears, allLyricists, allComposers, allArrangers };
}

// 处理 LRC 歌词用于搜索
export function processLyricsForSearch(lrcLyrics: string | null): string {
  if (!lrcLyrics) return "";

  // 1. 过滤掉头部信息行 (ar:, ti:, al:, by:, offset:, re:, ve: 等)
  let processedText = lrcLyrics.replace(
    /^\[(?:ar|ti|al|by|offset|re|ve):[^\]]*\]\s*$/gm,
    "",
  );

  // 2. 移除时间戳 [00:26.87] [00:15.365] 等
  processedText = processedText.replace(/\[\d{1,2}:\d{2}(?:\.\d{1,3})?\]/g, "");

  // 3. 清理多余的空白字符和空行
  const lines = processedText
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  return lines.join(" ");
}

// 创建 Fuse.js 搜索实例（不包含歌词搜索）
export function createFuseInstance(songs: Song[]) {
  // 为每首歌准备搜索数据
  const searchData = songs.map((song) => {
    const songDetail = song as SongDetail;
    return {
      ...song,
      searchableContent: [
        song.title,
        song.album || "",
        (song.lyricist || []).join(" "),
        (song.composer || []).join(" "),
        (songDetail.arranger || []).join(" "),
      ]
        .filter(Boolean)
        .join(" "),
    };
  });

  return new Fuse(searchData, {
    keys: [
      { name: "title", weight: 0.35 }, // 提高标题权重
      { name: "album", weight: 0.25 }, // 提高专辑权重
      { name: "lyricist", weight: 0.2 },
      { name: "composer", weight: 0.1 },
      { name: "arranger", weight: 0.1 },
    ],
    threshold: 0.4, // 放宽阈值，对中文更友好
    includeScore: true,
    ignoreLocation: true,
    findAllMatches: true,
    minMatchCharLength: 1, // 允许单字符匹配
    shouldSort: true,
  });
}

// 过滤歌曲
export function filterSongs(
  songsData: Song[],
  searchTerm: string,
  selectedType: string,
  selectedYear: string | (string | number)[],
  selectedLyricist: string,
  selectedComposer: string,
  selectedArranger: string,
  fuseInstance?: Fuse<Song & { searchableContent: string }>,
): Song[] {
  let filteredBySearch = songsData;

  // 如果有搜索词，使用 Fuse.js 进行模糊搜索
  if (searchTerm.trim()) {
    const fuse = fuseInstance || createFuseInstance(songsData);
    const searchResults = fuse.search(searchTerm);
    filteredBySearch = searchResults.map((result) => result.item);
  }

  // 应用其他筛选条件
  return filteredBySearch.filter((song) => {
    const songDetail = song as SongDetail;

    // type 筛选
    const matchesType =
      selectedType === "全部" ||
      (selectedType === "未知"
        ? !song.type || song.type.length === 0
        : song.type && song.type.includes(selectedType));

    // year 筛选
    let matchesYear = true;
    if (Array.isArray(selectedYear)) {
      if (selectedYear.length > 0) {
        // 如果是数组，检查是否包含
        const yearVal = song.year || "未知";
        matchesYear = selectedYear.includes(yearVal);
      }
    } else {
      matchesYear =
        selectedYear === "全部" ||
        (selectedYear === "未知"
          ? !song.year
          : (song.year?.toString() ?? "") === selectedYear);
    }

    const matchesLyricist =
      selectedLyricist === "全部" ||
      (selectedLyricist === "未知"
        ? !song.lyricist || song.lyricist.length === 0
        : song.lyricist && song.lyricist.includes(selectedLyricist));

    const matchesComposer =
      selectedComposer === "全部" ||
      (selectedComposer === "未知"
        ? !song.composer || song.composer.length === 0
        : song.composer && song.composer.includes(selectedComposer));

    const matchesArranger =
      selectedArranger === "全部" ||
      (selectedArranger === "未知"
        ? !songDetail.arranger || songDetail.arranger.length === 0
        : songDetail.arranger &&
          songDetail.arranger.includes(selectedArranger));

    return (
      matchesType &&
      matchesYear &&
      matchesLyricist &&
      matchesComposer &&
      matchesArranger
    );
  });
}

// 计算歌曲信息
export function calculateSongInfo(song: SongDetail): SongInfo {
  return {
    creativeInfo: [
      {
        label: "作词",
        value:
          song.lyricist && song.lyricist.length > 0
            ? song.lyricist.join(" ")
            : "未知",
      },
      {
        label: "作曲",
        value:
          song.composer && song.composer.length > 0
            ? song.composer.join(" ")
            : "未知",
      },
      {
        label: "编曲",
        value:
          song.arranger && song.arranger.length > 0
            ? song.arranger.join(" ")
            : "未知",
      },
      {
        label: "演唱",
        value:
          song.artist && song.artist.length > 0
            ? song.artist.join(" ")
            : "未知",
      },
    ],
    basicInfo: [
      { label: "专辑", value: song.album || "未知" },
      {
        label: "出品发行",
        value:
          song.albumartist && song.albumartist.length > 0
            ? song.albumartist.join(" ")
            : "未知",
      },
      { label: "发行日期", value: formatDate(song.date) },
      { label: "时长", value: formatTime(song.length) },
      {
        label: "曲号",
        value: `${song.track || "未知"}/${song.tracktotal || "未知"}`,
      },
      {
        label: "碟号",
        value: `${song.discnumber || "未知"}/${song.disctotal || "未知"}`,
      },
      {
        label: "流派",
        value:
          song.genre && song.genre.length > 0 ? song.genre.join(" ") : "未知",
      },
      {
        label: "类型",
        value: song.type && song.type.length > 0 ? song.type.join(" ") : "原创",
      },
    ],
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

export function getCoverUrl(song: Song | SongDetail): string {
  if (song.hascover === true) {
    return `https://cover.hetu-music.com/cover/${song.id}.jpg`;
  } else if (song.hascover === false) {
    return "https://cover.hetu-music.com/cover/proto.jpg";
  } else {
    return "https://cover.hetu-music.com/cover/default.jpg";
  }
}

// 获取乐谱图片 URL
export function getNmnUrl(song: Song | SongDetail): string {
  return `https://cover.hetu-music.com/nmn/${song.id}.png`;
}

// 字段校验工具（用于表单校验）
export function validateField(f: SongFieldConfig, value: unknown): string {
  if (
    f.required &&
    (!value || (typeof value === "string" && value.trim() === ""))
  ) {
    return `${f.label}为必填项`;
  }
  if (
    (f.type === "text" || f.type === "textarea" || f.type === "date") &&
    typeof value === "string"
  ) {
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
  if (f.type === "array" && Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      if (f.arrayMaxLength && value[i] && value[i].length > f.arrayMaxLength) {
        return `${f.label}第${i + 1}项不能超过${f.arrayMaxLength}个字符`;
      }
    }
  }
  if (f.type === "number") {
    if (value !== null && value !== undefined && value !== "") {
      if (typeof value !== "number" || isNaN(value))
        return `${f.label}必须为数字`;
      if (f.min !== undefined && (value as number) < f.min) {
        return `${f.label}不能小于${f.min}`;
      }
      if (!Number.isInteger(value)) {
        return `${f.label}必须为整数`;
      }
    }
  }
  return "";
}
