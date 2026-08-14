import { useQuery } from "@tanstack/react-query";
import { MapPin } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  BecomeProviderSection,
  CategoryQuickNav,
  ConciergeEliteSection,
  HeroSection,
  HowItWorks,
  IndustryGrid,
  ProviderCarousel,
  RecommendedSection,
} from "../components/home";
import { api } from "../lib/api";
import { popularSubcategories } from "../lib/category-tree";
import {
  getExploredCategories,
  getRecentListings,
  getSavedCity,
  getSavedCoords,
  setSavedCity,
  setSavedCoords,
} from "../lib/discovery";

export function Home() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [city, setCity] = useState(getSavedCity);
  const [coords, setCoords] = useState(getSavedCoords);
  const explored = getExploredCategories();
  const recent = getRecentListings();

  const categories = useQuery({ queryKey: ["categories"], queryFn: api.categories });
  const mains = categories.data ?? [];
  const popularSearches = useMemo(() => popularSubcategories(mains), [mains]);

  const nearbyParams = useMemo(() => {
    const params = new URLSearchParams({ pageSize: "8" });
    if (city.trim()) params.set("city", city.trim());
    if (coords) {
      params.set("lat", String(coords.lat));
      params.set("lng", String(coords.lng));
    }
    return params;
  }, [city, coords]);

  const popular = useQuery({
    queryKey: ["search", "popular", nearbyParams.toString()],
    queryFn: async () => {
      const result = await api.search(nearbyParams);
      if (result.items.length || !nearbyParams.get("city")) return result;
      const fallback = new URLSearchParams({ pageSize: "8" });
      if (coords) {
        fallback.set("lat", String(coords.lat));
        fallback.set("lng", String(coords.lng));
      }
      return api.search(fallback);
    },
  });

  const recommendedParams = useMemo(() => {
    const params = new URLSearchParams({ pageSize: "8" });
    if (explored[0]?.slug) params.set("category", explored[0].slug);
    if (city.trim()) params.set("city", city.trim());
    return params;
  }, [explored, city]);

  const recommended = useQuery({
    queryKey: ["recommendations", recommendedParams.toString()],
    queryFn: () => api.recommendations(recommendedParams),
    enabled: explored.length > 0 && recent.length === 0,
  });

  const recommendedListings = recent.length ? recent : (recommended.data?.items ?? []);
  const nearbyCity = city.trim() || popular.data?.items.find((item) => item.city)?.city;

  function submit(event: FormEvent) {
    event.preventDefault();
    setSavedCity(city);
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (city.trim()) params.set("city", city.trim());
    navigate(`/listings?${params.toString()}`);
  }

  function useLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((position) => {
      const next = { lat: position.coords.latitude, lng: position.coords.longitude };
      setSavedCoords(next);
      setCoords(next);
    });
  }

  return (
    <>
      <HeroSection
        city={city}
        query={query}
        categories={mains}
        categoriesLoading={categories.isLoading}
        popularSearches={popularSearches}
        onCityChange={setCity}
        onQueryChange={setQuery}
        onSubmit={submit}
        onUseLocation={useLocation}
      />
      <CategoryQuickNav categories={mains} loading={categories.isLoading} error={categories.isError} />
      <ProviderCarousel
        title="Popular near you"
        subtitle={
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="size-4 text-gold-dark" aria-hidden="true" />
            {nearbyCity || "Featured partners"}
          </span>
        }
        listings={popular.data?.items ?? []}
        loading={popular.isLoading}
        error={popular.isError}
        empty="No popular listings yet. Explore the directory to get started."
        viewAllTo={city.trim() ? `/listings?city=${encodeURIComponent(city.trim())}` : "/listings"}
      />
      <IndustryGrid categories={mains} loading={categories.isLoading} />
      <RecommendedSection
        categories={explored}
        listings={recommendedListings}
        loading={Boolean(explored.length && !recent.length && recommended.isLoading)}
        error={recommended.isError}
      />
      <HowItWorks />
      <BecomeProviderSection />
      <ConciergeEliteSection />
    </>
  );
}
