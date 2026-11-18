import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PenLine, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiGet, apiPost } from "@/lib/api";
import { STORE } from "@/lib/constants";
import type { Review } from "@/lib/types";
import { cn } from "@/lib/utils";

function Stars({ rating, className }: { rating: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} data-testid={`stars-${rating}`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn("size-3.5", n <= rating ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200")}
        />
      ))}
    </span>
  );
}

function ReviewDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (body: { name: string; rating: number; comment: string }) => apiPost<Review>("/reviews", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      toast.success("Thanks for your review! It's now live on the site.");
      setName("");
      setComment("");
      setRating(5);
      onOpenChange(false);
    },
    onError: () => toast.error("Could not submit your review. Please try again."),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="review-form-dialog">
        <DialogHeader>
          <DialogTitle className="font-heading text-purple-950">Write a Review</DialogTitle>
          <DialogDescription>Share your experience shopping at {STORE.name}.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="review-name">Your Name</Label>
            <Input
              id="review-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Srilatha Reddy"
              data-testid="review-form-name-input"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Your Rating</Label>
            <div className="flex gap-1" data-testid="review-form-rating-picker">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} star`} data-testid={`review-form-star-${n}`}>
                  <Star className={cn("size-6 transition-transform hover:scale-110", n <= rating ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200")} />
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="review-comment">Your Review</Label>
            <Textarea
              id="review-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell other customers about products, prices, service…"
              rows={3}
              data-testid="review-form-comment-input"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={() => mutation.mutate({ name: name.trim(), rating, comment: comment.trim() })}
            disabled={!name.trim() || !comment.trim() || mutation.isPending}
            data-testid="review-form-submit-button"
          >
            {mutation.isPending ? "Submitting…" : "Submit Review"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function ReviewSection({ limit }: { limit?: number }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: reviews, isLoading } = useQuery({
    queryKey: ["reviews"],
    queryFn: () => apiGet<Review[]>("/reviews"),
  });

  const list = reviews ?? [];
  const shown = limit ? list.slice(0, limit) : list;
  const average = list.length ? list.reduce((s, r) => s + r.rating, 0) / list.length : 0;

  return (
    <div data-testid="reviews-section">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-purple-600">Customer Reviews</p>
          <h2 className="mt-1.5 font-heading text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            What Our Customers Say
          </h2>
          <div className="mt-2 flex items-center gap-2" data-testid="reviews-average-rating">
            <Stars rating={Math.round(average)} />
            <span className="font-heading text-sm font-bold text-slate-900">
              {average ? average.toFixed(1) : "—"} / 5
            </span>
            <span className="text-sm text-slate-500">({list.length} reviews)</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setDialogOpen(true)} data-testid="review-form-open-button" className="gap-1.5">
            <PenLine className="size-4" /> Write a Review
          </Button>
          <a
            href={STORE.mapsListing}
            target="_blank"
            rel="noreferrer"
            data-testid="google-btn-review"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-purple-200 bg-white px-3.5 text-sm font-semibold text-purple-800 transition-colors hover:bg-purple-50"
          >
            <Star className="size-4 fill-amber-400 text-amber-400" /> Write a Google Review
          </a>
        </div>
      </div>

      <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? [0, 1, 2].map((i) => <div key={i} className="h-40 animate-pulse rounded-2xl border border-purple-100 bg-purple-50/50" />)
          : shown.map((r) => (
              <div
                key={r.id}
                data-testid={`review-card-${r.id}`}
                className="flex flex-col gap-2 rounded-2xl border border-purple-100 bg-white p-5 shadow-sm"
              >
                <Stars rating={r.rating} />
                <p className="flex-1 text-sm leading-relaxed text-slate-600">“{r.comment}”</p>
                <div className="flex items-center justify-between">
                  <p className="font-heading text-sm font-bold text-purple-900">{r.name}</p>
                  <Badge variant="secondary" className="bg-purple-50 text-purple-700">
                    Local Customer
                  </Badge>
                </div>
              </div>
            ))}
      </div>

      <ReviewDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
