import QuickContact from "@/components/QuickContact";
import AiAssistant from "@/components/AiAssistant";
import ReviewSection from "@/components/ReviewSection";
import { STORE } from "@/lib/constants";

export default function ReviewsPage() {
  return (
    <>
      <section className="bg-[#3B0764]">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">Customer Reviews</p>
          <h1 className="mt-1.5 font-heading text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Loved by Bandlaguda Jagir
          </h1>
          <p className="mt-2 max-w-2xl text-base leading-relaxed text-purple-200">
            Families, students and offices shop at {STORE.name} every day. Here&apos;s what they say — and
            your review helps neighbours find us too.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12">
        <ReviewSection />
      </section>

      <QuickContact />
      <AiAssistant />
    </>
  );
}
