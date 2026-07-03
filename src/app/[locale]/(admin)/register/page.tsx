import { Metadata } from "next";
import { headers } from "next/headers";
import AuthClient from "@/components/admin/AuthClient";

export const metadata: Metadata = {
  title: "Register - 河图作品勘鉴",
  description: "Create an account to manage the library content.",
};

export default async function RegisterPage() {
  const headersList = await headers();
  const nonce = headersList.get("x-nonce") || undefined;

  return <AuthClient nonce={nonce} mode="register" />;
}
