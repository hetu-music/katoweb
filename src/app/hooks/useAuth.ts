import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const [csrfToken, setCsrfToken] = useState('');
  const [logoutLoading, setLogoutLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/csrf-token')
      .then(res => res.json())
      .then(data => setCsrfToken(data.csrfToken || ''));
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
