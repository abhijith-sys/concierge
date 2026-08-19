import { BadgeCheck, MapPin, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { twMerge } from "tailwind-merge";
import type { FieldValue, Listing } from "../lib/api";
import { formatDistanceKm } from "../lib/discovery";
import { isSupplierListing } from "../lib/listing-kind";
import { formatListingPrice } from "../lib/pricing";
import { SafeImage } from "./SafeImage";
import { WishlistButton } from "./WishlistButton";

const fallbackImage = "/assets/categories/home-property.jpg";

function displayValue(value: unknown) {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.join(", ");
  if (value == null || value === "") return "";
  return String(value);
}

function fieldValue(fields: FieldValue[] | undefined, key: string) {
  return fields?.find((item) => item.key === key)?.value;
}

export function listingHref(listing: Listing) {
  return `/business/${listing.business?.slug ?? listing.businessId ?? listing.id}`;
}

export function ProviderCard({
  listing,
  className,
}: {
  listing: Listing;
  className?: string;
}) {
  const name = listing.business?.name ?? listing.title;
  const image = listing.images?.[0] ?? listing.business?.coverUrl ?? fallbackImage;
  const offer = listing.business?.services?.[0];
  const reviews = listing.reviewCount ?? 0;
  const distance = formatDistanceKm(listing.distanceKm);
  const place = [listing.city, distance].filter(Boolean).join(" · ");
  const shop = isSupplierListing(listing);
  const orderModes = displayValue(fieldValue(listing.fieldValues, "order_modes"));
  const moq = displayValue(fieldValue(listing.fieldValues, "min_order_qty"));

  return (
    <article
      className={twMerge(
        "group overflow-hidden rounded-2xl border border-line/80 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg",
        className,
      )}
    >
      <Link to={listingHref(listing)} className="relative block aspect-[5/4] overflow-hidden">
        <SafeImage
          src={image}
          alt={`${name} featured work`}
          width={640}
          height={512}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
        />
        {listing.business?.verified ? (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-[11px] font-bold text-emerald-700 shadow-sm">
            <BadgeCheck className="size-3.5" aria-hidden="true" />
            Verified
          </span>
        ) : null}
        <WishlistButton listingId={listing.id} className="absolute right-3 top-3 size-9" />
      </Link>
      <div className="p-3.5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-bold leading-snug text-navy">{name}</h3>
          <span className="flex shrink-0 items-center gap-1 text-sm font-bold">
            <Star className="size-3.5 fill-gold text-gold" aria-hidden="true" />
            {Number(listing.avgRating ?? 0).toFixed(1)}
            <span className="font-semibold text-ink-soft">({reviews})</span>
          </span>
        </div>
        {listing.category?.name ? (
          <p className="mt-1 truncate text-xs font-semibold text-ink-soft">{listing.category.name}</p>
        ) : null}
        {place ? (
          <p className="mt-1 flex items-center gap-1 truncate text-xs text-ink-soft">
            <MapPin className="size-3 shrink-0" aria-hidden="true" />
            {place}
          </p>
        ) : null}
        {shop && (orderModes || moq) ? (
          <p className="mt-2 text-xs font-semibold text-ink-soft">
            {[orderModes, moq ? `MOQ ${moq}` : null].filter(Boolean).join(" · ")}
          </p>
        ) : null}
        {offer ? (
          <p className="mt-2 text-sm font-extrabold text-navy">{formatListingPrice(offer)}</p>
        ) : null}
      </div>
    </article>
  );
}

export const ListingCard = ProviderCard;
