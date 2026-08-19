import type { LucideIcon } from "lucide-react";
import {
  Armchair,
  Bath,
  Bell,
  Briefcase,
  Car,
  Check,
  Coffee,
  Cross,
  Dices,
  Droplets,
  Dumbbell,
  Flame,
  Flower2,
  Gamepad2,
  Heart,
  Languages,
  Newspaper,
  PawPrint,
  Snowflake,
  Sparkles,
  Trees,
  Tv,
  UserRound,
  UtensilsCrossed,
  Waves,
  Wifi,
  Wind,
  Zap,
} from "lucide-react";
import { useState } from "react";
import type { FieldValue } from "../../lib/api";
import { stayAmenityModel, type AmenityGroupKey } from "../../lib/stay-amenities";

const ICONS: Record<string, LucideIcon> = {
  parking: Car,
  bonfire: Flame,
  "indoor games": Dices,
  restaurant: UtensilsCrossed,
  "swimming pool": Waves,
  "breakfast included": Coffee,
  "couple friendly": Heart,
  "pet friendly": PawPrint,
  "power backup": Zap,
  housekeeping: Sparkles,
  "room service": Bell,
  newspaper: Newspaper,
  wifi: Wifi,
  lift: Check,
  cctv: Check,
  "fire extinguisher": Check,
  garden: Trees,
  "play area": Gamepad2,
  concierge: Bell,
  "multilingual staff": Languages,
  "luggage assistance": Briefcase,
  caretaker: UserRound,
  "pickup & drop": Car,
  "pool/beach towels": Bath,
  "first-aid services": Cross,
  spa: Flower2,
  gym: Dumbbell,
  yoga: Flower2,
  "doctor on call": Cross,
  "coffee machine": Coffee,
  "dental kit": Sparkles,
  "geyser/water heater": Droplets,
  toiletries: Bath,
  "air purifier": Wind,
  "work desk": Armchair,
  "air conditioning": Snowflake,
  tv: Tv,
  balcony: Trees,
  kitchenette: UtensilsCrossed,
  "private bathroom": Bath,
  "hot water": Droplets,
  "mini fridge": Snowflake,
  "mountain view": Trees,
  "pool view": Waves,
  "garden view": Trees,
};

function AmenityIcon({ label, className = "mt-0.5 size-4 shrink-0 text-ink-soft" }: { label: string; className?: string }) {
  const Icon = ICONS[label.toLowerCase()] ?? Check;
  return <Icon className={className} aria-hidden="true" />;
}

function AmenityList({ items }: { items: string[] }) {
  return (
    <ul className="mt-4 grid gap-3">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2.5 text-sm text-ink">
          <AmenityIcon label={item} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

const PREVIEW_PER_COLUMN = 6;

export function StayAmenities({
  propertyName,
  listingFields,
  roomFields,
  className = "",
}: {
  propertyName: string;
  listingFields?: FieldValue[];
  roomFields?: FieldValue[];
  className?: string;
}) {
  const { popular, groups, activities } = stayAmenityModel(listingFields, roomFields);
  const [expanded, setExpanded] = useState(false);
  const hasMore = groups.some((group) => group.items.length > PREVIEW_PER_COLUMN);

  if (!popular.length && !groups.length) return null;

  const visibleGroups = groups.map((group) => ({
    ...group,
    items: expanded ? group.items : group.items.slice(0, PREVIEW_PER_COLUMN),
  }));

  const columnClass =
    visibleGroups.length >= 4
      ? "sm:grid-cols-2 lg:grid-cols-5"
      : visibleGroups.length === 3
        ? "sm:grid-cols-2 lg:grid-cols-3"
        : "sm:grid-cols-2";

  return (
    <section className={`rounded-xl border border-line bg-white p-5 md:p-8 ${className}`}>
      <h3 className="text-xl font-extrabold tracking-tight text-ink md:text-2xl">
        Amenities at {propertyName}
      </h3>

      {popular.length ? (
        <div className="mt-6 rounded-xl bg-cream px-4 py-4 md:px-5">
          <h4 className="text-base font-extrabold text-gold-dark">Popular Amenities</h4>
          <ul className="mt-4 flex flex-wrap gap-2.5">
            {popular.map((item) => (
              <li
                key={item}
                className="inline-flex items-center gap-2 rounded-full bg-gold-light px-3.5 py-1.5 text-sm font-bold text-navy"
              >
                <AmenityIcon label={item} className="size-4 shrink-0 text-gold-dark" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {visibleGroups.length ? (
        <div className={`mt-8 grid gap-8 ${columnClass}`}>
          {visibleGroups.map((group) => (
            <div key={group.key as AmenityGroupKey}>
              <h4 className="text-base font-extrabold text-ink">{group.title}</h4>
              <AmenityList items={group.items} />
            </div>
          ))}
        </div>
      ) : null}

      {activities.length ? (
        <div className="mt-8">
          <h4 className="text-base font-extrabold text-ink">Activities</h4>
          <ul className="mt-4 flex flex-wrap gap-2">
            {activities.map((item) => (
              <li key={item} className="rounded-full bg-gold-light/40 px-3 py-1.5 text-sm font-semibold">
                {item}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {hasMore ? (
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className="mt-6 text-sm font-bold text-[#0071c2] hover:underline"
        >
          {expanded ? "Show fewer amenities" : "Show All Amenities"}
        </button>
      ) : null}
    </section>
  );
}
