"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import React from "react";
import { ChunkErrorHandler } from "@/components/shared/ChunkErrorHandler";
import { UserProvider } from "@/context/UserContext";
import { FavoritesProvider } from "@/context/FavoritesContext";
import { PlayerProvider } from "@/context/PlayerContext";
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
              <PlayerProvider>{children}</PlayerProvider>
            </FavoritesProvider>
          </UserProvider>
        </QueryClientProvider>
      </NuqsAdapter>
    </ThemeProvider>
  );
}
