import type { Metadata } from "next";
import { DM_Sans, Manrope } from "next/font/google";
import "./globals.css";

// Keep branding and customer-facing pages fresh across local production rebuilds.
export const dynamic = "force-dynamic";

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans", display: "swap" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });

export const metadata: Metadata = {
  title: "H.A.R DAILY NEEDS | Stationery, Dairy & Refreshing Drinks Under One Roof",
  description: "Stationery, printing, gifts, recharges and trusted everyday services in Bandlaguda Jagir, Hyderabad.",
  applicationName: "H.A.R Daily Needs",
  keywords: ["stationery", "printing", "Xerox", "Bandlaguda Jagir", "Hyderabad", "gifts", "money transfer"],
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg" },
  openGraph: {
    title: "H.A.R Daily Needs",
    description: "Your friendly neighbourhood shop for everyday needs in Bandlaguda Jagir, Hyderabad.",
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
