"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface UserInfo {
  id: string;
  email?: string;
  name: string;
  display: boolean;
  intro: string | null;
  isAdmin: boolean;
}

export function useUser() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loaded, setLoaded] = useState(false);
  const fetchedRef = useRef(false);

  const fetchMe = useCallback(async () => {
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
    fetchMe();
  }, [fetchMe]);

  return { user, loaded, isLoggedIn: !!user, refetch: fetchMe };
}
