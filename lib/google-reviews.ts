const address = "2-2/30/201 My Abode the Sirius, Suryohayacolony, Bandlaguda Jagir 500086";
export function googleReviewTarget(value = process.env.NEXT_PUBLIC_GOOGLE_REVIEW_URL) {
  if (value) {
    try {
      const url = new URL(value);
      if (url.protocol === "https:" && ["g.page", "maps.app.goo.gl", "google.com", "www.google.com", "search.google.com", "www.google.co.in"].includes(url.hostname)) return { url: url.href, direct: true };
    } catch {}
  }
  return { url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`H.A.R DAILY NEEDS, ${address}, Hyderabad`)}`, direct: false };
}
