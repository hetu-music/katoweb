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
  // We need to read headers to force dynamic rendering for admin pages
  // preventing them from being statically optimized which would break auth
  await headers();

  return (
    <>
      {children}
    </>
  );
}
