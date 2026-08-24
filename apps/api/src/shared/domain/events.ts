import { EVENTS_CATEGORY_SLUG, EVENTS_SERVICE_SUBCATEGORY_SLUGS } from "../../config/constants.js";

const eventServiceSlugs = new Set<string>([...EVENTS_SERVICE_SUBCATEGORY_SLUGS]);

export function isEventsRootSlug(slug?: string | null) {
  return slug === EVENTS_CATEGORY_SLUG;
}

/** True for event crews (not jewellery / décor / catering-supply shops). */
export function isEventServiceCategorySlug(slug?: string | null) {
  return Boolean(slug && eventServiceSlugs.has(slug));
}

export const EVENT_HIDDEN_PLATFORM_KEYS = new Set([
  "emergency_service",
  "emergency_timing",
  "home_visit",
  "order_modes",
  "min_order_qty",
  "sells_single_piece",
  "wholesale_available",
  "sample_available",
  "unit",
  "moq",
  "price_bulk",
  "price_piece",
  "lead_time_days",
  "custom_order",
]);

/** Strip these from jewellery / décor / catering-supply forms under the events root. */
export const EVENT_VERTICAL_FIELD_KEYS = new Set([
  "service_hours",
  "event_types",
  "travel_radius_km",
  "team_size",
  "languages",
  "cancellation_policy",
  "package_type",
  "duration_hours",
  "guest_capacity",
  "package_includes",
  "crew_count",
  "price_hourly",
  "price_day",
]);
