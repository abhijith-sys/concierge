import { HEALTH_CATEGORY_SLUG, HEALTH_SERVICE_SUBCATEGORY_SLUGS } from "../../config/constants.js";

const healthServiceSlugs = new Set<string>([...HEALTH_SERVICE_SUBCATEGORY_SLUGS]);

export function isHealthRootSlug(slug?: string | null) {
  return slug === HEALTH_CATEGORY_SLUG;
}

/** True for dentists / clinics / spa (not medical or wellness product shops). */
export function isHealthServiceCategorySlug(slug?: string | null) {
  return Boolean(slug && healthServiceSlugs.has(slug));
}

export const HEALTH_HIDDEN_PLATFORM_KEYS = new Set([
  "emergency_service",
  "emergency_timing",
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

/** Strip these from medical / wellness product forms under the health root. */
export const HEALTH_VERTICAL_FIELD_KEYS = new Set([
  "service_hours",
  "specialties",
  "languages",
  "home_visit",
  "cancellation_policy",
  "treatment_type",
  "duration_minutes",
  "price_session",
  "price_package",
]);
