import { haversineKm } from "../../shared/domain/business.js";
import { paginate } from "../../shared/utils/index.js";
import { searchRepository } from "./search.repository.js";
import type { SearchQuery } from "./search.schemas.js";

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

export const searchService = {
  async search(query: SearchQuery) {
    const where = searchRepository.buildWhere(query);
    const needsClientFilter = Boolean(query.open || (query.lat !== undefined && query.lng !== undefined));

    let items;
    let total;

    if (needsClientFilter) {
      let businesses = await searchRepository.findAllMatching(where);
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
          .filter((business) => business.distanceKm <= radius)
          .sort((a, b) => a.distanceKm - b.distanceKm);
      }
      total = businesses.length;
      const start = (query.page - 1) * query.pageSize;
      items = businesses.slice(start, start + query.pageSize);
    } else {
      [items, total] = await Promise.all([
        searchRepository.findMany(where, (query.page - 1) * query.pageSize, query.pageSize),
        searchRepository.count(where),
      ]);
    }

    return {
      items,
      pagination: paginate(total, query.page, query.pageSize),
      filters: {
        q: query.q ?? null,
        city: query.city ?? null,
        category: query.category ?? null,
        subcategory: query.subcategory ?? null,
        rating: query.rating ?? null,
        open: query.open ?? false,
        lat: query.lat ?? null,
        lng: query.lng ?? null,
        radiusKm: query.lat !== undefined ? (query.radiusKm ?? 10) : null,
      },
    };
  },
};
