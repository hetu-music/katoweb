"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { createContext, useCallback, useContext } from "react";

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

const AUTH_ME_QUERY_KEY = ["auth", "me"] as const;

async function fetchCurrentUser(): Promise<UserInfo | null> {
  const res = await fetch("/api/auth/me", { credentials: "include" });
  if (!res.ok) {
    return null;
  }

  return res.json();
}

async function fetchCsrfToken() {
  const response = await fetch("/api/public/csrf-token", {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("获取 CSRF Token 失败");
  }

  const data: { csrfToken?: string } = await response.json();
  if (!data.csrfToken) {
    throw new Error("CSRF Token 缺失");
  }

  return data.csrfToken;
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  const {
    data: user = null,
    isPending,
    refetch: refetchUser,
  } = useQuery({
    queryKey: AUTH_ME_QUERY_KEY,
    queryFn: fetchCurrentUser,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const csrfToken = await fetchCsrfToken();
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
      });

      if (!response.ok) {
        throw new Error("退出登录失败");
      }
    },
    onSuccess: () => {
      queryClient.setQueryData(AUTH_ME_QUERY_KEY, null);
      window.location.href = "/login";
    },
  });

  const refetch = useCallback(async () => {
    await refetchUser();
  }, [refetchUser]);

  const logout = useCallback(async () => {
    await logoutMutation.mutateAsync();
  }, [logoutMutation]);

  const value = React.useMemo(
    () => ({
      user,
      loaded: !isPending,
      isLoggedIn: !!user,
      refetch,
      logout,
      loggingOut: logoutMutation.isPending,
    }),
    [user, isPending, refetch, logout, logoutMutation.isPending],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUserContext(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUserContext must be used within UserProvider");
  return ctx;
}
