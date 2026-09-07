import { describe, it, expect } from "vitest";
import {
  toTraditional,
  toTraditionalArray,
  toTraditionalLrc,
} from "./utils-convert";

describe("toTraditional", () => {
  it("将简体字符转换为繁体（台湾）", () => {
    // “国” -> “國” 是 OpenCC 里最基础且稳定的简繁映射
    expect(toTraditional("中国")).toBe("中國");
  });

  it.each([null, undefined, ""])("输入 %j 时原样返回", (input) => {
    expect(toTraditional(input)).toBe(input ?? null);
  });
});

describe("toTraditionalArray", () => {
  it("逐项转换数组中的字符串", () => {
    expect(toTraditionalArray(["中国", "汉字"])).toEqual(["中國", "漢字"]);
  });

  it.each([null, undefined])("输入 %j 时原样返回", (input) => {
    expect(toTraditionalArray(input)).toBe(input ?? null);
  });

  it("空数组返回空数组", () => {
    expect(toTraditionalArray([])).toEqual([]);
  });
});

describe("toTraditionalLrc", () => {
  it("保留时间戳标签，只转换歌词文字部分", () => {
    const lrc = "[00:12.34]中国话";
    expect(toTraditionalLrc(lrc)).toBe("[00:12.34]中國話");
  });

  it("多行 LRC 逐行转换并保留换行", () => {
    const lrc = "[00:01.00]中国\n[00:02.00]汉字";
    expect(toTraditionalLrc(lrc)).toBe("[00:01.00]中國\n[00:02.00]漢字");
  });

  it.each([null, undefined, ""])("输入 %j 时原样返回", (input) => {
    expect(toTraditionalLrc(input)).toBe(input ?? null);
  });
});
