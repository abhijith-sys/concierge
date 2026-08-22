import { BusinessStatus, Prisma, PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { existsSync } from "node:fs";
import path from "node:path";
import { assignDefaultRoleForLegacy, ensureRbacCatalog } from "../src/shared/auth/rbac.service.js";
import {
  PLATFORM_CATEGORY_SLUG,
  demoBusinessCategoryMap,
  exampleSubcategoryFields,
  healthWellnessFields,
  phase1Mains,
  phase1Subs,
  platformListingFields,
  platformProviderFields,
  rentalHireListingFields,
  rentalVendorFields,
  stayPropertyFields,
  stayRoomFields,
  travelOperatorFields,
  travelVehicleFields,
  eventVendorFields,
  eventPackageFields,
  logisticsVendorFields,
  logisticsOfferingFields,
  educationVendorFields,
  educationCourseFields,
  healthVendorFields,
  healthServiceFields,
  professionalVendorFields,
  professionalServiceFields,
  homeTradeVendorFields,
  homeTradePackageFields,
  autoTradeVendorFields,
  autoTradePackageFields,
  electronicsTradeVendorFields,
  electronicsTradePackageFields,
  type FieldSeed,
} from "./taxonomy.js";

dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });
dotenv.config();

const prisma = new PrismaClient();
const DEMO_PASSWORD = "Concierge123!";

const listingImages = {
  electrical: "/assets/listings/electrical-shop.jpg",
  plumbing: "/assets/listings/plumbing.jpg",
  furniture: "/assets/listings/furniture.jpg",
  garments: "/assets/listings/garments.jpg",
  electrician: "/assets/listings/electrician.jpg",
  home: "/assets/categories/home-property.jpg",
  fashion: "/assets/categories/fashion-apparel.jpg",
  electronics: "/assets/categories/electronics-technology.jpg",
  logistics: "/assets/categories/logistics-other.jpg",
} as const;

const stayPhotos = {
  stay: "/assets/categories/hotels-resorts-stays.jpg",
  stayBanner: "/assets/categories/hotels-resorts-stays-banner.jpg",
  home: "/assets/categories/home-property.jpg",
  homeBanner: "/assets/categories/home-property-banner.jpg",
  wellness: "/assets/categories/health-wellness.jpg",
  wellnessBanner: "/assets/categories/health-wellness-banner.jpg",
  education: "/assets/categories/education-training.jpg",
  educationBanner: "/assets/categories/education-training-banner.jpg",
  professional: "/assets/categories/professional-business.jpg",
  professionalBanner: "/assets/categories/professional-business-banner.jpg",
  events: "/assets/categories/events-lifestyle.jpg",
  eventsBanner: "/assets/categories/events-lifestyle-banner.jpg",
  furniture: "/assets/listings/furniture.jpg",
} as const;

const rentalPhotos = {
  hire: "/assets/categories/rental-hire.jpg",
  hireBanner: "/assets/categories/rental-hire-banner.jpg",
  auto: "/assets/categories/automotive.jpg",
  autoBanner: "/assets/categories/automotive-banner.jpg",
  electronics: "/assets/categories/electronics-technology.jpg",
  electronicsBanner: "/assets/categories/electronics-technology-banner.jpg",
  events: "/assets/categories/events-lifestyle.jpg",
  eventsBanner: "/assets/categories/events-lifestyle-banner.jpg",
  travel: "/assets/categories/travel-taxi-transport.jpg",
  furniture: "/assets/listings/furniture.jpg",
} as const;

type DemoCatalogItem = {
  name: string;
  description: string;
  price: number;
  pricingType?: string;
  images: string[];
  fields?: Record<string, string | number | boolean>;
};

function hireItem(
  name: string,
  description: string,
  price: number,
  images: string[],
  fields: Record<string, string | number | boolean>,
): DemoCatalogItem {
  return {
    name,
    description,
    price,
    pricingType: "daily",
    images,
    fields: {
      rental_availability: "Available",
      item_status: "Active",
      ...fields,
    },
  };
}

function travelVehicle(
  name: string,
  description: string,
  price: number,
  images: string[],
  fields: Record<string, string | number | boolean>,
): DemoCatalogItem {
  return {
    name,
    description,
    price,
    pricingType: "hourly",
    images,
    fields: {
      ac: true,
      ...fields,
    },
  };
}

function eventPackage(
  name: string,
  description: string,
  price: number,
  images: string[],
  fields: Record<string, string | number | boolean>,
): DemoCatalogItem {
  return {
    name,
    description,
    price,
    pricingType: "daily",
    images,
    fields: {
      crew_count: 1,
      ...fields,
    },
  };
}

function logisticsOffering(
  name: string,
  description: string,
  price: number,
  images: string[],
  fields: Record<string, string | number | boolean>,
): DemoCatalogItem {
  return {
    name,
    description,
    price,
    pricingType: "hourly",
    images,
    fields: {
      vehicle_count: 1,
      ...fields,
    },
  };
}

function educationCourse(
  name: string,
  description: string,
  price: number,
  images: string[],
  fields: Record<string, string | number | boolean>,
): DemoCatalogItem {
  return {
    name,
    description,
    price,
    pricingType: "daily",
    images,
    fields: {
      ...fields,
    },
  };
}

function healthTreatment(
  name: string,
  description: string,
  price: number,
  images: string[],
  fields: Record<string, string | number | boolean>,
): DemoCatalogItem {
  return {
    name,
    description,
    price,
    pricingType: "hourly",
    images,
    fields: {
      ...fields,
    },
  };
}

function professionalEngagement(
  name: string,
  description: string,
  price: number,
  images: string[],
  fields: Record<string, string | number | boolean>,
): DemoCatalogItem {
  return {
    name,
    description,
    price,
    pricingType: "hourly",
    images,
    fields: {
      ...fields,
    },
  };
}

function tradePackage(
  name: string,
  description: string,
  price: number,
  images: string[],
  fields: Record<string, string | number | boolean>,
): DemoCatalogItem {
  return {
    name,
    description,
    price,
    pricingType: "hourly",
    images,
    fields: {
      ...fields,
    },
  };
}

type DemoBusiness = {
  name: string;
  slug: string;
  category: string;
  city: string;
  address: string;
  headline?: string;
  description: string;
  lat: number;
  lng: number;
  images: string[];
  years?: number;
  supportTurnaround?: string;
  whatsapp?: string;
  orderModes?: string[];
  minOrderQty?: number;
  sellsSinglePiece?: boolean;
  wholesale?: boolean;
  catalog?: DemoCatalogItem[];
  stayFields?: Record<string, string | number | boolean | string[]>;
  rentalFields?: Record<string, string | number | boolean | string[]>;
  travelFields?: Record<string, string | number | boolean | string[]>;
  eventFields?: Record<string, string | number | boolean | string[]>;
  logisticsFields?: Record<string, string | number | boolean | string[]>;
  educationFields?: Record<string, string | number | boolean | string[]>;
  healthFields?: Record<string, string | number | boolean | string[]>;
  professionalFields?: Record<string, string | number | boolean | string[]>;
  homeFields?: Record<string, string | number | boolean | string[]>;
  autoFields?: Record<string, string | number | boolean | string[]>;
  electronicsFields?: Record<string, string | number | boolean | string[]>;
};

