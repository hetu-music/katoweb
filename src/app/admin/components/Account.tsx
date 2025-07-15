import React, { useState } from 'react';

interface AccountProps {
  csrfToken: string;
  handleLogout: () => void;
  logoutLoading: boolean;
}

const Account: React.FC<AccountProps> = ({ csrfToken, handleLogout, logoutLoading }) => {
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showChangePwd, setShowChangePwd] = useState(false);
  const [pwdForm, setPwdForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [pwdFormError, setPwdFormError] = useState<string | null>(null);
  const [pwdFormSuccess, setPwdFormSuccess] = useState<string | null>(null);
  const [pwdFormLoading, setPwdFormLoading] = useState(false);

  React.useEffect(() => {
    if (!showAccountMenu) return;
    const onClick = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.relative')) {
        setShowAccountMenu(false);
      }
    };
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, [showAccountMenu]);

  return (
    <div className="relative">
      <button
        onClick={() => setShowAccountMenu(v => !v)}
        className="flex items-center gap-2 px-6 py-2 rounded-xl bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border border-blue-400/30 text-blue-100 hover:from-blue-500/30 hover:to-indigo-500/30 hover:text-white transition-all duration-200 shadow-sm font-medium whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ minWidth: 0 }}
        type="button"
      >
        管理账号
      </button>
      {showAccountMenu && (
        <div className="absolute right-0 mt-2 w-40 bg-gradient-to-br from-purple-800 via-blue-900 to-indigo-900 border border-white/20 rounded-xl shadow-lg z-50 overflow-hidden animate-fade-in">
          <button
            className="w-full text-left px-5 py-3 text-white hover:bg-blue-500/20 transition-all duration-150 border-b border-white/10"
            onClick={() => { setShowAccountMenu(false); setShowChangePwd(true); }}
            type="button"
          >
            修改密码
          </button>
          <button
            className="w-full text-left px-5 py-3 text-red-200 hover:bg-red-500/20 transition-all duration-150"
            onClick={() => { setShowAccountMenu(false); handleLogout(); }}
            disabled={logoutLoading}
            type="button"
          >
            {logoutLoading ? (
              <span className="inline-block w-5 h-5 mr-2 align-middle animate-spin border-2 border-white border-t-transparent rounded-full"></span>
            ) : null}
            退出登录
          </button>
        </div>
      )}

      {showChangePwd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-gradient-to-br from-purple-800 via-blue-900 to-indigo-900 border border-white/20 rounded-2xl shadow-2xl p-8 max-w-md w-full">
            <h2 className="text-xl font-bold text-white mb-4">修改密码</h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setPwdFormError(null);
                setPwdFormSuccess(null);
                if (!pwdForm.oldPassword || !pwdForm.newPassword || !pwdForm.confirmPassword) {
                  setPwdFormError('请填写所有字段');
                  return;
                }
                if (pwdForm.newPassword.length < 6) {
                  setPwdFormError('新密码长度不能少于6位');
                  return;
                }
                if (pwdForm.newPassword !== pwdForm.confirmPassword) {
                  setPwdFormError('两次输入的新密码不一致');
                  return;
                }
                setPwdFormLoading(true);
                try {
                  const res = await import('../../lib/api').then(m => m.apiChangePassword(pwdForm.oldPassword, pwdForm.newPassword, csrfToken));
                  if (res.success) {
                    setPwdFormSuccess('密码修改成功');
                    setPwdForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
                  } else {
                    setPwdFormError(res.error || '修改失败');
                  }
                } catch {
                  setPwdFormError('网络错误');
                } finally {
                  setPwdFormLoading(false);
                }
              }}
              className="space-y-6"
            >
              <div>
                <label className="block text-blue-100 font-semibold mb-1 text-sm">旧密码</label>
                <input
                  type="password"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="请输入旧密码"
                  value={pwdForm.oldPassword}
                  onChange={e => setPwdForm(f => ({ ...f, oldPassword: e.target.value }))}
                  autoComplete="current-password"
                />
              </div>
              <div>
                <label className="block text-blue-100 font-semibold mb-1 text-sm">新密码</label>
                <input
                  type="password"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="请输入新密码（至少6位）"
                  value={pwdForm.newPassword}
                  onChange={e => setPwdForm(f => ({ ...f, newPassword: e.target.value }))}
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className="block text-blue-100 font-semibold mb-1 text-sm">确认新密码</label>
                <input
                  type="password"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="请再次输入新密码"
                  value={pwdForm.confirmPassword}
                  onChange={e => setPwdForm(f => ({ ...f, confirmPassword: e.target.value }))}
                  autoComplete="new-password"
                />
              </div>
              {pwdFormError && <div className="text-red-400 text-sm mt-2">{pwdFormError}</div>}
              {pwdFormSuccess && <div className="text-green-400 text-sm mt-2">{pwdFormSuccess}</div>}
              <div className="flex items-center justify-end gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowChangePwd(false); setPwdFormError(null); setPwdFormSuccess(null); setPwdForm({ oldPassword: '', newPassword: '', confirmPassword: '' }); }}
                  className="px-6 py-2 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all duration-200 font-medium"
                  disabled={pwdFormLoading}
                >
                  关闭
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30 text-green-200 hover:from-green-500/30 hover:to-emerald-500/30 hover:text-green-100 transition-all duration-200 font-semibold shadow-sm"
                  disabled={pwdFormLoading}
                >
                  {pwdFormLoading ? '提交中...' : '提交'}
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
