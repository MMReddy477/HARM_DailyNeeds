import type { Metadata } from "next";
import { DM_Sans, Manrope } from "next/font/google";
import "./globals.css";
import "./final-polish.css";

// Keep branding and customer-facing pages fresh across local production rebuilds.
export const dynamic = "force-dynamic";

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans", display: "swap" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });

export const metadata: Metadata = {
  title: "H.A.R.M DAILY NEEDS | Stationery, Dairy & Refreshing Drinks Under One Roof",
  description: "Stationery, dairy and refreshing drinks under one roof, alongside Xerox, printing and everyday services in Bandlaguda Jagir, Hyderabad.",
  applicationName: "H.A.R.M Daily Needs",
  keywords: ["stationery", "printing", "Xerox", "Bandlaguda Jagir", "Hyderabad", "gifts", "money transfer", "milk", "dairy", "curd", "paneer", "cool drinks", "daily essentials"],
  manifest: "/manifest.webmanifest",
  icons: { icon: [{ url: "/icon.svg", type: "image/svg+xml" }, { url: "/brand/favicon-32.png", sizes: "32x32", type: "image/png" }], apple: "/brand/apple-touch-icon.png" },
  openGraph: {
    title: "H.A.R.M Daily Needs",
    description: "Stationery, dairy and refreshing drinks under one roof in Bandlaguda Jagir, Hyderabad.",
    type: "website"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} ${manrope.variable}`}>{children}</body>
    </html>
  );
}
