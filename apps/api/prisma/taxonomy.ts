import { PLATFORM_CATEGORY_SLUG } from "../src/config/constants.js";

export { PLATFORM_CATEGORY_SLUG };

function categoryCard(slug: string) {
  return `/assets/categories/${slug}.jpg`;
}

function categoryBanner(slug: string) {
  return `/assets/categories/${slug}-banner.jpg`;
}

const nestedParentMain: Record<string, string> = {
  "vehicle-rental": "rental-hire",
  "electronics-rental": "rental-hire",
  "event-equipment": "rental-hire",
  "outdoor-travel": "rental-hire",
  "tools-equipment": "rental-hire",
  "furniture-rental": "rental-hire",
};

function mediaForCategory(slug: string) {
  const mainSlug = nestedParentMain[slug] ?? slug;
  return {
    imageUrl: categoryCard(mainSlug),
    bannerUrl: categoryBanner(mainSlug),
  };
}

export type MainCategorySeed = {
  name: string;
  slug: string;
  icon: string;
  sortOrder: number;
  description: string;
  imageUrl: string;
  bannerUrl: string;
  kind: "supplier" | "service";
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
  kind: "supplier" | "service";
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
    | "phone"
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
    name: "Home & Properties",
    slug: "home-property",
    icon: "home_repair_service",
    sortOrder: 1,
    kind: "supplier",
    description: "Electrical, plumbing, hardware, and home decor shops — bulk, by order, or single piece.",
    ...mediaForCategory("home-property"),
  },
  {
    name: "Fashion & Apparel",
    slug: "fashion-apparel",
    icon: "checkroom",
    sortOrder: 2,
    kind: "supplier",
    description: "Clothing, footwear, textiles, and accessory wholesalers.",
    ...mediaForCategory("fashion-apparel"),
  },
  {
    name: "Automotive",
    slug: "automotive",
    icon: "directions_car",
    sortOrder: 3,
    kind: "supplier",
    description: "Auto parts, tyres, and batteries first — repair workshops second.",
    ...mediaForCategory("automotive"),
  },
  {
    name: "Electronics & Technology",
    slug: "electronics-technology",
    icon: "devices",
    sortOrder: 4,
    kind: "supplier",
    description: "Wholesale electronics, mobiles, CCTV, and computer hardware.",
    ...mediaForCategory("electronics-technology"),
  },
  {
    name: "Professional & Business",
    slug: "professional-business",
    icon: "business_center",
    sortOrder: 5,
    kind: "supplier",
    description: "Office supplies and print shops, plus consultants when you need a professional.",
    ...mediaForCategory("professional-business"),
  },
  {
    name: "Health & Wellness",
    slug: "health-wellness",
    icon: "medical_services",
    sortOrder: 6,
    kind: "supplier",
    description: "Medical and wellness supplies, with clinics and care providers as a second option.",
    ...mediaForCategory("health-wellness"),
  },
  {
    name: "Education & Training",
    slug: "education-training",
    icon: "school",
    sortOrder: 7,
    kind: "supplier",
    description: "Books and stationery suppliers, plus coaching when you need an instructor.",
    ...mediaForCategory("education-training"),
  },
  {
    name: "Events & Lifestyle",
    slug: "events-lifestyle",
    icon: "celebration",
    sortOrder: 8,
    kind: "supplier",
    description: "Jewellery, décor materials, and catering supplies — event crews second.",
    ...mediaForCategory("events-lifestyle"),
  },
  {
    name: "Logistics & Other Services",
    slug: "logistics-other",
    icon: "local_shipping",
    sortOrder: 9,
    kind: "supplier",
    description: "Packing materials, scrap, and fabricators — movers and courier as a second option.",
    ...mediaForCategory("logistics-other"),
  },
  {
    name: "Hotels, Resorts & Stays",
    slug: "hotels-resorts-stays",
    icon: "hotel",
    sortOrder: 10,
    kind: "service",
    description: "Hotels, resorts, homestays, villas, and other places to stay.",
    ...mediaForCategory("hotels-resorts-stays"),
  },
  {
    name: "Rental & Hire",
    slug: "rental-hire",
    icon: "key",
    sortOrder: 11,
    kind: "supplier",
    description: "Hire vehicles, tools, furniture, and event equipment by the hour or day.",
    ...mediaForCategory("rental-hire"),
  },
  {
    name: "Travel, Taxi & Transport",
    slug: "travel-taxi-transport",
    icon: "local_taxi",
    sortOrder: 12,
    kind: "service",
    description: "Taxi, cab, airport transfers, tours, and passenger transport.",
    ...mediaForCategory("travel-taxi-transport"),
  },
];

