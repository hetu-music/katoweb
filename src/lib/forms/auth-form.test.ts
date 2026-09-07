import { describe, it, expect } from "vitest";
import {
  createAuthFormSchema,
  createAuthFormValues,
  createOtpFormValues,
  otpFormSchema,
} from "./auth-form";

describe("createAuthFormSchema", () => {
  it("login 模式：密码只要非空即可，不校验复杂度", () => {
    const schema = createAuthFormSchema("login");
    const result = schema.safeParse({
      email: "user@example.com",
      password: "123",
      turnstileToken: "token",
    });
    expect(result.success).toBe(true);
  });

  it("register 模式：密码必须至少8位且包含字母和数字", () => {
    const schema = createAuthFormSchema("register");
    const weak = schema.safeParse({
      email: "user@example.com",
      password: "12345678", // 纯数字，不满足复杂度
      turnstileToken: "token",
    });
    expect(weak.success).toBe(false);

    const strong = schema.safeParse({
      email: "user@example.com",
      password: "abc12345",
      turnstileToken: "token",
    });
    expect(strong.success).toBe(true);
  });

  it("邮箱格式非法时拒绝", () => {
    const schema = createAuthFormSchema("login");
    const result = schema.safeParse({
      email: "not-an-email",
      password: "123",
      turnstileToken: "token",
    });
    expect(result.success).toBe(false);
  });

  it("缺少 turnstileToken 时拒绝（人机验证必填）", () => {
    const schema = createAuthFormSchema("login");
    const result = schema.safeParse({
      email: "user@example.com",
      password: "123",
      turnstileToken: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("otpFormSchema", () => {
  it("6 位数字验证码通过", () => {
    const result = otpFormSchema.safeParse({
      otp: ["1", "2", "3", "4", "5", "6"],
    });
    expect(result.success).toBe(true);
  });

  it("包含未填写的空位时拒绝", () => {
    const result = otpFormSchema.safeParse({
      otp: ["1", "2", "", "4", "5", "6"],
    });
    expect(result.success).toBe(false);
  });

  it("长度不为 6 时拒绝", () => {
    const result = otpFormSchema.safeParse({ otp: ["1", "2", "3"] });
    expect(result.success).toBe(false);
  });
});

describe("默认值工厂", () => {
  it("createAuthFormValues 返回空白表单", () => {
    expect(createAuthFormValues()).toEqual({
      email: "",
      password: "",
      turnstileToken: "",
    });
  });

  it("createOtpFormValues 返回 6 个空字符串", () => {
    expect(createOtpFormValues()).toEqual({
      otp: ["", "", "", "", "", ""],
    });
  });
});
