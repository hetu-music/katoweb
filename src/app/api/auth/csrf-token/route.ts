import { NextResponse } from 'next/server';
import { generateCSRFToken, setCSRFCookie } from '@/app/lib/utils';

export async function GET() {
  const token = generateCSRFToken();
  await setCSRFCookie(token);
  return NextResponse.json({ csrfToken: token });
} 