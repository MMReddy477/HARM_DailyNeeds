import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, ownerCookie, validCredentials } from "@/lib/auth";

const attempts = new Map<string, { count: number; resetAt: number }>();
const maxAttempts = 10;
const attemptWindowMs = 15 * 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { username?: unknown; password?: unknown };
    if (typeof body.username !== "string" || body.username.length > 100
      || typeof body.password !== "string" || body.password.length > 1000) {
      return NextResponse.json({ message: "Enter a valid username and password." }, { status: 400 });
    }

    const address = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || request.headers.get("x-real-ip")
      || "unknown";
    const now = Date.now();
    const current = attempts.get(address);
    const state = !current || current.resetAt <= now
      ? { count: 0, resetAt: now + attemptWindowMs }
      : current;
    attempts.set(address, state);
    if (state.count >= maxAttempts) {
      return NextResponse.json(
        { message: "Too many sign-in attempts. Please wait 15 minutes and try again." },
        { status: 429, headers: { "Retry-After": String(Math.ceil((state.resetAt - now) / 1000)) } }
      );
    }

    if (!validCredentials(body.username, body.password)) {
      state.count += 1;
      return NextResponse.json({ message: "Invalid username or password. Please try again." }, { status: 401 });
    }

    attempts.delete(address);
    const response = NextResponse.json({ redirect: "/admin" });
    response.cookies.set(ownerCookie.name, createSessionToken(body.username), ownerCookie);
    return response;
  } catch (error) {
    console.error("Owner sign-in failed:", error);
    return NextResponse.json({ message: "Owner sign-in is not configured. Check the server environment." }, { status: 503 });
  }
}
