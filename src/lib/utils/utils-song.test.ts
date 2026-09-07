import { describe, it, expect } from "vitest";
import {
  calculateFilterOptions,
  filterSongs,
  getCoverUrl,
  getNmnUrl,
  mapAndSortSongs,
  processLyricsForSearch,
} from "./utils-song";
import type { Song } from "@/lib/types";

function makeSong(overrides: Partial<Song> & { id: number }): Song {
  return {
    title: `song-${overrides.id}`,
    album: null,
    year: null,
    genre: null,
    lyricist: null,
    composer: null,
    artist: null,
    length: null,
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("mapAndSortSongs", () => {
  it("按 date 降序排序，且从 date 计算 year", () => {
    const songs = [
      makeSong({ id: 1, date: "2020-01-01" }),
      makeSong({ id: 2, date: "2023-05-01" }),
    ];
    const result = mapAndSortSongs(songs);
    expect(result.map((s) => s.id)).toEqual([2, 1]);
    expect(result[0].year).toBe(2023);
  });

  it("没有 date 的歌曲排在有 date 的后面", () => {
    const songs = [
      makeSong({ id: 1 }), // 无 date
      makeSong({ id: 2, date: "2020-01-01" }),
    ];
    const result = mapAndSortSongs(songs);
    expect(result.map((s) => s.id)).toEqual([2, 1]);
  });

  it("都没有 date 时保持稳定，不抛异常", () => {
    const songs = [makeSong({ id: 1 }), makeSong({ id: 2 })];
    expect(() => mapAndSortSongs(songs)).not.toThrow();
  });
});

describe("getCoverUrl / getNmnUrl", () => {
  it("hascover 为 true 时返回歌曲专属封面", () => {
    expect(getCoverUrl(makeSong({ id: 1, hascover: true }))).toBe(
      "https://cover.hetu-music.com/cover/1.jpg",
    );
  });

  it("hascover 为 false 时返回占位封面", () => {
    expect(getCoverUrl(makeSong({ id: 1, hascover: false }))).toBe(
      "https://cover.hetu-music.com/cover/proto.jpg",
    );
  });

  it("hascover 缺失（undefined/null）时返回默认封面", () => {
    expect(getCoverUrl(makeSong({ id: 1 }))).toBe(
      "https://cover.hetu-music.com/cover/default.jpg",
    );
  });

  it("getNmnUrl 按 id 拼接乐谱图片地址", () => {
    expect(getNmnUrl(makeSong({ id: 42 }))).toBe(
      "https://cover.hetu-music.com/nmn/42.png",
    );
  });
});

describe("calculateFilterOptions", () => {
  it("汇总类型/流派/年份，并将缺失字段的歌曲归入“未知”", () => {
    const songs = [
      makeSong({ id: 1, type: ["原创"], genre: ["古风"], date: "2020-01-01" }),
      makeSong({ id: 2, type: [], genre: [] }), // 触发“未知”分支
    ];
    const options = calculateFilterOptions(
      mapAndSortSongs(songs), // 复用 mapAndSortSongs 补齐 year
    );
    expect(options.allTypes).toEqual(["全部", "原创", "未知"]);
    expect(options.allGenres).toEqual(["全部", "古风", "未知"]);
    expect(options.allYears).toEqual(["全部", 2020, "未知"]);
  });

  it("人名类字段按“英文在前、中文拼音在后”排序", () => {
    const songs = [
      makeSong({ id: 1, lyricist: ["张三"] }),
      makeSong({ id: 2, lyricist: ["Alice"] }),
      makeSong({ id: 3, lyricist: ["李四"] }),
    ];
    const options = calculateFilterOptions(songs);
    // 全部/Alice 在前，中文按拼音排序（李四在张三之前）
    expect(options.allLyricists).toEqual(["全部", "Alice", "李四", "张三"]);
  });
});

describe("filterSongs", () => {
  const songs = [
    makeSong({ id: 1, title: "红豆", type: ["原创"], year: 2020 }),
    makeSong({ id: 2, title: "橄榄树", type: ["翻唱"], year: 2021 }),
    makeSong({ id: 3, title: "无题", type: [] }), // 未知 type / year
  ];

  it("按类型精确筛选", () => {
    const result = filterSongs(songs, "", "原创", "全部", [], [], []);
    expect(result.map((s) => s.id)).toEqual([1]);
  });

  it("类型为“未知”时匹配缺失 type 的歌曲", () => {
    const result = filterSongs(songs, "", "未知", "全部", [], [], []);
    expect(result.map((s) => s.id)).toEqual([3]);
  });

  it("类型为“全部”时不过滤", () => {
    const result = filterSongs(songs, "", "全部", "全部", [], [], []);
    expect(result).toHaveLength(3);
  });

  it("按年份数组筛选（多选）", () => {
    const result = filterSongs(songs, "", "全部", [2020], [], [], []);
    expect(result.map((s) => s.id)).toEqual([1]);
  });

  it("使用 Fuse 模糊搜索标题", () => {
    const result = filterSongs(songs, "红豆", "全部", "全部", [], [], []);
    expect(result.map((s) => s.id)).toEqual([1]);
  });
});

describe("processLyricsForSearch", () => {
  it("去除元数据行、时间戳，并用空格拼接为一行", () => {
    const lrc = "[ti:标题]\n[00:01.00]第一句\n[00:02.00]第二句";
    expect(processLyricsForSearch(lrc)).toBe("第一句 第二句");
  });

  it("空输入返回空字符串", () => {
    expect(processLyricsForSearch(null)).toBe("");
    expect(processLyricsForSearch("")).toBe("");
  });
});
