import { describe, it, expect } from "vitest";
import { getAudio } from "./audio-engine";

// getAudio() 的核心不变量是 SSR 安全：服务端（没有 window）必须返回 null，
// 不能在渲染服务端组件时意外实例化 Audio。
// 真实浏览器里创建 Audio 元素并绑定事件监听的行为需要 jsdom + 完整的
// HTMLMediaElement 实现（jsdom 本身对 play()/pause() 只是桩实现），
// 价值有限，这里不展开测。

describe("getAudio（服务端安全性）", () => {
  it("非浏览器环境（没有 window）时返回 null，不抛异常", () => {
    expect(typeof window).toBe("undefined");
    expect(getAudio()).toBeNull();
  });

  it("多次调用在同一（无 window）环境下始终返回 null", () => {
    expect(getAudio()).toBeNull();
    expect(getAudio()).toBeNull();
  });
});
