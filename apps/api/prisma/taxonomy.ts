import { PLATFORM_CATEGORY_SLUG } from "../src/config/constants.js";

export { PLATFORM_CATEGORY_SLUG };

const catalogPhotos = [
  "/assets/heritage-estate.jpg",
  "/assets/builders-hero.jpg",
  "/assets/concierge-architectural-hero.jpg",
  "/assets/aura-showroom.jpg",
  "/assets/brett-villa.jpg",
  "/assets/terra-stone.jpg",
  "/assets/arcadian-desert.jpg",
  "/assets/elite-plans.jpg",
  "/assets/aura-chair.jpg",
  "/assets/aura-craft.jpg",
  "/assets/elite-slab.jpg",
] as const;

function catalogImage(index: number, offset = 0) {
  return catalogPhotos[(index + offset + catalogPhotos.length) % catalogPhotos.length];
}

export type MainCategorySeed = {
  name: string;
  slug: string;
  icon: string;
  sortOrder: number;
  description: string;
  imageUrl: string;
  bannerUrl: string;
};

export type SubCategorySeed = {
  name: string;
  slug: string;
  parentSlug: string;
  icon: string;
  sortOrder: number;
  description: string;
  imageUrl: string;
  bannerUrl: string;
};

export type FieldSeed = {
  key: string;
  label: string;
  fieldType:
    | "text"
    | "textarea"
    | "number"
    | "boolean"
    | "select"
    | "multiselect"
    | "asset_ref"
    | "asset_gallery";
  scope: "listing" | "service" | "business";
  required?: boolean;
  helpText?: string;
  placeholder?: string;
  section?: string;
  sortOrder: number;
  options?: string[];
  validation?: { min?: number; max?: number; minLength?: number; maxLength?: number };
  conditionalRules?: { fieldKey: string; equals?: string | number | boolean | null };
};

export const phase1Mains: MainCategorySeed[] = [
  {
    name: "Home & Property",
    slug: "home-property",
    icon: "home_repair_service",
    sortOrder: 1,
    description: "Electricians, plumbers, interiors, real estate, and home services.",
    imageUrl: catalogImage(0),
    bannerUrl: catalogImage(0, 4),
  },
  {
    name: "Automotive",
    slug: "automotive",
    icon: "directions_car",
    sortOrder: 2,
    description: "Vehicle repair, hire, wash, towing, and related services.",
    imageUrl: catalogImage(1),
    bannerUrl: catalogImage(1, 4),
  },
  {
    name: "Electronics & Technology",
    slug: "electronics-technology",
    icon: "devices",
    sortOrder: 3,
    description: "Device repair, IT, CCTV, and digital specialists.",
    imageUrl: catalogImage(2),
    bannerUrl: catalogImage(2, 4),
  },
  {
    name: "Professional & Business",
    slug: "professional-business",
    icon: "business_center",
    sortOrder: 4,
    description: "Legal, tax, accounting, marketing, and consulting.",
    imageUrl: catalogImage(3),
    bannerUrl: catalogImage(3, 4),
  },
  {
    name: "Health & Wellness",
    slug: "health-wellness",
    icon: "medical_services",
    sortOrder: 5,
    description: "Clinics, home care, spa, and wellness professionals.",
    imageUrl: catalogImage(4),
    bannerUrl: catalogImage(4, 4),
  },
  {
    name: "Education & Training",
    slug: "education-training",
    icon: "school",
    sortOrder: 6,
    description: "Coaching, tuition, vocational and hobby classes.",
    imageUrl: catalogImage(5),
    bannerUrl: catalogImage(5, 4),
  },
  {
    name: "Events & Lifestyle",
    slug: "events-lifestyle",
    icon: "celebration",
    sortOrder: 7,
    description: "Weddings, photography, catering, and lifestyle services.",
    imageUrl: catalogImage(6),
    bannerUrl: catalogImage(6, 4),
  },
  {
    name: "Logistics & Other Services",
    slug: "logistics-other",
    icon: "local_shipping",
    sortOrder: 8,
    description: "Courier, movers, transport, security, and local trades.",
    imageUrl: catalogImage(7),
    bannerUrl: catalogImage(7, 4),
  },
  {
    name: "Hotels, Resorts & Stays",
    slug: "hotels-resorts-stays",
    icon: "hotel",
    sortOrder: 9,
    description: "Hotels, resorts, homestays, villas, and other places to stay.",
    imageUrl: catalogImage(8),
    bannerUrl: catalogImage(8, 4),
  },
  {
    name: "Rental & Hire",
    slug: "rental-hire",
    icon: "key",
    sortOrder: 10,
    description: "Generic rental for vehicles, electronics, events, outdoor gear, tools, and furniture.",
    imageUrl: catalogImage(9),
    bannerUrl: catalogImage(9, 4),
  },
  {
    name: "Travel, Taxi & Transport",
    slug: "travel-taxi-transport",
    icon: "local_taxi",
    sortOrder: 11,
    description: "Taxi, cab, airport transfers, tours, and passenger transport.",
    imageUrl: catalogImage(10),
    bannerUrl: catalogImage(10, 4),
  },
];

