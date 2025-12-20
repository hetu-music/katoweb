import type { Metadata } from "next";
import {
  Playfair_Display,
  Inter,
  Noto_Serif_SC,
  Noto_Sans_SC,
} from "next/font/google";
import localFont from "next/font/local";
import { headers } from "next/headers";
import "../globals.css";

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
  src: "../../../public/fonts/LXGWMono.woff2",
  variable: "--font-mono-cjk",
  weight: "400",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "Admin - 河图作品勘鉴",
  description: "Administrative Interface",
};

import { Providers } from "@/context/providers";

export default async function AdminRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const nonce = headersList.get("x-nonce") || "";

  return (
    <html
      lang="zh-CN"
      suppressHydrationWarning
      className={`${playfairDisplay.variable} ${notoSerifSC.variable} ${inter.variable} ${notoSansSC.variable} ${lxgwMono.variable}`}
    >
      <head>
        <script
          id="trusted-types-policy"
          nonce={nonce}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
            if (window.trustedTypes && window.trustedTypes.createPolicy) {
              try {
                window.trustedTypes.createPolicy('default', {
                  createHTML: function(string) { return string; },
                  createScript: function(string) { return string; },
                  createScriptURL: function(string) { return string; }
                });
              } catch (e) {
                console.warn('Trusted Types policy creation failed:', e);
              }
            }
          `,
          }}
        />
      </head>
      <body className="antialiased">
        <Providers>
          <div className="relative z-10 min-h-screen">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
