import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export function useAuth() {
  const [csrfToken, setCsrfToken] = useState("");
  const [logoutLoading, setLogoutLoading] = useState(false);
  const router = useRouter();

  const fetchCsrfToken = async () => {
    const res = await fetch("/api/auth/csrf-token");
    const data = await res.json();
    setCsrfToken(data.csrfToken || "");
  };

  useEffect(() => {
    fetchCsrfToken();
  }, []);

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      // 使用当前的 CSRF token，不要获取新的
      const res = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
      });
      if (res.ok) {
        // 清空当前的 CSRF token
        setCsrfToken("");
        router.push("/admin/login");
        router.refresh();
        // 只有在需要时才获取新的 CSRF token（比如用户重新访问登录页面）
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