const businesses: DemoBusiness[] = [
  {
    name: "Elite Build & Masonry",
    slug: "elite-build-masonry",
    category: "fabricators",
    city: "New York",
    address: "150 Madison Avenue, New York, NY",
    headline: "Artistry in Every Atom.",
    description:
      "Architectural materials for luxury homes and commercial envelopes. Bulk slab reservations, made-to-order panels, and single-piece samples.",
    lat: 40.7458,
    lng: -73.9847,
    images: [listingImages.logistics, listingImages.home],
    years: 30,
    whatsapp: "+1 212 555 0100",
    orderModes: ["Bulk", "By order", "Single piece"],
    minOrderQty: 1,
    sellsSinglePiece: true,
    wholesale: true,
    catalog: [
      {
        name: "Calacatta Borghini Selection",
        description: "Imported from Carrara, Italy",
        price: 0,
        pricingType: "contact",
        images: [listingImages.home],
        fields: {
          availability_qty: "42 Slabs",
          thickness: "20mm / 30mm",
          finish: "Polished",
          unit: "slab",
          moq: 1,
          custom_order: true,
        },
      },
      {
        name: "Engineered Timber",
        description: "Sustainable European Oak & Walnut",
        price: 0,
        pricingType: "contact",
        images: [listingImages.furniture],
        fields: { selection_note: "12 Variants", unit: "sqm", moq: 20 },
      },
      {
        name: "Architectural Steel",
        description: "Custom Beams & Facade Panels",
        price: 0,
        pricingType: "contact",
        images: [listingImages.logistics],
        fields: { selection_note: "4 Finishes", unit: "piece", custom_order: true },
      },
      {
        name: "Structural Glass",
        description: "High-Performance Thermal Glazing",
        price: 0,
        pricingType: "contact",
        images: [listingImages.electronics],
        fields: { selection_note: "Ultra-Clear", unit: "panel" },
      },
    ],
  },
  {
    name: "Volt & Wire Electrical",
    slug: "volt-wire-electrical",
    category: "wires-cables",
    city: "New York",
    address: "410 Queens Boulevard, New York, NY",
    headline: "Best-rate electrical supplies, any quantity.",
    description:
      "Wholesale electrical shop for contractors and homeowners. Cables, switchgear, lighting, and panels — bulk coils, project orders, or a single piece at trade rates.",
    lat: 40.735,
    lng: -73.877,
    images: [listingImages.electrical, listingImages.electronics],
    years: 18,
    whatsapp: "+1 718 555 0142",
    orderModes: ["Bulk", "By order", "Single piece"],
    minOrderQty: 1,
    sellsSinglePiece: true,
    wholesale: true,
    catalog: [
      {
        name: "Copper building wire 2.5mm",
        description: "ISI copper conductor, 90m coil or cut length.",
        price: 42,
        pricingType: "starting_from",
        images: [listingImages.electrical],
        fields: { brand: "Havells", unit: "coil", moq: 1, price_bulk: 38, price_piece: 42, lead_time_days: 0 },
      },
      {
        name: "Modular switch range",
        description: "16A switches and sockets. Box or single piece.",
        price: 2.4,
        pricingType: "starting_from",
        images: [listingImages.electronics],
        fields: { brand: "Legrand", unit: "piece", moq: 10, price_bulk: 1.9, price_piece: 2.4, lead_time_days: 2 },
      },
      {
        name: "LED panel lights 18W",
        description: "Trade packs of 20 or single replacements.",
        price: 9.5,
        pricingType: "starting_from",
        images: [listingImages.electrical],
        fields: { brand: "Philips", unit: "piece", moq: 4, price_bulk: 7.8, price_piece: 9.5 },
      },
    ],
  },
  {
    name: "AquaFlow Plumbing Supplies",
    slug: "terra-stone-collective",
    category: "pipes-fittings",
    city: "New York",
    address: "210 West 18th Street, New York, NY",
    headline: "Pipes, fittings, and sanitary ware at trade rates.",
    description:
      "Plumbing wholesaler for fit-outs and repairs. CPVC, PVC, valves, and bathroom fittings in bulk, on-order, or as single replacements.",
    lat: 40.7411,
    lng: -74.0002,
    images: [listingImages.plumbing, listingImages.home],
    years: 14,
    whatsapp: "+1 212 555 0188",
    orderModes: ["Bulk", "By order", "Single piece"],
    minOrderQty: 1,
    sellsSinglePiece: true,
    wholesale: true,
    catalog: [
      {
        name: "CPVC pipe 3/4 inch",
        description: "3m lengths. Bundle of 10 or single stick.",
        price: 6.2,
        pricingType: "starting_from",
        images: [listingImages.plumbing],
        fields: { brand: "Astral", unit: "length", moq: 1, price_bulk: 5.4, price_piece: 6.2 },
      },
      {
        name: "Brass ball valves",
        description: "Quarter-turn valves, 1/2 to 2 inch.",
        price: 4.8,
        pricingType: "starting_from",
        images: [listingImages.plumbing],
        fields: { brand: "Jaquar", unit: "piece", moq: 5, price_bulk: 3.9, price_piece: 4.8 },
      },
    ],
  },
  {
    name: "Hudson Cement Depot",
    slug: "hudson-cement-depot",
    category: "cement",
    city: "New York",
    address: "55 Varick Street, New York, NY",
    headline: "Bagged cement and binders for site pours.",
    description:
      "Cement wholesaler for contractors and renovation crews. OPC and PPC bags from major mills — pallet lots, project orders, or a few bags for punch-list work.",
    lat: 40.7245,
    lng: -74.0058,
    images: [listingImages.home, listingImages.logistics],
    years: 16,
    whatsapp: "+1 212 555 0195",
    orderModes: ["Bulk", "By order", "Single piece"],
    minOrderQty: 10,
    sellsSinglePiece: true,
    wholesale: true,
    catalog: [
      {
        name: "OPC 53 grade — 50kg",
        description: "High-early strength for slabs and columns.",
        price: 8.4,
        pricingType: "starting_from",
        images: [listingImages.home],
        fields: { brand: "UltraTech", unit: "bag", moq: 10, price_bulk: 7.6, price_piece: 8.4 },
      },
      {
        name: "PPC cement — 50kg",
        description: "General construction blend for plaster and masonry.",
        price: 7.9,
        pricingType: "starting_from",
        images: [listingImages.logistics],
        fields: { brand: "ACC", unit: "bag", moq: 10, price_bulk: 7.1, price_piece: 7.9 },
      },
      {
        name: "Composite cement — 50kg",
        description: "Durable blend for foundations and retaining walls.",
        price: 8.1,
        pricingType: "starting_from",
        images: [listingImages.home],
        fields: { brand: "Ambuja", unit: "bag", moq: 20, price_bulk: 7.3, price_piece: 8.1 },
      },
      {
        name: "Rapid-set cement — 50kg",
        description: "Fast setting for repairs and cold-weather pours.",
        price: 9.2,
        pricingType: "starting_from",
        images: [listingImages.logistics],
        fields: { brand: "Dalmia", unit: "bag", moq: 10, price_bulk: 8.4, price_piece: 9.2 },
      },
    ],
  },
  {
    name: "Aura Interior & Furniture",
    slug: "aura-interior-furniture",
    category: "home-decor",
    city: "New York",
    address: "88 Wooster Street, New York, NY",
    headline: "Home décor wholesale for living and hospitality.",
    description:
      "A curated sanctuary of artisanal décor, lighting, and furniture. Project lots for interiors houses, or a single statement piece.",
    lat: 40.723,
    lng: -74.0017,
    images: [listingImages.furniture, listingImages.home],
    years: 12,
    whatsapp: "+1 212 555 0164",
    orderModes: ["Bulk", "By order", "Single piece"],
    sellsSinglePiece: true,
    wholesale: true,
    catalog: [
      {
        name: "Artisan lounge chair",
        description: "Hand-finished oak frame with linen upholstery.",
        price: 420,
        pricingType: "starting_from",
        images: [listingImages.furniture],
        fields: { unit: "piece", moq: 1, price_bulk: 360, price_piece: 420, custom_order: true, lead_time_days: 21 },
      },
      {
        name: "Ceramic table lamp set",
        description: "Trade carton of 6, or single showroom piece.",
        price: 85,
        pricingType: "starting_from",
        images: [listingImages.furniture],
        fields: { unit: "piece", moq: 1, price_bulk: 68, price_piece: 85 },
      },
    ],
  },
  {
    name: "Loom & Thread Garments",
    slug: "brett-architects-builders",
    category: "clothing-men",
    city: "Brooklyn",
    address: "45 Main Street, Brooklyn, NY",
    headline: "Apparel wholesale, uniforms, and fabrics.",
    description:
      "Garment supplier for retailers, hotels, and workwear buyers. Full lots, made-to-order uniforms, or sample pieces at published rates.",
    lat: 40.7033,
    lng: -73.9903,
    images: [listingImages.garments, listingImages.fashion],
    years: 9,
    whatsapp: "+1 347 555 0119",
    orderModes: ["Bulk", "By order", "Single piece"],
    minOrderQty: 12,
    sellsSinglePiece: true,
    wholesale: true,
    catalog: [
      {
        name: "Cotton work shirts",
        description: "Sizes S–XXL. Dozen packs or sample.",
        price: 14,
        pricingType: "starting_from",
        images: [listingImages.garments],
        fields: { brand: "Dickies", unit: "piece", moq: 12, price_bulk: 11, price_piece: 16, lead_time_days: 7 },
      },
      {
        name: "Hotel linen uniforms",
        description: "Made-to-order sets with embroidery.",
        price: 0,
        pricingType: "contact",
        images: [listingImages.fashion],
        fields: { brand: "Cintas", unit: "set", custom_order: true, lead_time_days: 18 },
      },
    ],
  },
  {
    name: "Stride Wholesale Footwear",
    slug: "arcadian-structures",
    category: "shoes",
    city: "Scottsdale",
    address: "7200 East Camelback Road, Scottsdale, AZ",
    headline: "Footwear lots for retailers and job sites.",
    description:
      "Shoes and safety footwear at trade rates. Case packs for stores, or a single pair when you need a replacement fast.",
    lat: 33.5021,
    lng: -111.9261,
    images: [listingImages.fashion, listingImages.garments],
    years: 11,
    whatsapp: "+1 480 555 0177",
    orderModes: ["Bulk", "Single piece"],
    minOrderQty: 1,
    sellsSinglePiece: true,
    wholesale: true,
    catalog: [
      {
        name: "Safety boots S3",
        description: "Steel toe, oil-resistant sole. Pair or carton of 8.",
        price: 48,
        pricingType: "starting_from",
        images: [listingImages.fashion],
        fields: { unit: "pair", moq: 1, price_bulk: 39, price_piece: 48 },
      },
      {
        name: "Everyday canvas sneakers",
        description: "Assorted sizes, mixed carton or sample pair.",
        price: 18,
        pricingType: "starting_from",
        images: [listingImages.garments],
        fields: { unit: "pair", moq: 6, price_bulk: 14, price_piece: 18 },
      },
    ],
  },
  {
    name: "Metro Line Electricians",
    slug: "heritage-artisan-group",
    category: "electricians",
    city: "New York",
    address: "12 East 74th Street, New York, NY",
    headline: "Licensed electricians for install and repair.",
    description:
      "Residential and commercial electrical work — wiring, lighting, and switchboards. Second-priority trade listing when you need a technician, not a shop.",
    lat: 40.7731,
    lng: -73.9652,
    images: [listingImages.electrician],
    years: 16,
    supportTurnaround: "24h",
    catalog: [
      {
        name: "Site visit & wiring repair",
        description: "Licensed electrician callout for diagnostics and repair.",
        price: 120,
        pricingType: "starting_from",
        images: [listingImages.electrician],
      },
    ],
  },
  {
    name: "Mist Valley Resorts",
    slug: "mist-valley-resorts",
    category: "resorts",
    city: "Munnar",
    address: "Old Munnar Road, Munnar, Kerala",
    headline: "Valley cottages, pool, and campfire nights.",
    description:
      "A hillside resort with valley-facing cottages and hotel rooms. Breakfast is included, couples are welcome, and the team can arrange pickup from Munnar town. Evenings usually end at the campfire with tea and local snacks.\n\nThe property sits above the tea estates, about fifteen minutes from town. Guests come for quiet stays, family weekends, and small gatherings. Rooms are listed separately so you can compare rates, occupancy, and photos before you enquire.",
    lat: 10.0889,
    lng: 77.0595,
    images: [stayPhotos.stay, stayPhotos.stayBanner, stayPhotos.home],
    years: 12,
    whatsapp: "+91 484 555 0190",
    stayFields: {
      check_in_time: "14:00",
      check_out_time: "11:00",
      min_stay_nights: 1,
      meals: ["Breakfast included"],
      breakfast_included: true,
      amenities_highlighted: [
        "Parking",
        "Bonfire",
        "Indoor Games",
        "Restaurant",
        "Swimming Pool",
        "Breakfast included",
        "Couple friendly",
      ],
      amenities_basic: ["Parking", "Swimming Pool", "Power Backup", "Housekeeping", "Room Service", "WiFi", "Play area"],
      amenities_services: ["Concierge", "Luggage Assistance", "Pickup & drop", "Pool/Beach towels"],
      amenities_wellness: ["First-aid Services"],
      couples_allowed: true,
      pets_allowed: false,
      extra_bed_available: true,
      extra_bed_rate: 1200,
      other_activities: ["Trekking", "Bonfire", "Guided tours"],
      cancellation_policy: "Moderate",
      nearest_landmark: "12 minutes from Munnar town",
      whatsapp: "+91 484 555 0190",
    },
    catalog: [
      {
        name: "Valley View Cottage",
        description: "Private cottage with a sit-out, king bed, and valley view. Ideal for couples.",
        price: 8500,
        pricingType: "daily",
        images: [stayPhotos.stay, stayPhotos.stayBanner, stayPhotos.homeBanner, stayPhotos.events],
        fields: {
          room_type: "Cottage",
          occupancy_adults: 2,
          occupancy_children: 1,
          bed_type: "King",
          room_size_sqft: 420,
          room_count: 6,
          room_facilities: [
            "Coffee Machine",
            "Dental Kit",
            "Geyser/Water Heater",
            "Toiletries",
            "Work Desk",
            "Air conditioning",
            "TV",
            "WiFi",
            "Balcony",
            "Hot water",
            "Mountain view",
          ],
          rate_weekday: 8500,
          rate_weekend: 9800,
          rate_extra_person: 1500,
          rate_extra_bed: 1200,
        },
      },
      {
        name: "Deluxe Room",
        description: "Hotel-style deluxe room with garden view and attached bath.",
        price: 5200,
        pricingType: "daily",
        images: [stayPhotos.stayBanner, stayPhotos.home, stayPhotos.wellness, stayPhotos.furniture],
        fields: {
          room_type: "Deluxe Room",
          occupancy_adults: 2,
          occupancy_children: 1,
          bed_type: "Queen",
          room_size_sqft: 280,
          room_count: 10,
          room_facilities: ["Air conditioning", "TV", "WiFi", "Hot water", "Geyser/Water Heater", "Toiletries", "Garden view"],
          rate_weekday: 5200,
          rate_weekend: 6200,
          rate_extra_person: 1200,
        },
      },
      {
        name: "Family Suite",
        description: "Two-room suite with extra bedding for families. Pool-facing sit-out.",
        price: 12500,
        pricingType: "daily",
        images: [stayPhotos.home, stayPhotos.eventsBanner, stayPhotos.stay, stayPhotos.wellnessBanner],
        fields: {
          room_type: "Suite",
          occupancy_adults: 4,
          occupancy_children: 2,
          bed_type: "Multiple",
          room_size_sqft: 680,
          room_count: 3,
          room_facilities: [
            "Coffee Machine",
            "Toiletries",
            "Air Purifier",
            "Work Desk",
            "Air conditioning",
            "TV",
            "WiFi",
            "Balcony",
            "Mini fridge",
            "Pool view",
          ],
          rate_weekday: 12500,
          rate_weekend: 14500,
          rate_extra_person: 1800,
          rate_extra_bed: 1200,
        },
      },
    ],
  },
  {
    name: "Tea Garden Homestay",
    slug: "tea-garden-homestay",
    category: "homestays",
    city: "Munnar",
    address: "Lockhart Gap Road, Munnar, Kerala",
    headline: "A family homestay among the tea gardens.",
    description:
      "Stay with a local family in a garden cottage. Home-cooked meals, a play area for children, and pets are welcome. Pickup from Munnar bus stand is available on request.\n\nThe house looks over a working tea estate. Hosts help with short walks, taxi plans, and simple Kerala meals. Enquire with your dates and the rooms you want — they reply directly.",
    lat: 10.0794,
    lng: 77.0469,
    images: [stayPhotos.stay, stayPhotos.home, stayPhotos.homeBanner],
    years: 7,
    whatsapp: "+91 484 555 0177",
    stayFields: {
      check_in_time: "13:00",
      check_out_time: "11:00",
      min_stay_nights: 1,
      meals: ["Breakfast included", "Dinner"],
      breakfast_included: true,
      amenities_highlighted: ["Parking", "Bonfire", "Breakfast included", "Couple friendly", "Pet friendly"],
      amenities_basic: ["Parking", "Housekeeping", "Newspaper", "WiFi", "Garden", "Play area"],
      amenities_services: ["Caretaker", "Pickup & drop", "Luggage Assistance"],
      amenities_wellness: ["First-aid Services"],
      couples_allowed: true,
      pets_allowed: true,
      extra_bed_available: true,
      extra_bed_rate: 800,
      other_activities: ["Trekking", "Bonfire", "Kids activities"],
      cancellation_policy: "Flexible",
      nearest_landmark: "Near Lockhart Gap viewpoint",
      whatsapp: "+91 484 555 0177",
    },
    catalog: [
      {
        name: "Garden Cottage",
        description: "Standalone cottage with a small sit-out and garden. Sleeps two adults and a child.",
        price: 3800,
        pricingType: "daily",
        images: [stayPhotos.home, stayPhotos.homeBanner, stayPhotos.events, stayPhotos.stay],
        fields: {
          room_type: "Cottage",
          occupancy_adults: 2,
          occupancy_children: 1,
          bed_type: "Double",
          room_size_sqft: 260,
          room_count: 2,
          room_facilities: ["WiFi", "Hot water", "Geyser/Water Heater", "Toiletries", "Garden view", "Private bathroom"],
          rate_weekday: 3800,
          rate_weekend: 4500,
          rate_extra_person: 800,
        },
      },
      {
        name: "Family Room",
        description: "Larger room in the main house with extra bedding for families.",
        price: 4600,
        pricingType: "daily",
        images: [stayPhotos.stay, stayPhotos.furniture, stayPhotos.wellness, stayPhotos.homeBanner],
        fields: {
          room_type: "Family Room",
          occupancy_adults: 3,
          occupancy_children: 2,
          bed_type: "Multiple",
          room_size_sqft: 340,
          room_count: 1,
          room_facilities: ["TV", "WiFi", "Hot water", "Toiletries", "Work Desk", "Mountain view"],
          rate_weekday: 4600,
          rate_weekend: 5400,
          rate_extra_bed: 800,
        },
      },
    ],
  },
  {
    name: "Hudson Drive Hire",
    slug: "hudson-drive-hire",
    category: "car-rental",
    city: "New York",
    address: "410 11th Avenue, New York, NY",
    headline: "Self-drive cars for the city, airports, and weekends away.",
    description:
      "Insured compact cars, SUVs, and vans with same-day pickup from Hell’s Kitchen. Delivery to JFK, LGA, and Manhattan hotels is available. Bring a driving licence — a refundable deposit is held until return.\n\nEach vehicle is listed with hourly and daily rates, stock, and where to collect it. Tick the cars you want, add dates, and the shop replies directly.",
    lat: 40.7602,
    lng: -74.0021,
    images: [rentalPhotos.hire, rentalPhotos.auto, rentalPhotos.autoBanner, rentalPhotos.travel],
    years: 11,
    whatsapp: "+1 212 555 0144",
    rentalFields: {
      pickup_hours: "7:00 AM – 9:00 PM",
      delivery_available: true,
      delivery_radius_km: 25,
      delivery_fee: 45,
      id_proof_required: true,
      damage_policy: "Refundable security deposit. Return with the same fuel level. Accidental damage is billed after inspection.",
      cancellation_policy: "Moderate",
      whatsapp: "+1 212 555 0144",
    },
    catalog: [
      hireItem(
        "Toyota Corolla — compact sedan",
        "Automatic, Apple CarPlay, reverse camera. Easy for Midtown and airport runs.",
        89,
        [rentalPhotos.auto, rentalPhotos.autoBanner, rentalPhotos.travel, rentalPhotos.hire],
        {
          quantity: 6,
          price_hourly: 18,
          price_daily: 89,
          price_weekly: 499,
          security_deposit: 400,
          min_rental_duration: "4 hours",
          max_rental_duration: "30 days",
          rental_location: "11th Avenue lot or hotel delivery",
        },
      ),
      hireItem(
        "Honda CR-V — compact SUV",
        "5 seats, cargo room for weekend bags. All-wheel drive for wet weather.",
        129,
        [rentalPhotos.autoBanner, rentalPhotos.hireBanner, rentalPhotos.travel, rentalPhotos.auto],
        {
          quantity: 4,
          price_hourly: 24,
          price_daily: 129,
          price_weekly: 720,
          security_deposit: 500,
          min_rental_duration: "1 day",
          max_rental_duration: "21 days",
          rental_location: "11th Avenue, Hell’s Kitchen",
        },
      ),
      hireItem(
        "Chrysler Pacifica — 7 seater",
        "Family van with captain chairs. Child-seat on request.",
        169,
        [rentalPhotos.travel, rentalPhotos.auto, rentalPhotos.hire, rentalPhotos.autoBanner],
        {
          quantity: 2,
          price_daily: 169,
          price_weekly: 950,
          security_deposit: 700,
          min_rental_duration: "1 day",
          max_rental_duration: "14 days",
          rental_location: "Hell’s Kitchen lot",
        },
      ),
      hireItem(
        "Mercedes Sprinter cargo van",
        "High-roof van for moves and production. Unlimited miles inside NYC on 2+ day hires.",
        189,
        [rentalPhotos.hireBanner, rentalPhotos.autoBanner, rentalPhotos.hire, rentalPhotos.travel],
        {
          rental_availability: "Limited",
          quantity: 2,
          price_daily: 189,
          price_weekly: 1100,
          security_deposit: 900,
          min_rental_duration: "1 day",
          max_rental_duration: "10 days",
          rental_location: "11th Avenue — call before pickup",
        },
      ),
      hireItem(
        "Vespa Primavera scooter",
        "125cc automatic scooter with two helmets. Best for short downtown hops.",
        49,
        [rentalPhotos.hire, rentalPhotos.travel, rentalPhotos.auto, rentalPhotos.events],
        {
          quantity: 8,
          price_hourly: 12,
          price_daily: 49,
          price_weekly: 275,
          security_deposit: 250,
          min_rental_duration: "2 hours",
          max_rental_duration: "7 days",
          rental_location: "11th Avenue lot",
        },
      ),
    ],
  },
  {
    name: "Lens & Light Hire",
    slug: "lens-and-light-hire",
    category: "camera-rental",
    city: "New York",
    address: "36 E 20th Street, New York, NY",
    headline: "Cameras, glass, drones, and lights for shoots and events.",
    description:
      "Bodies, lenses, drones, and strobes by the day. Flatiron studio pickup, courier across Manhattan, and a refundable deposit. ID is checked at handover.\n\nEach kit is listed with daily and weekly rates so you can add a body, a drone, and lights to one hire request.",
    lat: 40.7391,
    lng: -73.9887,
    images: [rentalPhotos.electronics, rentalPhotos.electronicsBanner, rentalPhotos.events, rentalPhotos.hire],
    years: 8,
    whatsapp: "+1 212 555 0188",
    rentalFields: {
      pickup_hours: "10:00 AM – 7:00 PM",
      delivery_available: true,
      delivery_radius_km: 12,
      delivery_fee: 25,
      id_proof_required: true,
      damage_policy: "Deposit held until gear is checked. Sensor cleaning is included. Lost accessories are billed at retail.",
      cancellation_policy: "Flexible",
      whatsapp: "+1 212 555 0188",
    },
    catalog: [
      hireItem(
        "Sony A7 IV body kit",
        "Full-frame body, 24–70mm, two batteries, 128GB card, and a strap.",
        95,
        [rentalPhotos.electronics, rentalPhotos.electronicsBanner, rentalPhotos.events, rentalPhotos.hire],
        {
          quantity: 4,
          price_daily: 95,
          price_weekly: 475,
          security_deposit: 1500,
          min_rental_duration: "1 day",
          max_rental_duration: "14 days",
          rental_location: "Flatiron studio or Manhattan courier",
        },
      ),
      hireItem(
        "Canon RF 70–200mm f/2.8",
        "Stabilised telephoto for events and portraits. Includes hood and pouch.",
        55,
        [rentalPhotos.electronicsBanner, rentalPhotos.hire, rentalPhotos.electronics, rentalPhotos.events],
        {
          quantity: 3,
          price_daily: 55,
          price_weekly: 275,
          security_deposit: 800,
          min_rental_duration: "1 day",
          max_rental_duration: "10 days",
          rental_location: "Flatiron studio",
        },
      ),
      hireItem(
        "DJI Air 3 drone kit",
        "Folding drone, three batteries, ND filters. Pilot licence not included.",
        85,
        [rentalPhotos.electronicsBanner, rentalPhotos.eventsBanner, rentalPhotos.hire, rentalPhotos.electronics],
        {
          quantity: 2,
          price_daily: 85,
          price_weekly: 420,
          security_deposit: 1800,
          min_rental_duration: "1 day",
          max_rental_duration: "7 days",
          rental_location: "Studio pickup",
        },
      ),
      hireItem(
        "Godox AD200 lighting kit",
        "Two strobes, stands, 60cm softbox, and triggers for portraits and product.",
        45,
        [rentalPhotos.events, rentalPhotos.electronics, rentalPhotos.hireBanner, rentalPhotos.eventsBanner],
        {
          quantity: 5,
          price_hourly: 12,
          price_daily: 45,
          price_weekly: 220,
          security_deposit: 400,
          min_rental_duration: "4 hours",
          max_rental_duration: "10 days",
          rental_location: "Flatiron studio",
        },
      ),
      hireItem(
        "Epson 4K projector + 100\" screen",
        "Bright 4K projector with HDMI, stand, and inflatable screen for rooftop screenings.",
        120,
        [rentalPhotos.electronics, rentalPhotos.eventsBanner, rentalPhotos.hire, rentalPhotos.electronicsBanner],
        {
          rental_availability: "Limited",
          quantity: 2,
          price_daily: 120,
          price_weekly: 600,
          security_deposit: 700,
          min_rental_duration: "1 day",
          max_rental_duration: "5 days",
          rental_location: "Studio or Manhattan delivery",
        },
      ),
    ],
  },
  {
    name: "Park Avenue Event Hire",
    slug: "park-avenue-event-hire",
    category: "event-equipment",
    city: "New York",
    address: "220 E 42nd Street, New York, NY",
    headline: "Chairs, tables, lighting, and sound for parties and launches.",
    description:
      "Event furniture and production gear with Midtown pickup or venue delivery. Minimum half-day hire. Damage deposit is refunded after the strike.\n\nChairs, cocktail tables, uplights, and a PA are listed separately so you can build one enquiry for the whole floor plan.",
    lat: 40.7506,
    lng: -73.9738,
    images: [rentalPhotos.events, rentalPhotos.eventsBanner, rentalPhotos.hire, rentalPhotos.furniture],
    years: 14,
    whatsapp: "+1 212 555 0160",
    rentalFields: {
      pickup_hours: "8:00 AM – 6:00 PM",
      delivery_available: true,
      delivery_radius_km: 20,
      delivery_fee: 95,
      id_proof_required: true,
      damage_policy: "Per-item deposit. Stains and broken frames are billed after the event. Delivery crew can set and strike for an extra fee.",
      cancellation_policy: "Moderate",
      whatsapp: "+1 212 555 0160",
    },
    catalog: [
      hireItem(
        "Chiavari chairs — set of 10",
        "Gold chiavari chairs with ivory cushions. Sold in tens.",
        40,
        [rentalPhotos.events, rentalPhotos.furniture, rentalPhotos.eventsBanner, rentalPhotos.hire],
        {
          quantity: 40,
          price_daily: 40,
          price_weekly: 180,
          security_deposit: 80,
          min_rental_duration: "1 day",
          max_rental_duration: "7 days",
          rental_location: "42nd Street warehouse or venue delivery",
        },
      ),
      hireItem(
        "Banquet tables — 6 ft",
        "Folding banquet table, seats 8. White linen available on request.",
        18,
        [rentalPhotos.furniture, rentalPhotos.events, rentalPhotos.hireBanner, rentalPhotos.eventsBanner],
        {
          quantity: 30,
          price_daily: 18,
          price_weekly: 80,
          security_deposit: 40,
          min_rental_duration: "1 day",
          max_rental_duration: "10 days",
          rental_location: "42nd Street warehouse",
        },
      ),
      hireItem(
        "Cocktail high-top tables — pair",
        "Two 30-inch high-tops with spandex covers. Ideal for mixers.",
        28,
        [rentalPhotos.eventsBanner, rentalPhotos.furniture, rentalPhotos.events, rentalPhotos.hire],
        {
          quantity: 16,
          price_daily: 28,
          price_weekly: 120,
          security_deposit: 50,
          min_rental_duration: "1 day",
          max_rental_duration: "7 days",
          rental_location: "Warehouse or Midtown delivery",
        },
      ),
      hireItem(
        "QSC 12\" PA + two mics",
        "Powered speaker pair, mixer, two wireless mics, and stands.",
        150,
        [rentalPhotos.events, rentalPhotos.electronics, rentalPhotos.hire, rentalPhotos.eventsBanner],
        {
          quantity: 4,
          price_hourly: 35,
          price_daily: 150,
          price_weekly: 700,
          security_deposit: 400,
          min_rental_duration: "4 hours",
          max_rental_duration: "5 days",
          rental_location: "42nd Street — tech check at pickup",
        },
      ),
      hireItem(
        "Uplight kit — 8 LED pars",
        "Battery uplights with remote. Warm, cool, or RGB.",
        90,
        [rentalPhotos.eventsBanner, rentalPhotos.electronicsBanner, rentalPhotos.events, rentalPhotos.hire],
        {
          quantity: 6,
          price_daily: 90,
          price_weekly: 400,
          security_deposit: 200,
          min_rental_duration: "1 day",
          max_rental_duration: "5 days",
          rental_location: "Warehouse pickup",
        },
      ),
    ],
  },
  {
    name: "Chelsea Tool Yard",
    slug: "chelsea-tool-yard",
    category: "power-tools",
    city: "New York",
    address: "155 W 18th Street, New York, NY",
    headline: "Power tools, generators, and site equipment by the day.",
    description:
      "Contractors and DIYers hire saws, drills, and generators here. Chelsea pickup from 7am. Delivery to Manhattan jobsites before 10am if you enquire the night before.\n\nStock counts update as jobs go out. Enquire with the tools and dates — the yard confirms what is free.",
    lat: 40.7416,
    lng: -73.9973,
    images: [rentalPhotos.hire, rentalPhotos.hireBanner, listingImages.logistics, listingImages.home],
    years: 16,
    whatsapp: "+1 212 555 0133",
    rentalFields: {
      pickup_hours: "7:00 AM – 5:00 PM",
      delivery_available: true,
      delivery_radius_km: 15,
      delivery_fee: 55,
      id_proof_required: true,
      damage_policy: "Blades and bits that break in normal use are replaced. Lost tools are billed at retail. Fuel for generators is extra.",
      cancellation_policy: "Flexible",
      whatsapp: "+1 212 555 0133",
    },
    catalog: [
      hireItem(
        "DeWalt 18V drill + impact kit",
        "Brushless drill and impact, two batteries, charger, and a 20-piece bit set.",
        28,
        [listingImages.logistics, rentalPhotos.hire, listingImages.home, rentalPhotos.hireBanner],
        {
          quantity: 10,
          price_hourly: 8,
          price_daily: 28,
          price_weekly: 120,
          security_deposit: 150,
          min_rental_duration: "4 hours",
          max_rental_duration: "14 days",
          rental_location: "W 18th Street counter",
        },
      ),
      hireItem(
        "Makita 10\" mitre saw",
        "Sliding compound mitre saw with stand and a 60-tooth blade.",
        45,
        [listingImages.home, rentalPhotos.hireBanner, listingImages.logistics, rentalPhotos.hire],
        {
          quantity: 4,
          price_daily: 45,
          price_weekly: 200,
          security_deposit: 250,
          min_rental_duration: "1 day",
          max_rental_duration: "10 days",
          rental_location: "Chelsea Tool Yard",
        },
      ),
      hireItem(
        "Honda 3000W inverter generator",
        "Quiet inverter for events and site power. Full tank included; return with fuel.",
        75,
        [rentalPhotos.hireBanner, listingImages.logistics, rentalPhotos.hire, listingImages.electrical],
        {
          quantity: 3,
          price_daily: 75,
          price_weekly: 350,
          security_deposit: 400,
          min_rental_duration: "1 day",
          max_rental_duration: "7 days",
          rental_location: "Yard — load-out from the alley",
        },
      ),
      hireItem(
        "Bosch rotary hammer SDS-plus",
        "For concrete anchors and chasing. Includes two bits and a dust shroud.",
        38,
        [listingImages.electrical, listingImages.logistics, rentalPhotos.hire, listingImages.home],
        {
          quantity: 5,
          price_hourly: 10,
          price_daily: 38,
          price_weekly: 170,
          security_deposit: 200,
          min_rental_duration: "4 hours",
          max_rental_duration: "10 days",
          rental_location: "W 18th Street",
        },
      ),
      hireItem(
        "19ft scissor lift",
        "Electric scissor lift for interiors. Proof of operator training required.",
        220,
        [listingImages.logistics, rentalPhotos.hireBanner, listingImages.home, rentalPhotos.hire],
        {
          rental_availability: "Limited",
          quantity: 1,
          price_daily: 220,
          price_weekly: 990,
          security_deposit: 1500,
          min_rental_duration: "1 day",
          max_rental_duration: "5 days",
          rental_location: "Yard — delivery only",
        },
      ),
    ],
  },
  {
    name: "Soho Furniture Hire",
    slug: "soho-furniture-hire",
    category: "home-furniture",
    city: "New York",
    address: "88 Greene Street, New York, NY",
    headline: "Sofas, desks, and staging furniture for homes and sets.",
    description:
      "Short-term sofas, dining sets, and office desks for staging, film, and furnished stays. Soho showroom pickup or white-glove delivery in Manhattan.\n\nPieces are listed with weekly and monthly rates. Enquire with the rooms you are dressing and the dates.",
    lat: 40.7245,
    lng: -74.0004,
    images: [rentalPhotos.furniture, listingImages.home, rentalPhotos.events, rentalPhotos.hire],
    years: 9,
    whatsapp: "+1 212 555 0171",
    rentalFields: {
      pickup_hours: "10:00 AM – 6:00 PM",
      delivery_available: true,
      delivery_radius_km: 12,
      delivery_fee: 120,
      id_proof_required: true,
      damage_policy: "White-glove delivery includes placement. Tears, stains, and missing hardware are billed after collection.",
      cancellation_policy: "Strict",
      whatsapp: "+1 212 555 0171",
    },
    catalog: [
      hireItem(
        "Walnut 3-seat sofa",
        "Mid-century sofa in oatmeal linen. Includes two throw pillows.",
        95,
        [rentalPhotos.furniture, listingImages.home, rentalPhotos.events, rentalPhotos.hire],
        {
          quantity: 4,
          price_daily: 95,
          price_weekly: 280,
          price_monthly: 750,
          security_deposit: 400,
          min_rental_duration: "1 week",
          max_rental_duration: "90 days",
          rental_location: "Greene Street showroom or Manhattan delivery",
        },
      ),
      hireItem(
        "Oak dining table + 6 chairs",
        "Seats six. Table pads included. Chairs are upholstered in oatmeal.",
        120,
        [listingImages.home, rentalPhotos.furniture, rentalPhotos.eventsBanner, rentalPhotos.hire],
        {
          quantity: 3,
          price_weekly: 320,
          price_monthly: 890,
          price_daily: 120,
          security_deposit: 500,
          min_rental_duration: "1 week",
          max_rental_duration: "90 days",
          rental_location: "Showroom",
        },
      ),
      hireItem(
        "Standing desk + task chair",
        "Electric sit-stand desk, monitor arm, and mesh chair. For offices and sets.",
        55,
        [listingImages.furniture, rentalPhotos.hire, listingImages.home, rentalPhotos.electronics],
        {
          quantity: 8,
          price_daily: 55,
          price_weekly: 160,
          price_monthly: 420,
          security_deposit: 250,
          min_rental_duration: "3 days",
          max_rental_duration: "120 days",
          rental_location: "Soho or office delivery",
        },
      ),
      hireItem(
        "King bed frame + mattress",
        "Upholstered king frame, mattress, and two nightstands. Linens extra.",
        140,
        [listingImages.home, rentalPhotos.furniture, rentalPhotos.events, rentalPhotos.hireBanner],
        {
          quantity: 2,
          price_weekly: 380,
          price_monthly: 980,
          price_daily: 140,
          security_deposit: 600,
          min_rental_duration: "1 week",
          max_rental_duration: "90 days",
          rental_location: "White-glove delivery only",
        },
      ),
      hireItem(
        "Lounge seating set — 8 people",
        "Two sofas, two armchairs, and a coffee table. For launches and lounges.",
        220,
        [rentalPhotos.events, rentalPhotos.furniture, listingImages.home, rentalPhotos.eventsBanner],
        {
          quantity: 2,
          price_daily: 220,
          price_weekly: 650,
          security_deposit: 800,
          min_rental_duration: "1 day",
          max_rental_duration: "14 days",
          rental_location: "Showroom or venue delivery",
        },
      ),
    ],
  },
  {
    name: "Metro Yellow Cabs",
    slug: "metro-yellow-cabs",
    category: "taxi-services",
    city: "New York",
    address: "240 W 40th Street, New York, NY",
    headline: "City taxis for Midtown, downtown, and late-night pickups.",
    description:
      "Yellow-cab style sedans and SUVs with English-speaking drivers. Book a sedan for two, an SUV for luggage, or a van for the group. Metered city trips and fixed airport rates are listed on each car.\n\nTick the vehicle you want, add pickup and drop-off, and the dispatcher replies directly.",
    lat: 40.7557,
    lng: -73.9878,
    images: [rentalPhotos.travel, rentalPhotos.auto, rentalPhotos.autoBanner, rentalPhotos.hire],
    years: 14,
    whatsapp: "+1 212 555 0188",
    travelFields: {
      service_hours: "24 hours",
      airports_served: "JFK, LGA, EWR",
      airport_transfer: true,
      outstation_available: false,
      fleet_size: 42,
      languages: "English, Spanish",
      payment_modes: ["Cash", "Card"],
      cancellation_policy: "Flexible",
      whatsapp: "+1 212 555 0188",
    },
    catalog: [
      travelVehicle(
        "Toyota Camry sedan",
        "4 passengers. Quiet city taxi with USB charging and a child seat on request.",
        45,
        [rentalPhotos.auto, rentalPhotos.travel, rentalPhotos.autoBanner, rentalPhotos.hire],
        {
          vehicle_type: "Sedan",
          seating_capacity: 4,
          luggage_capacity: "2 large + 2 cabin",
          vehicle_count: 18,
          price_hourly: 45,
          price_per_km: 3,
          price_airport: 89,
          waiting_charge: 18,
        },
      ),
      travelVehicle(
        "Honda CR-V SUV",
        "5 seats and extra cargo for weekend bags or airport runs.",
        58,
        [rentalPhotos.autoBanner, rentalPhotos.hireBanner, rentalPhotos.travel, rentalPhotos.auto],
        {
          vehicle_type: "SUV",
          seating_capacity: 5,
          luggage_capacity: "3 large + 2 cabin",
          vehicle_count: 10,
          price_hourly: 58,
          price_per_km: 4,
          price_airport: 115,
          waiting_charge: 22,
        },
      ),
      travelVehicle(
        "Chrysler Pacifica van",
        "7 seats with captain chairs. Families and small groups.",
        75,
        [rentalPhotos.travel, rentalPhotos.auto, rentalPhotos.hire, rentalPhotos.autoBanner],
        {
          vehicle_type: "Van",
          seating_capacity: 7,
          luggage_capacity: "4 large bags",
          vehicle_count: 6,
          price_hourly: 75,
          price_airport: 149,
          waiting_charge: 28,
        },
      ),
      travelVehicle(
        "Late-night sedan",
        "24-hour sedan for after-hours pickups across Manhattan and Brooklyn.",
        52,
        [rentalPhotos.hire, rentalPhotos.travel, rentalPhotos.auto, rentalPhotos.autoBanner],
        {
          vehicle_type: "Sedan",
          seating_capacity: 4,
          luggage_capacity: "2 large",
          vehicle_count: 8,
          price_hourly: 52,
          price_airport: 99,
          night_charge: 15,
        },
      ),
    ],
  },
  {
    name: "Skyline Airport Cars",
    slug: "skyline-airport-cars",
    category: "airport-transfers",
    city: "New York",
    address: "11 Penn Plaza, New York, NY",
    headline: "Fixed-rate airport cars for JFK, LaGuardia, and Newark.",
    description:
      "Meet-and-greet at arrivals, flight tracking, and a 60-minute wait included. Sedans, luxury cars, and vans with space for golf bags or ski cases.\n\nEach transfer lists an airport rate and hourly wait. Add your flight number in the notes when you enquire.",
    lat: 40.7505,
    lng: -73.9934,
    images: [rentalPhotos.travel, rentalPhotos.hireBanner, rentalPhotos.autoBanner, rentalPhotos.auto],
    years: 9,
    whatsapp: "+1 212 555 0191",
    travelFields: {
      service_hours: "4:00 AM – 1:00 AM",
      airports_served: "JFK, LGA, EWR",
      airport_transfer: true,
      outstation_available: true,
      fleet_size: 28,
      languages: "English",
      payment_modes: ["Card", "Invoice"],
      cancellation_policy: "Moderate",
      whatsapp: "+1 212 555 0191",
    },
    catalog: [
      travelVehicle(
        "JFK sedan transfer",
        "Meet at Terminal arrivals. 60 minutes wait. Suits 1–3 passengers.",
        89,
        [rentalPhotos.auto, rentalPhotos.travel, rentalPhotos.hire, rentalPhotos.autoBanner],
        {
          vehicle_type: "Sedan",
          seating_capacity: 3,
          luggage_capacity: "2 large + 2 cabin",
          vehicle_count: 12,
          price_hourly: 55,
          price_airport: 89,
          waiting_charge: 20,
        },
      ),
      travelVehicle(
        "LGA SUV transfer",
        "LaGuardia SUV with extra luggage space. Flight tracking included.",
        119,
        [rentalPhotos.autoBanner, rentalPhotos.travel, rentalPhotos.hireBanner, rentalPhotos.auto],
        {
          vehicle_type: "SUV",
          seating_capacity: 5,
          luggage_capacity: "4 large bags",
          vehicle_count: 8,
          price_hourly: 68,
          price_airport: 119,
          waiting_charge: 24,
        },
      ),
      travelVehicle(
        "EWR luxury sedan",
        "Mercedes E-Class to Newark. Water, Wi-Fi, and a quiet cabin.",
        159,
        [rentalPhotos.hire, rentalPhotos.auto, rentalPhotos.travel, rentalPhotos.hireBanner],
        {
          vehicle_type: "Luxury sedan",
          seating_capacity: 3,
          luggage_capacity: "2 large + 2 cabin",
          vehicle_count: 5,
          price_hourly: 95,
          price_airport: 159,
          night_charge: 25,
        },
      ),
      travelVehicle(
        "Group van — 8 seats",
        "Sprinter-style van for families or crews with lots of bags.",
        189,
        [rentalPhotos.travel, rentalPhotos.autoBanner, rentalPhotos.hire, rentalPhotos.auto],
        {
          vehicle_type: "Van",
          seating_capacity: 8,
          luggage_capacity: "8 large bags",
          vehicle_count: 3,
          price_hourly: 110,
          price_airport: 189,
          price_outstation_day: 420,
        },
      ),
    ],
  },
  {
    name: "Hudson Day Tours",
    slug: "hudson-day-tours",
    category: "tour-operators",
    city: "New York",
    address: "350 Fifth Avenue, New York, NY",
    headline: "Private day tours of Manhattan, upstate, and the Hudson Valley.",
    description:
      "Licensed guides and a small fleet of vans and coaches. Half-day city loops, full-day Hudson Valley, and custom itineraries for visiting families.\n\nEach package lists seats and a day rate. Enquire with your group size and preferred date.",
    lat: 40.7484,
    lng: -73.9857,
    images: [rentalPhotos.travel, rentalPhotos.events, rentalPhotos.eventsBanner, rentalPhotos.hire],
    years: 7,
    whatsapp: "+1 212 555 0194",
    travelFields: {
      service_hours: "7:00 AM – 8:00 PM",
      airports_served: "JFK, LGA",
      airport_transfer: false,
      outstation_available: true,
      fleet_size: 11,
      languages: "English, French",
      payment_modes: ["Card", "Bank transfer", "Invoice"],
      cancellation_policy: "Moderate",
      whatsapp: "+1 212 555 0194",
    },
    catalog: [
      travelVehicle(
        "Manhattan half-day van",
        "4-hour private loop: Downtown, Midtown, Central Park. Guide included.",
        320,
        [rentalPhotos.events, rentalPhotos.travel, rentalPhotos.hire, rentalPhotos.eventsBanner],
        {
          vehicle_type: "Tour package",
          seating_capacity: 8,
          luggage_capacity: "Day bags only",
          vehicle_count: 4,
          price_hourly: 95,
          price_outstation_day: 320,
        },
      ),
      travelVehicle(
        "Hudson Valley full day",
        "West Point, Sleepy Hollow, or wine country. 8 hours with a driver-guide.",
        540,
        [rentalPhotos.travel, rentalPhotos.eventsBanner, rentalPhotos.hireBanner, rentalPhotos.events],
        {
          vehicle_type: "Tour package",
          seating_capacity: 7,
          luggage_capacity: "Light overnight bags",
          vehicle_count: 3,
          price_hourly: 110,
          price_outstation_day: 540,
        },
      ),
      travelVehicle(
        "Coach — 24 seats",
        "Mini coach for school groups and visiting teams. PA system on board.",
        780,
        [rentalPhotos.hireBanner, rentalPhotos.travel, rentalPhotos.auto, rentalPhotos.events],
        {
          vehicle_type: "Bus",
          seating_capacity: 24,
          luggage_capacity: "Under-bus hold",
          vehicle_count: 2,
          ac: true,
          price_hourly: 180,
          price_outstation_day: 780,
        },
      ),
      travelVehicle(
        "Custom itinerary SUV",
        "Flexible SUV for 1–4 guests. You set the stops; we drive.",
        140,
        [rentalPhotos.auto, rentalPhotos.travel, rentalPhotos.events, rentalPhotos.autoBanner],
        {
          vehicle_type: "SUV",
          seating_capacity: 4,
          luggage_capacity: "3 large",
          vehicle_count: 2,
          price_hourly: 140,
          price_outstation_day: 620,
        },
      ),
    ],
  },
  {
    name: "Nightline Chauffeur",
    slug: "nightline-chauffeur",
    category: "chauffeur-services",
    city: "New York",
    address: "641 Lexington Avenue, New York, NY",
    headline: "Black-car chauffeur for dinners, events, and hourly hire.",
    description:
      "Chauffeurs in dark suits, bottled water, and a quiet cabin. Book by the hour for a night out, or a dedicated car for a visiting executive.\n\nLuxury sedans and SUVs with night rates listed. Add your itinerary in the enquiry notes.",
    lat: 40.758,
    lng: -73.9708,
    images: [rentalPhotos.hire, rentalPhotos.travel, rentalPhotos.auto, rentalPhotos.hireBanner],
    years: 12,
    whatsapp: "+1 212 555 0197",
    travelFields: {
      service_hours: "5:00 PM – 4:00 AM, plus daytime by request",
      airports_served: "JFK, LGA, EWR",
      airport_transfer: true,
      outstation_available: true,
      fleet_size: 16,
      languages: "English",
      payment_modes: ["Card", "Invoice"],
      cancellation_policy: "Strict",
      whatsapp: "+1 212 555 0197",
    },
    catalog: [
      travelVehicle(
        "Mercedes E-Class chauffeur",
        "Black sedan, suited chauffeur, 3-hour minimum in the evening.",
        125,
        [rentalPhotos.hire, rentalPhotos.auto, rentalPhotos.travel, rentalPhotos.hireBanner],
        {
          vehicle_type: "Luxury sedan",
          seating_capacity: 3,
          luggage_capacity: "2 large + 2 cabin",
          vehicle_count: 7,
          price_hourly: 125,
          price_airport: 175,
          night_charge: 30,
          waiting_charge: 40,
        },
      ),
      travelVehicle(
        "Cadillac Escalade",
        "Full-size SUV for 5 passengers. Events and airport VIP.",
        165,
        [rentalPhotos.autoBanner, rentalPhotos.hireBanner, rentalPhotos.travel, rentalPhotos.auto],
        {
          vehicle_type: "SUV",
          seating_capacity: 5,
          luggage_capacity: "5 large bags",
          vehicle_count: 4,
          price_hourly: 165,
          price_airport: 220,
          night_charge: 40,
        },
      ),
      travelVehicle(
        "Executive hourly — 8 hours",
        "Dedicated chauffeur for a working day. Meetings across Manhattan.",
        980,
        [rentalPhotos.travel, rentalPhotos.hire, rentalPhotos.auto, rentalPhotos.events],
        {
          vehicle_type: "Luxury sedan",
          seating_capacity: 3,
          luggage_capacity: "2 large",
          vehicle_count: 3,
          price_hourly: 125,
          price_outstation_day: 980,
        },
      ),
      travelVehicle(
        "Sprinter lounge van",
        "Captain chairs and a mini fridge. Airport groups and after-parties.",
        210,
        [rentalPhotos.events, rentalPhotos.travel, rentalPhotos.hireBanner, rentalPhotos.autoBanner],
        {
          vehicle_type: "Van",
          seating_capacity: 8,
          luggage_capacity: "6 large bags",
          vehicle_count: 2,
          price_hourly: 210,
          price_airport: 280,
          night_charge: 50,
        },
      ),
    ],
  },
  {
    name: "Atlas Event Studio",
    slug: "atlas-event-studio",
    category: "event-organizers",
    city: "New York",
    address: "200 Park Avenue South, New York, NY",
    headline: "Full-service planners for weddings, galas, and brand nights.",
    description:
      "A downtown studio that runs the timeline, vendors, and guest flow so hosts stay in the room. Corporate launches, rooftop dinners, and weekend weddings across Manhattan and Brooklyn.\n\nTick a coordination package, add venue and guest count, and the producer replies with a run-of-show.",
    lat: 40.7371,
    lng: -73.9887,
    images: [stayPhotos.events, stayPhotos.eventsBanner, rentalPhotos.furniture, stayPhotos.home],
    years: 11,
    whatsapp: "+1 212 555 0210",
    eventFields: {
      service_hours: "By appointment, 9:00 AM – 8:00 PM",
      event_types: ["Wedding", "Corporate", "Private dinner"],
      travel_radius_km: 80,
      team_size: 14,
      languages: "English, Spanish",
      cancellation_policy: "Moderate",
      whatsapp: "+1 212 555 0210",
    },
    catalog: [
      eventPackage(
        "Full-day wedding coordination",
        "Lead planner, two assistants, vendor calls, and a 12-hour run-of-show.",
        4200,
        [stayPhotos.events, stayPhotos.eventsBanner, rentalPhotos.furniture, stayPhotos.home],
        {
          package_type: "Full event",
          duration_hours: 12,
          guest_capacity: 180,
          package_includes: "Planner, 2 assistants, timeline, vendor liaison",
          price_day: 4200,
          price_hourly: 380,
        },
      ),
      eventPackage(
        "Corporate launch — 8 hours",
        "Stage, guest flow, and AV coordination for a product or brand night.",
        2800,
        [stayPhotos.eventsBanner, rentalPhotos.events, stayPhotos.home, stayPhotos.events],
        {
          package_type: "Coordination",
          duration_hours: 8,
          guest_capacity: 250,
          package_includes: "Producer, stage manager, guest list desk",
          price_day: 2800,
        },
      ),
      eventPackage(
        "Private dinner producer",
        "Intimate 20–40 guest dinner. Floor plan, staffing cues, and vendor timing.",
        1600,
        [rentalPhotos.furniture, stayPhotos.events, stayPhotos.home, stayPhotos.eventsBanner],
        {
          package_type: "Coordination",
          duration_hours: 6,
          guest_capacity: 40,
          package_includes: "Planner and one assistant",
          price_day: 1600,
          price_hourly: 280,
        },
      ),
      eventPackage(
        "Month-of wedding support",
        "Confirm vendors, finalise timeline, and run the wedding day.",
        2400,
        [stayPhotos.events, rentalPhotos.eventsBanner, stayPhotos.home, stayPhotos.eventsBanner],
        {
          package_type: "Full event",
          duration_hours: 10,
          guest_capacity: 150,
          package_includes: "Month-of calls plus wedding-day lead",
          price_day: 2400,
        },
      ),
    ],
  },
  {
    name: "Lens & Vow Photography",
    slug: "lens-and-vow-photography",
    category: "photographers",
    city: "New York",
    address: "75 Varick Street, New York, NY",
    headline: "Editorial wedding and event photography with a quiet second shooter.",
    description:
      "Two-photographer teams for ceremonies, receptions, and brand dinners. Digital gallery in a week, album design extra.\n\nChoose a coverage window, add the venue, and the studio confirms a lead and second shooter.",
    lat: 40.7233,
    lng: -74.0056,
    images: [stayPhotos.eventsBanner, stayPhotos.events, stayPhotos.home, rentalPhotos.electronics],
    years: 8,
    whatsapp: "+1 212 555 0213",
    eventFields: {
      service_hours: "By booking, typically 8:00 AM – 11:00 PM",
      event_types: ["Wedding", "Engagement", "Photoshoot", "Corporate"],
      travel_radius_km: 120,
      team_size: 6,
      languages: "English",
      cancellation_policy: "Flexible",
      whatsapp: "+1 212 555 0213",
    },
    catalog: [
      eventPackage(
        "Wedding day — 8 hours",
        "Lead and second shooter. Getting ready through last dance.",
        3900,
        [stayPhotos.eventsBanner, stayPhotos.events, stayPhotos.home, rentalPhotos.electronics],
        {
          package_type: "Photography",
          duration_hours: 8,
          guest_capacity: 200,
          package_includes: "2 photographers, online gallery, 50 edits",
          price_day: 3900,
          price_hourly: 450,
        },
      ),
      eventPackage(
        "Engagement session",
        "90 minutes in SoHo, Central Park, or Brooklyn waterfront.",
        650,
        [stayPhotos.home, stayPhotos.events, rentalPhotos.electronics, stayPhotos.eventsBanner],
        {
          package_type: "Photography",
          duration_hours: 2,
          guest_capacity: 4,
          package_includes: "1 photographer, 40 edited photos",
          price_hourly: 325,
          price_day: 650,
        },
      ),
      eventPackage(
        "Corporate event coverage",
        "Keynote, networking, and product shots. Same-week selects.",
        1800,
        [rentalPhotos.electronics, stayPhotos.eventsBanner, stayPhotos.events, stayPhotos.home],
        {
          package_type: "Photography",
          duration_hours: 5,
          guest_capacity: 300,
          package_includes: "1 photographer, 80 edited photos",
          price_day: 1800,
        },
      ),
      eventPackage(
        "Full weekend wedding",
        "Rehearsal dinner plus ceremony day. Two photographers both days.",
        6200,
        [stayPhotos.events, stayPhotos.home, stayPhotos.eventsBanner, rentalPhotos.electronics],
        {
          package_type: "Photography",
          duration_hours: 16,
          guest_capacity: 180,
          package_includes: "2 photographers, album consult, highlight set",
          price_day: 6200,
        },
      ),
    ],
  },
  {
    name: "Harvest Table Catering",
    slug: "harvest-table-catering",
    category: "caterers",
    city: "New York",
    address: "11 E 26th Street, New York, NY",
    headline: "Seasonal menus for weddings, rooftops, and seated dinners.",
    description:
      "Kitchen in NoMad, service teams for 20 to 300. Farm-table dinners, passed canapés, and late-night stations. Dietary labels on every tray.\n\nPick a menu package and guest count; the chef replies with a tasting date.",
    lat: 40.743,
    lng: -73.9876,
    images: [stayPhotos.events, rentalPhotos.furniture, stayPhotos.home, stayPhotos.eventsBanner],
    years: 10,
    whatsapp: "+1 212 555 0216",
    eventFields: {
      service_hours: "Kitchen 8:00 AM – 10:00 PM",
      event_types: ["Wedding", "Corporate", "Private dinner", "Birthday"],
      travel_radius_km: 50,
      team_size: 22,
      languages: "English",
      cancellation_policy: "Moderate",
      whatsapp: "+1 212 555 0216",
    },
    catalog: [
      eventPackage(
        "Seated dinner — 80 guests",
        "Three courses, wine pairing optional, waitstaff included.",
        9600,
        [stayPhotos.events, rentalPhotos.furniture, stayPhotos.home, stayPhotos.eventsBanner],
        {
          package_type: "Catering",
          duration_hours: 5,
          guest_capacity: 80,
          package_includes: "Chef, 6 servers, plates and linens",
          price_day: 9600,
        },
      ),
      eventPackage(
        "Passed canapés hour",
        "Eight bites per guest, bartenders extra. Rooftops and galleries.",
        2800,
        [rentalPhotos.furniture, stayPhotos.eventsBanner, stayPhotos.events, stayPhotos.home],
        {
          package_type: "Catering",
          duration_hours: 2,
          guest_capacity: 120,
          package_includes: "Kitchen lead and 4 passers",
          price_hourly: 1400,
          price_day: 2800,
        },
      ),
      eventPackage(
        "Family-style wedding feast",
        "Shared platters for 100–150. Vegetarian and kosher-style options.",
        14500,
        [stayPhotos.eventsBanner, stayPhotos.events, rentalPhotos.furniture, stayPhotos.home],
        {
          package_type: "Catering",
          duration_hours: 6,
          guest_capacity: 150,
          package_includes: "Chef de cuisine, 10 servers, dessert station",
          price_day: 14500,
        },
      ),
      eventPackage(
        "Tasting for 8",
        "Menu trial at the studio kitchen before you book the full event.",
        480,
        [stayPhotos.home, stayPhotos.events, rentalPhotos.furniture, stayPhotos.eventsBanner],
        {
          package_type: "Catering",
          duration_hours: 2,
          guest_capacity: 8,
          package_includes: "Chef tasting, printed menu notes",
          price_day: 480,
        },
      ),
    ],
  },
  {
    name: "Fifth Avenue Weddings",
    slug: "fifth-avenue-weddings",
    category: "wedding-services",
    city: "New York",
    address: "445 Park Avenue, New York, NY",
    headline: "Ceremony, décor, and day-of styling for city weddings.",
    description:
      "Florals, aisle design, and a day-of stylist who stays through portraits. Hotels, clubs, and brownstone gardens.\n\nSelect a décor or styling package, then add guest count and venue in the enquiry.",
    lat: 40.7606,
    lng: -73.9712,
    images: [stayPhotos.eventsBanner, stayPhotos.events, rentalPhotos.furniture, stayPhotos.home],
    years: 15,
    whatsapp: "+1 212 555 0219",
    eventFields: {
      service_hours: "10:00 AM – 7:00 PM, weekends by booking",
      event_types: ["Wedding", "Engagement", "Private dinner"],
      travel_radius_km: 60,
      team_size: 9,
      languages: "English, French",
      cancellation_policy: "Strict",
      whatsapp: "+1 212 555 0219",
    },
    catalog: [
      eventPackage(
        "Ceremony décor install",
        "Aisle, chuppah or arch, and pew or chair florals. Strike included.",
        5400,
        [stayPhotos.eventsBanner, stayPhotos.events, rentalPhotos.furniture, stayPhotos.home],
        {
          package_type: "Decor",
          duration_hours: 8,
          guest_capacity: 120,
          package_includes: "Design lead, 3 florists, install and strike",
          price_day: 5400,
        },
      ),
      eventPackage(
        "Reception tablescape",
        "Centerpieces, candles, and place settings for up to 150.",
        7200,
        [rentalPhotos.furniture, stayPhotos.events, stayPhotos.eventsBanner, stayPhotos.home],
        {
          package_type: "Decor",
          duration_hours: 10,
          guest_capacity: 150,
          package_includes: "Tables, florals, candle program",
          price_day: 7200,
        },
      ),
      eventPackage(
        "Day-of bridal styling",
        "Stylist from getting-ready through first look. Touch-ups at the venue.",
        890,
        [stayPhotos.home, stayPhotos.eventsBanner, stayPhotos.events, rentalPhotos.furniture],
        {
          package_type: "Coordination",
          duration_hours: 6,
          guest_capacity: 8,
          package_includes: "Stylist and kit",
          price_hourly: 150,
          price_day: 890,
        },
      ),
      eventPackage(
        "Micro-wedding suite",
        "Florals, styling, and a coordinator for 30 guests or fewer.",
        3800,
        [stayPhotos.events, stayPhotos.home, stayPhotos.eventsBanner, rentalPhotos.furniture],
        {
          package_type: "Full event",
          duration_hours: 8,
          guest_capacity: 30,
          package_includes: "Coordinator, florals, styling",
          price_day: 3800,
        },
      ),
    ],
  },
  {
    name: "Harborline Courier",
    slug: "harborline-courier",
    category: "courier-services",
    city: "New York",
    address: "90 West Street, New York, NY",
    headline: "Same-day bike and van courier across the five boroughs.",
    description:
      "Documents, samples, and small freight with live tracking. Bikes for Midtown, vans for outer boroughs, and a night window for closings.\n\nTick a courier type, add pickup and drop-off, and dispatch confirms an ETA.",
    lat: 40.7102,
    lng: -74.0144,
    images: [listingImages.logistics, rentalPhotos.auto, rentalPhotos.travel, stayPhotos.home],
    years: 16,
    whatsapp: "+1 212 555 0222",
    logisticsFields: {
      service_hours: "7:00 AM – 10:00 PM, rush nights by request",
      coverage_area: "NYC five boroughs, Hudson County NJ",
      packing_available: false,
      insurance_available: true,
      fleet_size: 38,
      languages: "English, Spanish",
      cancellation_policy: "Flexible",
      whatsapp: "+1 212 555 0222",
    },
    catalog: [
      logisticsOffering(
        "Bike courier — documents",
        "Envelope and small parcel. Typical Midtown hop under 45 minutes.",
        28,
        [listingImages.logistics, rentalPhotos.auto, rentalPhotos.travel, stayPhotos.home],
        {
          offering_type: "Courier",
          vehicle_type: "Bike",
          capacity_kg: 8,
          crew_size: 1,
          vehicle_count: 18,
          price_hourly: 28,
          price_per_km: 2,
        },
      ),
      logisticsOffering(
        "Van courier — same day",
        "Cartons and sample kits. Lift-gate on request.",
        75,
        [rentalPhotos.auto, listingImages.logistics, rentalPhotos.autoBanner, rentalPhotos.travel],
        {
          offering_type: "Courier",
          vehicle_type: "Van",
          capacity_kg: 800,
          crew_size: 1,
          vehicle_count: 10,
          price_hourly: 75,
          price_per_km: 4,
        },
      ),
      logisticsOffering(
        "Rush closing run",
        "Legal envelopes between downtown and Midtown with a dedicated rider.",
        95,
        [rentalPhotos.travel, listingImages.logistics, stayPhotos.home, rentalPhotos.auto],
        {
          offering_type: "Courier",
          vehicle_type: "Bike",
          capacity_kg: 5,
          crew_size: 1,
          vehicle_count: 6,
          price_hourly: 95,
        },
      ),
      logisticsOffering(
        "NJ same-day van",
        "Jersey City, Hoboken, and Newark airport cargo desks.",
        110,
        [rentalPhotos.autoBanner, listingImages.logistics, rentalPhotos.travel, rentalPhotos.auto],
        {
          offering_type: "Courier",
          vehicle_type: "Van",
          capacity_kg: 900,
          crew_size: 1,
          vehicle_count: 4,
          price_hourly: 110,
          price_per_km: 5,
          price_day: 520,
        },
      ),
    ],
  },
  {
    name: "Borough Packers & Movers",
    slug: "borough-packers-movers",
    category: "packers-movers",
    city: "New York",
    address: "55 Washington Street, Brooklyn, NY",
    headline: "Apartment and office moves with packing crews in Brooklyn and Manhattan.",
    description:
      "Studio to three-bed moves, piano handling on request, and weekend slots. Packing paper and wardrobes can be added on the enquiry.\n\nChoose a crew size, add both addresses, and the dispatcher sends a window.",
    lat: 40.7032,
    lng: -73.9898,
    images: [listingImages.logistics, stayPhotos.home, stayPhotos.homeBanner, rentalPhotos.auto],
    years: 13,
    whatsapp: "+1 212 555 0225",
    logisticsFields: {
      service_hours: "7:00 AM – 7:00 PM",
      coverage_area: "Manhattan, Brooklyn, Queens, Jersey City",
      packing_available: true,
      insurance_available: true,
      fleet_size: 12,
      languages: "English",
      cancellation_policy: "Moderate",
      whatsapp: "+1 212 555 0225",
    },
    catalog: [
      logisticsOffering(
        "Studio move — 2 movers",
        "Shared van, 3-hour minimum. Walk-ups extra per flight.",
        145,
        [listingImages.logistics, stayPhotos.home, rentalPhotos.auto, stayPhotos.homeBanner],
        {
          offering_type: "Local move",
          vehicle_type: "Van",
          capacity_kg: 1200,
          crew_size: 2,
          vehicle_count: 4,
          price_hourly: 145,
        },
      ),
      logisticsOffering(
        "1–2 bedroom crew",
        "26-foot truck, 3 movers, blankets and dolly. Typical 5–7 hours.",
        210,
        [stayPhotos.homeBanner, listingImages.logistics, rentalPhotos.autoBanner, stayPhotos.home],
        {
          offering_type: "Local move",
          vehicle_type: "Truck",
          capacity_kg: 4500,
          crew_size: 3,
          vehicle_count: 5,
          price_hourly: 210,
          price_day: 1400,
        },
      ),
      logisticsOffering(
        "Full packing add-on",
        "Two packers the day before. Boxes extra at cost.",
        95,
        [stayPhotos.home, listingImages.logistics, stayPhotos.homeBanner, rentalPhotos.furniture],
        {
          offering_type: "Local move",
          vehicle_type: "Van",
          capacity_kg: 400,
          crew_size: 2,
          vehicle_count: 2,
          price_hourly: 95,
        },
      ),
      logisticsOffering(
        "Office weekend move",
        "After-hours crew for a floor of desks and IT. Lift reservation help.",
        280,
        [rentalPhotos.auto, listingImages.logistics, stayPhotos.home, rentalPhotos.autoBanner],
        {
          offering_type: "Local move",
          vehicle_type: "Truck",
          capacity_kg: 6000,
          crew_size: 5,
          vehicle_count: 2,
          price_hourly: 280,
          price_day: 2100,
        },
      ),
    ],
  },
  {
    name: "East River Transport",
    slug: "east-river-transport",
    category: "transporters",
    city: "New York",
    address: "37-11 21st Street, Long Island City, NY",
    headline: "Freight vans and trucks for showrooms, sites, and borough hops.",
    description:
      "Licensed transporters for palettes, furniture lots, and job-site drops. Hourly local and day rates to New Jersey.\n\nSelect a vehicle, add both yards, and operations confirm a driver.",
    lat: 40.757,
    lng: -73.9412,
    images: [rentalPhotos.autoBanner, listingImages.logistics, rentalPhotos.auto, rentalPhotos.travel],
    years: 20,
    whatsapp: "+1 212 555 0228",
    logisticsFields: {
      service_hours: "6:00 AM – 8:00 PM",
      coverage_area: "NYC, Long Island, North Jersey",
      packing_available: false,
      insurance_available: true,
      fleet_size: 22,
      languages: "English, Polish",
      cancellation_policy: "Moderate",
      whatsapp: "+1 212 555 0228",
    },
    catalog: [
      logisticsOffering(
        "Cargo van — hourly",
        "One driver. Showroom to site, no residential packing.",
        85,
        [rentalPhotos.auto, listingImages.logistics, rentalPhotos.autoBanner, rentalPhotos.travel],
        {
          offering_type: "Freight",
          vehicle_type: "Van",
          capacity_kg: 1100,
          crew_size: 1,
          vehicle_count: 8,
          price_hourly: 85,
          price_per_km: 4,
        },
      ),
      logisticsOffering(
        "Box truck — 16 ft",
        "Lift-gate. Palettes and crated lots.",
        130,
        [rentalPhotos.autoBanner, listingImages.logistics, rentalPhotos.auto, stayPhotos.home],
        {
          offering_type: "Freight",
          vehicle_type: "Truck",
          capacity_kg: 3500,
          crew_size: 1,
          vehicle_count: 7,
          price_hourly: 130,
          price_per_km: 5,
          price_day: 780,
        },
      ),
      logisticsOffering(
        "Outstation day truck",
        "LIC to a NJ or Long Island warehouse. 8-hour day plus tolls.",
        920,
        [rentalPhotos.travel, listingImages.logistics, rentalPhotos.autoBanner, rentalPhotos.auto],
        {
          offering_type: "Outstation move",
          vehicle_type: "Truck",
          capacity_kg: 4000,
          crew_size: 1,
          vehicle_count: 4,
          price_day: 920,
          price_hourly: 145,
        },
      ),
      logisticsOffering(
        "Tempo with helper",
        "Driver plus one for loading. Tight streets in SoHo and the Village.",
        115,
        [listingImages.logistics, rentalPhotos.auto, stayPhotos.home, rentalPhotos.autoBanner],
        {
          offering_type: "Freight",
          vehicle_type: "Tempo",
          capacity_kg: 1800,
          crew_size: 2,
          vehicle_count: 3,
          price_hourly: 115,
        },
      ),
    ],
  },
  {
    name: "Sentinel Guard Services",
    slug: "sentinel-guard-services",
    category: "security-services",
    city: "New York",
    address: "1 Penn Plaza, New York, NY",
    headline: "Licensed guards for events, sites, and overnight patrols.",
    description:
      "Unarmed floor staff, door teams, and overnight patrol cars. Event shifts book in 8-hour blocks; sites can take a dedicated car.\n\nChoose a unit, add both locations if escorting, and the duty officer confirms coverage.",
    lat: 40.751,
    lng: -73.992,
    images: [listingImages.logistics, stayPhotos.home, rentalPhotos.auto, stayPhotos.events],
    years: 18,
    whatsapp: "+1 212 555 0231",
    logisticsFields: {
      service_hours: "24 hours",
      coverage_area: "Manhattan, Brooklyn, Queens",
      packing_available: false,
      insurance_available: true,
      fleet_size: 40,
      languages: "English, Spanish",
      cancellation_policy: "Strict",
      whatsapp: "+1 212 555 0231",
    },
    catalog: [
      logisticsOffering(
        "Event door team — 4 guards",
        "Bag check and guest list. 8-hour minimum.",
        52,
        [stayPhotos.events, listingImages.logistics, stayPhotos.home, rentalPhotos.auto],
        {
          offering_type: "Security shift",
          vehicle_type: "Guard team",
          crew_size: 4,
          vehicle_count: 6,
          price_hourly: 52,
          price_day: 380,
        },
      ),
      logisticsOffering(
        "Overnight patrol car",
        "Licensed driver and radio. Two site loops per hour.",
        68,
        [rentalPhotos.auto, listingImages.logistics, stayPhotos.home, rentalPhotos.autoBanner],
        {
          offering_type: "Security shift",
          vehicle_type: "Patrol car",
          crew_size: 1,
          vehicle_count: 8,
          price_hourly: 68,
          price_day: 500,
        },
      ),
      logisticsOffering(
        "Site static guard",
        "Single post at a lobby or gate. 12-hour night available.",
        44,
        [stayPhotos.home, listingImages.logistics, rentalPhotos.auto, stayPhotos.events],
        {
          offering_type: "Security shift",
          vehicle_type: "Guard team",
          crew_size: 1,
          vehicle_count: 12,
          price_hourly: 44,
        },
      ),
      logisticsOffering(
        "Armed escort — 2 officers",
        "Licensed escort between two addresses. Advance notice required.",
        140,
        [rentalPhotos.autoBanner, listingImages.logistics, stayPhotos.home, rentalPhotos.auto],
        {
          offering_type: "Armed escort",
          vehicle_type: "Patrol car",
          crew_size: 2,
          vehicle_count: 2,
          price_hourly: 140,
          price_day: 980,
        },
      ),
    ],
  },
  {
    name: "Hudson River Coaching",
    slug: "hudson-river-coaching",
    category: "coaching",
    city: "New York",
    address: "450 W 33rd Street, New York, NY",
    headline: "Exam and career coaching with small evening batches.",
    description:
      "Coaches who prep students for competitive exams and career pivots. Weeknight online sessions and weekend in-person drills near Hudson Yards.\n\nPick a course, note your target exam date, and the desk replies with batch openings.",
    lat: 40.7536,
    lng: -74.001,
    images: [stayPhotos.education, stayPhotos.educationBanner, stayPhotos.home, stayPhotos.homeBanner],
    years: 9,
    whatsapp: "+1 212 555 0240",
    educationFields: {
      service_hours: "10:00 AM – 9:00 PM",
      subjects: ["Exam prep", "Competitive exams"],
      modes_offered: ["Online", "In-person"],
      languages: "English",
      cancellation_policy: "Moderate",
      whatsapp: "+1 212 555 0240",
    },
    catalog: [
      educationCourse(
        "SAT intensive — 8 weeks",
        "Math and evidence reading drills. Two evening sessions per week online.",
        1800,
        [stayPhotos.education, stayPhotos.educationBanner, stayPhotos.home, stayPhotos.homeBanner],
        {
          course_type: "Coaching",
          duration_weeks: 8,
          batch_size: 12,
          session_hours: 2,
          price_hourly: 55,
          price_session: 110,
          price_course: 1800,
        },
      ),
      educationCourse(
        "GRE quant bootcamp",
        "Six-week quant focus with timed sets and review sheets.",
        1450,
        [stayPhotos.educationBanner, stayPhotos.education, stayPhotos.homeBanner, stayPhotos.home],
        {
          course_type: "Coaching",
          duration_weeks: 6,
          batch_size: 10,
          session_hours: 1.5,
          price_hourly: 60,
          price_session: 90,
          price_course: 1450,
        },
      ),
      educationCourse(
        "Civil services foundation",
        "Current affairs and essay labs. Hybrid Saturday in-person, weekday online.",
        2200,
        [stayPhotos.home, stayPhotos.education, stayPhotos.educationBanner, stayPhotos.homeBanner],
        {
          course_type: "Coaching",
          duration_weeks: 12,
          batch_size: 18,
          session_hours: 2.5,
          price_hourly: 50,
          price_session: 125,
          price_course: 2200,
        },
      ),
      educationCourse(
        "Career switch mock interviews",
        "Four one-hour mocks with scorecards for product and consulting roles.",
        480,
        [stayPhotos.education, stayPhotos.home, stayPhotos.educationBanner, stayPhotos.homeBanner],
        {
          course_type: "Workshop",
          duration_weeks: 2,
          batch_size: 6,
          session_hours: 1,
          price_hourly: 120,
          price_session: 120,
          price_course: 480,
        },
      ),
    ],
  },
  {
    name: "Midtown Math Tuition",
    slug: "midtown-math-tuition",
    category: "tuition",
    city: "New York",
    address: "122 E 42nd Street, New York, NY",
    headline: "School maths tuition from grade 6 through A-levels.",
    description:
      "Quiet rooms above Grand Central for algebra, calculus, and exam polish. Small groups plus limited one-to-ones.\n\nChoose a level, add the school board in notes, and tutors confirm a weekly slot.",
    lat: 40.7512,
    lng: -73.9765,
    images: [stayPhotos.educationBanner, stayPhotos.education, stayPhotos.home, listingImages.home],
    years: 14,
    whatsapp: "+1 212 555 0243",
    educationFields: {
      service_hours: "3:00 PM – 8:00 PM weekdays, 10:00 AM – 2:00 PM Sat",
      subjects: ["School subjects"],
      modes_offered: ["In-person", "Hybrid"],
      languages: "English",
      cancellation_policy: "Flexible",
      whatsapp: "+1 212 555 0243",
    },
    catalog: [
      educationCourse(
        "Algebra I small group",
        "Twice weekly after school. Homework check included.",
        720,
        [stayPhotos.educationBanner, stayPhotos.education, stayPhotos.home, listingImages.home],
        {
          course_type: "Tuition",
          duration_weeks: 10,
          batch_size: 6,
          session_hours: 1.5,
          price_hourly: 45,
          price_session: 68,
          price_course: 720,
        },
      ),
      educationCourse(
        "AP Calculus AB",
        "Problem sets and past papers. Hybrid option once a week.",
        1100,
        [stayPhotos.education, stayPhotos.home, stayPhotos.educationBanner, listingImages.home],
        {
          course_type: "Tuition",
          duration_weeks: 12,
          batch_size: 8,
          session_hours: 2,
          price_hourly: 55,
          price_session: 110,
          price_course: 1100,
        },
      ),
      educationCourse(
        "GCSE maths polish",
        "Eight weeks of exam technique for UK board students in NYC.",
        880,
        [stayPhotos.home, stayPhotos.educationBanner, stayPhotos.education, listingImages.home],
        {
          course_type: "Tuition",
          duration_weeks: 8,
          batch_size: 5,
          session_hours: 1.5,
          price_hourly: 50,
          price_session: 75,
          price_course: 880,
        },
      ),
      educationCourse(
        "One-to-one geometry hour",
        "Private desk hour for proofs and diagram practice.",
        95,
        [listingImages.home, stayPhotos.education, stayPhotos.educationBanner, stayPhotos.home],
        {
          course_type: "Tuition",
          duration_weeks: 1,
          batch_size: 1,
          session_hours: 1,
          price_hourly: 95,
          price_session: 95,
          price_course: 95,
        },
      ),
    ],
  },
  {
    name: "SoHo Language Studio",
    slug: "soho-language-studio",
    category: "language-training",
    city: "New York",
    address: "98 Greene Street, New York, NY",
    headline: "English, French, and Spanish in conversation-first classes.",
    description:
      "Bright loft classrooms and live online rooms for working adults. Placement tests before you join a level.\n\nSelect a language course, note your current level, and the studio sends a trial slot.",
    lat: 40.7245,
    lng: -74.0012,
    images: [stayPhotos.education, stayPhotos.home, stayPhotos.educationBanner, stayPhotos.homeBanner],
    years: 7,
    whatsapp: "+1 212 555 0246",
    educationFields: {
      service_hours: "9:00 AM – 8:00 PM",
      subjects: ["Soft skills", "Career"],
      modes_offered: ["Online", "In-person", "Hybrid"],
      languages: "English, French, Spanish",
      cancellation_policy: "Flexible",
      whatsapp: "+1 212 555 0246",
    },
    catalog: [
      educationCourse(
        "Business English — 6 weeks",
        "Meetings, email tone, and presentation drills for professionals.",
        960,
        [stayPhotos.education, stayPhotos.home, stayPhotos.educationBanner, stayPhotos.homeBanner],
        {
          course_type: "Language",
          duration_weeks: 6,
          batch_size: 10,
          session_hours: 1.5,
          price_hourly: 48,
          price_session: 72,
          price_course: 960,
        },
      ),
      educationCourse(
        "French A2 evening",
        "Twice weekly conversation and grammar for travelers and expats.",
        780,
        [stayPhotos.educationBanner, stayPhotos.education, stayPhotos.home, stayPhotos.homeBanner],
        {
          course_type: "Language",
          duration_weeks: 8,
          batch_size: 8,
          session_hours: 1.5,
          price_hourly: 42,
          price_session: 63,
          price_course: 780,
        },
      ),
      educationCourse(
        "Spanish conversation lab",
        "Weekend immersion hour with native tutors. Drop-in packs of four.",
        320,
        [stayPhotos.home, stayPhotos.education, stayPhotos.educationBanner, stayPhotos.homeBanner],
        {
          course_type: "Language",
          duration_weeks: 4,
          batch_size: 12,
          session_hours: 1,
          price_hourly: 40,
          price_session: 40,
          price_course: 320,
        },
      ),
      educationCourse(
        "IELTS speaking clinic",
        "Four recorded mocks with band scoring and feedback notes.",
        440,
        [stayPhotos.education, stayPhotos.educationBanner, stayPhotos.homeBanner, stayPhotos.home],
        {
          course_type: "Workshop",
          duration_weeks: 2,
          batch_size: 6,
          session_hours: 1,
          price_hourly: 110,
          price_session: 110,
          price_course: 440,
        },
      ),
    ],
  },
  {
    name: "Chelsea Vocational Lab",
    slug: "chelsea-vocational-lab",
    category: "vocational-training",
    city: "New York",
    address: "220 W 26th Street, New York, NY",
    headline: "Hands-on workshops for trades and digital skills.",
    description:
      "Workshop bays and laptop benches for electric basics, CAD intro, and hospitality certs. Tools provided on site.\n\nBook a vocational course, add your experience level, and the lab confirms kit and start date.",
    lat: 40.7462,
    lng: -73.9948,
    images: [stayPhotos.educationBanner, listingImages.electrician, stayPhotos.education, stayPhotos.home],
    years: 11,
    whatsapp: "+1 212 555 0249",
    educationFields: {
      service_hours: "8:00 AM – 6:00 PM",
      subjects: ["Career", "Soft skills"],
      modes_offered: ["In-person"],
      languages: "English, Spanish",
      cancellation_policy: "Moderate",
      whatsapp: "+1 212 555 0249",
    },
    catalog: [
      educationCourse(
        "Residential electrical basics",
        "Safe circuits, outlets, and code overview. Tool kit loaned for the week.",
        1250,
        [listingImages.electrician, stayPhotos.education, stayPhotos.educationBanner, stayPhotos.home],
        {
          course_type: "Vocational",
          duration_weeks: 3,
          batch_size: 8,
          session_hours: 4,
          price_hourly: 55,
          price_session: 220,
          price_course: 1250,
        },
      ),
      educationCourse(
        "Intro CAD for fabricators",
        "SketchUp and basic drawings for shop floors. Laptop lab included.",
        980,
        [stayPhotos.educationBanner, listingImages.furniture, stayPhotos.education, stayPhotos.home],
        {
          course_type: "Vocational",
          duration_weeks: 4,
          batch_size: 10,
          session_hours: 3,
          price_hourly: 48,
          price_session: 144,
          price_course: 980,
        },
      ),
      educationCourse(
        "Hospitality service certificate",
        "Front-of-house drills and food safety. Weekend intensive.",
        690,
        [stayPhotos.education, stayPhotos.home, stayPhotos.educationBanner, listingImages.home],
        {
          course_type: "Workshop",
          duration_weeks: 2,
          batch_size: 14,
          session_hours: 5,
          price_hourly: 40,
          price_session: 200,
          price_course: 690,
        },
      ),
      educationCourse(
        "Welding safety day",
        "PPE, setup, and bead practice on scrap plate. One full Saturday.",
        320,
        [listingImages.logistics, stayPhotos.educationBanner, stayPhotos.education, stayPhotos.home],
        {
          course_type: "Workshop",
          duration_weeks: 1,
          batch_size: 6,
          session_hours: 6,
          price_hourly: 55,
          price_session: 320,
          price_course: 320,
        },
      ),
    ],
  },
  {
    name: "Park Avenue Dental",
    slug: "park-avenue-dental",
    category: "dentists",
    city: "New York",
    address: "580 Park Avenue, New York, NY",
    headline: "Preventive and cosmetic dentistry on the Upper East Side.",
    description:
      "Quiet chairs, digital X-rays, and evening slots for busy professionals. Cleaning, whitening, and implant consults.\n\nSelect a treatment, note any sensitivity, and the front desk confirms an appointment window.",
    lat: 40.7642,
    lng: -73.9698,
    images: [stayPhotos.wellness, stayPhotos.wellnessBanner, stayPhotos.home, stayPhotos.homeBanner],
    years: 16,
    whatsapp: "+1 212 555 0252",
    healthFields: {
      service_hours: "8:00 AM – 7:00 PM Mon–Fri, Sat by appointment",
      specialties: ["Dental"],
      languages: "English",
      home_visit: false,
      cancellation_policy: "Moderate",
      whatsapp: "+1 212 555 0252",
    },
    catalog: [
      healthTreatment(
        "New patient check-up",
        "Exam, cleaning review, and digital X-rays if needed.",
        185,
        [stayPhotos.wellness, stayPhotos.wellnessBanner, stayPhotos.home, stayPhotos.homeBanner],
        {
          treatment_type: "Check-up",
          duration_minutes: 45,
          price_session: 185,
        },
      ),
      healthTreatment(
        "Deep clean and polish",
        "Scaling, polish, and fluoride. Ideal every six months.",
        240,
        [stayPhotos.wellnessBanner, stayPhotos.wellness, stayPhotos.homeBanner, stayPhotos.home],
        {
          treatment_type: "Procedure",
          duration_minutes: 60,
          price_session: 240,
        },
      ),
      healthTreatment(
        "Cosmetic whitening session",
        "In-chair whitening with take-home trays.",
        520,
        [stayPhotos.home, stayPhotos.wellness, stayPhotos.wellnessBanner, stayPhotos.homeBanner],
        {
          treatment_type: "Procedure",
          duration_minutes: 90,
          price_session: 520,
          price_package: 890,
        },
      ),
      healthTreatment(
        "Implant consultation",
        "CBCT review and treatment plan discussion. No procedure same day.",
        150,
        [stayPhotos.wellness, stayPhotos.home, stayPhotos.wellnessBanner, stayPhotos.homeBanner],
        {
          treatment_type: "Consultation",
          duration_minutes: 30,
          price_session: 150,
        },
      ),
    ],
  },
  {
    name: "East Village Clinic",
    slug: "east-village-clinic",
    category: "clinics",
    city: "New York",
    address: "55 E 4th Street, New York, NY",
    headline: "Walk-in and scheduled care for common illness and checks.",
    description:
      "General practitioners with same-week slots. Labs next door and e-prescriptions after visit.\n\nChoose a visit type, list symptoms briefly, and triage confirms whether to come in or take a tele slot.",
    lat: 40.7264,
    lng: -73.9902,
    images: [stayPhotos.wellnessBanner, stayPhotos.wellness, stayPhotos.home, listingImages.home],
    years: 8,
    whatsapp: "+1 212 555 0255",
    healthFields: {
      service_hours: "9:00 AM – 8:00 PM daily",
      specialties: ["General"],
      languages: "English, Spanish",
      home_visit: true,
      cancellation_policy: "Flexible",
      whatsapp: "+1 212 555 0255",
    },
    catalog: [
      healthTreatment(
        "GP consultation",
        "In-clinic visit for fever, colds, and routine concerns.",
        120,
        [stayPhotos.wellnessBanner, stayPhotos.wellness, stayPhotos.home, listingImages.home],
        {
          treatment_type: "Consultation",
          duration_minutes: 20,
          price_session: 120,
        },
      ),
      healthTreatment(
        "Annual wellness check",
        "Vitals, basic labs order, and lifestyle review.",
        220,
        [stayPhotos.wellness, stayPhotos.home, stayPhotos.wellnessBanner, listingImages.home],
        {
          treatment_type: "Check-up",
          duration_minutes: 40,
          price_session: 220,
        },
      ),
      healthTreatment(
        "Home visit — Manhattan",
        "Doctor to your address within selected zip codes. Same-day when available.",
        280,
        [stayPhotos.home, stayPhotos.wellnessBanner, stayPhotos.wellness, listingImages.home],
        {
          treatment_type: "Consultation",
          duration_minutes: 45,
          price_session: 280,
        },
      ),
      healthTreatment(
        "Tele follow-up",
        "Video review of results or medication adjustment.",
        75,
        [stayPhotos.wellness, stayPhotos.wellnessBanner, stayPhotos.homeBanner, stayPhotos.home],
        {
          treatment_type: "Consultation",
          duration_minutes: 15,
          price_session: 75,
        },
      ),
    ],
  },
  {
    name: "Brooklyn Physio House",
    slug: "brooklyn-physio-house",
    category: "physiotherapy",
    city: "New York",
    address: "210 Court Street, Brooklyn, NY",
    headline: "Ortho and sports physio with home visits in Brooklyn.",
    description:
      "Treatment rooms in Cobble Hill plus therapists who travel with portable tables. Post-op, back pain, and running injuries.\n\nPick a therapy session, note the injury site, and intake sends a brief questionnaire.",
    lat: 40.6868,
    lng: -73.9935,
    images: [stayPhotos.wellness, stayPhotos.home, stayPhotos.wellnessBanner, stayPhotos.homeBanner],
    years: 10,
    whatsapp: "+1 212 555 0258",
    healthFields: {
      service_hours: "7:00 AM – 8:00 PM",
      specialties: ["Physio", "Orthopedic"],
      languages: "English",
      home_visit: true,
      cancellation_policy: "Moderate",
      whatsapp: "+1 212 555 0258",
    },
    catalog: [
      healthTreatment(
        "Initial physio assessment",
        "Movement screen, plan, and first exercises. 50 minutes.",
        165,
        [stayPhotos.wellness, stayPhotos.home, stayPhotos.wellnessBanner, stayPhotos.homeBanner],
        {
          treatment_type: "Consultation",
          duration_minutes: 50,
          price_session: 165,
        },
      ),
      healthTreatment(
        "Follow-up therapy session",
        "Manual therapy and progressive loading in clinic.",
        135,
        [stayPhotos.wellnessBanner, stayPhotos.wellness, stayPhotos.home, stayPhotos.homeBanner],
        {
          treatment_type: "Therapy session",
          duration_minutes: 45,
          price_session: 135,
          price_package: 600,
        },
      ),
      healthTreatment(
        "Sports rehab block — 5 sessions",
        "Return-to-play plan for runners and court sports.",
        620,
        [stayPhotos.home, stayPhotos.wellness, stayPhotos.wellnessBanner, stayPhotos.homeBanner],
        {
          treatment_type: "Therapy session",
          duration_minutes: 45,
          price_session: 135,
          price_package: 620,
        },
      ),
      healthTreatment(
        "Home physio visit — Brooklyn",
        "Therapist with portable table. Stairs and post-op friendly.",
        190,
        [stayPhotos.homeBanner, stayPhotos.wellnessBanner, stayPhotos.home, stayPhotos.wellness],
        {
          treatment_type: "Therapy session",
          duration_minutes: 55,
          price_session: 190,
        },
      ),
    ],
  },
  {
    name: "SoHo Glow Spa",
    slug: "soho-glow-spa",
    category: "beauty-spa-wellness",
    city: "New York",
    address: "70 Mercer Street, New York, NY",
    headline: "Facials, body rituals, and quiet recovery rooms.",
    description:
      "Skin and spa therapists for lunch-break facials and longer recovery packages. Organic lines and soft lighting.\n\nSelect a spa package, note skin concerns, and the desk holds a room.",
    lat: 40.7228,
    lng: -74.0005,
    images: [stayPhotos.wellnessBanner, stayPhotos.wellness, stayPhotos.homeBanner, stayPhotos.home],
    years: 6,
    whatsapp: "+1 212 555 0261",
    healthFields: {
      service_hours: "10:00 AM – 9:00 PM",
      specialties: ["Spa", "Skin"],
      languages: "English, French",
      home_visit: false,
      cancellation_policy: "Flexible",
      whatsapp: "+1 212 555 0261",
    },
    catalog: [
      healthTreatment(
        "Signature glow facial",
        "Cleanse, extract, mask, and LED finish. 60 minutes.",
        175,
        [stayPhotos.wellnessBanner, stayPhotos.wellness, stayPhotos.homeBanner, stayPhotos.home],
        {
          treatment_type: "Spa package",
          duration_minutes: 60,
          price_session: 175,
        },
      ),
      healthTreatment(
        "Deep tissue recovery",
        "90-minute bodywork for desk tension and travel fatigue.",
        210,
        [stayPhotos.wellness, stayPhotos.home, stayPhotos.wellnessBanner, stayPhotos.homeBanner],
        {
          treatment_type: "Therapy session",
          duration_minutes: 90,
          price_session: 210,
        },
      ),
      healthTreatment(
        "Bridal skin prep package",
        "Three facials across six weeks plus a trial makeup cleanse.",
        480,
        [stayPhotos.homeBanner, stayPhotos.wellnessBanner, stayPhotos.wellness, stayPhotos.home],
        {
          treatment_type: "Spa package",
          duration_minutes: 60,
          price_session: 175,
          price_package: 480,
        },
      ),
      healthTreatment(
        "Express lunch facial",
        "30-minute refresh between meetings. No extract.",
        95,
        [stayPhotos.wellness, stayPhotos.wellnessBanner, stayPhotos.home, stayPhotos.homeBanner],
        {
          treatment_type: "Spa package",
          duration_minutes: 30,
          price_session: 95,
        },
      ),
    ],
  },
  {
    name: "Lex & Ledger Advisors",
    slug: "lex-and-ledger-advisors",
    category: "chartered-accountants",
    city: "New York",
    address: "140 Broadway, New York, NY",
    headline: "Audit, bookkeeping retainers, and year-end filings for SMEs.",
    description:
      "Chartered accountants for founders and family offices. Monthly closes, audit support, and board packs.\n\nChoose an engagement, attach last year’s statements if you have them, and a partner schedules a scoping call.",
    lat: 40.7092,
    lng: -74.0105,
    images: [stayPhotos.professional, stayPhotos.professionalBanner, stayPhotos.home, stayPhotos.homeBanner],
    years: 18,
    whatsapp: "+1 212 555 0264",
    professionalFields: {
      service_hours: "9:00 AM – 6:00 PM",
      practice_areas: ["Audit", "Tax", "Corporate"],
      languages: "English",
      remote_available: true,
      cancellation_policy: "Moderate",
      whatsapp: "+1 212 555 0264",
    },
    catalog: [
      professionalEngagement(
        "Monthly bookkeeping retainer",
        "Close, reconciliations, and management pack by the 10th.",
        1800,
        [stayPhotos.professional, stayPhotos.professionalBanner, stayPhotos.home, stayPhotos.homeBanner],
        {
          engagement_type: "Retainer",
          duration_hours: 20,
          price_hourly: 90,
          price_retainer: 1800,
        },
      ),
      professionalEngagement(
        "Year-end accounts package",
        "Financial statements and partner review for LLC or S-corp.",
        4200,
        [stayPhotos.professionalBanner, stayPhotos.professional, stayPhotos.homeBanner, stayPhotos.home],
        {
          engagement_type: "Project",
          duration_hours: 40,
          price_hourly: 105,
          price_project: 4200,
        },
      ),
      professionalEngagement(
        "Audit readiness consult",
        "Two-hour walkthrough of controls and document gaps.",
        320,
        [stayPhotos.home, stayPhotos.professional, stayPhotos.professionalBanner, stayPhotos.homeBanner],
        {
          engagement_type: "Consultation",
          duration_hours: 2,
          price_hourly: 160,
        },
      ),
      professionalEngagement(
        "Payroll filings support",
        "Quarterly filings review and correction letters if needed.",
        650,
        [stayPhotos.professional, stayPhotos.home, stayPhotos.professionalBanner, stayPhotos.homeBanner],
        {
          engagement_type: "Filing",
          duration_hours: 6,
          price_hourly: 110,
          price_project: 650,
        },
      ),
    ],
  },
  {
    name: "Harbor Counsel LLP",
    slug: "harbor-counsel-llp",
    category: "lawyers",
    city: "New York",
    address: "7 World Trade Center, New York, NY",
    headline: "Corporate and litigation counsel for growing companies.",
    description:
      "Partners who draft, negotiate, and litigate. Startups through mid-market. Remote first meetings available.\n\nSelect an engagement type, summarise the matter, and conflicts check runs before the consult.",
    lat: 40.713,
    lng: -74.013,
    images: [stayPhotos.professionalBanner, stayPhotos.professional, stayPhotos.home, listingImages.home],
    years: 22,
    whatsapp: "+1 212 555 0267",
    professionalFields: {
      service_hours: "8:30 AM – 7:00 PM",
      practice_areas: ["Corporate", "Litigation"],
      languages: "English",
      remote_available: true,
      cancellation_policy: "Strict",
      whatsapp: "+1 212 555 0267",
    },
    catalog: [
      professionalEngagement(
        "Initial legal consult",
        "One-hour scoping with a partner. Written next steps after.",
        450,
        [stayPhotos.professionalBanner, stayPhotos.professional, stayPhotos.home, listingImages.home],
        {
          engagement_type: "Consultation",
          duration_hours: 1,
          price_hourly: 450,
        },
      ),
      professionalEngagement(
        "Contract review — commercial",
        "Marked-up agreement and call to walk through redlines.",
        1800,
        [stayPhotos.professional, stayPhotos.home, stayPhotos.professionalBanner, listingImages.home],
        {
          engagement_type: "Project",
          duration_hours: 4,
          price_hourly: 450,
          price_project: 1800,
        },
      ),
      professionalEngagement(
        "Litigation retainer — month",
        "Ongoing counsel for active commercial dispute.",
        8500,
        [stayPhotos.home, stayPhotos.professionalBanner, stayPhotos.professional, listingImages.home],
        {
          engagement_type: "Retainer",
          duration_hours: 20,
          price_hourly: 425,
          price_retainer: 8500,
        },
      ),
      professionalEngagement(
        "Entity formation package",
        "Formation docs, operating agreement, and EIN guidance.",
        2400,
        [stayPhotos.professional, stayPhotos.professionalBanner, stayPhotos.homeBanner, stayPhotos.home],
        {
          engagement_type: "Project",
          duration_hours: 8,
          price_hourly: 300,
          price_project: 2400,
        },
      ),
    ],
  },
  {
    name: "Metro Tax Advisors",
    slug: "metro-tax-advisors",
    category: "tax-consultants",
    city: "New York",
    address: "350 Fifth Avenue, New York, NY",
    headline: "Personal and small-business tax planning year round.",
    description:
      "Returns, estimated payments, and residency questions for NY and multi-state filers. Secure upload portal after booking.\n\nPick a filing or planning engagement, note filing status, and an advisor confirms documents needed.",
    lat: 40.7484,
    lng: -73.9857,
    images: [stayPhotos.professional, stayPhotos.home, stayPhotos.professionalBanner, stayPhotos.homeBanner],
    years: 12,
    whatsapp: "+1 212 555 0270",
    professionalFields: {
      service_hours: "9:00 AM – 6:00 PM, evenings in tax season",
      practice_areas: ["Tax", "Strategy"],
      languages: "English, Mandarin",
      remote_available: true,
      cancellation_policy: "Flexible",
      whatsapp: "+1 212 555 0270",
    },
    catalog: [
      professionalEngagement(
        "Individual return — Form 1040",
        "Federal and NY state with e-file. Complexity tiers after review.",
        650,
        [stayPhotos.professional, stayPhotos.home, stayPhotos.professionalBanner, stayPhotos.homeBanner],
        {
          engagement_type: "Filing",
          duration_hours: 4,
          price_hourly: 160,
          price_project: 650,
        },
      ),
      professionalEngagement(
        "S-corp return package",
        "1120-S plus K-1s and estimated calendar.",
        1800,
        [stayPhotos.professionalBanner, stayPhotos.professional, stayPhotos.home, stayPhotos.homeBanner],
        {
          engagement_type: "Filing",
          duration_hours: 10,
          price_hourly: 180,
          price_project: 1800,
        },
      ),
      professionalEngagement(
        "Tax planning consult",
        "90-minute session on withholding, estimated tax, and credits.",
        275,
        [stayPhotos.home, stayPhotos.professional, stayPhotos.professionalBanner, stayPhotos.homeBanner],
        {
          engagement_type: "Consultation",
          duration_hours: 1.5,
          price_hourly: 185,
        },
      ),
      professionalEngagement(
        "Quarterly estimated retainer",
        "Four quarterly reviews and payment vouchers.",
        1200,
        [stayPhotos.professional, stayPhotos.professionalBanner, stayPhotos.homeBanner, stayPhotos.home],
        {
          engagement_type: "Retainer",
          duration_hours: 8,
          price_hourly: 150,
          price_retainer: 1200,
        },
      ),
    ],
  },
  {
    name: "Pulse Digital NYC",
    slug: "pulse-digital-nyc",
    category: "digital-marketing",
    city: "New York",
    address: "245 Fifth Avenue, New York, NY",
    headline: "Paid media, SEO, and campaign creative for local brands.",
    description:
      "A Flatiron team that runs ads, landing pages, and monthly reporting. Retail, hospitality, and B2B services.\n\nSelect a campaign or retainer, share current channels, and strategy sends a kickoff checklist.",
    lat: 40.744,
    lng: -73.987,
    images: [stayPhotos.professionalBanner, stayPhotos.professional, rentalPhotos.electronics, stayPhotos.home],
    years: 9,
    whatsapp: "+1 212 555 0273",
    professionalFields: {
      service_hours: "10:00 AM – 7:00 PM",
      practice_areas: ["Marketing", "Strategy"],
      languages: "English",
      remote_available: true,
      cancellation_policy: "Moderate",
      whatsapp: "+1 212 555 0273",
    },
    catalog: [
      professionalEngagement(
        "Strategy workshop — half day",
        "Channel audit, ICP refresh, and 90-day roadmap.",
        2400,
        [stayPhotos.professionalBanner, stayPhotos.professional, rentalPhotos.electronics, stayPhotos.home],
        {
          engagement_type: "Consultation",
          duration_hours: 4,
          price_hourly: 600,
          price_project: 2400,
        },
      ),
      professionalEngagement(
        "Paid social campaign — 30 days",
        "Creative, media buy management, and weekly optimisations. Ad spend separate.",
        3500,
        [stayPhotos.professional, rentalPhotos.electronics, stayPhotos.professionalBanner, stayPhotos.home],
        {
          engagement_type: "Campaign",
          duration_hours: 30,
          price_hourly: 120,
          price_project: 3500,
        },
      ),
      professionalEngagement(
        "SEO retainer — month",
        "Technical fixes, content briefs, and ranking report.",
        2800,
        [rentalPhotos.electronics, stayPhotos.professionalBanner, stayPhotos.professional, stayPhotos.home],
        {
          engagement_type: "Retainer",
          duration_hours: 25,
          price_hourly: 112,
          price_retainer: 2800,
        },
      ),
      professionalEngagement(
        "Landing page project",
        "Copy, design, and build for one conversion page. Analytics wiring included.",
        4200,
        [stayPhotos.professional, stayPhotos.home, stayPhotos.professionalBanner, rentalPhotos.electronics],
        {
          engagement_type: "Project",
          duration_hours: 35,
          price_hourly: 120,
          price_project: 4200,
        },
      ),
    ],
  },
  {
    name: "Borough Spark Electricians",
    slug: "borough-spark-electricians",
    category: "electricians",
    city: "New York",
    address: "312 East 23rd Street, New York, NY",
    headline: "Licensed electricians for flats, shops, and fit-outs.",
    description:
      "Call-outs, panel upgrades, and new circuit installs across Manhattan and Brooklyn. Emergency slots when breakers trip.\n\nPick a package, describe the fault or scope, and a sparky confirms timing on WhatsApp.",
    lat: 40.7378,
    lng: -73.9812,
    images: [listingImages.electrical, stayPhotos.home, listingImages.electrician],
    years: 15,
    whatsapp: "+1 212 555 0280",
    homeFields: {
      service_hours: "8:00 AM – 7:00 PM",
      job_types: ["New install", "Repair", "Emergency"],
      service_radius_km: 25,
      languages: "English, Spanish",
      cancellation_policy: "Moderate",
      whatsapp: "+1 212 555 0280",
    },
    catalog: [
      tradePackage(
        "Emergency call-out",
        "Same-day visit for tripped breakers, dead circuits, or burnt outlets.",
        180,
        [listingImages.electrical, stayPhotos.home, listingImages.electrician],
        { job_package_type: "Call-out", duration_hours: 1.5, price_hourly: 120, price_job: 180 },
      ),
      tradePackage(
        "Lighting install — room",
        "Replace or add fixtures in one room. Materials quoted separately.",
        320,
        [stayPhotos.home, listingImages.electrical, listingImages.electrician],
        { job_package_type: "Install", duration_hours: 3, price_hourly: 110, price_job: 320 },
      ),
      tradePackage(
        "Panel upgrade consult",
        "Load assessment and quote for a new consumer unit.",
        150,
        [listingImages.electrician, listingImages.electrical, stayPhotos.home],
        { job_package_type: "Full project", duration_hours: 2, price_hourly: 125, price_job: 150 },
      ),
    ],
  },
  {
    name: "PipeRight Plumbers",
    slug: "piperight-plumbers",
    category: "plumbers",
    city: "New York",
    address: "88 Ninth Avenue, New York, NY",
    headline: "Leak stops, bathroom installs, and boiler fixes.",
    description:
      "Chelsea-based plumbers for burst pipes, fixture swaps, and small renovations. Parts from trade suppliers when you need speed.\n\nSelect a job package, note access and shut-off location, and dispatch confirms ETA.",
    lat: 40.7425,
    lng: -74.0048,
    images: [listingImages.plumbing, stayPhotos.home, listingImages.home],
    years: 12,
    whatsapp: "+1 212 555 0283",
    homeFields: {
      service_hours: "7:30 AM – 6:30 PM",
      job_types: ["Repair", "New install", "Maintenance", "Emergency"],
      service_radius_km: 20,
      languages: "English",
      cancellation_policy: "Flexible",
      whatsapp: "+1 212 555 0283",
    },
    catalog: [
      tradePackage(
        "Leak diagnosis call-out",
        "Locate drip or pressure loss and temporary stop if needed.",
        160,
        [listingImages.plumbing, stayPhotos.home, listingImages.home],
        { job_package_type: "Call-out", duration_hours: 1.5, price_hourly: 115, price_job: 160 },
      ),
      tradePackage(
        "Fixture install — sink or WC",
        "Remove old unit, set new fixture, and check for leaks.",
        280,
        [stayPhotos.home, listingImages.plumbing, listingImages.home],
        { job_package_type: "Install", duration_hours: 2.5, price_hourly: 110, price_job: 280 },
      ),
      tradePackage(
        "Annual pipe flush",
        "Clear drains and check valves on a maintenance visit.",
        220,
        [listingImages.home, listingImages.plumbing, stayPhotos.home],
        { job_package_type: "Maintenance", duration_hours: 2, price_hourly: 100, price_job: 220 },
      ),
    ],
  },
  {
    name: "CoolAir AC Pros",
    slug: "coolair-ac-pros",
    category: "ac-services",
    city: "New York",
    address: "420 Lexington Avenue, New York, NY",
    headline: "Split AC install, gas top-up, and summer servicing.",
    description:
      "Window and split units for apartments and small offices. Seasonal service plans and same-week installs when stock allows.\n\nChoose a package, share make/model photos, and a tech books the slot.",
    lat: 40.7516,
    lng: -73.9755,
    images: [stayPhotos.home, listingImages.electrical, listingImages.electronics],
    years: 10,
    whatsapp: "+1 212 555 0286",
    homeFields: {
      service_hours: "8:00 AM – 8:00 PM (Apr–Sep)",
      job_types: ["New install", "Repair", "Maintenance"],
      service_radius_km: 30,
      languages: "English, Mandarin",
      cancellation_policy: "Moderate",
      whatsapp: "+1 212 555 0286",
    },
    catalog: [
      tradePackage(
        "AC service — single unit",
        "Clean filters, check gas, and test cooling performance.",
        145,
        [stayPhotos.home, listingImages.electrical, listingImages.electronics],
        { job_package_type: "Maintenance", duration_hours: 1.5, price_hourly: 95, price_job: 145 },
      ),
      tradePackage(
        "Split install — 1.5 ton",
        "Mount indoor/outdoor, vacuum line, and commission. Unit priced separate.",
        480,
        [listingImages.electrical, stayPhotos.home, listingImages.electronics],
        { job_package_type: "Install", duration_hours: 5, price_hourly: 100, price_job: 480 },
      ),
      tradePackage(
        "No-cool diagnostics",
        "Find fault on a non-cooling unit and quote parts if needed.",
        120,
        [listingImages.electronics, stayPhotos.home, listingImages.electrical],
        { job_package_type: "Repair", duration_hours: 1, price_hourly: 110, price_job: 120 },
      ),
    ],
  },
  {
    name: "Midtown Motor Works",
    slug: "midtown-motor-works",
    category: "car-repair-services",
    city: "New York",
    address: "545 West 45th Street, New York, NY",
    headline: "Diagnostics, brakes, and general service for city cars.",
    description:
      "Hell’s Kitchen workshop for sedans, SUVs, and light vans. Loaner shuttle to Midtown when jobs run long.\n\nSelect a service package, note make/model and symptoms, and the bay confirms drop-off.",
    lat: 40.7622,
    lng: -73.9965,
    images: [rentalPhotos.auto, rentalPhotos.autoBanner, listingImages.home],
    years: 17,
    whatsapp: "+1 212 555 0289",
    autoFields: {
      service_hours: "8:00 AM – 6:00 PM",
      vehicle_types: ["Car", "SUV", "Van"],
      languages: "English",
      cancellation_policy: "Moderate",
      whatsapp: "+1 212 555 0289",
    },
    catalog: [
      tradePackage(
        "Full diagnostics",
        "OBD scan, road test, and written findings with parts estimate.",
        160,
        [rentalPhotos.auto, rentalPhotos.autoBanner, listingImages.home],
        { job_package_type: "Diagnostics", duration_hours: 1.5, price_hourly: 110, price_job: 160 },
      ),
      tradePackage(
        "Brake pad & rotor service",
        "Front or rear axle. Parts billed at supplier rate.",
        420,
        [rentalPhotos.autoBanner, rentalPhotos.auto, listingImages.home],
        { job_package_type: "Repair", duration_hours: 3, price_hourly: 120, price_job: 420 },
      ),
      tradePackage(
        "Oil & filter service",
        "Synthetic oil change with multi-point check.",
        95,
        [rentalPhotos.auto, listingImages.home, rentalPhotos.autoBanner],
        { job_package_type: "General service", duration_hours: 1, price_hourly: 95, price_job: 95 },
      ),
    ],
  },
  {
    name: "TwoWheel Fix Lab",
    slug: "twowheel-fix-lab",
    category: "bike-repair-services",
    city: "New York",
    address: "190 Bowery, New York, NY",
    headline: "Bike and scooter repair for messengers and weekend riders.",
    description:
      "Lower East Side bay for chain work, brakes, electrics, and puncture flats. Same-day slots for commuters.\n\nPick a package, describe the issue, and drop off or request a roadside patch when available.",
    lat: 40.7205,
    lng: -73.9942,
    images: [rentalPhotos.autoBanner, rentalPhotos.auto, stayPhotos.home],
    years: 8,
    whatsapp: "+1 212 555 0292",
    autoFields: {
      service_hours: "10:00 AM – 7:00 PM",
      vehicle_types: ["Bike", "Scooter"],
      languages: "English, Spanish",
      cancellation_policy: "Flexible",
      whatsapp: "+1 212 555 0292",
    },
    catalog: [
      tradePackage(
        "Tune-up — city bike",
        "Gears, brakes, chain clean, and tyre pressure.",
        85,
        [rentalPhotos.autoBanner, rentalPhotos.auto, stayPhotos.home],
        { job_package_type: "General service", duration_hours: 1.5, price_hourly: 70, price_job: 85 },
      ),
      tradePackage(
        "Flat repair — tube & patch",
        "Replace tube, check rim tape, and inflate to spec.",
        35,
        [rentalPhotos.auto, stayPhotos.home, rentalPhotos.autoBanner],
        { job_package_type: "Repair", duration_hours: 0.5, price_hourly: 60, price_job: 35 },
      ),
      tradePackage(
        "E-scooter diagnostics",
        "Battery, controller, and motor checks with written report.",
        75,
        [stayPhotos.home, rentalPhotos.auto, rentalPhotos.autoBanner],
        { job_package_type: "Diagnostics", duration_hours: 1, price_hourly: 75, price_job: 75 },
      ),
    ],
  },
  {
    name: "Harbor Detailing",
    slug: "harbor-detailing",
    category: "car-wash-detailing",
    city: "New York",
    address: "Pier 57, 25 11th Avenue, New York, NY",
    headline: "Hand wash, interior detail, and ceramic prep.",
    description:
      "Hudson Yards detailing bay for daily drivers and show cars. Express wash or full interior packages.\n\nChoose a package, note vehicle size, and book a bay time.",
    lat: 40.7478,
    lng: -74.0085,
    images: [rentalPhotos.auto, stayPhotos.home, rentalPhotos.autoBanner],
    years: 6,
    whatsapp: "+1 212 555 0295",
    autoFields: {
      service_hours: "9:00 AM – 6:00 PM",
      vehicle_types: ["Car", "SUV"],
      languages: "English",
      cancellation_policy: "Flexible",
      whatsapp: "+1 212 555 0295",
    },
    catalog: [
      tradePackage(
        "Express exterior wash",
        "Hand wash, dry, and tyre shine. 45 minutes.",
        55,
        [rentalPhotos.auto, stayPhotos.home, rentalPhotos.autoBanner],
        { job_package_type: "Wash", duration_hours: 0.75, price_hourly: 70, price_job: 55 },
      ),
      tradePackage(
        "Full interior detail",
        "Vacuum, steam, leather or fabric treatment, and glass.",
        220,
        [rentalPhotos.autoBanner, rentalPhotos.auto, stayPhotos.home],
        { job_package_type: "Detailing", duration_hours: 3, price_hourly: 80, price_job: 220 },
      ),
      tradePackage(
        "Ceramic prep wash",
        "Decontaminate and polish ahead of coating. Coating sold separate.",
        350,
        [stayPhotos.home, rentalPhotos.auto, rentalPhotos.autoBanner],
        { job_package_type: "Detailing", duration_hours: 4, price_hourly: 90, price_job: 350 },
      ),
    ],
  },
  {
    name: "ScreenFix Mobile Lab",
    slug: "screenfix-mobile-lab",
    category: "mobile-phone-repair",
    city: "New York",
    address: "123 West 25th Street, New York, NY",
    headline: "Same-day screen, battery, and port repairs.",
    description:
      "Chelsea walk-in and mail-in for iPhone and Android. OEM-grade parts with a 90-day workmanship warranty.\n\nSelect a repair package, share model and issue photos, and the bench confirms parts ETA.",
    lat: 40.7448,
    lng: -73.9925,
    images: [listingImages.electronics, rentalPhotos.electronics, stayPhotos.home],
    years: 7,
    whatsapp: "+1 212 555 0298",
    electronicsFields: {
      service_hours: "10:00 AM – 8:00 PM",
      device_types: ["Phone", "Tablet"],
      languages: "English",
      cancellation_policy: "Flexible",
      whatsapp: "+1 212 555 0298",
    },
    catalog: [
      tradePackage(
        "Screen replacement — flagship",
        "Digitizer and display for recent iPhone or Pixel. Parts quoted after model check.",
        180,
        [listingImages.electronics, rentalPhotos.electronics, stayPhotos.home],
        { job_package_type: "Screen repair", duration_hours: 1.5, price_hourly: 90, price_job: 180 },
      ),
      tradePackage(
        "Battery swap",
        "Health check and genuine-capacity battery install.",
        95,
        [rentalPhotos.electronics, listingImages.electronics, stayPhotos.home],
        { job_package_type: "Battery", duration_hours: 1, price_hourly: 80, price_job: 95 },
      ),
      tradePackage(
        "Charge-port repair",
        "Clean or replace port; test data and charging.",
        110,
        [stayPhotos.home, listingImages.electronics, rentalPhotos.electronics],
        { job_package_type: "Diagnostics", duration_hours: 1.25, price_hourly: 85, price_job: 110 },
      ),
    ],
  },
  {
    name: "ByteBench Laptop Repair",
    slug: "bytebench-laptop-repair",
    category: "computer-laptop-repair",
    city: "New York",
    address: "75 Varick Street, New York, NY",
    headline: "Laptop hardware, OS rebuilds, and data recovery triage.",
    description:
      "SoHo bench for MacBooks and Windows machines. Liquid damage assessment and SSD upgrades common.\n\nPick a package, note symptoms and backups, and a tech schedules drop-off or on-site.",
    lat: 40.7238,
    lng: -74.0055,
    images: [rentalPhotos.electronics, listingImages.electronics, stayPhotos.home],
    years: 11,
    whatsapp: "+1 212 555 0301",
    electronicsFields: {
      service_hours: "9:00 AM – 7:00 PM",
      device_types: ["Laptop", "Desktop", "Tablet"],
      languages: "English",
      cancellation_policy: "Moderate",
      whatsapp: "+1 212 555 0301",
    },
    catalog: [
      tradePackage(
        "Hardware diagnostics",
        "Stress test, thermal check, and written parts list.",
        95,
        [rentalPhotos.electronics, listingImages.electronics, stayPhotos.home],
        { job_package_type: "Diagnostics", duration_hours: 1.5, price_hourly: 85, price_job: 95 },
      ),
      tradePackage(
        "OS reinstall & tune",
        "Clean install, driver pack, and data restore from backup you provide.",
        160,
        [listingImages.electronics, stayPhotos.home, rentalPhotos.electronics],
        { job_package_type: "Software", duration_hours: 2.5, price_hourly: 75, price_job: 160 },
      ),
      tradePackage(
        "SSD upgrade install",
        "Clone or fresh install onto new drive. Drive priced separate.",
        140,
        [stayPhotos.home, rentalPhotos.electronics, listingImages.electronics],
        { job_package_type: "Install", duration_hours: 2, price_hourly: 80, price_job: 140 },
      ),
    ],
  },
  {
    name: "ClearView CCTV Install",
    slug: "clearview-cctv-install",
    category: "cctv-services",
    city: "New York",
    address: "200 Park Avenue South, New York, NY",
    headline: "Camera installs, NVR setup, and remote viewing.",
    description:
      "Small-business and residential CCTV. Wired and PoE kits with app setup included.\n\nSelect an install or visit package, share floor plan photos, and a tech schedules the site survey.",
    lat: 40.7368,
    lng: -73.9885,
    images: [listingImages.electronics, rentalPhotos.electronicsBanner, stayPhotos.home],
    years: 9,
    whatsapp: "+1 212 555 0304",
    electronicsFields: {
      service_hours: "8:30 AM – 6:00 PM",
      device_types: ["CCTV", "Network"],
      languages: "English, Spanish",
      cancellation_policy: "Strict",
      whatsapp: "+1 212 555 0304",
    },
    catalog: [
      tradePackage(
        "Site survey visit",
        "Walkthrough, camera count recommendation, and quote.",
        120,
        [listingImages.electronics, rentalPhotos.electronicsBanner, stayPhotos.home],
        { job_package_type: "On-site visit", duration_hours: 1.5, price_hourly: 90, price_job: 120 },
      ),
      tradePackage(
        "4-camera PoE install",
        "Mount, cable, NVR config, and phone app. Hardware quoted after survey.",
        850,
        [rentalPhotos.electronicsBanner, listingImages.electronics, stayPhotos.home],
        { job_package_type: "Install", duration_hours: 6, price_hourly: 110, price_job: 850 },
      ),
      tradePackage(
        "Remote viewing fix",
        "Network and app troubleshooting for an existing system.",
        150,
        [stayPhotos.home, listingImages.electronics, rentalPhotos.electronicsBanner],
        { job_package_type: "Diagnostics", duration_hours: 1.5, price_hourly: 100, price_job: 150 },
      ),
    ],
  },
];

