import { Check } from "lucide-react";
import { useState } from "react";
import type { FieldValue, Service } from "../../lib/api";
import { displayValue, fieldByKey } from "../../lib/field-values";
import {
  formatRentalMoney,
  rentalAvailability,
  rentalItemRates,
  rentalQuantity,
  rentalShopHighlights,
} from "../../lib/rentals";
import { SafeImage } from "../SafeImage";
import { Button } from "../ui";

const THUMB_COUNT = 4;

function ItemGallery({
  images,
  name,
  onViewAll,
}: {
  images: string[];
  name: string;
  onViewAll: () => void;
}) {
  const [index, setIndex] = useState(0);
  const main = images[index] ?? images[0];
  const thumbs = images.slice(0, THUMB_COUNT);
  const showViewAll = images.length > 1;

  return (
    <div className="flex w-full shrink-0 flex-col gap-1.5 sm:w-[248px] lg:w-[268px]">
      <button
        type="button"
        onClick={onViewAll}
        className="relative aspect-[5/4] overflow-hidden rounded-lg bg-surface-high"
        aria-label={`View photos of ${name}`}
      >
        {main ? (
          <SafeImage src={main} alt={name} width={640} height={512} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-surface-high" />
        )}
      </button>
      {thumbs.length > 1 ? (
        <div className="grid grid-cols-4 gap-1.5">
          {thumbs.map((src, thumbIndex) => {
            const isLast = thumbIndex === thumbs.length - 1;
            const overlay = isLast && showViewAll;
            return (
              <button
                key={`${src}-${thumbIndex}`}
                type="button"
                onClick={() => (overlay ? onViewAll() : setIndex(thumbIndex))}
                className={`relative aspect-square overflow-hidden rounded-md bg-surface-high ${
                  !overlay && index === thumbIndex ? "ring-2 ring-navy" : ""
                }`}
                aria-label={overlay ? `View all ${images.length} photos` : `Photo ${thumbIndex + 1}`}
              >
                <SafeImage src={src} alt="" className="size-full object-cover" />
                {overlay ? (
                  <span className="absolute inset-0 grid place-items-center bg-black/55 text-[10px] font-extrabold tracking-[0.08em] text-white">
                    VIEW ALL
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export function RentalItemCard({
  service,
  listingFields,
  categoryName,
  selected,
  onOpen,
  onEnquire,
}: {
  service: Service;
  listingFields?: FieldValue[];
  categoryName?: string;
  selected?: boolean;
  onOpen: (service: Service) => void;
  onEnquire: (service: Service) => void;
}) {
  const availability = rentalAvailability(service);
  const quantity = rentalQuantity(service);
  const location = displayValue(fieldByKey(service.fieldValues, "rental_location")?.value);
  const minDuration = displayValue(fieldByKey(service.fieldValues, "min_rental_duration")?.value);
  const highlights = rentalShopHighlights(listingFields);
  const rates = rentalItemRates(service);
  const badge = [availability, categoryName].filter(Boolean).join(" · ") || "Hire";
  const meta = [quantity != null ? `${quantity} in stock` : null, minDuration ? `Min ${minDuration}` : null, location]
    .filter(Boolean)
    .join(" | ");

  return (
    <article
      className={`overflow-hidden rounded-xl border bg-white shadow-sm transition ${
        selected ? "border-navy ring-1 ring-navy/20" : "border-line/90"
      }`}
    >
      <div className="flex flex-col gap-4 p-3 sm:flex-row sm:items-stretch sm:gap-5 sm:p-3.5">
        <ItemGallery images={service.images ?? []} name={service.name} onViewAll={() => onOpen(service)} />

        <div className="flex min-w-0 flex-1 flex-col">
          <span className="inline-flex w-fit items-center rounded-full bg-surface-high px-2.5 py-1 text-[11px] font-extrabold tracking-wide text-ink">
            {badge}
          </span>
          <h3 className="mt-2 text-lg font-extrabold leading-snug tracking-tight text-navy md:text-xl">
            {service.name}
          </h3>
          {meta ? <p className="mt-1 text-sm font-semibold text-[#0071c2]">{meta}</p> : null}
          {service.description ? (
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-ink-soft">{service.description}</p>
          ) : null}
          {highlights.length ? (
            <ul className="mt-3 grid gap-1.5">
              {highlights.map((item) => (
                <li key={item.label} className="flex items-center gap-2 text-[13px] font-semibold text-ink">
                  <Check className="size-3.5 shrink-0 text-emerald-600" strokeWidth={3} aria-hidden="true" />
                  {item.label}
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col justify-between border-t border-line pt-3 sm:w-[200px] sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0 lg:w-[220px]">
          {rates.deposit != null ? (
            <div className="rounded-md border border-gold/40 bg-cream px-2.5 py-2 text-[11px] leading-4">
              <p>
                <span className="font-extrabold text-navy">Deposit</span>
                <span className="text-ink-soft"> | {formatRentalMoney(rates.deposit, rates.currency)}</span>
              </p>
            </div>
          ) : (
            <div />
          )}
          <div className="mt-4 text-right sm:mt-auto">
            <p className="text-2xl font-extrabold tracking-tight text-ink">
              {formatRentalMoney(rates.from, rates.currency)}
            </p>
            <p className="mt-0.5 text-xs font-semibold text-ink-soft">
              {rates.hourly != null && rates.hourly === rates.from ? "per hour" : "per day"}
            </p>
            {rates.weekly != null ? (
              <p className="mt-1 text-[11px] font-semibold text-ink-soft">
                Weekly {formatRentalMoney(rates.weekly, rates.currency)}
              </p>
            ) : null}
            {selected ? (
              <p className="mt-2 text-[11px] font-extrabold uppercase tracking-wide text-emerald-700">Selected</p>
            ) : null}
            <Button className="mt-3 w-full rounded-lg" onClick={() => onEnquire(service)}>
              Enquire now
            </Button>
            <button
              type="button"
              onClick={() => onOpen(service)}
              className="mt-2 w-full text-xs font-bold text-[#0071c2] hover:underline"
            >
              View photos & details
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