export const phase1Subs: SubCategorySeed[] = [
  ...namedSubs("home-property", [
    ["Electrical", "electrical", "electrical_services"],
    ["Plumbing items", "plumbing-items", "plumbing"],
    ["Mechanical & hardware", "mechanical-hardware", "handyman"],
    ["Home decor", "home-decor", "chair"],
    ["Furniture", "furniture", "weekend"],
    ["Paint & coatings", "paint-coatings", "format_paint"],
    ["Building materials", "building-materials", "apartment"],
  ]),
  ...namedSubs(
    "home-property",
    [
      ["Electricians", "electricians", "electrical_services"],
      ["Plumbers", "plumbers", "plumbing"],
      ["AC Services", "ac-services", "ac_unit"],
      ["Interior Designers", "interior-designers", "chair"],
      ["Painting Contractors", "painting-contractors", "format_paint"],
      ["Carpenter Services", "carpenter-services", "handyman"],
    ],
    { kind: "service", startOrder: 20 },
  ),
  ...namedSubs("fashion-apparel", [
    ["Clothing / garments", "clothing", "checkroom"],
    ["Shoes / footwear", "shoes", "steps"],
    ["Textiles", "textiles", "weekend"],
    ["Bags & accessories", "bags-accessories", "shopping_bag"],
  ]),
  ...namedSubs("automotive", [
    ["Auto parts", "auto-parts", "settings"],
    ["Tyres", "tyres", "tire_repair"],
    ["Batteries", "batteries", "battery_charging_full"],
    ["Accessories", "auto-accessories", "directions_car"],
  ]),
  ...namedSubs(
    "automotive",
    [
      ["Car Repair & Services", "car-repair-services", "car_repair"],
      ["Bike Repair & Services", "bike-repair-services", "two_wheeler"],
      ["Car Wash & Detailing", "car-wash-detailing", "local_car_wash"],
      ["Vehicle Towing", "vehicle-towing", "rv_hookup"],
    ],
    { kind: "service", startOrder: 20 },
  ),
  ...namedSubs("electronics-technology", [
    ["Electronics wholesale", "electronics-wholesale", "devices"],
    ["Mobiles & accessories", "mobiles-accessories", "phone_iphone"],
    ["CCTV equipment", "cctv-equipment", "videocam"],
    ["Computer hardware", "computer-hardware", "computer"],
  ]),
  ...namedSubs(
    "electronics-technology",
    [
      ["Computer & Laptop Repair", "computer-laptop-repair", "laptop"],
      ["Mobile Phone Repair", "mobile-phone-repair", "phone_iphone"],
      ["CCTV Services", "cctv-services", "videocam"],
      ["IT Services", "it-services", "dns"],
      ["Electronics Repair", "electronics-repair", "memory"],
    ],
    { kind: "service", startOrder: 20 },
  ),
  ...namedSubs("professional-business", [
    ["Office supplies", "office-supplies", "print"],
    ["Printing & Publishing", "printing-publishing", "menu_book"],
  ]),
  ...namedSubs(
    "professional-business",
    [
      ["Chartered Accountants", "chartered-accountants", "calculate"],
      ["Lawyers", "lawyers", "gavel"],
      ["Tax Consultants", "tax-consultants", "request_quote"],
      ["Digital Marketing", "digital-marketing", "campaign"],
      ["Business Consultants", "business-consultants", "handshake"],
    ],
    { kind: "service", startOrder: 20 },
  ),
  ...namedSubs("health-wellness", [
    ["Medical supplies", "medical-supplies", "medical_services"],
    ["Wellness products", "wellness-products", "spa"],
  ]),
  ...namedSubs(
    "health-wellness",
    [
      ["Dentists", "dentists", "dentistry"],
      ["Hospitals", "hospitals", "local_hospital"],
      ["Clinics", "clinics", "medical_services"],
      ["Physiotherapy", "physiotherapy", "accessibility"],
      ["Beauty Spa", "beauty-spa-wellness", "spa"],
    ],
    { kind: "service", startOrder: 20 },
  ),
  ...namedSubs("education-training", [
    ["Books & stationery", "books-stationery", "menu_book"],
  ]),
  ...namedSubs(
    "education-training",
    [
      ["Coaching", "coaching", "school"],
      ["Tuition", "tuition", "menu_book"],
      ["Vocational Training", "vocational-training", "engineering"],
      ["Language Training", "language-training", "translate"],
    ],
    { kind: "service", startOrder: 20 },
  ),
  ...namedSubs("events-lifestyle", [
    ["Jewellery", "jewellery-showrooms", "diamond"],
    ["Decoration materials", "decoration-materials", "celebration"],
    ["Catering supplies", "catering-supplies", "room_service"],
  ]),
  ...namedSubs(
    "events-lifestyle",
    [
      ["Event Organizers", "event-organizers", "event"],
      ["Photographers", "photographers", "photo_camera"],
      ["Videographers", "videographers", "videocam"],
      ["Caterers", "caterers", "room_service"],
      ["Wedding Services", "wedding-services", "favorite"],
      ["Makeup Artists", "makeup-artists", "brush"],
    ],
    { kind: "service", startOrder: 20 },
  ),
  ...namedSubs("logistics-other", [
    ["Packing materials", "packing-materials", "inventory_2"],
    ["Scrap Dealers", "scrap-dealers", "recycling"],
    ["Fabricators", "fabricators", "precision_manufacturing"],
  ]),
  ...namedSubs(
    "logistics-other",
    [
      ["Courier Services", "courier-services", "local_post_office"],
      ["Packers & Movers", "packers-movers", "moving"],
      ["Transporters", "transporters", "local_shipping"],
      ["Security Services", "security-services", "security"],
    ],
    { kind: "service", startOrder: 20 },
  ),

  ...namedSubs(
    "hotels-resorts-stays",
    [
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
    ],
    { kind: "service" },
  ),
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
  ...namedSubs(
    "travel-taxi-transport",
    [
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
    ],
    { kind: "service" },
  ),
];

