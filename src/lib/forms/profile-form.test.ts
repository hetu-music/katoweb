import { describe, it, expect } from "vitest";
import {
  profileAccountFormSchema,
  profilePasswordFormSchema,
} from "./profile-form";

describe("profileAccountFormSchema", () => {
  it("合法数据通过", () => {
    const result = profileAccountFormSchema.safeParse({
      displayName: "小明",
      intro: "一句话简介",
      display: true,
    });
    expect(result.success).toBe(true);
  });

  it("用户名为空白字符串时拒绝", () => {
    const result = profileAccountFormSchema.safeParse({
      displayName: "   ",
      intro: "",
      display: false,
    });
    expect(result.success).toBe(false);
  });

  it("简介超过200字时拒绝", () => {
    const result = profileAccountFormSchema.safeParse({
      displayName: "小明",
      intro: "a".repeat(201),
      display: false,
    });
    expect(result.success).toBe(false);
  });
});

describe("profilePasswordFormSchema", () => {
  const valid = {
    currentPassword: "oldpass1",
    newPassword: "newpass1",
    confirmPassword: "newpass1",
  };

  it("合法数据通过", () => {
    expect(profilePasswordFormSchema.safeParse(valid).success).toBe(true);
  });

  it("两次新密码不一致时报错在 confirmPassword 字段上", () => {
    const result = profilePasswordFormSchema.safeParse({
      ...valid,
      confirmPassword: "different1",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) =>
        i.path.includes("confirmPassword"),
      );
      expect(issue?.message).toBe("两次输入的新密码不一致");
    }
  });

  it("新密码不含数字时拒绝", () => {
    const result = profilePasswordFormSchema.safeParse({
      ...valid,
      newPassword: "onlyletters",
      confirmPassword: "onlyletters",
    });
    expect(result.success).toBe(false);
  });

  it("新密码少于8位时拒绝", () => {
    const result = profilePasswordFormSchema.safeParse({
      ...valid,
      newPassword: "a1",
      confirmPassword: "a1",
    });
    expect(result.success).toBe(false);
  });
});
