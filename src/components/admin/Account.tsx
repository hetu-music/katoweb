"use client";
import React, { useState } from "react";
import {
  User,
  Key,
  Type,
  LogOut,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { createPortal } from "react-dom";

interface AccountProps {
  csrfToken: string;
  handleLogout: () => void;
  logoutLoading: boolean;
}

const Account: React.FC<AccountProps> = ({
  csrfToken,
  handleLogout,
  logoutLoading,
}) => {
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showChangePwd, setShowChangePwd] = useState(false);
  const [showDisplayName, setShowDisplayName] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [displayNameInput, setDisplayNameInput] = useState("");
  const [displayNameError, setDisplayNameError] = useState<string | null>(null);
  const [displayNameSuccess, setDisplayNameSuccess] = useState<string | null>(
    null,
  );
  const [displayNameLoading, setDisplayNameLoading] = useState(false);

  const [pwdForm, setPwdForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [pwdFormError, setPwdFormError] = useState<string | null>(null);
  const [pwdFormSuccess, setPwdFormSuccess] = useState<string | null>(null);
  const [pwdFormLoading, setPwdFormLoading] = useState(false);

  const [display, setDisplay] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const [intro, setIntro] = useState<string | null>(null);
  const [introInput, setIntroInput] = useState("");
  const [introError, setIntroError] = useState<string | null>(null);
  const [introSuccess, setIntroSuccess] = useState<string | null>(null);
  const [introLoading, setIntroLoading] = useState(false);

  // Auto-load info
  React.useEffect(() => {
    (async () => {
      try {
        const res = await import("@/lib/client-api").then((m) =>
          m.apiGetAccountInfo(),
        );
        setDisplayName(res.displayName !== undefined ? res.displayName : "");
        setDisplay(typeof res.display === "boolean" ? res.display : false);
        setIntro(
          typeof res.intro === "string" || res.intro === null
            ? res.intro
            : null,
        );
      } catch {
        setDisplayName("");
        setDisplay(false);
        setIntro(null);
      }
    })();
  }, []);

  // Click Outside to Close
  React.useEffect(() => {
    if (!showAccountMenu) return;
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-account-container]")) {
        setShowAccountMenu(false);
      }
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [showAccountMenu]);

  // Fetch Logic
  const fetchDisplayName = async () => {
    setDisplayNameError(null);
    setDisplayNameSuccess(null);
    setDisplayNameLoading(true);
    try {
      const res = await import("@/lib/client-api").then((m) => m.apiGetDisplayName());
      setDisplayName(res.displayName !== undefined ? res.displayName : "");
      setDisplayNameInput(res.displayName !== undefined ? res.displayName : "");
      setDisplay(typeof res.display === "boolean" ? res.display : false);
    } catch {
      setDisplayNameError("获取用户名失败");
    } finally {
      setDisplayNameLoading(false);
    }
  };

  const fetchIntro = async () => {
    setIntroError(null);
    setIntroSuccess(null);
    setIntroLoading(true);
    try {
      const res = await import("@/lib/client-api").then((m) => m.apiGetAccountInfo());
      setIntro(
        typeof res.intro === "string" || res.intro === null ? res.intro : null,
      );
      setIntroInput(
        typeof res.intro === "string" || res.intro === null
          ? res.intro || ""
          : "",
      );
    } catch {
      setIntroError("获取自我介绍失败");
    } finally {
      setIntroLoading(false);
    }
  };

  // Helper for consistent modal
  const Modal = ({
    title,
    onClose,
    children,
  }: {
    title: string;
    onClose: () => void;
    children: React.ReactNode;
  }) => {
    if (typeof window === "undefined") return null;
    return createPortal(
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div className="bg-white dark:bg-[#151921] w-full max-w-md rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-[#151921]/50">
            <h3 className="font-bold text-slate-900 dark:text-white">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
          <div className="p-6">{children}</div>
        </div>
      </div>,
      document.body,
    );
  };

  return (
    <div className="relative" data-account-container>
      <button
        onClick={() => setShowAccountMenu((v) => !v)}
        className="flex items-center gap-3 pl-1 pr-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors border border-transparent dark:border-slate-700"
      >
        <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm">
          {displayName ? (
            displayName.charAt(0).toUpperCase()
          ) : (
            <User size={16} />
          )}
        </div>
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200 max-w-[100px] truncate">
          {displayName || "Admin"}
        </span>
      </button>

      {showAccountMenu && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#151921] rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 mb-2">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
              Account Settings
            </p>
          </div>

          <button
            onClick={() => {
              setShowAccountMenu(false);
              setShowDisplayName(true);
              setDisplayNameInput(displayName);
              setDisplayNameError(null);
              setDisplayNameSuccess(null);
            }}
            className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300 transition-colors"
          >
            <User size={16} /> <span>修改用户名</span>
          </button>

          <button
            onClick={() => {
              setShowAccountMenu(false);
              setShowChangePwd(true);
            }}
            className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300 transition-colors"
          >
            <Key size={16} /> <span>修改密码</span>
          </button>

          <button
            onClick={() => {
              setShowAccountMenu(false);
              setShowIntro(true);
              setIntroInput(intro || "");
              setIntroError(null);
              setIntroSuccess(null);
            }}
            className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300 transition-colors"
          >
            <Type size={16} /> <span>自我介绍</span>
          </button>

          <div className="my-2 border-t border-slate-100 dark:border-slate-800" />

          <button
            onClick={() => {
              setShowAccountMenu(false);
              handleLogout();
            }}
            disabled={logoutLoading}
            className="w-full text-left px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-3 text-sm text-red-600 dark:text-red-400 transition-colors"
          >
            {logoutLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <LogOut size={16} />
            )}
            <span>退出登录</span>
          </button>
        </div>
      )}

      {/* Change Password Modal */}
      {showChangePwd && (
        <Modal
          title="修改密码"
          onClose={() => {
            setShowChangePwd(false);
            setPwdFormError(null);
            setPwdFormSuccess(null);
            setPwdForm({
              oldPassword: "",
              newPassword: "",
              confirmPassword: "",
            });
          }}
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setPwdFormError(null);
              setPwdFormSuccess(null);
              if (
                !pwdForm.oldPassword ||
                !pwdForm.newPassword ||
                !pwdForm.confirmPassword
              ) {
                setPwdFormError("请填写所有字段");
                return;
              }
              if (pwdForm.newPassword.length < 6) {
                setPwdFormError("新密码不能少于6位");
                return;
              }
              if (pwdForm.newPassword !== pwdForm.confirmPassword) {
                setPwdFormError("两次密码不一致");
                return;
              }

              setPwdFormLoading(true);
              try {
                const res = await import("@/lib/client-api").then((m) =>
                  m.apiChangePassword(
                    pwdForm.oldPassword,
                    pwdForm.newPassword,
                    csrfToken,
                  ),
                );
                if (res.success) {
                  setPwdFormSuccess("密码修改成功");
                  setPwdForm({
                    oldPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                  });
                } else {
                  setPwdFormError(res.error || "修改失败");
                }
              } catch {
                setPwdFormError("网络错误");
              } finally {
                setPwdFormLoading(false);
              }
            }}
            className="space-y-4"
          >
            {["oldPassword", "newPassword", "confirmPassword"].map((key) => (
              <div key={key}>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  {key === "oldPassword"
                    ? "旧密码"
                    : key === "newPassword"
                      ? "新密码"
                      : "确认新密码"}
                </label>
                <input
                  type="password"
                  value={(pwdForm as Record<string, string>)[key]}
                  onChange={(e) =>
                    setPwdForm((p) => ({ ...p, [key]: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-blue-500 transition-all text-sm"
                  placeholder="••••••"
                />
              </div>
            ))}

            {pwdFormError && (
              <div className="p-3 rounded-lg bg-red-50 text-red-600 text-xs flex items-center gap-2">
                <AlertCircle size={14} /> {pwdFormError}
              </div>
            )}
            {pwdFormSuccess && (
              <div className="p-3 rounded-lg bg-green-50 text-green-600 text-xs flex items-center gap-2">
                <CheckCircle2 size={14} /> {pwdFormSuccess}
              </div>
            )}

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowChangePwd(false)}
                className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={pwdFormLoading}
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {pwdFormLoading ? "提交中..." : "确认修改"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Username Modal */}
      {showDisplayName && (
        <Modal
          title="修改用户名"
          onClose={() => {
            setShowDisplayName(false);
            fetchDisplayName();
          }}
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setDisplayNameError(null);
              setDisplayNameSuccess(null);
              if (!displayNameInput || displayNameInput.length < 2) {
                setDisplayNameError("至少2个字符");
                return;
              }

              setDisplayNameLoading(true);
              try {
                const res = await import("@/lib/client-api").then((m) =>
                  m.apiUpdateDisplayName(displayNameInput, csrfToken, display),
                );
                if (res.success) {
                  setDisplayNameSuccess("更新成功");
                  setDisplayName(displayNameInput);
                } else {
                  setDisplayNameError(res.error || "更新失败");
                }
              } catch {
                setDisplayNameError("网络错误");
              } finally {
                setDisplayNameLoading(false);
              }
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                用户名
              </label>
              <input
                type="text"
                value={displayNameInput}
                onChange={(e) => setDisplayNameInput(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-blue-500 transition-all text-sm"
                maxLength={32}
              />
            </div>

            <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={display}
                onChange={(e) => setDisplay(e.target.checked)}
                className="accent-blue-500 w-4 h-4"
              />
              <span className="text-sm text-slate-600 dark:text-slate-300">
                展示在「关于 (About)」页面
              </span>
            </label>

            {displayNameError && (
              <div className="p-3 rounded-lg bg-red-50 text-red-600 text-xs flex items-center gap-2">
                <AlertCircle size={14} /> {displayNameError}
              </div>
            )}
            {displayNameSuccess && (
              <div className="p-3 rounded-lg bg-green-50 text-green-600 text-xs flex items-center gap-2">
                <CheckCircle2 size={14} /> {displayNameSuccess}
              </div>
            )}

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDisplayName(false)}
                className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={displayNameLoading}
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {displayNameLoading ? "保存中..." : "保存更改"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Intro Modal */}
      {showIntro && (
        <Modal
          title="自我介绍"
          onClose={() => {
            setShowIntro(false);
            fetchIntro();
          }}
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setIntroError(null);
              setIntroSuccess(null);
              if (introInput.length > 512) {
                setIntroError("不能超过512字");
                return;
              }

              setIntroLoading(true);
              try {
                const res = await import("@/lib/client-api").then((m) =>
                  m.apiUpdateAccountInfo(
                    displayName,
                    csrfToken,
                    display,
                    introInput || null,
                  ),
                );
                if (res.success) {
                  setIntroSuccess("更新成功");
                  setIntro(introInput);
                } else {
                  setIntroError(res.error || "更新失败");
                }
              } catch {
                setIntroError("网络错误");
              } finally {
                setIntroLoading(false);
              }
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                简介
              </label>
              <textarea
                value={introInput}
                onChange={(e) => setIntroInput(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-blue-500 transition-all text-sm min-h-[120px]"
                placeholder="介绍一下你自己..."
                maxLength={512}
              />
              <div className="text-right text-xs text-slate-400 mt-1">
                {introInput.length}/512
              </div>
            </div>

            {introError && (
              <div className="p-3 rounded-lg bg-red-50 text-red-600 text-xs flex items-center gap-2">
                <AlertCircle size={14} /> {introError}
              </div>
            )}
            {introSuccess && (
              <div className="p-3 rounded-lg bg-green-50 text-green-600 text-xs flex items-center gap-2">
                <CheckCircle2 size={14} /> {introSuccess}
              </div>
            )}

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowIntro(false)}
                className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={introLoading}
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {introLoading ? "保存中..." : "保存更改"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Account;
