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

/** Vehicle / equipment hire marketplace vertical (3-level: root → group → item). */
export const RENTAL_CATEGORY_SLUG = "rental-hire";
export const RENTAL_SUBCATEGORY_SLUGS = [
  "vehicle-rental",
  "electronics-rental",
  "event-equipment",
  "outdoor-travel",
  "tools-equipment",
  "furniture-rental",
  "car-rental",
  "bike-rental",
  "scooter-rental",
  "van-rental",
  "commercial-vehicle-rental",
  "camera-rental",
  "lens-rental",
  "drone-rental",
  "projector-rental",
  "laptop-rental",
  "speaker-rental",
  "event-chairs",
  "event-tables",
  "sound-systems",
  "event-lighting",
  "party-equipment",
  "camping-equipment",
  "trekking-equipment",
  "adventure-equipment",
  "power-tools",
  "construction-equipment",
  "generators",
  "agricultural-equipment",
  "home-furniture",
  "office-furniture",
  "event-furniture",
] as const;

/** Taxi / cab / airport / tour marketplace vertical. */
export const TRAVEL_CATEGORY_SLUG = "travel-taxi-transport";
export const TRAVEL_SUBCATEGORY_SLUGS = [
  "taxi-services",
  "cab-services",
  "airport-transfers",
  "outstation-taxi",
  "local-taxi",
  "bike-taxi",
  "auto-services",
  "bus-services",
  "tour-operators",
  "travel-agencies",
  "chauffeur-services",
] as const;

/** Event crews (organizers, photo, catering) — not jewellery / décor shops. */
export const EVENTS_CATEGORY_SLUG = "events-lifestyle";
export const EVENTS_SERVICE_SUBCATEGORY_SLUGS = [
  "event-organizers",
  "photographers",
  "videographers",
  "caterers",
  "wedding-services",
  "makeup-artists",
] as const;

/** Movers, courier, transport, security — not packing / scrap / fabricator shops. */
export const LOGISTICS_CATEGORY_SLUG = "logistics-other";
export const LOGISTICS_SERVICE_SUBCATEGORY_SLUGS = [
  "courier-services",
  "packers-movers",
  "transporters",
  "security-services",
] as const;

/** Coaching / tuition / training — not books & stationery shops. */
export const EDUCATION_CATEGORY_SLUG = "education-training";
export const EDUCATION_SERVICE_SUBCATEGORY_SLUGS = [
  "coaching",
  "tuition",
  "vocational-training",
  "language-training",
] as const;

/** Clinics / care / spa — not medical or wellness product shops. */
export const HEALTH_CATEGORY_SLUG = "health-wellness";
export const HEALTH_SERVICE_SUBCATEGORY_SLUGS = [
  "dentists",
  "hospitals",
  "clinics",
  "physiotherapy",
  "beauty-spa-wellness",
] as const;

/** CA / lawyers / consultants — not office supplies or print shops. */
export const PROFESSIONAL_CATEGORY_SLUG = "professional-business";
export const PROFESSIONAL_SERVICE_SUBCATEGORY_SLUGS = [
  "chartered-accountants",
  "lawyers",
  "tax-consultants",
  "digital-marketing",
  "business-consultants",
] as const;

/** Home trades — not electrical/plumbing/building materials shops. */
export const HOME_CATEGORY_SLUG = "home-property";
export const HOME_SERVICE_SUBCATEGORY_SLUGS = [
  "electricians",
  "plumbers",
  "ac-services",
  "interior-designers",
  "painting-contractors",
  "carpenter-services",
] as const;

/** Auto repair / wash / tow — not parts / tyres / battery shops. */
export const AUTOMOTIVE_CATEGORY_SLUG = "automotive";
export const AUTOMOTIVE_SERVICE_SUBCATEGORY_SLUGS = [
  "car-repair-services",
  "bike-repair-services",
  "car-wash-detailing",
  "vehicle-towing",
] as const;

/** Device / IT repair — not wholesale electronics shops. */
export const ELECTRONICS_CATEGORY_SLUG = "electronics-technology";
export const ELECTRONICS_SERVICE_SUBCATEGORY_SLUGS = [
  "computer-laptop-repair",
  "mobile-phone-repair",
  "cctv-services",
  "it-services",
  "electronics-repair",
] as const;
