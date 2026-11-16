import { networkInterfaces } from "os";

export function reviewPageUrl(requestUrl: string) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL || process.env.RENDER_EXTERNAL_URL;
  if (configured) {
    try { const url = new URL(configured); if (["http:", "https:"].includes(url.protocol)) return new URL("/reviews#write-review", url.origin).href; } catch {}
  }
  const url = new URL(requestUrl);
  if (["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) {
    const entries = Object.entries(networkInterfaces()).sort(([a], [b]) => Number(/wi-fi|wifi|wlan/i.test(b)) - Number(/wi-fi|wifi|wlan/i.test(a)));
    for (const [name, addresses] of entries) {
      if (/vethernet|virtual|vmware|docker|loopback/i.test(name)) continue;
      const address = addresses?.find(a => a.family === "IPv4" && !a.internal && /^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(a.address));
      if (address) { url.hostname = address.address; break; }
    }
  }
  return new URL("/reviews#write-review", url.origin).href;
}
