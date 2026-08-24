import { BadgeCheck, MapPin, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { twMerge } from "tailwind-merge";
import type { FieldValue, Listing } from "../lib/api";
import { formatDistanceKm } from "../lib/discovery";
import { isStayListing } from "../lib/stays";
import { formatRentalFrom, isRentalListing, rentalPreviewTags } from "../lib/rentals";
import { formatTravelFrom, isTravelListing, travelPreviewTags } from "../lib/travel";
import { formatEventFrom, isEventListing, eventPreviewTags } from "../lib/events";
import { formatLogisticsFrom, isLogisticsListing, logisticsPreviewTags } from "../lib/logistics";
import { formatEducationFrom, isEducationListing, educationPreviewTags } from "../lib/education";
import { formatHealthFrom, isHealthListing, healthPreviewTags } from "../lib/health";
import { formatProfessionalFrom, isProfessionalListing, professionalPreviewTags } from "../lib/professional";
import { formatHomeFrom, isHomeListing, homePreviewTags } from "../lib/home";
import { formatAutomotiveFrom, isAutomotiveListing, automotivePreviewTags } from "../lib/automotive";
import { formatElectronicsFrom, isElectronicsListing, electronicsPreviewTags } from "../lib/electronics";
import { catalogOfferBrand } from "../lib/shop";
import { stayAmenityPreview } from "../lib/stay-amenities";
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
  const stay = isStayListing(listing);
  const rental = isRentalListing(listing);
  const travel = isTravelListing(listing);
  const eventCrew = isEventListing(listing);
  const logistics = isLogisticsListing(listing);
  const education = isEducationListing(listing);
  const health = isHealthListing(listing);
  const professional = isProfessionalListing(listing);
  const homeTrade = isHomeListing(listing);
  const automotive = isAutomotiveListing(listing);
  const electronics = isElectronicsListing(listing);
  const orderModes = displayValue(fieldValue(listing.fieldValues, "order_modes"));
  const moq = displayValue(fieldValue(listing.fieldValues, "min_order_qty"));
  const brand = shop ? catalogOfferBrand(offer, listing.fieldValues) : "";
  const amenities = stay
    ? stayAmenityPreview(listing.fieldValues)
    : rental
      ? rentalPreviewTags(listing.fieldValues)
      : travel
        ? travelPreviewTags(listing.fieldValues)
        : eventCrew
          ? eventPreviewTags(listing.fieldValues)
          : logistics
            ? logisticsPreviewTags(listing.fieldValues)
            : education
              ? educationPreviewTags(listing.fieldValues)
              : health
                ? healthPreviewTags(listing.fieldValues)
                : professional
                  ? professionalPreviewTags(listing.fieldValues)
                  : homeTrade
                    ? homePreviewTags(listing.fieldValues)
                    : automotive
                      ? automotivePreviewTags(listing.fieldValues)
                      : electronics
                        ? electronicsPreviewTags(listing.fieldValues)
                        : [];
  const vertical =
    stay ||
    rental ||
    travel ||
    eventCrew ||
    logistics ||
    education ||
    health ||
    professional ||
    homeTrade ||
    automotive ||
    electronics;

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
        {shop && !rental && (orderModes || moq || brand) ? (
          <p className="mt-2 text-xs font-semibold text-ink-soft">
            {[brand, orderModes, moq ? `MOQ ${moq}` : null].filter(Boolean).join(" · ")}
          </p>
        ) : null}
        {vertical && amenities.length ? (
          <p className="mt-2 truncate text-xs font-semibold text-ink-soft">{amenities.join(" · ")}</p>
        ) : null}
        {offer && !vertical ? (
          <p className="mt-2 text-sm font-extrabold text-navy">{formatListingPrice(offer)}</p>
        ) : null}
        {stay && offer ? (
          <p className="mt-2 text-sm font-extrabold text-navy">From {formatListingPrice(offer)}</p>
        ) : null}
        {rental && offer ? (
          <p className="mt-2 text-sm font-extrabold text-navy">{formatRentalFrom(offer)}</p>
        ) : null}
        {travel && offer ? (
          <p className="mt-2 text-sm font-extrabold text-navy">{formatTravelFrom(offer)}</p>
        ) : null}
        {eventCrew && offer ? (
          <p className="mt-2 text-sm font-extrabold text-navy">{formatEventFrom(offer)}</p>
        ) : null}
        {logistics && offer ? (
          <p className="mt-2 text-sm font-extrabold text-navy">{formatLogisticsFrom(offer)}</p>
        ) : null}
        {education && offer ? (
          <p className="mt-2 text-sm font-extrabold text-navy">{formatEducationFrom(offer)}</p>
        ) : null}
        {health && offer ? (
          <p className="mt-2 text-sm font-extrabold text-navy">{formatHealthFrom(offer)}</p>
        ) : null}
        {professional && offer ? (
          <p className="mt-2 text-sm font-extrabold text-navy">{formatProfessionalFrom(offer)}</p>
        ) : null}
        {homeTrade && offer ? (
          <p className="mt-2 text-sm font-extrabold text-navy">{formatHomeFrom(offer)}</p>
        ) : null}
        {automotive && offer ? (
          <p className="mt-2 text-sm font-extrabold text-navy">{formatAutomotiveFrom(offer)}</p>
        ) : null}
        {electronics && offer ? (
          <p className="mt-2 text-sm font-extrabold text-navy">{formatElectronicsFrom(offer)}</p>
        ) : null}
      </div>
    </article>
  );
}

export const ListingCard = ProviderCard;
