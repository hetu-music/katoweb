'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // 每次登录前都获取最新的 CSRF token
      const csrfRes = await fetch('/api/auth/csrf-token');
      const csrfData = await csrfRes.json();
      const latestCsrfToken = csrfData.csrfToken || '';

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': latestCsrfToken,
        },
        body: JSON.stringify({ email, password }),
      });
      const result = await res.json();
      if (!res.ok) {
        setError(result.error || '登录失败');
        setLoading(false);
        return;
      }
      router.push('/admin');
      router.refresh();
    } catch (err: unknown) {
      setError('Unexpected error during login');
      setLoading(false);
      if (err && typeof err === 'object' && 'message' in err && typeof (err as Error).message === 'string') {
        console.error('Unexpected login error:', (err as Error).message);
      } else {
        console.error('Unexpected login error:', err);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <form
        onSubmit={handleLogin}
        className="flex flex-col gap-5 w-full max-w-sm p-8 bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl shadow-2xl"
      >
        <h2 className="text-3xl font-bold mb-2 text-white text-center tracking-wide">后台登录</h2>
        <input
          type="email"
          placeholder="邮箱"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="h-12 px-4 rounded-xl border border-white/20 bg-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white/30 transition-all"
          required
        />
        <input
          type="password"
          placeholder="密码"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="h-12 px-4 rounded-xl border border-white/20 bg-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white/30 transition-all"
          required
        />
        {error && <div className="text-red-400 text-center text-sm font-medium">{error}</div>}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.push('/')}
            className="flex-1 h-12 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-semibold rounded-xl shadow transition-all"
          >
            返回主页
          </button>
          <button
            type="submit"
            className="flex-1 h-12 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white font-semibold rounded-xl shadow transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading && (
              <span className="inline-block w-5 h-5 mr-2 align-middle animate-spin border-2 border-white border-t-transparent rounded-full"></span>
            )}
            {loading ? '登录中...' : '登录'}
          </button>
        </div>
      </form>
    </div>
  );
}