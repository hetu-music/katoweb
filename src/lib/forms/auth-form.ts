import { z } from "zod";

const passwordRule = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export function createAuthFormSchema(mode: "login" | "register") {
  return z.object({
    email: z.email("请输入正确的邮箱地址"),
    password:
      mode === "login"
        ? z.string().min(1, "请输入密码")
        : z.string().regex(passwordRule, "密码要求至少8位，并包含字母和数字"),
    turnstileToken: z.string().min(1, "请完成人机验证"),
  });
}

export const otpFormSchema = z
  .object({
    otp: z.array(z.string().regex(/^\d?$/, "验证码只能为数字")).length(6),
  })
  .superRefine((values, context) => {
    if (values.otp.some((digit) => !/^\d$/.test(digit))) {
      context.addIssue({
        code: "custom",
        path: ["otp"],
        message: "请输入完整的6位验证码",
      });
    }
  });

export type AuthFormValues = z.infer<ReturnType<typeof createAuthFormSchema>>;
export type OtpFormValues = z.infer<typeof otpFormSchema>;

export function createAuthFormValues(): AuthFormValues {
  return {
    email: "",
    password: "",
    turnstileToken: "",
  };
}

export function createOtpFormValues(): OtpFormValues {
  return {
    otp: ["", "", "", "", "", ""],
  };
}
