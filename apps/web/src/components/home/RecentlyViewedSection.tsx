import { Link } from "react-router-dom";
import type { RecentBusinessView } from "../../lib/discovery";
import { SafeImage } from "../SafeImage";

export function RecentlyViewedSection({ businesses }: { businesses: RecentBusinessView[] }) {
  if (!businesses.length) return null;

  return (
    <section className="page-shell py-12 lg:py-16">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="label-caps text-gold-dark">Pick up where you left off</p>
          <h2 className="mt-2 text-2xl font-semibold">Recently viewed</h2>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {businesses.map((business) => (
          <Link
            key={business.slug}
            to={`/business/${business.slug}`}
            className="group overflow-hidden rounded-2xl border border-line bg-white transition hover:border-navy hover:shadow-md"
          >
            <div className="aspect-[4/3] overflow-hidden bg-surface-high">
              {business.coverUrl ? (
                <SafeImage
                  src={business.coverUrl}
                  alt=""
                  width={400}
                  height={300}
                  className="size-full object-cover transition group-hover:scale-105"
                />
              ) : (
                <div className="grid size-full place-items-center text-sm font-semibold text-ink-soft">
                  {business.name.slice(0, 1)}
                </div>
              )}
            </div>
            <div className="p-3">
              <p className="line-clamp-2 text-sm font-semibold text-navy">{business.name}</p>
              {business.city ? <p className="mt-1 text-xs text-ink-soft">{business.city}</p> : null}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