function jsonField(value: Prisma.InputJsonValue | object | undefined) {
  return value === undefined ? Prisma.DbNull : (value as Prisma.InputJsonValue);
}

function isAdminMedia(url: string | null | undefined) {
  if (!url?.startsWith("/uploads/public/")) return false;
  const uploadRoot = process.env.UPLOAD_ROOT ?? path.resolve("uploads");
  return existsSync(path.join(uploadRoot, "public", url.slice("/uploads/public/".length)));
}

function keepImages(existing: unknown, fallback: string[]) {
  if (!Array.isArray(existing)) return fallback;
  const urls = existing.filter((item): item is string => typeof item === "string" && item.length > 0);
  return urls.some((url) => url.startsWith("/uploads/")) ? urls : fallback;
}

function seedFieldData(value: string | number | boolean | string[]) {
  if (typeof value === "boolean") return { valueBool: value, valueNumber: null, valueText: null, valueJson: Prisma.DbNull };
  if (typeof value === "number") return { valueNumber: value, valueBool: null, valueText: null, valueJson: Prisma.DbNull };
  if (Array.isArray(value)) {
    return { valueJson: value as Prisma.InputJsonValue, valueText: null, valueNumber: null, valueBool: null };
  }
  return { valueText: value, valueNumber: null, valueBool: null, valueJson: Prisma.DbNull };
}

