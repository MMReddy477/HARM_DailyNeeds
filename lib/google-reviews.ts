const address = "2-2/30/201 My Abode the Sirius, Suryohayacolony, Bandlaguda Jagir 500086";
export const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`H.A.R.M DAILY NEEDS, ${address}, Hyderabad`)}`;
export const shopDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
export function googleReviewTarget(value = process.env.NEXT_PUBLIC_GOOGLE_REVIEW_URL) {
  if (value) {
    try {
      const url = new URL(value);
      const brokenExample = url.hostname === "g.page" && url.pathname.replace(/\/$/, "") === "/r/CaeQwq8jEcDwEAI/review";
      const reviewPath = (url.hostname === "g.page" && /^\/r\/[^/]+\/review\/?$/.test(url.pathname))
        || (url.hostname === "search.google.com" && url.pathname === "/local/writereview" && !!url.searchParams.get("placeid"))
        || (url.hostname === "maps.app.goo.gl" && url.pathname.length > 1);
      if (url.protocol === "https:" && !brokenExample && reviewPath) return { url: url.href, direct: true };
    } catch {}
  }
  return { url: "/reviews#write-review", direct: false };
}
