import type { Metadata, Viewport } from "next";
import {
  Playfair_Display,
  Inter,
  Noto_Serif_SC,
  Noto_Sans_SC,
} from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { PWARegistration } from "@/components/pwa/PWARegistration";

// 标题字体 - 衬线体
const playfairDisplay = Playfair_Display({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const notoSerifSC = Noto_Serif_SC({
  variable: "--font-heading-sc",
  weight: ["400", "500", "600", "700"],
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
  weight: ["400", "500", "700"],
  display: "swap",
});

const lxgwMono = localFont({
  src: "../../public/fonts/LXGWMono.woff2",
  variable: "--font-mono-cjk",
  weight: "400",
  display: "swap",
  preload: false,
});

// PWA Viewport 配置
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://hetu-music.com"),
  title: "河图作品勘鉴",
  description: "河图音乐作品收录与筛选",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "河图勘鉴",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
  },
};

import { Providers } from "@/context/providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      suppressHydrationWarning
      className={`${playfairDisplay.variable} ${notoSerifSC.variable} ${inter.variable} ${notoSansSC.variable} ${lxgwMono.variable}`}
    >
      <body className="antialiased">
        <PWARegistration />
        <Providers>
          <div className="relative z-10 min-h-screen">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
