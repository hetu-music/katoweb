import { NextResponse } from "next/server";
import { setCSRFCookie, generateCSRFToken } from "@/lib/server-utils";

export async function GET() {
  const token = generateCSRFToken();
  await setCSRFCookie(token);
  return NextResponse.json({ csrfToken: token });
}
