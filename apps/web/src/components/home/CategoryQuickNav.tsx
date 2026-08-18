import { Link } from "react-router-dom";
import type { Category } from "../../lib/api";
import { iconForCategory } from "../../lib/category-icon";
import { EmptyList } from "../EmptyList";
import { SafeImage } from "../SafeImage";

export function CategoryQuickNav({
  categories,
  loading,
  error,
}: {
  categories: Category[];
  loading: boolean;
  error: boolean;
}) {
  return (
    <section className="py-6 md:py-8">
      <div className="page-shell">
        <div className="no-scrollbar flex gap-4 overflow-x-auto pb-1 lg:grid lg:grid-cols-[repeat(auto-fit,minmax(5.75rem,1fr))]">
          {loading
            ? Array.from({ length: 8 }, (_, index) => (
                <div key={index} className="flex min-w-24 flex-col items-center gap-2.5">
                  <div className="size-14 animate-pulse rounded-full bg-surface-high" />
                  <div className="h-3 w-16 animate-pulse rounded bg-surface-high" />
                </div>
              ))
            : categories.length
              ? categories.map((category) => {
                  const Icon = iconForCategory(category.icon, category.slug);
                  return (
                    <Link
                      key={category.id}
                      to={`/listings/${category.slug}`}
                      className="group flex min-w-24 flex-col items-center gap-2.5 text-center"
                    >
                      {category.imageUrl ? (
                        <span className="size-14 overflow-hidden rounded-full border border-line bg-white shadow-sm transition group-hover:-translate-y-0.5 group-hover:border-navy group-hover:shadow-md">
                          <SafeImage
                            src={category.imageUrl}
                            alt=""
                            width={112}
                            height={112}
                            className="size-full object-cover"
                          />
                        </span>
                      ) : (
                        <span className="grid size-14 place-items-center rounded-full border border-line bg-white shadow-sm transition group-hover:-translate-y-0.5 group-hover:border-navy group-hover:shadow-md">
                          <Icon className="size-5 text-navy" />
                        </span>
                      )}
                      <span className="max-w-24 text-[11px] font-bold leading-4 text-navy">{category.name}</span>
                    </Link>
                  );
                })
              : !error
                ? (
                    <div className="col-span-full min-w-full">
                      <EmptyList compact title="No categories yet" />
                    </div>
                  )
                : null}
        </div>
        {error ? (
          <p className="mt-3 text-center text-xs text-ink-soft">Categories are temporarily unavailable. Search still works.</p>
        ) : null}
      </div>
    </section>
  );
}
