"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import React from "react";
import { ChunkErrorHandler } from "@/components/shared/ChunkErrorHandler";
import GlobalPlayer from "@/components/shared/GlobalPlayer";
import { UserProvider } from "@/context/UserContext";
import { FavoritesProvider } from "@/context/FavoritesContext";
import { createQueryClient } from "@/lib/query-client";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(createQueryClient);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <NuqsAdapter>
        <QueryClientProvider client={queryClient}>
          <ChunkErrorHandler />
          <UserProvider>
            <FavoritesProvider>
              {children}
              {/* GlobalPlayer 在纯 Client 树内，zustand store 是模块级单例，
                  跨路由导航时音频状态完全不受影响 */}
              <GlobalPlayer />
            </FavoritesProvider>
          </UserProvider>
        </QueryClientProvider>
      </NuqsAdapter>
    </ThemeProvider>
  );
}
