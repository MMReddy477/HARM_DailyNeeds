import { NextResponse } from "next/server";
import { z } from "zod";
import { isOwnerAuthenticated } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { CustomerReview } from "@/models/CustomerReview";

export const dynamic = "force-dynamic";
export async function GET() {
  if (!await isOwnerAuthenticated()) return NextResponse.json({ message: "Sign in required." }, { status: 401 });
  try {
    await connectToDatabase();
    const reviews = await CustomerReview.find({}, { _id: 0, clientHash: 0, __v: 0 }).sort({ createdAt: -1 }).limit(200).lean();
    return NextResponse.json({ reviews }, { headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ message: "Reviews could not be loaded." }, { status: 503 }); }
}
export async function PATCH(request: Request) {
  if (!await isOwnerAuthenticated()) return NextResponse.json({ message: "Sign in required." }, { status: 401 });
  const origin = request.headers.get("origin");
  try { if (origin && new URL(origin).host !== request.headers.get("host")) return NextResponse.json({ message: "Invalid request origin." }, { status: 403 }); } catch { return NextResponse.json({ message: "Invalid request origin." }, { status: 403 }); }
  try {
    const parsed = z.object({ id: z.string().uuid(), status: z.enum(["approved", "rejected", "pending"]) }).safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ message: "Invalid review update." }, { status: 400 });
    await connectToDatabase();
    const result = await CustomerReview.updateOne({ id: parsed.data.id }, { $set: { status: parsed.data.status } });
    if (!result.matchedCount) return NextResponse.json({ message: "Review not found." }, { status: 404 });
    return NextResponse.json({ message: "Review updated." });
  } catch { return NextResponse.json({ message: "Review could not be updated." }, { status: 503 }); }
}
