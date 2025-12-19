import { Metadata } from "next";
import LoginClient from "@/components/admin/LoginClient";

export const metadata: Metadata = {
  title: "Admin Login - 河图作品勘鉴",
  description: "Sign in to manage the library content.",
};

export default function LoginPage() {
  return <LoginClient />;
}
