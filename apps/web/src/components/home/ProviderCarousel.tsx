import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, type ReactNode } from "react";
import { Link } from "react-router-dom";
import type { Listing } from "../../lib/api";
import { ProviderCard } from "../ListingCard";

export function ProviderCarousel({
  title,
  subtitle,
  viewAllTo = "/listings",
  viewAllLabel = "View all",
  listings,
  loading,
  error,
  empty,
}: {
  title: string;
  subtitle?: ReactNode;
  viewAllTo?: string;
  viewAllLabel?: string;
  listings: Listing[];
  loading: boolean;
  error?: boolean;
  empty?: string;
}) {
  const scroller = useRef<HTMLDivElement>(null);

  function scroll(direction: -1 | 1) {
    scroller.current?.scrollBy({ left: direction * 300, behavior: "smooth" });
  }

  return (
    <section className="py-6 md:py-8">
      <div className="page-shell">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-navy md:text-[1.75rem]">{title}</h2>
            {subtitle ? <div className="mt-1.5 text-sm text-ink-soft">{subtitle}</div> : null}
          </div>
          <Link to={viewAllTo} className="inline-flex items-center gap-1 text-sm font-bold text-navy">
            {viewAllLabel} <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="relative mt-5">
          <div ref={scroller} className="no-scrollbar flex gap-4 overflow-x-auto pb-1">
            {loading
              ? Array.from({ length: 4 }, (_, index) => (
                  <div
                    key={index}
                    className="h-72 min-w-[240px] animate-pulse rounded-2xl bg-surface-high"
                    aria-hidden="true"
                  />
                ))
              : listings.length
                ? listings.map((listing) => (
                    <ProviderCard key={listing.id} listing={listing} className="w-[240px] shrink-0" />
                  ))
                : (
                    <p className="py-8 text-sm text-ink-soft">{empty ?? "Nothing to show here yet."}</p>
                  )}
          </div>
          {listings.length > 3 ? (
            <>
              <button
                type="button"
                className="absolute -left-3 top-1/3 hidden size-10 items-center justify-center rounded-full border border-line bg-white shadow-md md:grid"
                aria-label={`Previous ${title}`}
                onClick={() => scroll(-1)}
              >
                <ChevronLeft className="size-5" />
              </button>
              <button
                type="button"
                className="absolute -right-3 top-1/3 hidden size-10 items-center justify-center rounded-full border border-line bg-white shadow-md md:grid"
                aria-label={`Next ${title}`}
                onClick={() => scroll(1)}
              >
                <ChevronRight className="size-5" />
              </button>
            </>
          ) : null}
        </div>
        {error ? <p className="mt-3 text-sm text-ink-soft">This section is temporarily unavailable.</p> : null}
      </div>
    </section>
  );
}
