import { NextResponse } from "next/server";
import { randomUUID, createHash } from "crypto";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { CustomerReview } from "@/models/CustomerReview";

export const dynamic = "force-dynamic";
const input = z.object({ name: z.string().trim().min(2).max(80), rating: z.number().int().min(1).max(5), text: z.string().trim().min(10).max(1500), consent: z.literal(true), website: z.string().max(0).optional() });
export async function GET() {
  try {
    await connectToDatabase();
    const reviews = await CustomerReview.find({ status: "approved" }, { _id: 0, id: 1, name: 1, rating: 1, text: 1, createdAt: 1 }).sort({ createdAt: -1 }).limit(100).lean();
    return NextResponse.json({ reviews }, { headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ reviews: [], message: "Customer reviews are temporarily unavailable." }, { status: 503 }); }
}
export async function POST(request: Request) {
  if (Number(request.headers.get("content-length") || 0) > 12000) return NextResponse.json({ message: "Review is too large." }, { status: 413 });
  const origin = request.headers.get("origin");
  try { if (origin && new URL(origin).host !== request.headers.get("host")) return NextResponse.json({ message: "Please submit from the shop website." }, { status: 403 }); } catch { return NextResponse.json({ message: "Invalid request origin." }, { status: 403 }); }
  let payload;
  try { payload = input.safeParse(await request.json()); } catch { return NextResponse.json({ message: "Invalid review." }, { status: 400 }); }
  if (!payload.success) return NextResponse.json({ message: "Enter your name, a 1–5 rating, a review of 10–1,500 characters and consent to publish." }, { status: 400 });
  try {
    await connectToDatabase();
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    const clientHash = createHash("sha256").update(`${process.env.HARM_SESSION_SECRET || "shop-reviews"}:${ip}`).digest("hex");
    if (await CustomerReview.exists({ clientHash, createdAt: { $gte: new Date(Date.now() - 60000) } })) return NextResponse.json({ message: "Please wait a minute before submitting another review." }, { status: 429 });
    await CustomerReview.create({ id: randomUUID(), name: payload.data.name, rating: payload.data.rating, text: payload.data.text, clientHash, status: "pending" });
    return NextResponse.json({ message: "Thank you! Your review was received and will appear after approval.", status: "pending" }, { status: 201 });
  } catch { return NextResponse.json({ message: "Your review could not be saved. Please try again shortly." }, { status: 503 }); }
}
