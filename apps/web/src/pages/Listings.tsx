import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BadgeCheck, Search, SlidersHorizontal, Star } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { SafeImage } from "../components/SafeImage";
import { Button, Input, PageState, Select } from "../components/ui";
import { api, type Listing } from "../lib/api";

const fallbackImage = "/assets/brett-villa.jpg";
const heroImage = "/assets/builders-hero.jpg";

function resultSlug(listing: Listing) {
  return listing.business?.slug ?? listing.businessId ?? listing.id;
}

export function Listings() {
  const { categorySlug } = useParams();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [city, setCity] = useState(params.get("city") ?? "");
  const requestParams = new URLSearchParams(params);
  if (categorySlug) requestParams.set("category", categorySlug);

  useEffect(() => setQuery(params.get("q") ?? ""), [params]);
  useEffect(() => setCity(params.get("city") ?? ""), [params]);
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setParams((current) => {
        if ((current.get("city") ?? "") === city.trim()) return current;
        const next = new URLSearchParams(current);
        if (city.trim()) next.set("city", city.trim());
        else next.delete("city");
        next.delete("page");
        return next;
      });
    }, 400);
    return () => window.clearTimeout(timeout);
  }, [city, setParams]);

  const results = useQuery({
    queryKey: ["search", requestParams.toString()],
    queryFn: () => api.search(requestParams),
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    const next = new URLSearchParams(params);
    if (query.trim()) next.set("q", query.trim());
    else next.delete("q");
    next.delete("page");
    setParams(next);
  }

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    setParams(next);
  }

  return (
    <div className="page-shell py-10">
      <section className="relative min-h-[340px] overflow-hidden rounded-[2rem] bg-navy">
        <SafeImage src={heroImage} alt="" width={1200} height={600} loading="eager" fetchPriority="high" className="absolute inset-0 h-full w-full object-cover opacity-35" />
        <div className="relative z-10 flex min-h-[340px] max-w-2xl flex-col justify-center p-8 text-white md:p-12">
          <p className="label-caps text-gold-light">Curated partners</p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">
            {categorySlug ? categorySlug.replaceAll("-", " ") : "Find your next expert"}
          </h1>
          <p className="mt-4 leading-7 text-white/75">Verified professionals, remarkable places, and services selected for quality.</p>
          <form onSubmit={submit} className="mt-7 flex rounded-xl bg-white p-1.5">
            <label className="flex flex-1 items-center gap-2 px-3 text-black">
              <Search className="size-5" /><span className="sr-only">Search listings</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} className="h-11 w-full bg-transparent text-sm outline-none" placeholder="Search businesses or services" />
            </label>
            <Button type="submit">Search</Button>
          </form>
        </div>
      </section>

      <div className="mt-10 grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside>
          <div className="sticky top-28 rounded-2xl border border-line bg-surface-low p-5">
            <h2 className="flex items-center gap-2 font-semibold"><SlidersHorizontal className="size-5" /> Filters</h2>
            <div className="mt-6 grid gap-5">
              <label className="grid gap-2 text-xs font-bold uppercase tracking-wider">City
                <Input value={city} onChange={(event) => setCity(event.target.value)} placeholder="Any city" className="bg-white normal-case tracking-normal" />
              </label>
              <label className="grid gap-2 text-xs font-bold uppercase tracking-wider">Minimum rating
                <Select value={params.get("rating") ?? ""} onChange={(event) => updateParam("rating", event.target.value)} className="normal-case tracking-normal">
                  <option value="">Any rating</option><option value="4">4.0+</option><option value="4.5">4.5+</option><option value="4.8">4.8+</option>
                </Select>
              </label>
              <label className="flex cursor-pointer items-center gap-3 text-sm">
                <input type="checkbox" checked={params.get("open") === "true"} onChange={(event) => updateParam("open", event.target.checked ? "true" : "")} className="size-5 accent-black" />
                Open now
              </label>
              <Button variant="outline" onClick={() => setParams(new URLSearchParams())}>Clear filters</Button>
            </div>
          </div>
        </aside>

        <section>
          <div className="mb-6 flex items-end justify-between gap-4">
            <div><p className="label-caps text-gold-dark">Directory</p><h2 className="mt-2 text-3xl font-semibold">Verified partners</h2></div>
            {results.data ? <p className="text-sm text-ink-soft">{results.data.total} results</p> : null}
          </div>
          {results.isLoading ? (
            <div className="grid gap-6 md:grid-cols-2">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-[430px] animate-pulse rounded-2xl bg-surface-high" />)}</div>
          ) : results.isError ? (
            <PageState title="We couldn't load listings" description="Check that the API is running, then try again." action={<Button onClick={() => void results.refetch()}>Try again</Button>} />
          ) : results.data?.items.length === 0 ? (
            <PageState title="No matches yet" description="Try broadening your filters or searching another city." action={<Button onClick={() => setParams(new URLSearchParams())}>Clear filters</Button>} />
          ) : (
            <>
              <div className="grid gap-6 md:grid-cols-2">
                {results.data?.items.map((listing) => (
                  <article key={listing.id} className="group overflow-hidden rounded-2xl border border-line bg-white transition duration-300 hover:-translate-y-1 hover:shadow-xl">
                    <Link to={`/business/${resultSlug(listing)}`} className="relative block h-60 overflow-hidden">
                      <SafeImage src={listing.images?.[0] ?? fallbackImage} alt={`${listing.business?.name ?? listing.title} featured work`} width={720} height={480} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                      {listing.business?.verified ? <span className="absolute left-4 top-4 flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white"><BadgeCheck className="size-4" /> Verified</span> : null}
                    </Link>
                    <div className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <h3 className="text-lg font-semibold">{listing.business?.name ?? listing.title}</h3>
                        <span className="flex items-center gap-1 font-bold"><Star className="size-4 fill-black" />{Number(listing.avgRating ?? 0).toFixed(1)}</span>
                      </div>
                      <p className="mt-3 line-clamp-3 text-sm leading-6 text-ink-soft">{listing.description}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {listing.category ? <span className="rounded-full bg-surface-high px-3 py-1 text-xs font-semibold">{listing.category.name}</span> : null}
                        {listing.city ? <span className="rounded-full bg-surface-high px-3 py-1 text-xs font-semibold">{listing.city}</span> : null}
                        <span className="rounded-full bg-surface-high px-3 py-1 text-xs font-semibold">{listing.reviewCount ?? 0} reviews</span>
                      </div>
                      <Link to={`/business/${resultSlug(listing)}`} className="mt-6 flex items-center gap-2 text-sm font-bold">View profile <ArrowRight className="size-4 transition group-hover:translate-x-1" /></Link>
                    </div>
                  </article>
                ))}
              </div>
              {results.data && results.data.pages > 1 ? (
                <div className="mt-10 flex items-center justify-center gap-3">
                  <Button variant="outline" disabled={results.data.page <= 1} onClick={() => updateParam("page", String(results.data.page - 1))}>Previous</Button>
                  <span className="text-sm text-ink-soft">Page {results.data.page} of {results.data.pages}</span>
                  <Button variant="outline" disabled={results.data.page >= results.data.pages} onClick={() => updateParam("page", String(results.data.page + 1))}>Next</Button>
                </div>
              ) : null}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
