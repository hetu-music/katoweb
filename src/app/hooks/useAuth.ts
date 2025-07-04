import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const [csrfToken, setCsrfToken] = useState('');
  const [logoutLoading, setLogoutLoading] = useState(false);
  const router = useRouter();

  const fetchCsrfToken = async () => {
    const res = await fetch('/api/auth/csrf-token');
    const data = await res.json();
    setCsrfToken(data.csrfToken || '');
  };

  useEffect(() => {
    fetchCsrfToken();
  }, []);

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      const csrfRes = await fetch('/api/auth/csrf-token');
      const csrfData = await csrfRes.json();
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfData.csrfToken || '',
        },
      });
      if (res.ok) {
        router.push('/admin/login');
        router.refresh();
        await fetchCsrfToken();
      }
    } finally {
      setLogoutLoading(false);
    }
  };

  return {
    csrfToken,
    handleLogout,
    logoutLoading,
  };
}
