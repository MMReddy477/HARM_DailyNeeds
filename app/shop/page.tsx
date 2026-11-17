import { Suspense } from "react";
import { ShopCatalog } from "@/components/shop-catalog";
export const dynamic = "force-dynamic";
export const metadata = { title: "Browse Products & Services | H.A.R.M DAILY NEEDS" };
export default function ShopPage() { return <Suspense fallback={<p style={{padding:40}}>Loading our shelves...</p>}><ShopCatalog /></Suspense>; }