export const phase1Subs: SubCategorySeed[] = [
  ...namedSubs("home-property", [
    ["Electricians", "electricians", "electrical_services"],
    ["Plumbers", "plumbers", "plumbing"],
    ["AC Services", "ac-services", "ac_unit"],
    ["Interior Designers", "interior-designers", "chair"],
    ["Painting Contractors", "painting-contractors", "format_paint"],
    ["Carpenter Services", "carpenter-services", "handyman"],
    ["Furniture Repair", "furniture-repair", "weekend"],
    ["Housekeeping", "housekeeping", "cleaning_services"],
    ["Pest Control", "pest-control", "bug_report"],
    ["Home Security", "home-security", "security"],
    ["Real Estate", "real-estate-services", "apartment"],
  ]),
  ...namedSubs("automotive", [
    ["Car Repair & Services", "car-repair-services", "car_repair"],
    ["Bike Repair & Services", "bike-repair-services", "two_wheeler"],
    ["Car Hire / Rental", "car-hire-rental", "car_rental"],
    ["Car Wash & Detailing", "car-wash-detailing", "local_car_wash"],
    ["Vehicle Towing", "vehicle-towing", "rv_hookup"],
    ["Vehicle Transport", "vehicle-transport", "local_shipping"],
    ["Tyre & Wheel Services", "tyre-wheel-services", "tire_repair"],
    ["Battery Services", "battery-services", "battery_charging_full"],
  ]),
  ...namedSubs("electronics-technology", [
    ["Computer & Laptop Repair", "computer-laptop-repair", "laptop"],
    ["Mobile Phone Repair", "mobile-phone-repair", "phone_iphone"],
    ["Website Designers", "website-designers", "language"],
    ["CCTV Services", "cctv-services", "videocam"],
    ["IT Services", "it-services", "dns"],
    ["Computer Training", "computer-training", "computer"],
    ["Electronics Repair", "electronics-repair", "memory"],
    ["Networking Services", "networking-services", "lan"],
    ["Printer Repair", "printer-repair", "print"],
  ]),
  ...namedSubs("professional-business", [
    ["Chartered Accountants", "chartered-accountants", "calculate"],
    ["Lawyers", "lawyers", "gavel"],
    ["Registration Consultants", "registration-consultants", "assignment"],
    ["Tax Consultants", "tax-consultants", "request_quote"],
    ["Accounting Services", "accounting-services", "account_balance"],
    ["Placement Services", "placement-services", "work"],
    ["Recruitment Services", "recruitment-services", "groups"],
    ["Digital Marketing", "digital-marketing", "campaign"],
    ["Printing & Publishing", "printing-publishing", "menu_book"],
    ["Business Consultants", "business-consultants", "handshake"],
  ]),
  ...namedSubs("health-wellness", [
    ["Dentists", "dentists", "dentistry"],
    ["Dermatologists", "dermatologists", "spa"],
    ["Hospitals", "hospitals", "local_hospital"],
    ["Clinics", "clinics", "medical_services"],
    ["Nursing Services", "nursing-services", "health_and_safety"],
    ["Physiotherapy", "physiotherapy", "accessibility"],
    ["Home Healthcare", "home-healthcare", "home_health"],
    ["Diagnostic Centers", "diagnostic-centers", "biotech"],
    ["Beauty Spa", "beauty-spa-wellness", "spa"],
    ["Body Massage & Wellness", "body-massage-wellness", "self_improvement"],
  ]),
  ...namedSubs("education-training", [
    ["Coaching", "coaching", "school"],
    ["Tuition", "tuition", "menu_book"],
    ["Computer Training", "computer-training-courses", "computer"],
    ["Vocational Training", "vocational-training", "engineering"],
    ["Skill Development", "skill-development", "psychology"],
    ["Language Training", "language-training", "translate"],
    ["Music Classes", "music-classes", "music_note"],
    ["Dance Classes", "dance-classes", "nightlife"],
    ["Art Classes", "art-classes", "palette"],
    ["Hobby Classes", "hobby-classes", "interests"],
  ]),
  ...namedSubs("events-lifestyle", [
    ["Event Organizers", "event-organizers", "event"],
    ["Photographers", "photographers", "photo_camera"],
    ["Videographers", "videographers", "videocam"],
    ["Caterers", "caterers", "room_service"],
    ["Wedding Services", "wedding-services", "favorite"],
    ["Event Decoration", "event-decoration", "celebration"],
    ["DJs & Music", "djs-music", "headphones"],
    ["Makeup Artists", "makeup-artists", "brush"],
    ["Jewellery Showrooms", "jewellery-showrooms", "diamond"],
    ["Astrologers", "astrologers", "nights_stay"],
  ]),
  ...namedSubs("logistics-other", [
    ["Courier Services", "courier-services", "local_post_office"],
    ["Packers & Movers", "packers-movers", "moving"],
    ["Transporters", "transporters", "local_shipping"],
    ["Scrap Dealers", "scrap-dealers", "recycling"],
    ["Scrap Buyers", "scrap-buyers", "recycling"],
    ["Fabricators", "fabricators", "precision_manufacturing"],
    ["Security Services", "security-services", "security"],
    ["Other Local Services", "other-local-services", "handyman"],
  ]),
  ...namedSubs("hotels-resorts-stays", [
    ["Hotels", "hotels", "hotel"],
    ["Resorts", "resorts", "beach_access"],
    ["Homestays", "homestays", "cottage"],
    ["Villas", "villas", "villa"],
    ["Serviced Apartments", "serviced-apartments", "apartment"],
    ["Guest Houses", "guest-houses", "house"],
    ["Hostels", "hostels", "bunk_bed"],
    ["Boutique Hotels", "boutique-hotels", "nightlife"],
    ["Farm Stays", "farm-stays", "agriculture"],
    ["Cottages", "cottages", "cottage"],
    ["Camping / Glamping", "camping-glamping", "camping"],
  ]),
  ...namedSubs("rental-hire", [
    ["Vehicle Rental", "vehicle-rental", "directions_car"],
    ["Electronics Rental", "electronics-rental", "devices"],
    ["Event Equipment", "event-equipment", "event"],
    ["Outdoor & Travel", "outdoor-travel", "hiking"],
    ["Tools & Equipment", "tools-equipment", "handyman"],
    ["Furniture Rental", "furniture-rental", "chair"],
  ]),
  ...namedSubs("vehicle-rental", [
    ["Car Rental", "car-rental", "directions_car"],
    ["Bike Rental", "bike-rental", "two_wheeler"],
    ["Scooter Rental", "scooter-rental", "electric_moped"],
    ["Van Rental", "van-rental", "airport_shuttle"],
    ["Commercial Vehicle Rental", "commercial-vehicle-rental", "local_shipping"],
  ]),
  ...namedSubs("electronics-rental", [
    ["Camera", "camera-rental", "photo_camera"],
    ["Lens", "lens-rental", "camera_roll"],
    ["Drone", "drone-rental", "flight"],
    ["Projector", "projector-rental", "videocam"],
    ["Laptop", "laptop-rental", "laptop"],
    ["Speaker", "speaker-rental", "speaker"],
  ]),
  ...namedSubs("event-equipment", [
    ["Chairs", "event-chairs", "event_seat"],
    ["Tables", "event-tables", "table_restaurant"],
    ["Sound Systems", "sound-systems", "speaker"],
    ["Lighting", "event-lighting", "lightbulb"],
    ["Party Equipment", "party-equipment", "celebration"],
  ]),
  ...namedSubs("outdoor-travel", [
    ["Camping Equipment", "camping-equipment", "camping"],
    ["Trekking Equipment", "trekking-equipment", "hiking"],
    ["Adventure Equipment", "adventure-equipment", "downhill_skiing"],
  ]),
  ...namedSubs("tools-equipment", [
    ["Power Tools", "power-tools", "handyman"],
    ["Construction Equipment", "construction-equipment", "precision_manufacturing"],
    ["Generators", "generators", "bolt"],
    ["Agricultural Equipment", "agricultural-equipment", "agriculture"],
  ]),
  ...namedSubs("furniture-rental", [
    ["Home Furniture", "home-furniture", "chair"],
    ["Office Furniture", "office-furniture", "desk"],
    ["Event Furniture", "event-furniture", "event_seat"],
  ]),
  ...namedSubs("travel-taxi-transport", [
    ["Taxi Services", "taxi-services", "local_taxi"],
    ["Cab Services", "cab-services", "local_taxi"],
    ["Airport Transfers", "airport-transfers", "flight"],
    ["Outstation Taxi", "outstation-taxi", "directions_car"],
    ["Local Taxi", "local-taxi", "local_taxi"],
    ["Bike Taxi", "bike-taxi", "two_wheeler"],
    ["Auto Services", "auto-services", "electric_rickshaw"],
    ["Bus Services", "bus-services", "directions_bus"],
    ["Tour Operators", "tour-operators", "tour"],
    ["Travel Agencies", "travel-agencies", "map"],
    ["Chauffeur Services", "chauffeur-services", "airline_seat_recline_extra"],
  ]),
];

