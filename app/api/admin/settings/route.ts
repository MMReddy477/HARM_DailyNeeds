import { NextResponse } from "next/server";
import { z } from "zod";
import { isOwnerAuthenticated } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { StoreSettings } from "@/models/StoreSettings";

export const dynamic = "force-dynamic";

const settingsSchema = z.object({
  businessName: z.string().trim().min(1).max(120),
  address: z.string().trim().min(1).max(240),
  phone: z.string().trim().min(5).max(32),
  googleReviewLink: z.string().trim().max(500).refine(value => {
    if (!value) return true;
    try { return new URL(value).protocol === "https:"; } catch { return false; }
  }, "Enter a valid HTTPS URL."),
  storeHours: z.string().trim().min(1).max(120),
  taxRate: z.number().finite().min(0).max(100),
  serviceRates: z.record(z.string().trim().min(1).max(50), z.number().finite().min(0).max(100000))
    .refine(rates => Object.keys(rates).length <= 30, "Configure no more than 30 service rates.")
});

export async function GET() {
  if (!await isOwnerAuthenticated()) return NextResponse.json({ message: "Sign in required." }, { status: 401 });
  try {
    await connectToDatabase();
    const settings = await StoreSettings.findOne({ id: "primary" }, { _id: 0, __v: 0 }).lean();
    return NextResponse.json({ settings }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Could not load store settings:", error);
    return NextResponse.json({ message: "Store settings could not be loaded." }, { status: 503 });
  }
}

export async function PUT(request: Request) {
  if (!await isOwnerAuthenticated()) return NextResponse.json({ message: "Sign in required." }, { status: 401 });
  const origin = request.headers.get("origin");
  try {
    if (origin && new URL(origin).host !== request.headers.get("host")) {
      return NextResponse.json({ message: "Invalid request origin." }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ message: "Invalid request origin." }, { status: 403 });
  }
  try {
    const parsed = settingsSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ message: "Invalid store settings.", details: parsed.error.flatten() }, { status: 400 });
    await connectToDatabase();
    await StoreSettings.replaceOne({ id: "primary" }, { id: "primary", ...parsed.data }, { upsert: true, runValidators: true });
    return NextResponse.json({ saved: true });
  } catch (error) {
    console.error("Could not save store settings:", error);
    return NextResponse.json({ message: "Store settings could not be saved." }, { status: 503 });
  }
}
