import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { WallpaperProvider } from "./context/WallpaperContext";
import GlobalWallpaperBackground from "./components/GlobalWallpaperBackground";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "河图作品勘鉴",
  description: "河图音乐作品收录与筛选",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900`}
      >
        <WallpaperProvider>
          <GlobalWallpaperBackground />
          <div className="relative z-10 min-h-screen">
            {children}
          </div>
        </WallpaperProvider>
      </body>
    </html>
  );
}
