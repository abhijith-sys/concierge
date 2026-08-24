import { haversineKm } from "../../shared/domain/business.js";
import { serializeFieldValue } from "../../shared/domain/category-fields.js";
import { paginate } from "../../shared/utils/index.js";
import { searchRepository } from "./search.repository.js";
import type { SearchQuery, SuggestQuery } from "./search.schemas.js";

export type SearchSuggestion = {
  type: "business" | "category" | "query";
  label: string;
  slug?: string;
  id?: string;
  href?: string;
};

function listingsHref(q: string, city?: string) {
  const params = new URLSearchParams({ q });
  if (city) params.set("city", city);
  return `/listings?${params.toString()}`;
}

const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

function isOpenNow(hours: unknown, now = new Date()) {
  if (!hours || typeof hours !== "object" || Array.isArray(hours)) return false;
  const interval = (hours as Record<string, unknown>)[dayNames[now.getDay()]];
  if (
    !Array.isArray(interval) ||
    interval.length !== 2 ||
    interval.some((value) => typeof value !== "string")
  ) {
    return false;
  }
  const current = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  return current >= interval[0] && current <= interval[1];
}

type BusinessRow = Awaited<ReturnType<typeof searchRepository.findAllMatching>>[number] & {
  distanceKm?: number;
};

function sortBusinesses(businesses: BusinessRow[], query: SearchQuery) {
  const sort = query.sort ?? "relevance";
  const sorted = [...businesses];
  if (sort === "distance" && query.lat !== undefined && query.lng !== undefined) {
    return sorted.sort((a, b) => (a.distanceKm ?? Number.POSITIVE_INFINITY) - (b.distanceKm ?? Number.POSITIVE_INFINITY));
  }
  if (sort === "rating") {
    return sorted.sort((a, b) => (b.listing?.avgRating ?? 0) - (a.listing?.avgRating ?? 0));
  }
  return sorted.sort((a, b) => {
    const featured = Number(b.listing?.featured ?? false) - Number(a.listing?.featured ?? false);
    if (featured !== 0) return featured;
    const rating = (b.listing?.avgRating ?? 0) - (a.listing?.avgRating ?? 0);
    if (rating !== 0) return rating;
    return a.name.localeCompare(b.name);
  });
}

export const searchService = {
  async search(query: SearchQuery) {
    const where = searchRepository.buildWhere(query);
    const needsClientFilter = Boolean(query.open || (query.lat !== undefined && query.lng !== undefined) || query.sort === "distance");

    let items;
    let total;

    if (needsClientFilter) {
      let businesses: BusinessRow[] = await searchRepository.findAllMatching(where);
      if (query.open) {
        businesses = businesses.filter((business) => isOpenNow(business.listing?.hours));
      }
      if (query.lat !== undefined && query.lng !== undefined) {
        const radius = query.radiusKm ?? 10;
        businesses = businesses
          .map((business) => {
            const lat = business.listing?.lat;
            const lng = business.listing?.lng;
            const distanceKm =
              typeof lat === "number" && typeof lng === "number"
                ? haversineKm(query.lat!, query.lng!, lat, lng)
                : Number.POSITIVE_INFINITY;
            return { ...business, distanceKm };
          })
          .filter((business) => business.distanceKm <= radius);
      }
      businesses = sortBusinesses(businesses, query);
      total = businesses.length;
      const start = (query.page - 1) * query.pageSize;
      items = businesses.slice(start, start + query.pageSize);
    } else {
      const orderBy =
        query.sort === "rating"
          ? [{ listing: { avgRating: "desc" as const } }, { name: "asc" as const }]
          : searchRepository.orderBy;
      const skip = (query.page - 1) * query.pageSize;
      [items, total] = await Promise.all([
        searchRepository.findMany(where, skip, query.pageSize, orderBy),
        searchRepository.count(where),
      ]);
    }

    return {
      items: items.map((business) => ({
        ...business,
        listing: business.listing
          ? {
              ...business.listing,
              openNow: isOpenNow(business.listing.hours),
              fieldValues: business.listing.fieldValues.map(serializeFieldValue),
            }
          : business.listing,
      })),
      pagination: paginate(total, query.page, query.pageSize),
      filters: {
        q: query.q ?? null,
        city: query.city ?? null,
        category: query.category ?? null,
        subcategory: query.subcategory ?? null,
        rating: query.rating ?? null,
        open: query.open ?? false,
        verified: query.verified ?? false,
        lat: query.lat ?? null,
        lng: query.lng ?? null,
        radiusKm: query.lat !== undefined ? (query.radiusKm ?? 10) : null,
        kind: query.kind ?? null,
        sort: query.sort ?? "relevance",
      },
    };
  },

  async suggest(query: SuggestQuery) {
    const term = query.q.trim();
    const limit = query.limit ?? 8;
    const businessTake = Math.max(2, Math.ceil(limit * 0.5));
    const categoryTake = Math.max(1, Math.ceil(limit * 0.25));
    const listingTake = Math.max(1, limit - businessTake - categoryTake);

    const [businesses, listings, categories] = await Promise.all([
      searchRepository.suggestBusinesses(term, query.city, businessTake),
      searchRepository.suggestListingTitles(term, query.city, listingTake),
      searchRepository.suggestCategories(term, categoryTake),
    ]);

    const suggestions: SearchSuggestion[] = [];
    const seen = new Set<string>();

    for (const business of businesses) {
      const key = `business:${business.slug}`;
      if (seen.has(key)) continue;
      seen.add(key);
      suggestions.push({
        type: "business",
        label: business.name,
        slug: business.slug,
        id: business.id,
        href: `/business/${business.slug}`,
      });
    }

    for (const listing of listings) {
      const slug = listing.business.slug;
      const key = `listing:${slug}:${listing.title}`;
      if (seen.has(key) || seen.has(`business:${slug}`)) continue;
      seen.add(key);
      suggestions.push({
        type: "business",
        label: listing.title === listing.business.name ? listing.title : `${listing.business.name} — ${listing.title}`,
        slug,
        id: listing.business.id,
        href: `/business/${slug}`,
      });
    }

    for (const category of categories) {
      const key = `category:${category.slug}`;
      if (seen.has(key)) continue;
      seen.add(key);
      suggestions.push({
        type: "category",
        label: category.name,
        slug: category.slug,
        id: category.id,
        href: `/listings/${category.slug}`,
      });
    }

    suggestions.push({
      type: "query",
      label: `Search "${term}"`,
      href: listingsHref(term, query.city),
    });

    return { suggestions: suggestions.slice(0, limit + 1) };
  },
};
