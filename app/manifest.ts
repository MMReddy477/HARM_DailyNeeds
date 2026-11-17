import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "H.A.R.M Daily Needs",
    short_name: "H.A.R.M",
    description: "Stationery, Dairy & Refreshing Drinks Under One Roof.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#5B21B6",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }]
  };
}
