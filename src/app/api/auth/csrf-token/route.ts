import { NextResponse } from "next/server";
import { setCSRFCookie, generateCSRFToken } from "@/lib/utils.server";

export async function GET() {
  const token = generateCSRFToken();
  await setCSRFCookie(token);
  return NextResponse.json({ csrfToken: token });
}
