import Link from "next/link";
import { CustomerReviews } from "@/components/customer-reviews";
export const metadata = { title: "Write a Review | H.A.R DAILY NEEDS" };
export default function ReviewsPage() { return <main className="reference-storefront review-page"><header className="review-page-header section-shell"><Link href="/">H.A.R DAILY NEEDS</Link><Link href="/">Back to shop</Link></header><CustomerReviews formInitiallyOpen/></main>; }
