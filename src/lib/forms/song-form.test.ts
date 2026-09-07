import { describe, it, expect } from "vitest";
import {
  createEmptySongForm,
  createEmptySongFormState,
  toSongFormPayload,
  toSongFormState,
  validateSongForm,
  type SongFormValues,
} from "./song-form";
import type { SongDetail } from "@/lib/types";

describe("toSongFormState / toSongFormPayload 往返转换", () => {
  it("state → payload 时数组字段从 {value} 对象还原为字符串数组", () => {
    const state = createEmptySongFormState();
    state.title = "测试歌曲";
    state.lyricist = [{ value: "甲" }, { value: "乙" }];

    const payload = toSongFormPayload(state);
    expect(payload.lyricist).toEqual(["甲", "乙"]);
    expect(payload.title).toBe("测试歌曲");
  });

  it("song → state 时数组字段包裹为 {value} 供 useFieldArray 使用", () => {
    const song: Partial<SongDetail> = {
      title: "标题",
      lyricist: ["甲", "乙"],
    };
    const state = toSongFormState(song);
    expect(state.lyricist).toEqual([{ value: "甲" }, { value: "乙" }]);
  });

  it("song 缺失字段时补齐为空值而不是 undefined", () => {
    const state = toSongFormState({ title: "只有标题" });
    expect(state.album).toBe("");
    expect(state.length).toBeNull();
    expect(state.composer).toEqual([]);
  });

  it("null / 非法类型字段被规范化为对应空值", () => {
    const song = {
      title: 123, // 非字符串
      length: "not-a-number",
      hascover: "true", // 非布尔值
    } as unknown as Partial<SongDetail>;
    const state = toSongFormState(song);
    expect(state.title).toBe("123");
    expect(state.length).toBeNull();
    expect(state.hascover).toBeNull();
  });
});

describe("validateSongForm", () => {
  function baseValues(): SongFormValues {
    return { ...createEmptySongForm(), title: "合法标题" };
  }

  it("合法数据通过校验", () => {
    const result = validateSongForm(baseValues());
    expect(result.errors).toEqual({});
    expect(result.data).not.toBeNull();
  });

  it("标题为空时报错", () => {
    const result = validateSongForm({ ...baseValues(), title: "" });
    expect(result.data).toBeNull();
    expect(result.errors.title).toBeTruthy();
  });

  it("非法 URL 时报错", () => {
    const result = validateSongForm({
      ...baseValues(),
      kugolink: "not-a-url",
    });
    expect(result.data).toBeNull();
    expect(result.errors.kugolink).toBeTruthy();
  });

  it("空字符串 URL 视为未填写，不报错", () => {
    const result = validateSongForm({ ...baseValues(), kugolink: "" });
    expect(result.errors.kugolink).toBeUndefined();
  });

  it("length 为负数时报错", () => {
    const result = validateSongForm({ ...baseValues(), length: -1 });
    expect(result.errors.length).toBeTruthy();
  });
});
