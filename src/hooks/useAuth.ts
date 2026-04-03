// useAuth is kept for backward compatibility with AdminClient.
// It provides csrfToken fetching + logout via UserContext.
import { useState, useEffect } from "react";
import { useUserContext } from "@/context/UserContext";

export function useAuth() {
  const [csrfToken, setCsrfToken] = useState("");
  const { logout, loggingOut } = useUserContext();

  useEffect(() => {
    fetch("/api/public/csrf-token")
      .then((r) => r.json())
      .then((d) => setCsrfToken(d.csrfToken || ""));
  }, []);

  return {
    csrfToken,
    handleLogout: logout,
    logoutLoading: loggingOut,
  };
}
