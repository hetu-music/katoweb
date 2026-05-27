import React from "react";
import GlobalPlayer from "@/components/shared/GlobalPlayer";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      {children}
      <GlobalPlayer />
    </>
  );
}
