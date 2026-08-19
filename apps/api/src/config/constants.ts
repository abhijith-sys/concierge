export const AUTH_COOKIE_NAME = "concierge_session";
export const REFRESH_COOKIE_NAME = "concierge_refresh";
/** Short-lived access JWT. Refresh cookie keeps the session alive. */
export const ACCESS_TTL_SECONDS = 15 * 60;
export const REFRESH_TTL_SECONDS = 60 * 60 * 24 * 7;
export const RESET_TTL_SECONDS = 15 * 60;
export const OTP_TTL_SECONDS = 10 * 60;
/** @deprecated Use ACCESS_TTL_SECONDS. Kept so existing imports keep compiling. */
export const JWT_TTL_SECONDS = ACCESS_TTL_SECONDS;
export const SERVICE_NAME = "concierge-api";

/** Hidden from public category trees. Holds platform-wide common form fields. */
export const PLATFORM_CATEGORY_SLUG = "_platform";

/** Hotels / resorts / homestays marketplace vertical. */
export const STAY_CATEGORY_SLUG = "hotels-resorts-stays";
export const STAY_SUBCATEGORY_SLUGS = [
  "hotels",
  "resorts",
  "homestays",
  "villas",
  "serviced-apartments",
  "guest-houses",
  "hostels",
  "boutique-hotels",
  "farm-stays",
  "cottages",
  "camping-glamping",
] as const;
