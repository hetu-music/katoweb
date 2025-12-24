"use client";

import { ThemeProvider } from "next-themes";
import React from "react";
import { ChunkErrorHandler } from "@/components/shared/ChunkErrorHandler";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <ChunkErrorHandler />
      {children}
    </ThemeProvider>
  );
}