/** Demo businesses from the previous seed → nearest Phase 1 subcategory. */
export const demoBusinessCategoryMap: Record<string, string> = {
  "material-suppliers": "fabricators",
  "home-decor": "interior-designers",
  "architects-builders": "interior-designers",
};

export const platformProviderFields: FieldSeed[] = [
  {
    key: "years_of_experience",
    label: "Years of experience",
    fieldType: "number",
    scope: "listing",
    section: "Credentials",
    sortOrder: 1,
    validation: { min: 0, max: 80 },
    placeholder: "e.g. 8",
  },
  {
    key: "business_type",
    label: "Business type",
    fieldType: "select",
    scope: "listing",
    section: "Business",
    sortOrder: 2,
    options: ["Individual", "Small Business", "Company", "Shop", "Agency", "Other"],
  },
  {
    key: "license_number",
    label: "Business license",
    fieldType: "text",
    scope: "listing",
    section: "Documents",
    sortOrder: 3,
    helpText: "Registration or trade license. Super Admin can require this per category.",
    validation: { minLength: 3, maxLength: 64 },
  },
  {
    key: "emergency_service",
    label: "Emergency service",
    fieldType: "boolean",
    scope: "listing",
    section: "Service area",
    sortOrder: 4,
  },
  {
    key: "emergency_timing",
    label: "Emergency service timing",
    fieldType: "text",
    scope: "listing",
    section: "Service area",
    sortOrder: 5,
    placeholder: "e.g. 24/7 or 8pm–8am",
    conditionalRules: { fieldKey: "emergency_service", equals: true },
  },
  {
    key: "home_visit",
    label: "Home visit available",
    fieldType: "boolean",
    scope: "listing",
    section: "Service area",
    sortOrder: 6,
  },
  {
    key: "service_radius_km",
    label: "Service radius (km)",
    fieldType: "number",
    scope: "listing",
    section: "Service area",
    sortOrder: 7,
    validation: { min: 1, max: 500 },
    conditionalRules: { fieldKey: "home_visit", equals: true },
  },
];

