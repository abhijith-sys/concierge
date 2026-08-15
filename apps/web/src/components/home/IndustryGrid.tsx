import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { Category } from "../../lib/api";
import { iconForCategory } from "../../lib/category-icon";
import { SafeImage } from "../SafeImage";

export function IndustryCard({ category }: { category: Category }) {
  const Icon = iconForCategory(category.icon, category.slug);

  return (
    <Link
      to={`/listings/${category.slug}`}
      className="group relative h-32 overflow-hidden rounded-2xl md:h-36"
    >
      <SafeImage
        src={category.imageUrl || undefined}
        alt=""
        width={480}
        height={200}
        className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
      />
      <span className="absolute inset-0 bg-navy/45 transition group-hover:bg-navy/35" />
      <span className="absolute left-3 top-3 grid size-8 place-items-center rounded-full bg-white/15 text-white backdrop-blur">
        <Icon className="size-4" />
      </span>
      <span className="absolute inset-x-0 bottom-0 p-3">
        <span className="block text-sm font-bold text-white">{category.name}</span>
        {category.description ? (
          <span className="mt-0.5 block line-clamp-2 text-[11px] leading-4 text-white/80">{category.description}</span>
        ) : null}
      </span>
    </Link>
  );
}

export function IndustryGrid({
  categories,
  loading,
}: {
  categories: Category[];
  loading: boolean;
}) {
  return (
    <section className="py-6 md:py-8">
      <div className="page-shell">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-2xl font-extrabold tracking-tight text-navy md:text-[1.75rem]">Explore by industry</h2>
          <Link to="/listings" className="inline-flex items-center gap-1 text-sm font-bold text-navy">
            View all industries <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {loading
            ? Array.from({ length: 8 }, (_, index) => (
                <div key={index} className="h-32 animate-pulse rounded-2xl bg-surface-high md:h-36" />
              ))
            : categories.map((category) => <IndustryCard key={category.id} category={category} />)}
        </div>
      </div>
    </section>
  );
}
