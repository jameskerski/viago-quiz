import { NextResponse } from 'next/server';
import { adminSessionCookie } from '@/lib/v2/adminAuth';

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: adminSessionCookie.name,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  });
  return response;
}
