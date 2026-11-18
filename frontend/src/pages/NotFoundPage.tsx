import { Link } from "react-router-dom";
import { Home } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-purple-50 px-4 text-center" data-testid="not-found-page">
      <p className="font-heading text-6xl font-extrabold text-purple-300">404</p>
      <h1 className="mt-3 font-heading text-2xl font-extrabold text-purple-950">This aisle doesn&apos;t exist</h1>
      <p className="mt-2 max-w-sm text-sm text-slate-600">
        The page you&apos;re looking for isn&apos;t on our shelves. Let&apos;s get you back to the storefront.
      </p>
      <Link to="/" data-testid="notfound-home-button" className={cn(buttonVariants(), "mt-6 gap-2")}>
        <Home className="size-4" /> Back to Home
      </Link>
    </div>
  );
}
