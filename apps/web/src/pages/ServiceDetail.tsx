import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BadgeCheck, MapPin, Star } from "lucide-react";
import { Link, Navigate, useParams } from "react-router-dom";
import { SafeImage } from "../components/SafeImage";
import { Button, PageState } from "../components/ui";
import { api } from "../lib/api";
import { displayValue, fieldByKey, visibleFields } from "../lib/field-values";
import { isSupplierListing } from "../lib/listing-kind";
import { formatListingPrice } from "../lib/pricing";
import { theme } from "../lib/theme";

const PRICE_KEYS = new Set(["price_bulk", "price_piece", "unit", "moq", "lead_time_days"]);

export function ServiceDetail() {
  const { slug = "", itemId = "" } = useParams();

  const item = useQuery({
    queryKey: ["service", itemId],
    queryFn: () => api.service(itemId),
    enabled: Boolean(itemId),
  });
  const shop = useQuery({
    queryKey: ["business", slug],
    queryFn: () => api.business(slug),
    enabled: Boolean(slug),
  });

  if (item.isLoading) return <PageState title="Loading this listing" loading />;
  if (item.isError || !item.data) {
    return (
      <PageState
        title="Listing not found"
        description="This item may be unavailable or the link may have changed."
        action={
          <Link to={slug ? `/business/${slug}` : "/listings"}>
            <Button>Back to {slug ? "seller" : "listings"}</Button>
          </Link>
        }
      />
    );
  }

  const service = item.data;
  const sellerSlug = service.business?.slug ?? slug;
  if (sellerSlug && slug && sellerSlug !== slug) {
    return <Navigate to={`/business/${sellerSlug}/items/${service.id}`} replace />;
  }

  const profile = shop.data;
  const listing = profile?.listing ?? service.business?.listing;
  const isMaterialsCatalog = isSupplierListing(listing);
  const image = service.images?.[0] ?? profile?.coverUrl ?? theme.assets.banner;
  const gallery = service.images?.length ? service.images : image ? [image] : [];
  const rating = listing?.avgRating ?? 0;
  const reviewCount = listing?.reviewCount ?? 0;
  const sellerName = profile?.name ?? service.business?.name ?? "Seller";
  const city = listing?.city;
  const verified = profile?.verified ?? service.business?.verified;
  const phone = profile?.phone ?? service.business?.phone;
  const whatsapp = displayValue(fieldByKey(profile?.fieldValues, "whatsapp")?.value);
  const details = visibleFields(service.fieldValues).filter((field) => field.key !== "selection_note");
  const priceExtras = details.filter((field) => PRICE_KEYS.has(field.key));
  const otherDetails = details.filter((field) => !PRICE_KEYS.has(field.key));
  const catalogLabel = isMaterialsCatalog ? "catalog" : "offerings";

  return (
    <>
      <section className="relative min-h-[220px] overflow-hidden md:min-h-[260px]">
        <SafeImage
          src={gallery[0] ?? image}
          alt={service.name}
          width={1600}
          height={1000}
          loading="eager"
          fetchPriority="high"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
        <div className="page-shell relative flex min-h-[220px] items-end py-8 text-white md:min-h-[260px] md:py-10">
          <div className="max-w-3xl">
            <Link
              to={`/business/${sellerSlug}`}
              className="inline-flex items-center gap-2 text-sm font-semibold text-white/80 underline-offset-4 hover:underline"
            >
              <ArrowLeft className="size-4" />
              Back to {sellerName}
            </Link>
            {service.category?.name ? (
              <p className="label-caps mt-3 text-white/70">{service.category.name}</p>
            ) : listing?.category?.name ? (
              <p className="label-caps mt-3 text-white/70">{listing.category.name}</p>
            ) : null}
            <h1 className="mt-2 text-3xl font-extrabold leading-[1.05] tracking-[-0.04em] md:text-5xl">
              {service.name}
            </h1>
            <p className="mt-2 text-lg font-extrabold md:text-xl">{formatListingPrice(service)}</p>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-white/85">
              <Link
                to={`/business/${sellerSlug}#reviews`}
                className="inline-flex items-center gap-1.5 font-bold underline-offset-4 hover:underline"
              >
                <Star className="size-4 fill-gold-light text-gold-light" aria-hidden="true" />
                {Number(rating).toFixed(1)}
                <span className="font-semibold text-white/70">({reviewCount} shop reviews)</span>
              </Link>
              {city ? (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-4" />
                  {city}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="page-shell grid gap-12 py-16 lg:grid-cols-[1.15fr_0.85fr] lg:py-24">
        <div>
          {service.description ? (
            <p className="text-sm leading-7 text-ink-soft md:text-[15px] md:leading-8">{service.description}</p>
          ) : null}

          <dl className="mt-10 grid gap-6 sm:grid-cols-2">
            <div>
              <dt className="label-caps text-ink-soft/70">Rate</dt>
              <dd className="mt-1 text-lg font-extrabold text-ink">{formatListingPrice(service)}</dd>
            </div>
            {service.durationMinutes ? (
              <div>
                <dt className="label-caps text-ink-soft/70">Duration</dt>
                <dd className="mt-1 text-lg font-semibold text-ink">{service.durationMinutes} min</dd>
              </div>
            ) : null}
            {priceExtras.map((field) => (
              <div key={field.fieldId}>
                <dt className="label-caps text-ink-soft/70">{field.label}</dt>
                <dd className="mt-1 text-lg font-semibold text-ink">{displayValue(field.value)}</dd>
              </div>
            ))}
          </dl>

          {otherDetails.length ? (
            <div className="mt-12">
              <h2 className="text-2xl font-extrabold tracking-[-0.03em] text-ink">Details</h2>
              <dl className="mt-6 grid gap-5 sm:grid-cols-2">
                {otherDetails.map((field) => (
                  <div key={field.fieldId} className="rounded-xl border border-line p-4">
                    <dt className="label-caps text-ink-soft/70">{field.label}</dt>
                    <dd className="mt-1 text-sm font-semibold text-ink">{displayValue(field.value)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}

          {gallery.length > 1 ? (
            <div className="mt-12 grid grid-cols-3 gap-3">
              {gallery.slice(1, 4).map((src) => (
                <div key={src} className="overflow-hidden rounded-xl">
                  <SafeImage src={src} alt="" width={480} height={360} className="aspect-[4/3] h-full w-full object-cover" />
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <aside className="h-fit rounded-xl bg-surface-low p-6 md:p-8">
          <p className="label-caps text-ink-soft/70">Sold by</p>
          <div className="mt-3 flex items-start justify-between gap-3">
            <div>
              <Link to={`/business/${sellerSlug}`} className="text-xl font-extrabold text-ink hover:underline">
                {sellerName}
              </Link>
              {verified ? (
                <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                  <BadgeCheck className="size-4" />
                  Verified partner
                </p>
              ) : null}
            </div>
            <Link
              to={`/business/${sellerSlug}#reviews`}
              className="flex shrink-0 items-center gap-1 text-sm font-bold"
            >
              <Star className="size-3.5 fill-gold text-gold" aria-hidden="true" />
              {Number(rating).toFixed(1)}
            </Link>
          </div>
          <div className="mt-6 grid gap-3">
            <Link
              to={`/business/${sellerSlug}#collections`}
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-black px-4 text-sm font-extrabold tracking-wide text-white"
            >
              View full {catalogLabel}
            </Link>
            <Link
              to={`/business/${sellerSlug}#contact`}
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-line px-4 text-sm font-extrabold tracking-wide text-ink"
            >
              {isMaterialsCatalog ? "Connect with seller" : "Contact provider"}
            </Link>
            {phone ? (
              <a href={`tel:${phone}`} className="text-sm font-semibold text-ink-soft underline-offset-4 hover:underline">
                {phone}
              </a>
            ) : null}
            {whatsapp ? (
              <a
                href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`}
                className="text-sm font-semibold text-ink-soft underline-offset-4 hover:underline"
                rel="noreferrer"
                target="_blank"
              >
                WhatsApp
              </a>
            ) : null}
          </div>
        </aside>
      </section>
    </>
  );
}
