import type { Metadata } from "next";
import { headers } from "next/headers";

export const metadata: Metadata = {
  title: "Admin - 河图作品勘鉴",
  description: "Administrative Interface",
};

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const nonce = headersList.get("x-nonce") || "";

  return (
    <>
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
      {children}
    </>
  );
}

