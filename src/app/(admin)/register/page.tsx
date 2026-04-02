import { Metadata } from "next";
import { headers } from "next/headers";
import RegisterClient from "@/components/admin/RegisterClient";

export const metadata: Metadata = {
  title: "注册 - 河图作品勘鉴",
  description: "注册账号以管理内容。",
};

export default async function RegisterPage() {
  const headersList = await headers();
  const nonce = headersList.get("x-nonce") || undefined;

  return <RegisterClient nonce={nonce} />;
}
