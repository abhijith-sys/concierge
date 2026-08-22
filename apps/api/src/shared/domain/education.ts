import { EDUCATION_CATEGORY_SLUG, EDUCATION_SERVICE_SUBCATEGORY_SLUGS } from "../../config/constants.js";

const educationServiceSlugs = new Set<string>([...EDUCATION_SERVICE_SUBCATEGORY_SLUGS]);

export function isEducationRootSlug(slug?: string | null) {
  return slug === EDUCATION_CATEGORY_SLUG;
}

/** True for coaching / tuition / training (not books & stationery shops). */
export function isEducationServiceCategorySlug(slug?: string | null) {
  return Boolean(slug && educationServiceSlugs.has(slug));
}

export const EDUCATION_HIDDEN_PLATFORM_KEYS = new Set([
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

/** Strip these from books & stationery forms under the education root. */
export const EDUCATION_VERTICAL_FIELD_KEYS = new Set([
  "service_hours",
  "subjects",
  "modes_offered",
  "languages",
  "cancellation_policy",
  "course_type",
  "duration_weeks",
  "batch_size",
  "session_hours",
  "price_hourly",
  "price_session",
  "price_course",
]);
