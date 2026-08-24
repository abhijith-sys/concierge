import {
  PROFESSIONAL_CATEGORY_SLUG,
  PROFESSIONAL_SERVICE_SUBCATEGORY_SLUGS,
} from "../../config/constants.js";

const professionalServiceSlugs = new Set<string>([...PROFESSIONAL_SERVICE_SUBCATEGORY_SLUGS]);

export function isProfessionalRootSlug(slug?: string | null) {
  return slug === PROFESSIONAL_CATEGORY_SLUG;
}

/** True for CA / lawyers / consultants (not office supplies or print shops). */
export function isProfessionalServiceCategorySlug(slug?: string | null) {
  return Boolean(slug && professionalServiceSlugs.has(slug));
}

export const PROFESSIONAL_HIDDEN_PLATFORM_KEYS = new Set([
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

/** Strip these from office-supply / print forms under the professional root. */
export const PROFESSIONAL_VERTICAL_FIELD_KEYS = new Set([
  "service_hours",
  "practice_areas",
  "languages",
  "remote_available",
  "cancellation_policy",
  "engagement_type",
  "duration_hours",
  "price_hourly",
  "price_retainer",
  "price_project",
]);