export const platformListingFields: FieldSeed[] = [
  {
    key: "availability",
    label: "Availability",
    fieldType: "select",
    scope: "service",
    section: "Listing",
    sortOrder: 1,
    options: ["Weekdays", "Weekends", "24/7", "By appointment"],
  },
  {
    key: "contact_option",
    label: "Preferred contact",
    fieldType: "select",
    scope: "service",
    section: "Listing",
    sortOrder: 2,
    options: ["Call", "WhatsApp", "Message", "Any"],
  },
];

export const exampleSubcategoryFields: Record<string, FieldSeed[]> = {
  electricians: [
    {
      key: "years_of_experience",
      label: "Years of electrical experience",
      fieldType: "number",
      scope: "listing",
      required: true,
      section: "Credentials",
      sortOrder: 1,
      validation: { min: 0, max: 80 },
    },
    {
      key: "electrical_services",
      label: "Electrical services",
      fieldType: "multiselect",
      scope: "listing",
      required: true,
      section: "Services",
      sortOrder: 2,
      options: ["Wiring", "Lighting", "Switchboard", "Inverter", "Solar electrical work"],
    },
    {
      key: "residential_commercial",
      label: "Residential / Commercial",
      fieldType: "select",
      scope: "listing",
      required: true,
      section: "Services",
      sortOrder: 3,
      options: ["Residential", "Commercial", "Both"],
    },
    {
      key: "license_number",
      label: "Electrical license",
      fieldType: "text",
      scope: "listing",
      required: true,
      section: "Documents",
      sortOrder: 4,
      helpText: "Required for electricians.",
    },
    {
      key: "job_type",
      label: "Typical jobs",
      fieldType: "multiselect",
      scope: "service",
      section: "Listing",
      sortOrder: 1,
      options: ["New installation", "Repair", "Maintenance", "Emergency callout"],
    },
  ],
  plumbers: [
    {
      key: "years_of_experience",
      label: "Years of plumbing experience",
      fieldType: "number",
      scope: "listing",
      required: true,
      section: "Credentials",
      sortOrder: 1,
      validation: { min: 0, max: 80 },
    },
    {
      key: "plumbing_services",
      label: "Plumbing services",
      fieldType: "multiselect",
      scope: "listing",
      required: true,
      section: "Services",
      sortOrder: 2,
      options: [
        "Pipe installation",
        "Bathroom plumbing",
        "Kitchen plumbing",
        "Water tank",
        "Leakage repair",
        "Drainage",
      ],
    },
    {
      key: "emergency_service",
      label: "Emergency plumbing",
      fieldType: "boolean",
      scope: "listing",
      required: true,
      section: "Service area",
      sortOrder: 3,
    },
  ],
  "interior-designers": [
    {
      key: "years_of_experience",
      label: "Years of design experience",
      fieldType: "number",
      scope: "listing",
      required: true,
      section: "Credentials",
      sortOrder: 1,
      validation: { min: 0, max: 80 },
    },
    {
      key: "residential_commercial",
      label: "Residential / Commercial",
      fieldType: "select",
      scope: "listing",
      required: true,
      section: "Services",
      sortOrder: 2,
      options: ["Residential", "Commercial", "Both"],
    },
    {
      key: "interior_type",
      label: "Interior type",
      fieldType: "multiselect",
      scope: "listing",
      section: "Services",
      sortOrder: 3,
      options: ["2D design", "3D design", "Modular kitchen", "Wardrobe", "Office interior"],
    },
    {
      key: "portfolio",
      label: "Portfolio",
      fieldType: "asset_gallery",
      scope: "listing",
      section: "Media",
      sortOrder: 4,
    },
  ],
  "car-repair-services": [
    {
      key: "years_of_experience",
      label: "Years in auto repair",
      fieldType: "number",
      scope: "listing",
      required: true,
      section: "Credentials",
      sortOrder: 1,
      validation: { min: 0, max: 80 },
    },
    {
      key: "vehicle_types",
      label: "Vehicle types",
      fieldType: "multiselect",
      scope: "listing",
      required: true,
      section: "Services",
      sortOrder: 2,
      options: ["Hatchback", "Sedan", "SUV", "Luxury", "Commercial"],
    },
    {
      key: "repair_services",
      label: "Repair services",
      fieldType: "multiselect",
      scope: "listing",
      required: true,
      section: "Services",
      sortOrder: 3,
      options: ["General service", "Engine", "AC", "Electrical", "Brake", "Suspension", "Tyres", "Battery"],
    },
    {
      key: "pickup_drop",
      label: "Pickup & drop",
      fieldType: "boolean",
      scope: "listing",
      section: "Service area",
      sortOrder: 4,
    },
  ],
  photographers: [
    {
      key: "photography_type",
      label: "Photography type",
      fieldType: "multiselect",
      scope: "listing",
      required: true,
      section: "Services",
      sortOrder: 1,
      options: ["Wedding", "Portrait", "Product", "Events", "Fashion", "Commercial"],
    },
    {
      key: "offers_video",
      label: "Video",
      fieldType: "boolean",
      scope: "listing",
      section: "Services",
      sortOrder: 2,
    },
    {
      key: "offers_drone",
      label: "Drone",
      fieldType: "boolean",
      scope: "listing",
      section: "Services",
      sortOrder: 3,
    },
    {
      key: "offers_editing",
      label: "Editing included",
      fieldType: "boolean",
      scope: "listing",
      section: "Services",
      sortOrder: 4,
    },
    {
      key: "portfolio",
      label: "Portfolio",
      fieldType: "asset_gallery",
      scope: "listing",
      section: "Media",
      sortOrder: 5,
    },
  ],
  fabricators: [
    {
      key: "availability_qty",
      label: "Availability",
      fieldType: "text",
      scope: "service",
      section: "Listing",
      sortOrder: 10,
    },
    {
      key: "thickness",
      label: "Thickness",
      fieldType: "text",
      scope: "service",
      section: "Listing",
      sortOrder: 11,
    },
    {
      key: "finish",
      label: "Finish",
      fieldType: "text",
      scope: "service",
      section: "Listing",
      sortOrder: 12,
    },
    {
      key: "selection_note",
      label: "Selection",
      fieldType: "text",
      scope: "service",
      section: "Listing",
      sortOrder: 13,
    },
  ],
};

