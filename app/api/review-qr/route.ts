import QRCode from "qrcode";
import { reviewPageUrl } from "@/lib/review-page-url";
import { googleReviewTarget } from "@/lib/google-reviews";

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const shop = params.get("kind") === "shop";
  const target = shop ? reviewPageUrl(request.url) : googleReviewTarget().url;
  if (params.get("format") === "json") return Response.json({ url: target }, { headers: { "Cache-Control": "no-store" } });
  const image = await QRCode.toBuffer(target, { type: "png", width: 720, margin: 4, errorCorrectionLevel: "Q", color: { dark: "#000000", light: "#ffffff" } });
  const download = new URL(request.url).searchParams.has("download");
  return new Response(new Uint8Array(image), { headers: { "Content-Type": "image/png", "Cache-Control": "no-store", "Content-Disposition": `${download ? "attachment" : "inline"}; filename="harm-${shop ? "shop-review" : "google-maps"}-qr.png"` } });
}
