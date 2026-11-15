import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "H.A.R.M Daily Needs",
    short_name: "H.A.R.M",
    description: "Your friendly neighbourhood shop for everyday needs.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#5B2D90",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }]
  };
}
