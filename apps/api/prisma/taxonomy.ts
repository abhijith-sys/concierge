import { PLATFORM_CATEGORY_SLUG } from "../src/config/constants.js";

export { PLATFORM_CATEGORY_SLUG };

export type MainCategorySeed = {
  name: string;
  slug: string;
  icon: string;
  sortOrder: number;
  description: string;
};

export type SubCategorySeed = {
  name: string;
  slug: string;
  parentSlug: string;
  icon: string;
  sortOrder: number;
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
  conditionalRules?: { fieldKey: string; equals: unknown };
};

export const phase1Mains: MainCategorySeed[] = [
  {
    name: "Home & Property",
    slug: "home-property",
    icon: "home_repair_service",
    sortOrder: 1,
    description: "Electricians, plumbers, interiors, real estate, and home services.",
  },
  {
    name: "Automotive",
    slug: "automotive",
    icon: "directions_car",
    sortOrder: 2,
    description: "Vehicle repair, hire, wash, towing, and related services.",
  },
  {
    name: "Electronics & Technology",
    slug: "electronics-technology",
    icon: "devices",
    sortOrder: 3,
    description: "Device repair, IT, CCTV, and digital specialists.",
  },
  {
    name: "Professional & Business",
    slug: "professional-business",
    icon: "business_center",
    sortOrder: 4,
    description: "Legal, tax, accounting, marketing, and consulting.",
  },
  {
    name: "Health & Wellness",
    slug: "health-wellness",
    icon: "medical_services",
    sortOrder: 5,
    description: "Clinics, home care, spa, and wellness professionals.",
  },
  {
    name: "Education & Training",
    slug: "education-training",
    icon: "school",
    sortOrder: 6,
    description: "Coaching, tuition, vocational and hobby classes.",
  },
  {
    name: "Events & Lifestyle",
    slug: "events-lifestyle",
    icon: "celebration",
    sortOrder: 7,
    description: "Weddings, photography, catering, and lifestyle services.",
  },
  {
    name: "Logistics & Other Services",
    slug: "logistics-other",
    icon: "local_shipping",
    sortOrder: 8,
    description: "Courier, movers, transport, security, and local trades.",
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
  }));
}
