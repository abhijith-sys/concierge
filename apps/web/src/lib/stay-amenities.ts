import type { FieldValue } from "./api";
import { fieldByKey } from "./field-values";
import { fieldList } from "./stays";

export type AmenityGroupKey = "highlighted" | "basic" | "services" | "wellness" | "room";

export type AmenityGroup = {
  key: AmenityGroupKey;
  title: string;
  items: string[];
};

const HIGHLIGHTED = new Set([
  "Parking",
  "Bonfire",
  "Indoor Games",
  "Restaurant",
  "Swimming Pool",
  "Breakfast included",
  "Couple friendly",
  "Pet friendly",
]);

const BASIC = new Set([
  "Parking",
  "Swimming Pool",
  "Power Backup",
  "Housekeeping",
  "Room Service",
  "Newspaper",
  "WiFi",
  "Lift",
  "CCTV",
  "Fire extinguisher",
  "Garden",
  "Play area",
]);

const SERVICES = new Set([
  "Concierge",
  "Multilingual Staff",
  "Luggage Assistance",
  "Caretaker",
  "Pickup & drop",
  "Pool/Beach towels",
]);

const WELLNESS = new Set(["First-aid Services", "Spa", "Gym", "Yoga", "Doctor on call"]);

const ROOM = new Set([
  "Coffee Machine",
  "Dental Kit",
  "Geyser/Water Heater",
  "Toiletries",
  "Air Purifier",
  "Work Desk",
  "Air conditioning",
  "TV",
  "WiFi",
  "Balcony",
  "Kitchenette",
  "Private bathroom",
  "Hot water",
  "Mini fridge",
  "Mountain view",
  "Pool view",
  "Garden view",
]);

const ALIASES: Record<string, string> = {
  "swimming pool": "Swimming Pool",
  campfire: "Bonfire",
  "indoor games": "Indoor Games",
  "work desk": "Work Desk",
  "geyser/water heater": "Geyser/Water Heater",
  "air conditioning": "Air conditioning",
  "room service": "Room Service",
  wifi: "WiFi",
  "pickup & drop": "Pickup & drop",
  "first-aid services": "First-aid Services",
  "first aid": "First-aid Services",
  "couples allowed": "Couple friendly",
  "pets allowed": "Pet friendly",
  "pet friendly": "Pet friendly",
  "couple friendly": "Couple friendly",
  "breakfast included": "Breakfast included",
};

const GROUP_TITLES: { key: AmenityGroupKey; title: string }[] = [
  { key: "highlighted", title: "Highlighted Amenities" },
  { key: "basic", title: "Basic Facilities" },
  { key: "services", title: "General Services" },
  { key: "wellness", title: "Health and wellness" },
  { key: "room", title: "Room Amenities" },
];

function normalizeAmenity(label: string) {
  const trimmed = label.trim();
  if (!trimmed) return "";
  return ALIASES[trimmed.toLowerCase()] ?? trimmed;
}

function uniqueLabels(labels: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const label of labels) {
    const item = normalizeAmenity(label);
    if (!item) continue;
    const key = item.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

function groupFor(label: string): AmenityGroupKey {
  if (HIGHLIGHTED.has(label)) return "highlighted";
  if (BASIC.has(label)) return "basic";
  if (SERVICES.has(label)) return "services";
  if (WELLNESS.has(label)) return "wellness";
  if (ROOM.has(label)) return "room";
  if (/view|balcony|bathroom|kitchen/i.test(label)) return "room";
  if (/spa|gym|yoga|aid|doctor/i.test(label)) return "wellness";
  if (/pickup|concierge|luggage|staff|caretaker|towel/i.test(label)) return "services";
  return "basic";
}

function truthy(fields: FieldValue[] | undefined, key: string) {
  return fieldByKey(fields, key)?.value === true;
}

function mealsIncludeBreakfast(fields: FieldValue[] | undefined) {
  return fieldList(fields, "meals").some((item) => /breakfast|all meals/i.test(item));
}

function pushUnique(target: string[], items: string[]) {
  const seen = new Set(target.map((item) => item.toLowerCase()));
  for (const item of uniqueLabels(items)) {
    const key = item.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    target.push(item);
  }
}

export function stayAmenityModel(
  listingFields?: FieldValue[],
  roomFields?: FieldValue[],
): { popular: string[]; groups: AmenityGroup[]; activities: string[] } {
  const buckets: Record<AmenityGroupKey, string[]> = {
    highlighted: [],
    basic: [],
    services: [],
    wellness: [],
    room: [],
  };

  pushUnique(buckets.highlighted, fieldList(listingFields, "amenities_highlighted"));
  pushUnique(buckets.basic, fieldList(listingFields, "amenities_basic"));
  pushUnique(buckets.services, fieldList(listingFields, "amenities_services"));
  pushUnique(buckets.wellness, fieldList(listingFields, "amenities_wellness"));
  pushUnique(buckets.room, fieldList(roomFields, "room_facilities"));

  if (truthy(listingFields, "breakfast_included") || mealsIncludeBreakfast(listingFields)) {
    pushUnique(buckets.highlighted, ["Breakfast included"]);
  }
  if (truthy(listingFields, "couples_allowed")) {
    pushUnique(buckets.highlighted, ["Couple friendly"]);
  }
  if (truthy(listingFields, "pets_allowed")) {
    pushUnique(buckets.highlighted, ["Pet friendly"]);
  }

  const claimed = new Set(
    Object.values(buckets)
      .flat()
      .map((item) => item.toLowerCase()),
  );
  for (const raw of fieldList(listingFields, "facilities")) {
    const item = normalizeAmenity(raw);
    if (!item || claimed.has(item.toLowerCase())) continue;
    claimed.add(item.toLowerCase());
    buckets[groupFor(item)].push(item);
  }

  const popular = buckets.highlighted.length
    ? buckets.highlighted
    : uniqueLabels([
        ...buckets.basic,
        ...buckets.services,
        ...buckets.wellness,
        ...buckets.room,
      ]).slice(0, 5);

  const groups = GROUP_TITLES.map(({ key, title }) => ({
    key,
    title,
    items: buckets[key],
  })).filter((group) => group.items.length);

  return {
    popular,
    groups,
    activities: fieldList(listingFields, "other_activities"),
  };
}

export function stayAmenityPreview(fields?: FieldValue[], limit = 3) {
  return stayAmenityModel(fields).popular.slice(0, limit);
}