/** Independent rental item fields on every Rental & Hire listing (Service). */
export const rentalHireListingFields: FieldSeed[] = [
  {
    key: "item_images",
    label: "Item images",
    fieldType: "asset_gallery",
    scope: "service",
    section: "Item",
    sortOrder: 1,
    helpText: "Each rental item is listed separately, with its own photos.",
  },
  {
    key: "rental_availability",
    label: "Availability",
    fieldType: "select",
    scope: "service",
    section: "Item",
    sortOrder: 2,
    options: ["Available", "Limited", "Booked", "Unavailable"],
  },
  {
    key: "quantity",
    label: "Quantity",
    fieldType: "number",
    scope: "service",
    section: "Item",
    sortOrder: 3,
    validation: { min: 0, max: 10000 },
    placeholder: "e.g. 4",
  },
  {
    key: "price_hourly",
    label: "Hourly rate",
    fieldType: "number",
    scope: "service",
    section: "Pricing",
    sortOrder: 4,
    validation: { min: 0 },
    placeholder: "Leave blank if not offered",
  },
  {
    key: "price_daily",
    label: "Daily rate",
    fieldType: "number",
    scope: "service",
    section: "Pricing",
    sortOrder: 5,
    validation: { min: 0 },
  },
  {
    key: "price_weekly",
    label: "Weekly rate",
    fieldType: "number",
    scope: "service",
    section: "Pricing",
    sortOrder: 6,
    validation: { min: 0 },
  },
  {
    key: "price_monthly",
    label: "Monthly rate",
    fieldType: "number",
    scope: "service",
    section: "Pricing",
    sortOrder: 7,
    validation: { min: 0 },
  },
  {
    key: "security_deposit",
    label: "Security deposit",
    fieldType: "number",
    scope: "service",
    section: "Pricing",
    sortOrder: 8,
    validation: { min: 0 },
  },
  {
    key: "min_rental_duration",
    label: "Minimum rental duration",
    fieldType: "text",
    scope: "service",
    section: "Rental terms",
    sortOrder: 9,
    placeholder: "e.g. 4 hours or 1 day",
  },
  {
    key: "max_rental_duration",
    label: "Maximum rental duration",
    fieldType: "text",
    scope: "service",
    section: "Rental terms",
    sortOrder: 10,
    placeholder: "e.g. 30 days",
  },
  {
    key: "rental_location",
    label: "Pickup / location",
    fieldType: "text",
    scope: "service",
    section: "Rental terms",
    sortOrder: 11,
    placeholder: "Where this item can be collected or delivered",
  },
  {
    key: "item_status",
    label: "Status",
    fieldType: "select",
    scope: "service",
    section: "Item",
    sortOrder: 12,
    options: ["Active", "Inactive", "Maintenance"],
  },
];

export const healthWellnessFields: FieldSeed[] = [
  {
    key: "professional_registration",
    label: "Professional registration",
    fieldType: "text",
    scope: "listing",
    required: true,
    section: "Documents",
    sortOrder: 10,
    helpText: "Medical and wellness providers should include registration or council ID.",
  },
  {
    key: "verification_document",
    label: "Verification document",
    fieldType: "asset_ref",
    scope: "listing",
    section: "Documents",
    sortOrder: 11,
    helpText: "Optional supporting certificate. KYC remains the formal verification path.",
  },
];

function namedSubs(
  parentSlug: string,
  rows: Array<[name: string, slug: string, icon: string]>,
): SubCategorySeed[] {
  return rows.map(([name, slug, icon], index) => ({
    name,
    slug,
    parentSlug,
    icon,
    sortOrder: index + 1,
    description: `Verified ${name.toLowerCase()} selected for quality and reliability.`,
    imageUrl: catalogImage(index, 2),
    bannerUrl: catalogImage(index, 6),
  }));
}
