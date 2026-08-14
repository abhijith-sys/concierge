import { Link } from "react-router-dom";
import type { Category, Listing } from "../../lib/api";
import { ProviderCarousel } from "./ProviderCarousel";

export function RecommendedSection({
  categories,
  listings,
  loading,
  error,
}: {
  categories: Array<Pick<Category, "name" | "slug">>;
  listings: Listing[];
  loading: boolean;
  error?: boolean;
}) {
  if (!loading && !listings.length && !categories.length) return null;

  return (
    <ProviderCarousel
      title="Recommended for you"
      subtitle={
        <div>
          <p>Based on what you've explored</p>
          {categories.length ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {categories.slice(0, 4).map((category) => (
                <Link
                  key={category.slug}
                  to={`/listings/${category.slug}`}
                  className="rounded-full border border-line px-3 py-1 text-xs font-semibold text-navy transition hover:border-navy hover:bg-navy hover:text-white"
                >
                  {category.name}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      }
      listings={listings}
      loading={loading}
      error={error}
      viewAllTo={categories[0] ? `/listings/${categories[0].slug}` : "/listings"}
    />
  );
}
