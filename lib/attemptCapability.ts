import { createHmac, timingSafeEqual } from "node:crypto";

export const ATTEMPT_COOKIE = "viago_quiz_attempt";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function secret() {
  const value = process.env.QUIZ_ATTEMPT_TOKEN_SECRET;
  if (!value) throw new Error("QUIZ_ATTEMPT_TOKEN_SECRET is required when attempt-token enforcement is enabled");
  return value;
}

function signature(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function issueAttemptCapability(attemptId: string, now = Date.now()) {
  const expires = Math.floor(now / 1000) + MAX_AGE_SECONDS;
  const payload = `${attemptId}.${expires}`;
  return `${payload}.${signature(payload)}`;
}

export function verifyAttemptCapability(token: string | undefined, attemptId: string, now = Date.now()) {
  if (!token) return false;
  const [id, expiresText, supplied] = token.split(".");
  if (id !== attemptId || !expiresText || !supplied || Number(expiresText) < Math.floor(now / 1000)) return false;
  const expected = signature(`${id}.${expiresText}`);
  const a = Buffer.from(supplied); const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function attemptTokenRequired() {
  return process.env.QUIZ_REQUIRE_ATTEMPT_TOKEN === "true";
}

function cookieValue(req: Request) {
  const header = req.headers.get("cookie") || "";
  for (const part of header.split(";")) {
    const [name, ...value] = part.trim().split("=");
    if (name === ATTEMPT_COOKIE) return decodeURIComponent(value.join("="));
  }
}

export function authorizeAttempt(req: Request, attemptId: string) {
  return !attemptTokenRequired() || verifyAttemptCapability(cookieValue(req), attemptId);
}

export const attemptCookieOptions = {
  httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production",
  path: "/", maxAge: MAX_AGE_SECONDS,
};
