"use client";

import { useUserContext } from "@/context/UserContext";
import { useCsrfToken } from "@/hooks/useCsrfToken";
import {
  profileAccountFormSchema,
  profilePasswordFormSchema,
  type ProfileAccountFormValues,
  type ProfilePasswordFormValues,
} from "@/lib/profile-form";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

export default function AccountTabContent() {
  const { user, loaded: userLoaded, refetch } = useUserContext();
  const csrfToken = useCsrfToken();
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">(
    "idle",
  );
  const [saveErrMsg, setSaveErrMsg] = useState<string>("");
  const [pwdMsg, setPwdMsg] = useState<string | null>(null);

  const accountForm = useForm<ProfileAccountFormValues>({
    resolver: zodResolver(profileAccountFormSchema),
    defaultValues: {
      displayName: "",
      intro: "",
      display: false,
    },
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  const passwordForm = useForm<ProfilePasswordFormValues>({
    resolver: zodResolver(profilePasswordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  const displayPublic = useWatch({
    control: accountForm.control,
    name: "display",
  });

  // Sync user details to form fields
  useEffect(() => {
    if (user) {
      accountForm.reset({
        displayName: user.name ?? "",
        intro: user.intro ?? "",
        display: user.display ?? false,
      });
    }
  }, [accountForm, user]);

  const handleSave = accountForm.handleSubmit(
    async ({ displayName, intro, display }) => {
      setSaveStatus("idle");
      if (!csrfToken) {
        setSaveStatus("error");
        setSaveErrMsg("保存失败");
        return;
      }
      try {
        const res = await fetch("/api/auth/account", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-csrf-token": csrfToken,
          },
          body: JSON.stringify({
            displayName,
            intro,
            ...(user?.isAdmin ? { display } : {}),
          }),
        });
        if (res.ok) {
          setSaveStatus("saved");
          // Refresh user context details
          await refetch();
        } else {
          const d = await res.json();
          setSaveStatus("error");
          setSaveErrMsg(d.error || "保存失败");
        }
      } catch {
        setSaveStatus("error");
        setSaveErrMsg("保存失败");
      } finally {
        setTimeout(() => setSaveStatus("idle"), 2500);
      }
    },
  );

  const handleChangePassword = passwordForm.handleSubmit(
    async ({ currentPassword, newPassword }) => {
      setPwdMsg(null);
      if (!csrfToken) {
        setPwdMsg("修改失败");
        return;
      }
      try {
        const res = await fetch("/api/auth/change-password", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-csrf-token": csrfToken,
          },
          body: JSON.stringify({ oldPassword: currentPassword, newPassword }),
        });
        if (res.ok) {
          setPwdMsg("密码修改成功");
          passwordForm.reset();
        } else {
          const d = await res.json();
          setPwdMsg(d.error || "修改失败");
        }
      } catch {
        setPwdMsg("修改失败");
      } finally {
        setTimeout(() => setPwdMsg(null), 3500);
      }
    },
  );

  if (!userLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-320px)]">
        <Loader2 size={32} className="animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex-1 flex flex-col">
      <div className="bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-6 border border-slate-200/50 dark:border-slate-800/50 shadow-xs space-y-6 flex-1">
        <div className="space-y-1">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            账户设置
          </h3>
          <p className="text-xs text-slate-400">管理您的公开资料与基本信息</p>
        </div>

        <div className="space-y-6">
          <form onSubmit={handleSave} className="space-y-6" noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">
                  用户名
                </label>
                <input
                  type="text"
                  maxLength={30}
                  {...accountForm.register("displayName")}
                  className={cn(
                    "w-full px-3.5 py-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none transition-colors text-sm text-slate-900 dark:text-slate-100 focus:border-blue-500 dark:focus:border-blue-500",
                    accountForm.formState.errors.displayName &&
                      "border-rose-300 focus:border-rose-500",
                  )}
                />
                {accountForm.formState.errors.displayName && (
                  <p className="text-xs text-rose-500 ml-1">
                    {accountForm.formState.errors.displayName.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">
                  邮箱
                </label>
                <div className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-500 cursor-not-allowed border border-slate-200/60 dark:border-slate-800/60">
                  {user?.email}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">
                个人简介
              </label>
              <textarea
                maxLength={200}
                rows={3}
                {...accountForm.register("intro")}
                className={cn(
                  "w-full px-3.5 py-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none transition-colors text-sm text-slate-900 dark:text-slate-100 resize-none focus:border-blue-500 dark:focus:border-blue-500",
                  accountForm.formState.errors.intro &&
                    "border-rose-300 focus:border-rose-500",
                )}
              />
              {accountForm.formState.errors.intro && (
                <p className="text-xs text-rose-500 ml-1">
                  {accountForm.formState.errors.intro.message}
                </p>
              )}
            </div>

            {/* Display 公开展示 — 仅管理员可见 */}
            {user?.isAdmin && (
              <div className="rounded-xl border border-blue-100 dark:border-blue-500/20 bg-blue-50/50 dark:bg-blue-500/5 px-4 py-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    公开展示
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      accountForm.setValue("display", !displayPublic, {
                        shouldDirty: true,
                        shouldTouch: true,
                      })
                    }
                    className={cn(
                      "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500/50",
                      displayPublic
                        ? "bg-blue-500"
                        : "bg-slate-300 dark:bg-slate-700",
                    )}
                    aria-pressed={displayPublic}
                    aria-label="切换公开展示"
                  >
                    <span
                      className={cn(
                        "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                        displayPublic ? "translate-x-5" : "translate-x-0",
                      )}
                    />
                  </button>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pr-10">
                  开启后，你的用户名和个人简介将在站内 关于-维护团队
                  页面中展示。
                </p>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={accountForm.formState.isSubmitting || !csrfToken}
                className={cn(
                  "px-5 py-2 rounded-full text-sm font-bold flex items-center justify-center gap-2",
                  accountForm.formState.isSubmitting || !csrfToken
                    ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                    : saveStatus === "saved"
                      ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/10"
                      : saveStatus === "error"
                        ? "bg-rose-500 text-white shadow-md shadow-rose-500/10"
                        : "bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/10 active:scale-95",
                )}
              >
                {accountForm.formState.isSubmitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : saveStatus === "saved" ? (
                  <Check size={16} />
                ) : null}
                {saveStatus === "saved"
                  ? "已保存"
                  : saveStatus === "error"
                    ? saveErrMsg
                    : "保存更改"}
              </button>
            </div>
          </form>
        </div>

        {/* Password Change Section */}
        <div className="pt-8 mt-8 border-t border-slate-100 dark:border-slate-800 space-y-6">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              修改密码
            </h4>
            <p className="text-xs text-slate-400">设置一个更安全的新密码</p>
          </div>

          <form
            onSubmit={handleChangePassword}
            className="space-y-6"
            noValidate
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">
                  当前密码
                </label>
                <input
                  type="password"
                  {...passwordForm.register("currentPassword")}
                  className={cn(
                    "w-full px-3.5 py-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none transition-colors text-sm text-slate-900 dark:text-slate-100 focus:border-blue-500 dark:focus:border-blue-500",
                    passwordForm.formState.errors.currentPassword &&
                      "border-rose-300 focus:border-rose-500",
                  )}
                />
                {passwordForm.formState.errors.currentPassword && (
                  <p className="text-xs text-rose-500 ml-1">
                    {passwordForm.formState.errors.currentPassword.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">
                  新密码
                </label>
                <input
                  type="password"
                  placeholder="至少8位，包含字母和数字"
                  {...passwordForm.register("newPassword")}
                  className={cn(
                    "w-full px-3.5 py-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none transition-colors text-sm text-slate-900 dark:text-slate-100 focus:border-blue-500 dark:focus:border-blue-500",
                    passwordForm.formState.errors.newPassword &&
                      "border-rose-300 focus:border-rose-500",
                  )}
                />
                {passwordForm.formState.errors.newPassword && (
                  <p className="text-xs text-rose-500 ml-1">
                    {passwordForm.formState.errors.newPassword.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5 sm:col-span-2 sm:w-1/2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">
                  确认新密码
                </label>
                <input
                  type="password"
                  placeholder="再次输入新密码"
                  {...passwordForm.register("confirmPassword")}
                  className={cn(
                    "w-full px-3.5 py-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none transition-colors text-sm text-slate-900 dark:text-slate-100 focus:border-blue-500 dark:focus:border-blue-500",
                    passwordForm.formState.errors.confirmPassword &&
                      "border-rose-300 focus:border-rose-500",
                  )}
                />
                {passwordForm.formState.errors.confirmPassword && (
                  <p className="text-xs text-rose-500 ml-1">
                    {passwordForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="submit"
                disabled={passwordForm.formState.isSubmitting || !csrfToken}
                className={cn(
                  "px-5 py-2 rounded-full text-sm font-bold flex items-center justify-center gap-2",
                  passwordForm.formState.isSubmitting || !csrfToken
                    ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                    : "bg-rose-600 text-white hover:bg-rose-700 shadow-md shadow-rose-500/10 active:scale-95",
                )}
              >
                {passwordForm.formState.isSubmitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : null}
                确认修改
              </button>
              {pwdMsg && (
                <span
                  className={cn(
                    "text-xs font-bold",
                    pwdMsg === "密码修改成功"
                      ? "text-emerald-500"
                      : "text-rose-500",
                  )}
                >
                  {pwdMsg}
                </span>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
