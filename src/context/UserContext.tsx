"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";

export interface UserInfo {
  id: string;
  email?: string;
  name: string;
  display: boolean;
  intro: string | null;
  isAdmin: boolean;
}

interface UserContextValue {
  user: UserInfo | null;
  loaded: boolean;
  isLoggedIn: boolean;
  refetch: () => Promise<void>;
  logout: () => Promise<void>;
  loggingOut: boolean;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const fetchedRef = useRef(false);

  const refetch = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    refetch();
  }, [refetch]);

  const logout = useCallback(async () => {
    setLoggingOut(true);
    try {
      const csrfRes = await fetch("/api/public/csrf-token", { cache: "no-store" });
      const { csrfToken } = await csrfRes.json();
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken },
      });
      setUser(null);
      window.location.href = "/login";
    } finally {
      setLoggingOut(false);
    }
  }, []);

  return (
    <UserContext.Provider
      value={{ user, loaded, isLoggedIn: !!user, refetch, logout, loggingOut }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUserContext(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUserContext must be used within UserProvider");
  return ctx;
}
