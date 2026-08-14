import { Link } from "react-router-dom";
import type { Category } from "../../lib/api";

export function PopularSearches({ categories }: { categories: Category[] }) {
  if (!categories.length) return null;

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold text-ink-soft">Popular:</span>
      {categories.map((category) => (
        <Link
          key={category.id}
          to={`/listings/${category.slug}`}
          className="rounded-full border border-line px-3.5 py-1.5 text-xs font-semibold text-navy transition hover:border-navy hover:bg-navy hover:text-white"
        >
          {category.name}
        </Link>
      ))}
    </div>
  );
}
