import { NextRequest, NextResponse } from "next/server";
import { ownerCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/", request.url), { status: 303 });
  response.cookies.set(ownerCookie.name, "", { ...ownerCookie, maxAge: 0 });
  return response;
}
