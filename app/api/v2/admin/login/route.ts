import { NextResponse } from 'next/server';
import { adminSessionCookie, createAdminSessionToken, verifyAdminPassword } from '@/lib/v2/adminAuth';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { password?: string } | null;
  const password = body?.password ?? '';

  if (!verifyAdminPassword(password)) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: adminSessionCookie.name,
    value: createAdminSessionToken(),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: adminSessionCookie.maxAge,
  });
  return response;
}
