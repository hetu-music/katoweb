"use client";

import { useState, useEffect, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";

export interface UserInfo {
  id: string;
  email?: string;
  name: string;
  display: boolean;
  intro: string | null;
  isAdmin: boolean;
}

function getSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createBrowserClient(url, key);
}

export function useUser() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loaded, setLoaded] = useState(false);

  const fetchMe = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
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
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setLoaded(true);
      return;
    }

    let ignore = false;

    // 初始检查
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (ignore) return;
      if (u) {
        fetchMe();
      } else {
        setUser(null);
        setLoaded(true);
      }
    });

    // 监听登录/登出
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (ignore) return;
        if (session?.user) {
          fetchMe();
        } else {
          setUser(null);
          setLoaded(true);
        }
      },
    );

    return () => {
      ignore = true;
      subscription.unsubscribe();
    };
  }, [fetchMe]);

  return { user, loaded, isLoggedIn: !!user };
}
