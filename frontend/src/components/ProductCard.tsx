import { Link } from "react-router-dom";
import { MessageCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { categorySlug, PLACEHOLDER_IMG, whatsappLink } from "@/lib/constants";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function ProductCard({ product, availabilityVerified = true }: { product: Product; availabilityVerified?: boolean }) {
  const inStock = product.available && product.stock > 0;
  const availabilityLabel = availabilityVerified
    ? inStock ? "Available In Store" : "Out of Stock"
    : "Confirm availability";
  return (
    <div
      data-testid={`product-card-${product.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-sm transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-1 hover:border-purple-300 hover:shadow-xl"
    >
      <Link
        to={`/c/${categorySlug(product.category)}`}
        className="relative block aspect-square overflow-hidden bg-purple-50"
      >
        <img
          src={product.image || PLACEHOLDER_IMG}
          alt={product.name}
          loading="lazy"
          decoding="async"
          className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {product.is_new ? (
          <Badge className="absolute left-2 top-2 bg-amber-100 text-amber-800" data-testid={`product-badge-new-${product.id}`}>
            New
          </Badge>
        ) : null}
        {product.is_best_seller ? (
          <Badge className="absolute right-2 top-2 bg-purple-700 text-white" data-testid={`product-badge-best-${product.id}`}>
            Bestseller
          </Badge>
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col gap-1.5 p-3.5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-purple-600">
          {product.category}
          {product.subcategory ? ` · ${product.subcategory}` : ""}
        </p>
        <h3 className="font-heading text-sm font-bold leading-snug text-slate-900 line-clamp-2">
          {product.name}
        </h3>

        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div>
            <p className="font-heading text-lg font-extrabold text-purple-950">₹{product.price}</p>
            <p className="text-[11px] text-slate-500">Starting price · {product.unit}</p>
          </div>
          <span
            data-testid={`product-stock-badge-${product.id}`}
            className={cn(
              "inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide",
              !availabilityVerified ? "bg-amber-50 text-amber-800" : inStock ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
            )}
          >
            {availabilityLabel}
          </span>
        </div>

        <a
          href={whatsappLink(product.name)}
          target="_blank"
          rel="noreferrer"
          data-testid={`product-whatsapp-${product.id}`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-2 w-full gap-1.5")}
        >
          <MessageCircle className="size-3.5 text-emerald-600" />
          WhatsApp to Enquire
        </a>
      </div>
    </div>
  );
}
