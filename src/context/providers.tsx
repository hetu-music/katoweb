"use client";

import { ThemeProvider } from "next-themes";
import React from "react";
import { ChunkErrorHandler } from "@/components/shared/ChunkErrorHandler";
import { UserProvider } from "@/context/UserContext";
import { FavoritesProvider } from "@/context/FavoritesContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <ChunkErrorHandler />
      <UserProvider>
        <FavoritesProvider>{children}</FavoritesProvider>
      </UserProvider>
    </ThemeProvider>
  );
}
