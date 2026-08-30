import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const COOKIE_NAME = 'viago_v2_admin';
const SESSION_SECONDS = 60 * 60 * 12;

function configuredPassword() {
  const value = process.env.VIAGO_ADMIN_PASSWORD;
  if (!value) throw new Error('VIAGO_ADMIN_PASSWORD is not configured');
  return value;
}

function digest(value: string) {
  return createHash('sha256').update(value).digest();
}

function signingKey() {
  return createHash('sha256')
    .update(`viago-v2-admin-session:${configuredPassword()}`)
    .digest();
}

function sign(payload: string) {
  return createHmac('sha256', signingKey()).update(payload).digest('hex');
}

export function verifyAdminPassword(candidate: string) {
  const expected = digest(configuredPassword());
  const actual = digest(candidate);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function createAdminSessionToken(now = Date.now()) {
  const expiresAt = Math.floor(now / 1000) + SESSION_SECONDS;
  const payload = `v1.${expiresAt}`;
  return `${payload}.${sign(payload)}`;
}

export function verifyAdminSessionToken(token?: string | null, now = Date.now()) {
  if (!token) return false;
  const [version, expiresText, signature] = token.split('.');
  if (version !== 'v1' || !expiresText || !signature) return false;
  const expiresAt = Number(expiresText);
  if (!Number.isFinite(expiresAt) || expiresAt <= Math.floor(now / 1000)) return false;

  const payload = `${version}.${expiresText}`;
  const expected = Buffer.from(sign(payload), 'hex');
  const actual = Buffer.from(signature, 'hex');
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export async function hasAdminSession() {
  const store = await cookies();
  return verifyAdminSessionToken(store.get(COOKIE_NAME)?.value);
}

export async function requireAdminSession() {
  if (!(await hasAdminSession())) redirect('/v2/admin/login');
}

export const adminSessionCookie = {
  name: COOKIE_NAME,
  maxAge: SESSION_SECONDS,
};
