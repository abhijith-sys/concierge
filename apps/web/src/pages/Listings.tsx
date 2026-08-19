import { useQuery } from "@tanstack/react-query";
import { Search, SlidersHorizontal } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { EmptyList } from "../components/EmptyList";
import { ListingCard } from "../components/ListingCard";
import { SafeImage } from "../components/SafeImage";
import { Button, Input, PageState, Select } from "../components/ui";
import { api } from "../lib/api";
import { theme } from "../lib/theme";
import { iconForCategory } from "../lib/category-icon";
import { recordExploredCategory, setSavedCity } from "../lib/discovery";
import {
  categoryKind,
  mixedKindChildren,
  sortSupplierFirst,
  type MarketplaceKind,
} from "../lib/listing-kind";

const heroImage = theme.assets.banner;

export function Listings() {
  const { categorySlug } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [city, setCity] = useState(params.get("city") ?? "");
  const requestParams = new URLSearchParams(params);

  const category = useQuery({
    queryKey: ["category", categorySlug],
    queryFn: () => api.category(categorySlug!),
    enabled: Boolean(categorySlug),
  });
  const parentCategory = useQuery({
    queryKey: ["category", category.data?.parent?.slug],
    queryFn: () => api.category(category.data!.parent!.slug),
    enabled: Boolean(category.data?.parent?.slug),
  });
  const categories = useQuery({ queryKey: ["categories"], queryFn: api.categories });

  const browseMainFromTree = categories.data?.find((main) => {
    if (main.slug === categorySlug) return true;
    return (main.children ?? []).some(
      (child) =>
        child.slug === categorySlug ||
        (child.children ?? []).some((nested) => nested.slug === categorySlug),
    );
  });
  const browseMain = browseMainFromTree ?? (category.data?.parent ? parentCategory.data : category.data);
  const leafKind = category.data?.parent ? categoryKind(category.data) : undefined;
  const mixedMain = Boolean(browseMain && mixedKindChildren(browseMain));
  const mainKind = browseMain && !mixedMain ? categoryKind(browseMain) : undefined;
  const defaultKind: MarketplaceKind = leafKind ?? (mixedMain ? "supplier" : mainKind) ?? "supplier";
  const selectedKind = leafKind ?? (params.get("kind") as MarketplaceKind | null) ?? defaultKind;
  const showKindTabs = Boolean(mixedMain || !categorySlug);
  requestParams.set("kind", selectedKind);

  if (categorySlug) {
    if (category.data?.parent) requestParams.set("subcategory", categorySlug);
    else requestParams.set("category", categorySlug);
  }

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

  useEffect(() => {
    if (category.data?.slug && category.data.name) {
      recordExploredCategory({ slug: category.data.slug, name: category.data.name });
    }
  }, [category.data?.slug, category.data?.name]);

  useEffect(() => {
    if (city.trim()) setSavedCity(city);
  }, [city]);

  const results = useQuery({
    queryKey: ["search", requestParams.toString()],
    queryFn: () => api.search(requestParams),
  });
  const subcategoryChips = sortSupplierFirst(browseMain?.children ?? []).filter((child) => {
    if (!showKindTabs) return true;
    return categoryKind(child) === selectedKind;
  });
  const tradesView = selectedKind === "service";
  const heroSrc =
    category.data?.bannerUrl?.trim() ||
    category.data?.imageUrl?.trim() ||
    parentCategory.data?.bannerUrl?.trim() ||
    parentCategory.data?.imageUrl?.trim() ||
    heroImage;
  const heroCopy =
    category.data?.description?.trim() ||
    parentCategory.data?.description?.trim() ||
    (tradesView
      ? "Licensed tradespeople ready to take the job."
      : "Shops and wholesalers selling bulk, by order, or single piece at trade rates.");

  function listingsPath(slug: string, patch?: Record<string, string>) {
    const next = new URLSearchParams(params);
    next.delete("page");
    if (patch) {
      for (const [key, value] of Object.entries(patch)) next.set(key, value);
    }
    const queryString = next.toString();
    const path = slug ? `/listings/${slug}` : "/listings";
    return queryString ? `${path}?${queryString}` : path;
  }

  function goToCategory(slug: string) {
    navigate(listingsPath(slug));
  }

  function selectKind(kind: MarketplaceKind) {
    const parentSlug = category.data?.parent?.slug;
    if (parentSlug) {
      navigate(listingsPath(parentSlug, { kind }));
      return;
    }
    updateParam("kind", kind);
  }

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
      {showKindTabs ? (
        <div className="mb-6 flex justify-center">
          <div
            role="tablist"
            aria-label="Listing type"
            className="inline-grid grid-cols-2 rounded-xl bg-surface-low p-1"
          >
            {(["supplier", "service"] as const).map((kind) => {
              const active = selectedKind === kind;
              return (
                <button
                  key={kind}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => selectKind(kind)}
                  className={`min-w-[10.5rem] rounded-lg px-5 py-2.5 text-sm font-bold tracking-tight transition ${
                    active
                      ? "bg-white text-navy shadow-sm"
                      : "text-ink-soft hover:text-navy"
                  }`}
                >
                  {kind === "supplier" ? "Shops & sellers" : "Service professionals"}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
      {subcategoryChips.length ? (
        <div className="mb-5 flex flex-wrap gap-2">
          {subcategoryChips.map((child) => {
            const Icon = iconForCategory(child.icon, child.slug);
            const active = child.slug === categorySlug;
            return (
              <Link
                key={child.id}
                to={
                  active && browseMain
                    ? listingsPath(browseMain.slug, { kind: selectedKind })
                    : listingsPath(child.slug, { kind: categoryKind(child) })
                }
                className={`inline-flex items-center gap-2.5 rounded-full py-1.5 pl-1.5 pr-4 text-sm font-semibold transition ${
                  active
                    ? "bg-navy text-white shadow-sm"
                    : "border border-line bg-white hover:border-black hover:shadow-sm"
                }`}
              >
                <span
                  className={`size-9 overflow-hidden rounded-full ${
                    active ? "bg-white/15 text-gold-light" : "bg-gold-light/50 text-gold-dark"
                  }`}
                >
                  {child.imageUrl ? (
                    <SafeImage src={child.imageUrl} alt="" width={72} height={72} className="size-full object-cover" />
                  ) : (
                    <span className="grid size-full place-items-center">
                      <Icon className="size-4" strokeWidth={2.25} aria-hidden="true" />
                    </span>
                  )}
                </span>
                {child.name}
              </Link>
            );
          })}
        </div>
      ) : null}
      <section className="relative overflow-hidden rounded-[1.75rem] bg-navy">
        <SafeImage src={heroSrc} alt="" width={1200} height={600} loading="eager" fetchPriority="high" className="absolute inset-0 h-full w-full object-cover opacity-35" />
        <div className="relative z-10 flex max-w-2xl flex-col justify-center p-5 text-white md:p-7">
          <p className="label-caps text-gold-light">{tradesView ? "Need a technician?" : "Supplier network"}</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
            {category.data?.name ?? (categorySlug ? categorySlug.replaceAll("-", " ") : tradesView ? "Find a professional" : "Find shops at the best rate")}
          </h1>
          <p className="mt-2 text-sm leading-6 text-white/75">{heroCopy}</p>
          <form onSubmit={submit} className="mt-4 flex rounded-xl bg-white p-1.5">
            <label className="flex flex-1 items-center gap-2 px-3 text-black">
              <Search className="size-5" /><span className="sr-only">Search listings</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} className="h-11 w-full bg-transparent text-sm outline-none" placeholder={tradesView ? "Search technicians or services" : "Search shops or items"} />
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
              <label className="grid gap-2 text-xs font-bold uppercase tracking-wider">Category
                <Select
                  value={categorySlug ?? ""}
                  onChange={(event) => goToCategory(event.target.value)}
                  className="normal-case tracking-normal"
                >
                  <option value="">All categories</option>
                  {categories.data?.map((main) => (
                    <optgroup key={main.id} label={main.name}>
                      <option value={main.slug}>{main.name}</option>
                      {(main.children ?? []).flatMap((child) => [
                        <option key={child.id} value={child.slug}>
                          {child.name}
                        </option>,
                        ...(child.children ?? []).map((nested) => (
                          <option key={nested.id} value={nested.slug}>
                            {child.name} / {nested.name}
                          </option>
                        )),
                      ])}
                    </optgroup>
                  ))}
                </Select>
              </label>
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
              <Button
                variant="outline"
                onClick={() => {
                  if (!navigator.geolocation) return;
                  navigator.geolocation.getCurrentPosition((position) => {
                    const next = new URLSearchParams(params);
                    next.set("lat", String(position.coords.latitude));
                    next.set("lng", String(position.coords.longitude));
                    next.set("radiusKm", params.get("radiusKm") ?? "10");
                    next.delete("page");
                    setParams(next);
                  });
                }}
              >
                Near me
              </Button>
              {params.get("lat") && params.get("lng") ? (
                <p className="text-xs text-ink-soft">
                  Searching within {params.get("radiusKm") ?? "10"} km of your location.
                  <button
                    type="button"
                    className="ml-2 underline"
                    onClick={() => {
                      const next = new URLSearchParams(params);
                      next.delete("lat");
                      next.delete("lng");
                      next.delete("radiusKm");
                      setParams(next);
                    }}
                  >
                    Clear
                  </button>
                </p>
              ) : null}
              <Button variant="outline" onClick={() => setParams(new URLSearchParams())}>Clear filters</Button>
            </div>
          </div>
        </aside>

        <section>
          <div className="mb-6 flex items-end justify-between gap-4">
            <div><p className="label-caps text-gold-dark">{tradesView ? "Technicians" : "Directory"}</p><h2 className="mt-2 text-3xl font-semibold">{tradesView ? "Service professionals" : "Shops & sellers"}</h2></div>
            {results.data ? <p className="text-sm text-ink-soft">{results.data.total} results</p> : null}
          </div>
          {results.isLoading ? (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">{Array.from({ length: 8 }, (_, index) => <div key={index} className="h-72 animate-pulse rounded-2xl bg-surface-high" />)}</div>
          ) : results.isError ? (
            <PageState title="We couldn't load listings" description="Check that the API is running, then try again." action={<Button onClick={() => void results.refetch()}>Try again</Button>} />
          ) : results.data?.items.length === 0 ? (
            <EmptyList title="No matches yet" description="Try broadening your filters or searching another city." action={<Button onClick={() => setParams(new URLSearchParams())}>Clear filters</Button>} />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
                {results.data?.items.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
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
