import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const cookieName = "harm_owner_session";
const sessionDurationSeconds = 60 * 60 * 8;

function secret() {
  const value = process.env.HARM_SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("HARM_SESSION_SECRET must contain at least 32 characters.");
  return value;
}

function signature(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function validCredentials(username: string, password: string) {
  const expectedUsername = process.env.HARM_ADMIN_USERNAME;
  const expectedPassword = process.env.HARM_ADMIN_PASSWORD;
  if (!expectedUsername || !expectedPassword) {
    throw new Error("Set HARM_ADMIN_USERNAME and HARM_ADMIN_PASSWORD before enabling owner login.");
  }
  const usernameBuffer = Buffer.from(username);
  const expectedUsernameBuffer = Buffer.from(expectedUsername);
  const passwordBuffer = Buffer.from(password);
  const expectedPasswordBuffer = Buffer.from(expectedPassword);
  const usernameMatches = usernameBuffer.length === expectedUsernameBuffer.length
    && timingSafeEqual(usernameBuffer, expectedUsernameBuffer);
  const passwordMatches = passwordBuffer.length === expectedPasswordBuffer.length
    && timingSafeEqual(passwordBuffer, expectedPasswordBuffer);
  return usernameMatches && passwordMatches;
}

export function createSessionToken(username: string) {
  const payload = Buffer.from(JSON.stringify({
    username,
    expiresAt: Math.floor(Date.now() / 1000) + sessionDurationSeconds
  })).toString("base64url");
  return `${payload}.${signature(payload)}`;
}

function verifySessionToken(token?: string) {
  if (!token) return false;
  const [payload, providedSignature, ...extra] = token.split(".");
  if (!payload || !providedSignature || extra.length) return false;
  const expected = Buffer.from(signature(payload));
  const provided = Buffer.from(providedSignature);
  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { username?: string; expiresAt?: number };
    return data.username === process.env.HARM_ADMIN_USERNAME
      && typeof data.expiresAt === "number"
      && data.expiresAt > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export async function isOwnerAuthenticated() {
  const cookieStore = await cookies();
  return verifySessionToken(cookieStore.get(cookieName)?.value);
}

export const ownerCookie = {
  name: cookieName,
  maxAge: sessionDurationSeconds,
  httpOnly: true,
  sameSite: "strict" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/"
};
