import { Metadata } from "next";
import { headers } from "next/headers";
import LoginClient from "@/components/admin/LoginClient";

export const metadata: Metadata = {
  title: "Admin Login - 河图作品勘鉴",
  description: "Sign in to manage the library content.",
};

export default async function LoginPage() {
  const headersList = await headers();
  const nonce = headersList.get("x-nonce") || undefined;

  return <LoginClient nonce={nonce} />;
}