async function ancestorCategoryIds(categoryId: string, platformId: string) {
  const node = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { id: true, parent: { select: { id: true, parentId: true } } },
  });
  return [categoryId, node?.parent?.id, node?.parent?.parentId, platformId].filter(
    (id): id is string => Boolean(id),
  );
}

async function preferredFields(keys: string[], categoryIds: string[], platformId: string) {
  const rows = await prisma.categoryField.findMany({
    where: { key: { in: keys }, categoryId: { in: categoryIds } },
    select: { id: true, key: true, categoryId: true },
  });
  const preferred = new Map<string, { id: string; key: string }>();
  for (const field of rows) {
    if (field.categoryId === platformId && preferred.has(field.key)) continue;
    preferred.set(field.key, field);
  }
  return preferred;
}

async function upsertFields(categoryId: string, fields: FieldSeed[]) {
  for (const field of fields) {
    const options = jsonField(field.options);
    const validation = jsonField(field.validation);
    const conditionalRules = jsonField(field.conditionalRules);
    await prisma.categoryField.upsert({
      where: { categoryId_key: { categoryId, key: field.key } },
      update: {
        label: field.label,
        helpText: field.helpText ?? null,
        placeholder: field.placeholder ?? null,
        fieldType: field.fieldType,
        required: field.required ?? false,
        section: field.section ?? null,
        sortOrder: field.sortOrder,
        options,
        validation,
        conditionalRules,
        isActive: true,
        scope: field.scope,
      },
      create: {
        categoryId,
        key: field.key,
        label: field.label,
        helpText: field.helpText ?? null,
        placeholder: field.placeholder ?? null,
        fieldType: field.fieldType,
        required: field.required ?? false,
        section: field.section ?? null,
        sortOrder: field.sortOrder,
        options,
        validation,
        conditionalRules,
        scope: field.scope,
        isActive: true,
      },
    });
  }
}

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  await ensureRbacCatalog(prisma);

  const demoUsers = [
    { name: "Demo User", email: "user@demo.com", role: Role.user },
    { name: "Demo Business", email: "business@demo.com", role: Role.business },
    { name: "Demo Admin", email: "admin@demo.com", role: Role.admin },
    ...Array.from({ length: 9 }, (_, index) => ({
      name: `Concierge Reviewer ${index + 1}`,
      email: `reviewer${index + 1}@demo.com`,
      role: Role.user,
    })),
  ];

  const users = new Map<string, { id: string }>();
  for (const user of demoUsers) {
    const saved = await prisma.user.upsert({
      where: { email: user.email },
      update: { name: user.name, role: user.role, passwordHash, emailVerifiedAt: new Date() },
      create: { ...user, passwordHash, emailVerifiedAt: new Date() },
      select: { id: true, role: true },
    });
    users.set(user.email, saved);
    await assignDefaultRoleForLegacy(saved.id, saved.role);
  }

  const categoryIds = new Map<string, string>();
  const categoryKinds = new Map<string, "supplier" | "service">();

  const platform = await prisma.category.upsert({
    where: { slug: PLATFORM_CATEGORY_SLUG },
    update: { name: "Platform common fields", isActive: true, sortOrder: 0 },
    create: { name: "Platform common fields", slug: PLATFORM_CATEGORY_SLUG, isActive: true, sortOrder: 0 },
  });
  categoryIds.set(PLATFORM_CATEGORY_SLUG, platform.id);

  for (const category of phase1Mains) {
    const existing = await prisma.category.findUnique({
      where: { slug: category.slug },
      select: { imageUrl: true, bannerUrl: true },
    });
    const saved = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        ...category,
        parentId: null,
        isActive: true,
        imageUrl: isAdminMedia(existing?.imageUrl) ? existing.imageUrl : category.imageUrl,
        bannerUrl: isAdminMedia(existing?.bannerUrl) ? existing.bannerUrl : category.bannerUrl,
      },
      create: { ...category, isActive: true },
    });
    categoryIds.set(category.slug, saved.id);
    categoryKinds.set(category.slug, category.kind);
  }

  for (const category of phase1Subs) {
    const { parentSlug, ...data } = category;
    const parentId = categoryIds.get(parentSlug);
    if (!parentId) throw new Error(`Missing parent category ${parentSlug}`);
    const existing = await prisma.category.findUnique({
      where: { slug: data.slug },
      select: { imageUrl: true, bannerUrl: true },
    });
    const saved = await prisma.category.upsert({
      where: { slug: data.slug },
      update: {
        ...data,
        parentId,
        isActive: true,
        imageUrl: isAdminMedia(existing?.imageUrl) ? existing.imageUrl : data.imageUrl,
        bannerUrl: isAdminMedia(existing?.bannerUrl) ? existing.bannerUrl : data.bannerUrl,
      },
      create: { ...data, parentId, isActive: true },
    });
    categoryIds.set(data.slug, saved.id);
    categoryKinds.set(data.slug, data.kind);
  }

  const keepRootSlugs = [...phase1Mains.map((item) => item.slug), PLATFORM_CATEGORY_SLUG];
  await prisma.category.updateMany({
    where: { parentId: null, slug: { notIn: keepRootSlugs } },
    data: { isActive: false },
  });
  const keepChildSlugs = phase1Subs.map((item) => item.slug);
  await prisma.category.updateMany({
    where: { parentId: { not: null }, slug: { notIn: keepChildSlugs } },
    data: { isActive: false },
  });

  await upsertFields(platform.id, [...platformProviderFields, ...platformListingFields]);
  const healthId = categoryIds.get("health-wellness");
  if (healthId) await upsertFields(healthId, [...healthWellnessFields, ...healthVendorFields, ...healthServiceFields]);
  const educationId = categoryIds.get("education-training");
  if (educationId) await upsertFields(educationId, [...educationVendorFields, ...educationCourseFields]);
  const professionalId = categoryIds.get("professional-business");
  if (professionalId) await upsertFields(professionalId, [...professionalVendorFields, ...professionalServiceFields]);
  const rentalHireId = categoryIds.get("rental-hire");
  if (rentalHireId) await upsertFields(rentalHireId, [...rentalVendorFields, ...rentalHireListingFields]);
  const travelId = categoryIds.get("travel-taxi-transport");
  if (travelId) await upsertFields(travelId, [...travelOperatorFields, ...travelVehicleFields]);
  const eventsId = categoryIds.get("events-lifestyle");
  if (eventsId) await upsertFields(eventsId, [...eventVendorFields, ...eventPackageFields]);
  const logisticsId = categoryIds.get("logistics-other");
  if (logisticsId) await upsertFields(logisticsId, [...logisticsVendorFields, ...logisticsOfferingFields]);
  const stayId = categoryIds.get("hotels-resorts-stays");
  if (stayId) {
    await upsertFields(stayId, [...stayPropertyFields, ...stayRoomFields]);
    await prisma.categoryField.updateMany({
      where: { categoryId: stayId, key: "facilities" },
      data: { isActive: false },
    });
  }
  const homeId = categoryIds.get("home-property");
  if (homeId) await upsertFields(homeId, [...homeTradeVendorFields, ...homeTradePackageFields]);
  const autoId = categoryIds.get("automotive");
  if (autoId) await upsertFields(autoId, [...autoTradeVendorFields, ...autoTradePackageFields]);
  const electronicsId = categoryIds.get("electronics-technology");
  if (electronicsId) await upsertFields(electronicsId, [...electronicsTradeVendorFields, ...electronicsTradePackageFields]);
  for (const [slug, fields] of Object.entries(exampleSubcategoryFields)) {
    const id = categoryIds.get(slug);
    if (id) await upsertFields(id, fields);
  }

  for (const [fromSlug, toSlug] of Object.entries(demoBusinessCategoryMap)) {
    const fromId = (await prisma.category.findUnique({ where: { slug: fromSlug } }))?.id;
    const toId = categoryIds.get(toSlug);
    if (fromId && toId) {
      await prisma.listing.updateMany({ where: { categoryId: fromId }, data: { categoryId: toId } });
      await prisma.service.updateMany({ where: { categoryId: fromId }, data: { categoryId: toId } });
    }
  }

  const platformFields = new Map(
    (
      await prisma.categoryField.findMany({
        where: { categoryId: platform.id },
        select: { id: true, key: true },
      })
    ).map((field) => [field.key, field.id]),
  );

  const retiredSlugs = ["coastal-wheels"];
  for (const slug of retiredSlugs) {
    const retired = await prisma.business.findUnique({ where: { slug }, select: { id: true } });
    if (retired) await prisma.business.delete({ where: { id: retired.id } });
  }

  const businessIds: string[] = [];
  for (const [index, item] of businesses.entries()) {
    const existingBusiness = await prisma.business.findUnique({
      where: { slug: item.slug },
      select: { coverUrl: true, listing: { select: { images: true } } },
    });
    const coverUrl = isAdminMedia(existingBusiness?.coverUrl) ? existingBusiness.coverUrl : item.images[0];
    const listingImagesKept = keepImages(existingBusiness?.listing?.images, item.images);
    const business = await prisma.business.upsert({
      where: { slug: item.slug },
      update: {
        name: item.name,
        email: `hello@${item.slug}.example`,
        verified: true,
        status: BusinessStatus.active,
        coverUrl,
        phone: item.whatsapp ?? "+1 212 555 0100",
        socialLinks: {
          instagram: `https://instagram.com/${item.slug}`,
        },
      },
      create: {
        ownerId: users.get("business@demo.com")!.id,
        name: item.name,
        slug: item.slug,
        email: `hello@${item.slug}.example`,
        phone: item.whatsapp ?? "+1 212 555 0100",
        verified: true,
        status: BusinessStatus.active,
        coverUrl,
        socialLinks: {
          instagram: `https://instagram.com/${item.slug}`,
        },
      },
    });
    businessIds.push(business.id);
    const categoryId = categoryIds.get(item.category);
    if (!categoryId) throw new Error(`Missing seeded category ${item.category}`);
    const categoryKind = categoryKinds.get(item.category) ?? "supplier";
    const listing = await prisma.listing.upsert({
      where: { businessId: business.id },
      update: {
        categoryId,
        listingKind: categoryKind,
        title: item.headline ?? item.name,
        description: item.description,
        address: item.address,
        city: item.city,
        lat: item.lat,
        lng: item.lng,
        images: listingImagesKept,
        featured: index < 2 || Boolean(item.stayFields) || Boolean(item.rentalFields) || Boolean(item.travelFields) || Boolean(item.eventFields) || Boolean(item.logisticsFields) || Boolean(item.educationFields) || Boolean(item.healthFields) || Boolean(item.professionalFields) || Boolean(item.homeFields) || Boolean(item.autoFields) || Boolean(item.electronicsFields),
      },
      create: {
        businessId: business.id,
        categoryId,
        listingKind: categoryKind,
        title: item.headline ?? item.name,
        description: item.description,
        address: item.address,
        city: item.city,
        lat: item.lat,
        lng: item.lng,
        hours: {
          monday: ["09:00", "18:00"],
          tuesday: ["09:00", "18:00"],
          wednesday: ["09:00", "18:00"],
          thursday: ["09:00", "18:00"],
          friday: ["09:00", "18:00"],
          saturday: ["10:00", "16:00"],
          sunday: null,
        },
        images: listingImagesKept,
        website: `https://${item.slug}.example`,
        featured: index < 2 || Boolean(item.stayFields) || Boolean(item.rentalFields) || Boolean(item.travelFields) || Boolean(item.eventFields) || Boolean(item.logisticsFields) || Boolean(item.educationFields) || Boolean(item.healthFields) || Boolean(item.professionalFields) || Boolean(item.homeFields) || Boolean(item.autoFields) || Boolean(item.electronicsFields),
      },
    });

    const yearsFieldId = platformFields.get("years_of_experience");
    const emergencyFieldId = platformFields.get("emergency_timing");
    const emergencyFlagId = platformFields.get("emergency_service");
    if (item.years != null && yearsFieldId) {
      await prisma.listingFieldValue.upsert({
        where: { listingId_fieldId: { listingId: listing.id, fieldId: yearsFieldId } },
        update: { valueNumber: item.years },
        create: { listingId: listing.id, fieldId: yearsFieldId, valueNumber: item.years },
      });
    }
    if (item.supportTurnaround && emergencyFieldId) {
      if (emergencyFlagId) {
        await prisma.listingFieldValue.upsert({
          where: { listingId_fieldId: { listingId: listing.id, fieldId: emergencyFlagId } },
          update: { valueBool: true },
          create: { listingId: listing.id, fieldId: emergencyFlagId, valueBool: true },
        });
      }
      await prisma.listingFieldValue.upsert({
        where: { listingId_fieldId: { listingId: listing.id, fieldId: emergencyFieldId } },
        update: { valueText: item.supportTurnaround },
        create: { listingId: listing.id, fieldId: emergencyFieldId, valueText: item.supportTurnaround },
      });
    }

    const listingShopFields: Array<[string, string | number | boolean | string[]]> = [];
    if (item.orderModes?.length) listingShopFields.push(["order_modes", item.orderModes]);
    if (item.minOrderQty != null) listingShopFields.push(["min_order_qty", item.minOrderQty]);
    if (item.sellsSinglePiece != null) listingShopFields.push(["sells_single_piece", item.sellsSinglePiece]);
    if (item.wholesale != null) listingShopFields.push(["wholesale_available", item.wholesale]);
    if (item.whatsapp) listingShopFields.push(["whatsapp", item.whatsapp]);
    for (const [key, value] of listingShopFields) {
      const fieldId = platformFields.get(key);
      if (!fieldId) continue;
      await prisma.listingFieldValue.upsert({
        where: { listingId_fieldId: { listingId: listing.id, fieldId } },
        update: seedFieldData(value),
        create: { listingId: listing.id, fieldId, ...seedFieldData(value) },
      });
    }

    const verticalListingFields = item.stayFields ?? item.rentalFields ?? item.travelFields ?? item.eventFields ?? item.logisticsFields ?? item.educationFields ?? item.healthFields ?? item.professionalFields ?? item.homeFields ?? item.autoFields ?? item.electronicsFields;
    if (verticalListingFields) {
      const fieldCategoryIds = await ancestorCategoryIds(categoryId, platform.id);
      const preferredVertical = await preferredFields(Object.keys(verticalListingFields), fieldCategoryIds, platform.id);
      for (const field of preferredVertical.values()) {
        const value = verticalListingFields[field.key];
        if (value === undefined) continue;
        await prisma.listingFieldValue.upsert({
          where: { listingId_fieldId: { listingId: listing.id, fieldId: field.id } },
          update: seedFieldData(value),
          create: { listingId: listing.id, fieldId: field.id, ...seedFieldData(value) },
        });
      }
    }

    const catalog = item.catalog ?? [
      {
        name: "Design consultation",
        description: "A one-hour consultation to scope your project and recommend next steps.",
        price: 150,
        images: [] as string[],
      },
    ];
    const catalogNames = catalog.map((entry) => entry.name);
    await prisma.service.deleteMany({
      where: item.stayFields || item.rentalFields || item.travelFields || item.eventFields || item.logisticsFields || item.educationFields || item.healthFields || item.professionalFields || item.homeFields || item.autoFields || item.electronicsFields
        ? { businessId: business.id }
        : { businessId: business.id, name: { in: ["Design consultation", ...catalogNames] } },
    });
    for (const entry of catalog) {
      const service = await prisma.service.create({
        data: {
          businessId: business.id,
          categoryId,
          name: entry.name,
          description: entry.description,
          price: entry.price,
          currency: "USD",
          pricingType: entry.pricingType ?? null,
          durationMinutes: entry.pricingType ? null : 60,
          isActive: true,
          approvalStatus: "approved",
          images: entry.images,
        },
      });
      if (entry.fields) {
        const fieldCategoryIds = await ancestorCategoryIds(categoryId, platform.id);
        const preferred = await preferredFields(Object.keys(entry.fields), fieldCategoryIds, platform.id);
        for (const field of preferred.values()) {
          const value = entry.fields[field.key];
          if (value === undefined) continue;
          await prisma.serviceFieldValue.upsert({
            where: { serviceId_fieldId: { serviceId: service.id, fieldId: field.id } },
            update: seedFieldData(value),
            create: { serviceId: service.id, fieldId: field.id, ...seedFieldData(value) },
          });
        }
      }
    }
  }

  const reviewerEmails = ["user@demo.com", ...Array.from({ length: 9 }, (_, index) => `reviewer${index + 1}@demo.com`)];
  const scoreSets = [
    [5, 5, 5, 5, 5, 5, 5, 5, 4, 4],
    [5, 5, 5, 5, 5, 5, 5, 5, 5, 4],
    [5, 5, 5, 5, 5, 5, 5, 5, 5, 4],
    [5, 5, 5, 5, 5, 5, 5, 5, 4, 4],
    [5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
    [5, 5, 5, 5, 5, 5, 5, 4, 4, 4],
    [5, 5, 5, 5, 5, 5, 4, 4, 4, 4],
    [5, 5, 5, 5, 5, 5, 5, 5, 5, 4],
    [5, 5, 5, 5, 5, 5, 5, 4, 4, 4],
  ];

  for (const [businessIndex, businessId] of businessIds.entries()) {
    for (const [reviewerIndex, email] of reviewerEmails.entries()) {
      const userId = users.get(email)!.id;
      const rating = (scoreSets[businessIndex] ?? scoreSets[0])[reviewerIndex];
      await prisma.review.upsert({
        where: { userId_businessId: { userId, businessId } },
        update: { rating, comment: "Exceptional service, thoughtful communication, and outstanding craftsmanship." },
        create: {
          userId,
          businessId,
          rating,
          comment: "Exceptional service, thoughtful communication, and outstanding craftsmanship.",
        },
      });
    }
    const aggregate = await prisma.review.aggregate({
      where: { businessId },
      _avg: { rating: true },
      _count: { rating: true },
    });
    await prisma.listing.update({
      where: { businessId },
      data: {
        avgRating: aggregate._avg.rating ?? 0,
        reviewCount: aggregate._count.rating,
      },
    });
  }

  console.log(
    `[seed] upserted RBAC catalog, ${phase1Mains.length} mains, ${phase1Subs.length} subcategories, ${businesses.length} businesses, and demo reviews`,
  );
}

main()
  .catch((error) => {
    console.error("[seed] failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
