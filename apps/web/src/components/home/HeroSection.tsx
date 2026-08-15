import { ArrowRight } from "lucide-react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import type { Category } from "../../lib/api";
import { SafeImage } from "../SafeImage";
import { PopularSearches } from "./PopularSearches";
import { SearchBar } from "./SearchBar";

const heroImage = "/assets/concierge-architectural-hero.jpg";

function categoryCopy(category: Category) {
  return category.description?.trim() || "Verified partners selected for quality.";
}

export function HeroSection({
  city,
  query,
  categories,
  categoriesLoading,
  popularSearches,
  onCityChange,
  onQueryChange,
  onSubmit,
  onUseLocation,
}: {
  city: string;
  query: string;
  categories: Category[];
  categoriesLoading: boolean;
  popularSearches: Category[];
  onCityChange: (value: string) => void;
  onQueryChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
  onUseLocation?: () => void;
}) {
  const heroTiles = categories.slice(0, 4);

  return (
    <section className="overflow-hidden bg-white py-6 md:py-8">
      <div className="page-shell grid items-center gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8">
        <div>
          <p className="label-caps text-gold-dark">Trusted. Verified. Reliable.</p>
          <h1 className="mt-3 max-w-xl text-3xl font-extrabold leading-[1.1] tracking-[-0.045em] text-navy md:text-5xl">
            Exceptional service, carefully found.
          </h1>
          <p className="mt-3 max-w-lg text-sm leading-6 text-ink-soft md:text-base md:leading-7">
            Discover verified businesses and skilled professionals for your home, business and everyday needs.
          </p>
          <SearchBar
            city={city}
            query={query}
            onCityChange={onCityChange}
            onQueryChange={onQueryChange}
            onSubmit={onSubmit}
            onUseLocation={onUseLocation}
          />
          <PopularSearches categories={popularSearches} />
        </div>

        <div className="relative min-h-[260px] overflow-hidden rounded-[1.75rem] lg:min-h-[340px]">
          <SafeImage
            src={heroImage}
            alt="A considered living space with natural materials"
            width={960}
            height={720}
            loading="eager"
            fetchPriority="high"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-2.5 p-3 md:p-4">
            {categoriesLoading
              ? Array.from({ length: 4 }, (_, index) => (
                  <div key={index} className="animate-pulse rounded-2xl bg-white/50" />
                ))
              : heroTiles.map((category) => (
                  <Link
                    key={category.id}
                    to={`/listings/${category.slug}`}
                    className="group relative flex flex-col justify-between overflow-hidden rounded-2xl p-3 shadow-lg"
                  >
                    <SafeImage
                      src={category.imageUrl || heroImage}
                      alt=""
                      width={480}
                      height={280}
                      className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    <span className="absolute inset-0 bg-navy/55 transition group-hover:bg-navy/45" />
                    <div className="relative z-10">
                      <h2 className="text-sm font-bold text-white">{category.name}</h2>
                      <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-white/75">
                        {categoryCopy(category)}
                      </p>
                    </div>
                    <ArrowRight className="relative z-10 mt-2 size-4 self-end text-white transition group-hover:translate-x-1" />
                  </Link>
                ))}
          </div>
        </div>
      </div>
    </section>
  );
}
