import { useQuery } from "@tanstack/react-query";
import { LayoutGrid, Map, Search, SlidersHorizontal } from "lucide-react";
import { Suspense, useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { EmptyList } from "../components/EmptyList";
import { SearchBar } from "../components/home/SearchBar";
import { ListingCard } from "../components/ListingCard";
import { defaultPageTitle, PageHead } from "../components/PageHead";
import { SafeImage } from "../components/SafeImage";
import { SearchAutocomplete } from "../components/SearchAutocomplete";
import { Button, Input, PageState, Select } from "../components/ui";
import { api, type SearchSuggestion } from "../lib/api";
import { lazyWithReload } from "../lib/lazyWithReload";
import { theme } from "../lib/theme";
import { iconForCategory } from "../lib/category-icon";
import { recordExploredCategory, setSavedCity, setSavedCoords, getExploredCategories } from "../lib/discovery";
import { isStayCategory } from "../lib/stays";
import { isRentalCategory } from "../lib/rentals";
import { isTravelCategory } from "../lib/travel";
import { isEventsRoot } from "../lib/events";
import { isLogisticsRoot } from "../lib/logistics";
import { isEducationRoot } from "../lib/education";
import { isHealthRoot } from "../lib/health";
import { isProfessionalRoot } from "../lib/professional";
import { isHomeRoot } from "../lib/home";
import { isAutomotiveRoot } from "../lib/automotive";
import { isElectronicsRoot } from "../lib/electronics";
import {
  categoryKind,
  mixedKindChildren,
  sortSupplierFirst,
  type MarketplaceKind,
} from "../lib/listing-kind";

const SearchResultsMap = lazyWithReload(() => import("../components/SearchResultsMap"), (module) => module.default);
const heroImage = theme.assets.banner;

export function Listings() {
  const { categorySlug } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [city, setCity] = useState(() => params.get("city") ?? "");
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
  const serviceFirstRoot =
    isEventsRoot(browseMain) ||
    isLogisticsRoot(browseMain) ||
    isEducationRoot(browseMain) ||
    isHealthRoot(browseMain) ||
    isProfessionalRoot(browseMain) ||
    isHomeRoot(browseMain) ||
    isAutomotiveRoot(browseMain) ||
    isElectronicsRoot(browseMain);
  const defaultKind: MarketplaceKind =
    leafKind ?? (mixedMain ? (serviceFirstRoot ? "service" : "supplier") : mainKind) ?? "supplier";
  const selectedKind = leafKind ?? (params.get("kind") as MarketplaceKind | null) ?? defaultKind;
  const showKindTabs = Boolean(mixedMain || !categorySlug);
  const mapView = params.get("view") === "map";
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
  const stayView =
    isStayCategory(category.data) ||
    isStayCategory(browseMain) ||
    isStayCategory(categorySlug ? { slug: categorySlug } : null);
  const rentalView =
    isRentalCategory(category.data) ||
    isRentalCategory(browseMain) ||
    isRentalCategory(categorySlug ? { slug: categorySlug } : null);
  const travelView =
    isTravelCategory(category.data) ||
    isTravelCategory(browseMain) ||
    isTravelCategory(categorySlug ? { slug: categorySlug } : null);
  const eventView =
    selectedKind === "service" &&
    (isEventsRoot(category.data) ||
      isEventsRoot(browseMain) ||
      isEventsRoot(categorySlug ? { slug: categorySlug } : null));
  const logisticsView =
    selectedKind === "service" &&
    (isLogisticsRoot(category.data) ||
      isLogisticsRoot(browseMain) ||
      isLogisticsRoot(categorySlug ? { slug: categorySlug } : null));
  const educationView =
    selectedKind === "service" &&
    (isEducationRoot(category.data) ||
      isEducationRoot(browseMain) ||
      isEducationRoot(categorySlug ? { slug: categorySlug } : null));
  const healthView =
    selectedKind === "service" &&
    (isHealthRoot(category.data) ||
      isHealthRoot(browseMain) ||
      isHealthRoot(categorySlug ? { slug: categorySlug } : null));
  const professionalView =
    selectedKind === "service" &&
    (isProfessionalRoot(category.data) ||
      isProfessionalRoot(browseMain) ||
      isProfessionalRoot(categorySlug ? { slug: categorySlug } : null));
  const homeView =
    selectedKind === "service" &&
    (isHomeRoot(category.data) ||
      isHomeRoot(browseMain) ||
      isHomeRoot(categorySlug ? { slug: categorySlug } : null));
  const automotiveView =
    selectedKind === "service" &&
    (isAutomotiveRoot(category.data) ||
      isAutomotiveRoot(browseMain) ||
      isAutomotiveRoot(categorySlug ? { slug: categorySlug } : null));
  const electronicsView =
    selectedKind === "service" &&
    (isElectronicsRoot(category.data) ||
      isElectronicsRoot(browseMain) ||
      isElectronicsRoot(categorySlug ? { slug: categorySlug } : null));
  const heroSrc =
    category.data?.bannerUrl?.trim() ||
    category.data?.imageUrl?.trim() ||
    parentCategory.data?.bannerUrl?.trim() ||
    parentCategory.data?.imageUrl?.trim() ||
    heroImage;
  const heroCopy =
    category.data?.description?.trim() ||
    parentCategory.data?.description?.trim() ||
    (stayView
      ? "Compare hotels, resorts, and homestays — rooms, rates, facilities, and guest reviews."
      : rentalView
      ? "Hire vehicles, cameras, event gear, and tools by the hour or day — rates, deposits, and availability."
      : travelView
      ? "Compare taxis, airport transfers, tours, and chauffeur trips — fleet, rates, and trip enquiries."
      : eventView
      ? "Compare event crews, photographers, caterers, and wedding teams — packages, rates, and event enquiries."
      : logisticsView
      ? "Compare couriers, movers, transporters, and security — vehicles, rates, and move enquiries."
      : educationView
      ? "Compare coaching, tuition, and training institutes — courses, rates, and learning enquiries."
      : healthView
      ? "Compare clinics, dentists, physio, and wellness — treatments, rates, and appointment enquiries."
      : professionalView
      ? "Compare CA, lawyers, tax, and consultants — services, rates, and professional enquiries."
      : homeView
      ? "Compare electricians, plumbers, and home trades — packages, rates, and job enquiries."
      : automotiveView
      ? "Compare car and bike repair, wash, and tow — packages, rates, and workshop enquiries."
      : electronicsView
      ? "Compare laptop, phone, CCTV, and IT repair — packages, rates, and repair enquiries."
      : tradesView
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
    setSavedCity(city);
    const next = new URLSearchParams(params);
    if (query.trim()) next.set("q", query.trim());
    else next.delete("q");
    if (city.trim()) next.set("city", city.trim());
    else next.delete("city");
    next.delete("page");
    setParams(next);
  }

  function useLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((position) => {
      const nextCoords = { lat: position.coords.latitude, lng: position.coords.longitude };
      setSavedCoords(nextCoords);
      const next = new URLSearchParams(params);
      next.set("lat", String(nextCoords.lat));
      next.set("lng", String(nextCoords.lng));
      next.set("radiusKm", params.get("radiusKm") ?? "10");
      next.delete("page");
      setParams(next);
    });
  }

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    setParams(next);
  }

  function setResultsView(view: "list" | "map") {
    updateParam("view", view === "map" ? "map" : "");
  }

  function handleSuggestionSelect(suggestion: SearchSuggestion) {
    if (suggestion.type === "query" && suggestion.href) {
      const url = new URL(suggestion.href, window.location.origin);
      const next = new URLSearchParams(params);
      const q = url.searchParams.get("q");
      if (q) {
        next.set("q", q);
        setQuery(q);
      }
      const suggestCity = url.searchParams.get("city");
      if (suggestCity) {
        next.set("city", suggestCity);
        setCity(suggestCity);
      }
      next.delete("page");
      setParams(next);
      return;
    }
    if (suggestion.href) navigate(suggestion.href);
  }

  const seo = useMemo(() => {
    const searchQ = params.get("q")?.trim();
    const categoryName = category.data?.name;
    if (searchQ) {
      const cityLabel = params.get("city")?.trim();
      const title = cityLabel
        ? `"${searchQ}" in ${cityLabel}`
        : `"${searchQ}" search results`;
      return {
        title: defaultPageTitle(title),
        description: cityLabel
          ? `Find ${searchQ} businesses and services in ${cityLabel} on DialGo.`
          : `Search results for ${searchQ} on DialGo — verified businesses and services.`,
        canonicalPath: categorySlug
          ? `/listings/${categorySlug}?${params.toString()}`
          : `/listings?${params.toString()}`,
      };
    }
    if (categoryName) {
      return {
        title: defaultPageTitle(`${categoryName} listings`),
        description: category.data?.description?.trim() ||
          `Browse ${categoryName} businesses and services on DialGo.`,
        canonicalPath: `/listings/${categorySlug}`,
      };
    }
    return {
      title: defaultPageTitle("Browse listings"),
      description: "Search and browse verified businesses, shops, and service professionals on DialGo.",
      canonicalPath: "/listings",
    };
  }, [params, category.data, categorySlug]);

  return (
    <div className="page-shell py-10">
      <PageHead
        title={seo.title}
        description={seo.description}
        canonicalPath={seo.canonicalPath}
      />
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
        <div className="relative z-10 flex max-w-3xl flex-col justify-center p-5 text-white md:p-7">
          <p className="label-caps text-gold-light">
            {stayView
              ? "Places to stay"
              : rentalView
                ? "Hire by the day"
                : travelView
                  ? "Need a ride?"
                  : eventView
                    ? "Planning an event?"
                    : logisticsView
                      ? "Need to move it?"
                      : educationView
                        ? "Looking to learn?"
                        : healthView
                          ? "Need care?"
                          : professionalView
                            ? "Need advice?"
                            : homeView
                              ? "Need a home trade?"
                              : automotiveView
                                ? "Need a workshop?"
                                : electronicsView
                                  ? "Need a repair?"
                                  : tradesView
                              ? "Need a technician?"
                              : "Supplier network"}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
            {category.data?.name ??
              (categorySlug
                ? categorySlug.replaceAll("-", " ")
                : stayView
                  ? "Find a stay"
                  : rentalView
                    ? "Find hire gear"
                    : travelView
                      ? "Find a taxi or tour"
                      : eventView
                        ? "Find an event crew"
                        : logisticsView
                          ? "Find movers or courier"
                          : educationView
                            ? "Find coaching or tuition"
                            : healthView
                              ? "Find a clinic or spa"
                              : professionalView
                                ? "Find a consultant"
                                : homeView
                                  ? "Find a home trade"
                                  : automotiveView
                                    ? "Find a workshop"
                                    : electronicsView
                                      ? "Find a repair shop"
                                      : tradesView
                                  ? "Find a professional"
                                  : "Find shops at the best rate")}
          </h1>
          <p className="mt-2 text-sm leading-6 text-white/75">{heroCopy}</p>
          {stayView ||
          rentalView ||
          travelView ||
          eventView ||
          logisticsView ||
          educationView ||
          healthView ||
          professionalView ||
          homeView ||
          automotiveView ||
          electronicsView ? (
            <SearchBar
              city={city}
              query={query}
              onCityChange={setCity}
              onQueryChange={setQuery}
              onSubmit={submit}
              onUseLocation={useLocation}
              onSuggestionSelect={handleSuggestionSelect}
              queryPlaceholder={
                stayView
                  ? "Search hotels, resorts, or homestays"
                  : rentalView
                    ? "Search cars, cameras, or event gear"
                    : travelView
                      ? "Search taxis, airport cars, or tours"
                      : eventView
                        ? "Search photographers, caterers, or planners"
                        : logisticsView
                          ? "Search couriers, movers, or security"
                          : educationView
                            ? "Search coaching, tuition, or training"
                            : healthView
                              ? "Search dentists, clinics, or spa"
                              : professionalView
                                ? "Search CA, lawyers, or consultants"
                                : homeView
                                  ? "Search electricians, plumbers, or painters"
                                  : automotiveView
                                    ? "Search car repair, wash, or tow"
                                    : "Search laptop, phone, or IT repair"
              }
              className="mt-4 text-navy"
            />
          ) : (
            <form onSubmit={submit} className="mt-4 flex rounded-xl bg-white p-1.5">
              <label className="flex flex-1 items-center gap-2 px-3 text-black">
                <Search className="size-5 shrink-0" /><span className="sr-only">Search listings</span>
                <SearchAutocomplete
                  value={query}
                  onChange={setQuery}
                  city={city}
                  placeholder={tradesView ? "Search technicians or services" : "Search shops or items"}
                  onSelect={handleSuggestionSelect}
                  inputClassName="text-black"
                />
              </label>
              <Button type="submit">Search</Button>
            </form>
          )}
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
              <label className="grid gap-2 text-xs font-bold uppercase tracking-wider">Sort by
                <Select value={params.get("sort") ?? "relevance"} onChange={(event) => updateParam("sort", event.target.value === "relevance" ? "" : event.target.value)} className="normal-case tracking-normal">
                  <option value="relevance">Relevance</option>
                  <option value="rating">Highest rated</option>
                  <option value="distance" disabled={!params.get("lat") || !params.get("lng")}>Nearest</option>
                </Select>
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
              <label className="flex cursor-pointer items-center gap-3 text-sm">
                <input type="checkbox" checked={params.get("verified") === "true"} onChange={(event) => updateParam("verified", event.target.checked ? "true" : "")} className="size-5 accent-black" />
                Verified only
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
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="label-caps text-gold-dark">
                {stayView
                  ? "Stays"
                  : rentalView
                    ? "Hire"
                    : travelView
                      ? "Transport"
                      : eventView
                        ? "Events"
                        : logisticsView
                          ? "Logistics"
                          : educationView
                            ? "Education"
                            : healthView
                              ? "Health"
                              : professionalView
                                ? "Professional"
                                : homeView
                                  ? "Home trades"
                                  : automotiveView
                                    ? "Automotive"
                                    : electronicsView
                                      ? "Electronics"
                                      : tradesView
                                  ? "Technicians"
                                  : "Directory"}
              </p>
              <h2 className="mt-2 text-3xl font-semibold">
                {stayView
                  ? "Hotels, resorts & stays"
                  : rentalView
                    ? "Rental & hire"
                    : travelView
                      ? "Travel, taxi & transport"
                      : eventView
                        ? "Events & lifestyle"
                        : logisticsView
                          ? "Logistics & other services"
                          : educationView
                            ? "Education & training"
                            : healthView
                              ? "Health & wellness"
                              : professionalView
                                ? "Professional & business"
                                : homeView
                                  ? "Home & property trades"
                                  : automotiveView
                                    ? "Automotive services"
                                    : electronicsView
                                      ? "Electronics & IT repair"
                                      : tradesView
                                  ? "Service professionals"
                                  : "Shops & sellers"}
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="inline-flex rounded-xl border border-line bg-white p-1" role="group" aria-label="Results view">
                <button
                  type="button"
                  aria-pressed={!mapView}
                  onClick={() => setResultsView("list")}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                    !mapView ? "bg-navy text-white" : "text-ink-soft hover:text-navy"
                  }`}
                >
                  <LayoutGrid className="size-4" aria-hidden="true" />
                  List
                </button>
                <button
                  type="button"
                  aria-pressed={mapView}
                  onClick={() => setResultsView("map")}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                    mapView ? "bg-navy text-white" : "text-ink-soft hover:text-navy"
                  }`}
                >
                  <Map className="size-4" aria-hidden="true" />
                  Map
                </button>
              </div>
              {results.data ? <p className="text-sm text-ink-soft">{results.data.total} results</p> : null}
            </div>
          </div>
          {results.isLoading ? (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">{Array.from({ length: 8 }, (_, index) => <div key={index} className="h-72 animate-pulse rounded-2xl bg-surface-high" />)}</div>
          ) : results.isError ? (
            <PageState title="We couldn't load listings" description="Check that the API is running, then try again." action={<Button onClick={() => void results.refetch()}>Try again</Button>} />
          ) : results.data?.items.length === 0 ? (
            <div className="rounded-2xl border border-line bg-surface-low p-8">
              <EmptyList
                title="No matches yet"
                description={
                  params.get("city")
                    ? `Nothing found in ${params.get("city")}. Try another city or remove filters.`
                    : "Try broadening your search or exploring a category below."
                }
                action={
                  <div className="flex flex-wrap justify-center gap-2">
                    <Button onClick={() => setParams(new URLSearchParams())}>Clear all filters</Button>
                    {params.get("city") ? (
                      <Button variant="outline" onClick={() => updateParam("city", "")}>
                        Search any city
                      </Button>
                    ) : null}
                  </div>
                }
              />
              {(getExploredCategories().length || categories.data?.length) ? (
                <div className="mt-8 border-t border-line pt-6">
                  <p className="text-center text-sm font-semibold text-navy">Try these categories</p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {(getExploredCategories().length
                      ? getExploredCategories()
                      : (categories.data ?? []).slice(0, 6).map((main) => ({ slug: main.slug, name: main.name }))
                    ).slice(0, 6).map((category) => (
                      <Link
                        key={category.slug}
                        to={listingsPath(category.slug)}
                        className="rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-navy transition hover:border-navy"
                      >
                        {category.name}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : mapView ? (
            <Suspense fallback={<div className="h-[28rem] animate-pulse rounded-2xl bg-surface-high" />}>
              <SearchResultsMap items={results.data?.items ?? []} />
            </Suspense>
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
