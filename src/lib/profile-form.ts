import { z } from "zod";

const passwordRuleMessage = "新密码需包含字母和数字";

export const profileAccountFormSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, "用户名不能为空")
    .max(30, "用户名不能超过30个字符"),
  intro: z.string().max(200, "个人简介不能超过200个字符"),
});

export const profilePasswordFormSchema = z
  .object({
    currentPassword: z.string().min(1, "请输入当前密码"),
    newPassword: z
      .string()
      .min(8, "新密码不能少于8位")
      .refine(
        (value) => /[a-zA-Z]/.test(value) && /[0-9]/.test(value),
        passwordRuleMessage,
      ),
    confirmPassword: z.string().min(1, "请再次输入新密码"),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: "两次输入的新密码不一致",
    path: ["confirmPassword"],
  });

export type ProfileAccountFormValues = z.infer<typeof profileAccountFormSchema>;
export type ProfilePasswordFormValues = z.infer<
  typeof profilePasswordFormSchema
>;
