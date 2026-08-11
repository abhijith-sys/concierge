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
    let items;
    let total;

    if (query.open) {
      const businesses = await searchRepository.findAllMatching(where);
      const filtered = businesses.filter((business) => isOpenNow(business.listing?.hours));
      total = filtered.length;
      const start = (query.page - 1) * query.pageSize;
      items = filtered.slice(start, start + query.pageSize);
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
        rating: query.rating ?? null,
        open: query.open ?? false,
      },
    };
  },
};