/** Demo businesses from the previous seed → nearest supplier-first subcategory. */
export const demoBusinessCategoryMap: Record<string, string> = {
  "material-suppliers": "fabricators",
  "architects-builders": "interior-designers",
  "tyre-wheel-services": "tyres",
  "battery-services": "batteries",
  "cctv-services": "cctv-equipment",
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
  {
    key: "order_modes",
    label: "Order modes",
    fieldType: "multiselect",
    scope: "listing",
    section: "Wholesale",
    sortOrder: 8,
    options: ["Bulk", "By order", "Single piece"],
    helpText: "How buyers can purchase from this shop.",
  },
  {
    key: "min_order_qty",
    label: "Minimum order quantity",
    fieldType: "number",
    scope: "listing",
    section: "Wholesale",
    sortOrder: 9,
    validation: { min: 1, max: 100000 },
    placeholder: "e.g. 10",
  },
  {
    key: "sells_single_piece",
    label: "Sells single piece",
    fieldType: "boolean",
    scope: "listing",
    section: "Wholesale",
    sortOrder: 10,
  },
  {
    key: "wholesale_available",
    label: "Wholesale rates available",
    fieldType: "boolean",
    scope: "listing",
    section: "Wholesale",
    sortOrder: 11,
  },
  {
    key: "sample_available",
    label: "Samples available",
    fieldType: "boolean",
    scope: "listing",
    section: "Wholesale",
    sortOrder: 12,
  },
  {
    key: "service_area",
    label: "Supply area",
    fieldType: "text",
    scope: "listing",
    section: "Wholesale",
    sortOrder: 13,
    placeholder: "e.g. Kochi & nearby districts, or pan-India shipping",
  },
  {
    key: "whatsapp",
    label: "WhatsApp",
    fieldType: "phone",
    scope: "listing",
    section: "Contact",
    sortOrder: 14,
    placeholder: "+91 …",
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
  {
    key: "unit",
    label: "Unit",
    fieldType: "text",
    scope: "service",
    section: "Pricing",
    sortOrder: 3,
    placeholder: "e.g. piece, box, metre, kg",
  },
  {
    key: "moq",
    label: "MOQ",
    fieldType: "number",
    scope: "service",
    section: "Pricing",
    sortOrder: 4,
    validation: { min: 1, max: 100000 },
    placeholder: "Minimum order quantity",
  },
  {
    key: "price_bulk",
    label: "Bulk rate",
    fieldType: "number",
    scope: "service",
    section: "Pricing",
    sortOrder: 5,
    validation: { min: 0 },
  },
  {
    key: "price_piece",
    label: "Piece rate",
    fieldType: "number",
    scope: "service",
    section: "Pricing",
    sortOrder: 6,
    validation: { min: 0 },
  },
  {
    key: "lead_time_days",
    label: "Lead time (days)",
    fieldType: "number",
    scope: "service",
    section: "Pricing",
    sortOrder: 7,
    validation: { min: 0, max: 365 },
  },
  {
    key: "custom_order",
    label: "Custom / made-to-order",
    fieldType: "boolean",
    scope: "service",
    section: "Pricing",
    sortOrder: 8,
  },
];

export const exampleSubcategoryFields: Record<string, FieldSeed[]> = {
  electrical: [
    {
      key: "product_range",
      label: "Product range",
      fieldType: "multiselect",
      scope: "listing",
      required: true,
      section: "Catalog",
      sortOrder: 1,
      options: [
        "Wires & cables",
        "Switches & sockets",
        "Lighting",
        "Panels & MCBs",
        "Conduits",
        "Motors",
        "Solar electrical",
      ],
    },
  ],
  "plumbing-items": [
    {
      key: "product_range",
      label: "Product range",
      fieldType: "multiselect",
      scope: "listing",
      required: true,
      section: "Catalog",
      sortOrder: 1,
      options: ["Pipes & fittings", "Bathroom fittings", "Tanks", "Pumps", "Valves", "Drainage"],
    },
  ],
  clothing: [
    {
      key: "product_range",
      label: "Product range",
      fieldType: "multiselect",
      scope: "listing",
      section: "Catalog",
      sortOrder: 1,
      options: ["Men", "Women", "Kids", "Uniforms", "Fabrics", "Workwear"],
    },
  ],
  shoes: [
    {
      key: "product_range",
      label: "Product range",
      fieldType: "multiselect",
      scope: "listing",
      section: "Catalog",
      sortOrder: 1,
      options: ["Men", "Women", "Kids", "Sports", "Safety footwear", "Casual"],
    },
  ],
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
  options?: { kind?: "supplier" | "service"; startOrder?: number },
): SubCategorySeed[] {
  const kind = options?.kind ?? "supplier";
  const startOrder = options?.startOrder ?? 1;
  return rows.map(([name, slug, icon], index) => ({
    name,
    slug,
    parentSlug,
    icon,
    kind,
    sortOrder: startOrder + index,
    description:
      kind === "service"
        ? `Verified ${name.toLowerCase()} ready to take on jobs.`
        : `Shops and wholesalers for ${name.toLowerCase()} — bulk, by order, or single piece.`,
    ...mediaForCategory(parentSlug),
  }));
}
