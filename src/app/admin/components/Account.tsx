import React, { useState } from "react";

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

  // 自动加载 display name、display 和 intro
  React.useEffect(() => {
    (async () => {
      try {
        const res = await import("../../../lib/api").then((m) =>
          m.apiGetAccountInfo(),
        );
        if (res.displayName !== undefined) {
          setDisplayName(res.displayName);
        } else {
          setDisplayName("");
        }
        if (typeof res.display === "boolean") {
          setDisplay(res.display);
        } else {
          setDisplay(false);
        }
        if (typeof res.intro === "string" || res.intro === null) {
          setIntro(res.intro);
        } else {
          setIntro(null);
        }
      } catch {
        setDisplayName("");
        setDisplay(false);
        setIntro(null);
      }
    })();
  }, []);

  React.useEffect(() => {
    if (!showAccountMenu) return;
    const onClick = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest(".relative")) {
        setShowAccountMenu(false);
      }
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [showAccountMenu]);

  // 获取 display name
  const fetchDisplayName = async () => {
    setDisplayNameError(null);
    setDisplayNameSuccess(null);
    setDisplayNameLoading(true);
    try {
      const res = await import("../../../lib/api").then((m) =>
        m.apiGetDisplayName(),
      );
      if (res.displayName !== undefined) {
        setDisplayName(res.displayName);
        setDisplayNameInput(res.displayName);
      } else {
        setDisplayName("");
        setDisplayNameInput("");
      }
      if (typeof res.display === "boolean") {
        setDisplay(res.display);
      } else {
        setDisplay(false);
      }
    } catch {
      setDisplayNameError("获取用户名失败");
    } finally {
      setDisplayNameLoading(false);
    }
  };

  // 获取 intro
  const fetchIntro = async () => {
    setIntroError(null);
    setIntroSuccess(null);
    setIntroLoading(true);
    try {
      const res = await import("../../../lib/api").then((m) =>
        m.apiGetAccountInfo(),
      );
      if (typeof res.intro === "string" || res.intro === null) {
        setIntro(res.intro);
        setIntroInput(res.intro || "");
      } else {
        setIntro(null);
        setIntroInput("");
      }
    } catch {
      setIntroError("获取自我介绍失败");
    } finally {
      setIntroLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowAccountMenu((v) => !v)}
        className="group flex items-center gap-4 h-12 px-8 py-1 rounded-2xl bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-purple-500/20 border border-blue-400/30 text-blue-100 hover:from-blue-500/30 hover:via-indigo-500/30 hover:to-purple-500/30 hover:text-white hover:border-blue-300/50 transition-all duration-300 shadow-lg hover:shadow-xl font-medium whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed backdrop-blur-sm"
        style={{ minWidth: 0 }}
        type="button"
      >
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-inner">
            {displayName ? displayName.charAt(0).toUpperCase() : "?"}
          </div>
          <span className="inline-block max-w-[120px] truncate align-middle text-lg font-semibold">
            {displayName}
          </span>
        </div>
      </button>

      {showAccountMenu && (
        <div className="absolute right-0 mt-3 w-48 bg-gradient-to-br from-purple-800/95 via-blue-900/95 to-indigo-900/95 backdrop-blur-lg border border-white/20 rounded-2xl shadow-2xl z-50 overflow-hidden animate-fade-in">
          <div className="p-2">
            <button
              className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-blue-500/20 transition-all duration-200 rounded-xl border-b border-white/10 group"
              onClick={() => {
                setShowAccountMenu(false);
                setShowDisplayName(true);
                setDisplayNameInput(displayName);
                setDisplayNameError(null);
                setDisplayNameSuccess(null);
              }}
              type="button"
            >
              <div className="w-6 h-6 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-blue-300 group-hover:text-white transition-colors"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
              </div>
              <span className="text-sm font-medium">管理用户名</span>
            </button>
            <button
              className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-blue-500/20 transition-all duration-200 rounded-xl border-b border-white/10 group"
              onClick={() => {
                setShowAccountMenu(false);
                setShowChangePwd(true);
              }}
              type="button"
            >
              <div className="w-6 h-6 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-blue-300 group-hover:text-white transition-colors"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <span className="text-sm font-medium">修改密码</span>
            </button>
            <button
              className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-blue-500/20 transition-all duration-200 rounded-xl border-b border-white/10 group"
              onClick={() => {
                setShowAccountMenu(false);
                setShowIntro(true);
                setIntroInput(intro || "");
                setIntroError(null);
                setIntroSuccess(null);
              }}
              type="button"
            >
              <div className="w-6 h-6 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-blue-300 group-hover:text-white transition-colors"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <span className="text-sm font-medium">自我介绍</span>
            </button>
            <button
              className="w-full flex items-center gap-3 px-4 py-3 text-red-200 hover:bg-red-500/20 transition-all duration-200 rounded-xl group"
              onClick={() => {
                setShowAccountMenu(false);
                handleLogout();
              }}
              disabled={logoutLoading}
              type="button"
            >
              <div className="w-6 h-6 flex items-center justify-center">
                {logoutLoading ? (
                  <div className="w-5 h-5 animate-spin border-2 border-red-300 border-t-transparent rounded-full"></div>
                ) : (
                  <svg
                    className="w-5 h-5 text-red-300 group-hover:text-red-200 transition-colors"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                )}
              </div>
              <span className="text-sm font-medium">退出登录</span>
            </button>
          </div>
        </div>
      )}

      {/* 修改密码弹窗 */}
      {showChangePwd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-gradient-to-br from-purple-800/95 via-blue-900/95 to-indigo-900/95 backdrop-blur-lg border border-white/20 rounded-3xl shadow-2xl p-8 max-w-md w-full animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white">修改密码</h2>
            </div>

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
                  setPwdFormError("新密码长度不能少于6位");
                  return;
                }
                if (pwdForm.newPassword !== pwdForm.confirmPassword) {
                  setPwdFormError("两次输入的新密码不一致");
                  return;
                }
                setPwdFormLoading(true);
                try {
                  const res = await import("../../../lib/api").then((m) =>
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
              className="space-y-6"
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-blue-100 font-semibold mb-2 text-sm">
                    旧密码
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 placeholder-white/50"
                      placeholder="请输入旧密码"
                      value={pwdForm.oldPassword}
                      onChange={(e) =>
                        setPwdForm((f) => ({
                          ...f,
                          oldPassword: e.target.value,
                        }))
                      }
                      autoComplete="current-password"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-blue-100 font-semibold mb-2 text-sm">
                    新密码
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 placeholder-white/50"
                      placeholder="请输入新密码（至少6位）"
                      value={pwdForm.newPassword}
                      onChange={(e) =>
                        setPwdForm((f) => ({
                          ...f,
                          newPassword: e.target.value,
                        }))
                      }
                      autoComplete="new-password"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-blue-100 font-semibold mb-2 text-sm">
                    确认新密码
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 placeholder-white/50"
                      placeholder="请再次输入新密码"
                      value={pwdForm.confirmPassword}
                      onChange={(e) =>
                        setPwdForm((f) => ({
                          ...f,
                          confirmPassword: e.target.value,
                        }))
                      }
                      autoComplete="new-password"
                    />
                  </div>
                </div>
              </div>

              {pwdFormError && (
                <div className="bg-red-500/10 border border-red-400/30 rounded-xl p-3 text-red-300 text-sm flex items-center gap-2">
                  <svg
                    className="w-4 h-4 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {pwdFormError}
                </div>
              )}

              {pwdFormSuccess && (
                <div className="bg-green-500/10 border border-green-400/30 rounded-xl p-3 text-green-300 text-sm flex items-center gap-2">
                  <svg
                    className="w-4 h-4 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  {pwdFormSuccess}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowChangePwd(false);
                    setPwdFormError(null);
                    setPwdFormSuccess(null);
                    setPwdForm({
                      oldPassword: "",
                      newPassword: "",
                      confirmPassword: "",
                    });
                  }}
                  className="px-6 py-3 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all duration-200 font-medium"
                  disabled={pwdFormLoading}
                >
                  关闭
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-500/30 to-emerald-500/30 border border-green-400/30 text-green-100 hover:from-green-500/40 hover:to-emerald-500/40 hover:text-white transition-all duration-200 font-semibold shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={pwdFormLoading}
                >
                  {pwdFormLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 animate-spin border-2 border-white border-t-transparent rounded-full"></div>
                      <span>提交中...</span>
                    </div>
                  ) : (
                    "确认修改"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 用户名管理弹窗 */}
      {showDisplayName && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-gradient-to-br from-purple-800/95 via-blue-900/95 to-indigo-900/95 backdrop-blur-lg border border-white/20 rounded-3xl shadow-2xl p-8 max-w-md w-full animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white">管理用户名</h2>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setDisplayNameError(null);
                setDisplayNameSuccess(null);
                if (!displayNameInput || displayNameInput.length < 2) {
                  setDisplayNameError("用户名不能为空且不少于2个字符");
                  return;
                }
                setDisplayNameLoading(true);
                try {
                  const res = await import("../../../lib/api").then((m) =>
                    m.apiUpdateDisplayName(
                      displayNameInput,
                      csrfToken,
                      display,
                    ),
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
              className="space-y-6"
            >
              <div>
                <label className="block text-blue-100 font-semibold mb-2 text-sm">
                  用户名
                </label>
                <div className="relative">
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 placeholder-white/50"
                    placeholder="请输入用户名"
                    value={displayNameInput}
                    onChange={(e) => setDisplayNameInput(e.target.value)}
                    autoComplete="off"
                    maxLength={32}
                    disabled={displayNameLoading}
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-white/50">
                    {displayNameInput.length}/32
                  </div>
                </div>
              </div>
              <div className="flex items-center mt-2">
                <label
                  htmlFor="display-contributor"
                  className="flex items-center gap-3 cursor-pointer select-none py-2 px-3 rounded-xl bg-white/10 border border-white/20 hover:bg-white/20 transition-all duration-200 w-full"
                >
                  <span className="text-blue-100 text-sm font-medium">
                    展示我到 关于-维护者 中
                  </span>
                  <span className="flex-1"></span>
                  <span className="relative inline-block w-11 h-6 align-middle select-none">
                    <input
                      id="display-contributor"
                      type="checkbox"
                      className="sr-only peer"
                      checked={display}
                      onChange={(e) => setDisplay(e.target.checked)}
                      disabled={displayNameLoading}
                    />
                    <span className="block w-11 h-6 bg-gray-400 rounded-full peer-checked:bg-blue-500 transition-colors duration-200"></span>
                    <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-200 peer-checked:translate-x-5"></span>
                  </span>
                </label>
              </div>

              {displayNameError && (
                <div className="bg-red-500/10 border border-red-400/30 rounded-xl p-3 text-red-300 text-sm flex items-center gap-2">
                  <svg
                    className="w-4 h-4 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {displayNameError}
                </div>
              )}

              {displayNameSuccess && (
                <div className="bg-green-500/10 border border-green-400/30 rounded-xl p-3 text-green-300 text-sm flex items-center gap-2">
                  <svg
                    className="w-4 h-4 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  {displayNameSuccess}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowDisplayName(false);
                    setDisplayNameInput(displayName);
                    setDisplayNameError(null);
                    setDisplayNameSuccess(null);
                    // 关闭时同步当前 display
                    fetchDisplayName();
                  }}
                  className="px-6 py-3 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all duration-200 font-medium"
                  disabled={displayNameLoading}
                >
                  关闭
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-500/30 to-emerald-500/30 border border-green-400/30 text-green-100 hover:from-green-500/40 hover:to-emerald-500/40 hover:text-white transition-all duration-200 font-semibold shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={displayNameLoading}
                >
                  {displayNameLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 animate-spin border-2 border-white border-t-transparent rounded-full"></div>
                      <span>保存中...</span>
                    </div>
                  ) : (
                    "保存更改"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* intro（自我介绍）管理弹窗 */}
      {showIntro && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-gradient-to-br from-purple-800/95 via-blue-900/95 to-indigo-900/95 backdrop-blur-lg border border-white/20 rounded-3xl shadow-2xl p-8 max-w-md w-full animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white">自我介绍</h2>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setIntroError(null);
                setIntroSuccess(null);
                if (introInput.length > 512) {
                  setIntroError("自我介绍不能超过512个字符");
                  return;
                }
                setIntroLoading(true);
                try {
                  const res = await import("../../../lib/api").then((m) =>
                    m.apiUpdateAccountInfo(
                      displayName,
                      csrfToken,
                      display,
                      introInput || null,
                    ),
                  );
                  if (res.success) {
                    setIntroSuccess("更新成功");
                    setIntro(introInput || null);
                  } else {
                    setIntroError(res.error || "更新失败");
                  }
                } catch {
                  setIntroError("网络错误");
                } finally {
                  setIntroLoading(false);
                }
              }}
              className="space-y-6"
            >
              <div>
                <label className="block text-blue-100 font-semibold mb-2 text-sm">
                  自我介绍
                </label>
                <textarea
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 placeholder-white/50 min-h-[80px]"
                  placeholder="请输入自我介绍（可选，最多512字）"
                  value={introInput}
                  onChange={(e) => setIntroInput(e.target.value)}
                  maxLength={512}
                  disabled={introLoading}
                />
                <div className="text-xs text-white/50 mt-1 text-right">
                  {introInput.length}/512
                </div>
              </div>
              {introError && (
                <div className="bg-red-500/10 border border-red-400/30 rounded-xl p-3 text-red-300 text-sm flex items-center gap-2">
                  <svg
                    className="w-4 h-4 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {introError}
                </div>
              )}
              {introSuccess && (
                <div className="bg-green-500/10 border border-green-400/30 rounded-xl p-3 text-green-300 text-sm flex items-center gap-2">
                  <svg
                    className="w-4 h-4 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  {introSuccess}
                </div>
              )}
              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowIntro(false);
                    setIntroInput(intro || "");
                    setIntroError(null);
                    setIntroSuccess(null);
                    fetchIntro();
                  }}
                  className="px-6 py-3 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all duration-200 font-medium"
                  disabled={introLoading}
                >
                  关闭
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-500/30 to-emerald-500/30 border border-green-400/30 text-green-100 hover:from-green-500/40 hover:to-emerald-500/40 hover:text-white transition-all duration-200 font-semibold shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={introLoading}
                >
                  {introLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 animate-spin border-2 border-white border-t-transparent rounded-full"></div>
                      <span>保存中...</span>
                    </div>
                  ) : (
                    "保存更改"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Account;
