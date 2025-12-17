import type { Metadata } from "next";
import { Playfair_Display, Inter, Noto_Serif_SC, Noto_Sans_SC } from "next/font/google";
import "./globals.css";
import { WallpaperProvider } from "@/context/WallpaperContext";
import GlobalWallpaperBackground from "@/components/public/GlobalWallpaperBackground";

// 标题字体 - 衬线体
const playfairDisplay = Playfair_Display({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const notoSerifSC = Noto_Serif_SC({
  variable: "--font-heading-sc",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "900"],
  display: "swap",
});

// 正文字体 - 无衬线体
const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

const notoSansSC = Noto_Sans_SC({
  variable: "--font-body-sc",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "河图作品勘鉴",
  description: "河图音乐作品收录与筛选",
};

import { Providers } from "@/context/providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body
        className={`${playfairDisplay.variable} ${notoSerifSC.variable} ${inter.variable} ${notoSansSC.variable} antialiased bg-linear-to-br from-purple-900 via-blue-900 to-indigo-900`}
      >
        <Providers>
          <WallpaperProvider>
            <GlobalWallpaperBackground />
            <div className="relative z-10 min-h-screen">{children}</div>
          </WallpaperProvider>
        </Providers>
      </body>
    </html>
  );
}
