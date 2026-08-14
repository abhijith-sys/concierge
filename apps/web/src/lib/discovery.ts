import type { Category, Listing } from "./api";

const CITY_KEY = "concierge_city";
const VIEWED_KEY = "concierge_recent_listings";
const EXPLORED_KEY = "concierge_explored_categories";
const COORDS_KEY = "concierge_coords";

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore private-mode storage failures.
  }
}

export function getSavedCity() {
  try {
    return localStorage.getItem(CITY_KEY) ?? "";
  } catch {
    return "";
  }
}

export function setSavedCity(city: string) {
  try {
    const next = city.trim();
    if (next) localStorage.setItem(CITY_KEY, next);
    else localStorage.removeItem(CITY_KEY);
  } catch {
    // Ignore private-mode storage failures.
  }
}

export function getSavedCoords(): { lat: number; lng: number } | null {
  const value = readJson<{ lat: number; lng: number } | null>(COORDS_KEY, null);
  if (!value || typeof value.lat !== "number" || typeof value.lng !== "number") return null;
  return value;
}

export function setSavedCoords(coords: { lat: number; lng: number } | null) {
  if (!coords) {
    try {
      localStorage.removeItem(COORDS_KEY);
    } catch {
      // Ignore private-mode storage failures.
    }
    return;
  }
  writeJson(COORDS_KEY, coords);
}

export function getRecentListings(): Listing[] {
  return readJson<Listing[]>(VIEWED_KEY, []).filter((item) => item?.id);
}

export function recordRecentListing(listing: Listing) {
  const next = [listing, ...getRecentListings().filter((item) => item.id !== listing.id)].slice(0, 8);
  writeJson(VIEWED_KEY, next);
}

export function getExploredCategories(): Array<Pick<Category, "name" | "slug">> {
  return readJson<Array<Pick<Category, "name" | "slug">>>(EXPLORED_KEY, []).filter(
    (item) => item?.slug && item?.name,
  );
}

export function recordExploredCategory(category: Pick<Category, "name" | "slug">) {
  const next = [
    category,
    ...getExploredCategories().filter((item) => item.slug !== category.slug),
  ].slice(0, 8);
  writeJson(EXPLORED_KEY, next);
}

export function formatDistanceKm(km?: number | null) {
  if (typeof km !== "number" || !Number.isFinite(km)) return null;
  return `${km < 10 ? km.toFixed(1) : Math.round(km)} km`;
}
