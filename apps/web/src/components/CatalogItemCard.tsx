import { Star } from "lucide-react";
import { Link } from "react-router-dom";
import type { Service } from "../lib/api";
import { visibleFields, displayValue } from "../lib/field-values";
import { formatListingPrice } from "../lib/pricing";
import { SafeImage } from "./SafeImage";

function catalogItemHref(slug: string, serviceId: string) {
  return `/business/${slug}/items/${serviceId}`;
}

export function CatalogItemCard({
  service,
  slug,
  rating,
  reviewCount,
}: {
  service: Service;
  slug: string;
  rating?: number;
  reviewCount?: number;
}) {
  const image = service.images?.[0];
  const extra = visibleFields(service.fieldValues).find((item) =>
    ["unit", "moq", "price_bulk", "price_piece"].includes(item.key),
  );

  return (
    <Link
      to={catalogItemHref(slug, service.id)}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line/80 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="aspect-[5/4] overflow-hidden bg-surface-high">
        {image ? (
          <SafeImage
            src={image}
            alt={service.name}
            width={640}
            height={512}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-surface-high" />
        )}
      </div>
      <div className="flex flex-1 flex-col p-3.5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-bold leading-snug text-navy">{service.name}</h3>
          {rating != null ? (
            <span className="flex shrink-0 items-center gap-1 text-sm font-bold">
              <Star className="size-3.5 fill-gold text-gold" aria-hidden="true" />
              {Number(rating).toFixed(1)}
              {reviewCount != null ? (
                <span className="font-semibold text-ink-soft">({reviewCount})</span>
              ) : null}
            </span>
          ) : null}
        </div>
        <p className="mt-2 text-sm font-extrabold text-navy">{formatListingPrice(service)}</p>
        {extra ? (
          <p className="mt-1 text-xs font-semibold text-ink-soft">
            {extra.label}: {displayValue(extra.value)}
          </p>
        ) : service.durationMinutes ? (
          <p className="mt-1 text-xs font-semibold text-ink-soft">{service.durationMinutes} min</p>
        ) : null}
      </div>
    </Link>
  );
}
