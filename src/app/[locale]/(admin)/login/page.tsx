import { Metadata } from "next";
import { headers } from "next/headers";
import AuthClient from "@/components/admin/AuthClient";

export const metadata: Metadata = {
  title: "Login - 河图作品勘鉴",
  description: "Sign in to manage the library content.",
};

export default async function LoginPage() {
  const headersList = await headers();
  const nonce = headersList.get("x-nonce") || undefined;

  return <AuthClient nonce={nonce} mode="login" />;
}
