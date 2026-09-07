import { describe, it, expect } from "vitest";
import { processLyrics, validateLrcFormat } from "./utils-lyrics";

describe("processLyrics", () => {
  it("按时间戳排序，而不是按原始行顺序", () => {
    const lrc = "[00:12.34]第一句\n[00:05.00]第二句";
    const result = processLyrics(lrc);
    expect(result.lines.map((l) => l.text)).toEqual(["第二句", "第一句"]);
    expect(result.lyrics).toBe("第二句\n第一句");
  });

  it("支持 mm:ss / mm:ss.xx / mm:ss.xxx 三种时间戳格式", () => {
    const lrc = "[00:01]A\n[00:02.50]B\n[00:03.500]C";
    const result = processLyrics(lrc);
    expect(result.lines).toEqual([
      { time: 1, text: "A" },
      { time: 2.5, text: "B" },
      { time: 3.5, text: "C" },
    ]);
  });

  it("跳过元数据行（ti/ar/al/by/offset/re/ve）", () => {
    const lrc = [
      "[ti:标题]",
      "[ar:艺术家]",
      "[al:专辑]",
      "[by:作者]",
      "[offset:0]",
      "[00:01.00]正文",
    ].join("\n");
    const result = processLyrics(lrc);
    expect(result.lines).toEqual([{ time: 1, text: "正文" }]);
  });

  it("一行携带多个时间戳时，为每个时间戳生成一条歌词行", () => {
    const lrc = "[00:01.00][00:05.00]副歌重复";
    const result = processLyrics(lrc);
    expect(result.lines).toEqual([
      { time: 1, text: "副歌重复" },
      { time: 5, text: "副歌重复" },
    ]);
  });

  it("没有时间戳的行被跳过", () => {
    const lrc = "纯文本没有时间戳\n[00:01.00]有时间戳";
    const result = processLyrics(lrc);
    expect(result.lines).toEqual([{ time: 1, text: "有时间戳" }]);
  });

  it("时间戳后没有歌词文本的行被跳过", () => {
    const lrc = "[00:01.00]\n[00:02.00]正文";
    const result = processLyrics(lrc);
    expect(result.lines).toEqual([{ time: 2, text: "正文" }]);
  });

  it.each([null, undefined, "", 123 as unknown as string])(
    "非法输入 %j 时返回空结果而不抛异常",
    (input) => {
      const result = processLyrics(input as string);
      expect(result).toEqual({ lyrics: "", lines: [] });
    },
  );
});

describe("validateLrcFormat", () => {
  it("包含合法时间戳时判定为有效", () => {
    const result = validateLrcFormat("[00:12.34]歌词内容");
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("没有任何时间戳时判定为无效", () => {
    const result = validateLrcFormat("没有时间戳的纯文本");
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("No valid timestamps found in LRC content");
  });

  it("空字符串判定为无效", () => {
    const result = validateLrcFormat("");
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
