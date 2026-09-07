import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("合并多个类名字符串", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("忽略 falsy 值", () => {
    expect(cn("a", false, null, undefined, "b")).toBe("a b");
  });

  it("冲突的 Tailwind 类名以后者为准（tailwind-merge 行为）", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("支持条件对象写法", () => {
    expect(cn("base", { active: true, disabled: false })).toBe("base active");
  });
});
