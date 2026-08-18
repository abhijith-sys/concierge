import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, BadgeCheck, Check, MapPin, Star, Trash2 } from "lucide-react";
import { Suspense, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { ApprovalBanner } from "../components/ApprovalBanner";
import { SafeImage } from "../components/SafeImage";
import { Button, PageState, Textarea } from "../components/ui";
import { WishlistButton } from "../components/WishlistButton";
import { useAuth } from "../context/useAuth";
import { api, type FieldValue, type Listing, type Service } from "../lib/api";
import { theme } from "../lib/theme";
import { recordExploredCategory, recordRecentListing } from "../lib/discovery";
import { formatListingPrice } from "../lib/pricing";
import { isSupplierListing } from "../lib/listing-kind";
import { lazyWithReload } from "../lib/lazyWithReload";

const BusinessMap = lazyWithReload(() => import("../components/BusinessMap"), (module) => module.default);
const fallbackHero = theme.assets.banner;

function displayValue(value: unknown) {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.join(", ");
  if (value == null || value === "") return "";
  return String(value);
}

function visibleFields(fields?: FieldValue[]) {
  return (fields ?? []).filter((item) => {
    const text = displayValue(item.value);
    return text.length > 0 && !(Array.isArray(item.value) && !item.value.length);
  });
}

function fieldByKey(fields: FieldValue[] | undefined, key: string) {
  return fields?.find((item) => item.key === key);
}

function splitCopy(text: string) {
  const parts = text.split(/\n\n+/).map((part) => part.trim()).filter(Boolean);
  const lead = parts[0] ?? "";
  const rest = parts.slice(1).join("\n\n");
  return { lead, body: rest.length ? rest : lead };
}

function captionFromSrc(src: string) {
  const file = src.split("/").pop()?.replace(/\.[^.]+$/, "") ?? "Project";
  return file.replace(/[-_]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function plusLabel(value: number | string) {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return String(value);
  return numeric >= 10 ? `${Math.round(numeric)}+` : String(Math.round(numeric));
}

export function BusinessDetail() {
  const { slug = "" } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [inquiry, setInquiry] = useState({
    name: user?.name ?? "",
    firm: "",
    email: user?.email ?? "",
    project: "",
  });
  const [inquirySent, setInquirySent] = useState(false);

  const business = useQuery({ queryKey: ["business", slug], queryFn: () => api.business(slug) });
  const reviews = useQuery({
    queryKey: ["reviews", business.data?.id],
    queryFn: () => api.reviews(business.data!.id),
    enabled: Boolean(business.data?.id),
  });
  const services = useQuery({
    queryKey: ["services", business.data?.id],
    queryFn: () => api.services(business.data!.id),
    enabled: Boolean(business.data?.id),
  });
  const createReview = useMutation({
    mutationFn: api.createReview,
    onSuccess: async () => {
      setComment("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["reviews", business.data?.id] }),
        queryClient.invalidateQueries({ queryKey: ["business", slug] }),
      ]);
    },
  });
  const deleteReview = useMutation({
    mutationFn: api.deleteReview,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["reviews", business.data?.id] }),
        queryClient.invalidateQueries({ queryKey: ["business", slug] }),
      ]);
    },
  });

  useEffect(() => {
    const profile = business.data;
    if (!profile?.listing?.id) return;
    recordRecentListing({
      ...profile.listing,
      business: profile,
      businessId: profile.id,
    });
    if (profile.listing.category?.slug && profile.listing.category.name) {
      recordExploredCategory({
        slug: profile.listing.category.slug,
        name: profile.listing.category.name,
      });
    }
  }, [business.data]);

  useEffect(() => {
    setInquiry((current) => ({
      ...current,
      name: current.name || user?.name || "",
      email: current.email || user?.email || "",
    }));
  }, [user?.name, user?.email]);

  if (business.isLoading) return <PageState title="Preparing this profile" loading />;
  if (business.isError || !business.data) {
    return (
      <PageState
        title="Business not found"
        description="This profile may be unavailable or the link may have changed."
        action={
          <Link to="/listings">
            <Button>Browse listings</Button>
          </Link>
        }
      />
    );
  }

  const profile = business.data;
  const listing = profile.listing ?? (profile as unknown as Listing);
  const images = listing.images?.length
    ? listing.images
    : profile.coverUrl
      ? [profile.coverUrl]
      : [fallbackHero];
  const allReviews = reviews.data ?? profile.reviews ?? [];
  const canReview = Boolean(user && (user.role === "admin" || user.id !== profile.ownerId));
  const canEdit = Boolean(user && (user.role === "admin" || user.id === profile.ownerId));
  const copy = splitCopy(listing.description ?? "");
  const aboutHeading = listing.title && listing.title !== profile.name ? listing.title : "A standard of lasting work.";
  const heroImage = images[0];
  const legacyImage = images[1] ?? images[0];
  const projectImages = (images.length > 4 ? images.slice(2, 5) : images.slice(1, 4)).filter(Boolean).slice(0, 3);
  const offerings = services.data ?? [];
  const isMaterialsCatalog = isSupplierListing(listing);
  const whatsapp = displayValue(fieldByKey(profile.fieldValues, "whatsapp")?.value);
  const featured = offerings[0];
  const sideOfferings = offerings.slice(1, 4);
  const featuredFields = visibleFields(featured?.fieldValues)
    .filter((item) => item.key !== "selection_note")
    .slice(0, 3);
  const stats = buildLegacyStats({
    fields: profile.fieldValues,
    rating: listing.avgRating,
    reviewCount: listing.reviewCount ?? allReviews.length,
    listingsCount: offerings.length,
    verified: profile.verified,
  });

  function submitReview(event: FormEvent) {
    event.preventDefault();
    if (!comment.trim()) return;
    createReview.mutate({ businessId: profile.id, rating, comment: comment.trim() });
  }

  function submitInquiry(event: FormEvent) {
    event.preventDefault();
    if (!profile.email) return;
    const body = [
      `Name: ${inquiry.name}`,
      inquiry.firm ? `Firm / company: ${inquiry.firm}` : null,
      `Email: ${inquiry.email}`,
      "",
      inquiry.project,
    ]
      .filter((line) => line !== null)
      .join("\n");
    window.location.href = `mailto:${profile.email}?subject=${encodeURIComponent(`Inquiry for ${profile.name}`)}&body=${encodeURIComponent(body)}`;
    setInquirySent(true);
  }

  return (
    <>
      <section className="relative min-h-[72vh] overflow-hidden md:min-h-[82vh]">
        <SafeImage
          src={heroImage}
          alt={`${profile.name} signature work`}
          width={1600}
          height={1000}
          loading="eager"
          fetchPriority="high"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/10" />
        <div className="absolute right-4 top-4 z-10 flex items-center gap-2 md:right-8 md:top-6">
          <WishlistButton listingId={profile.listing?.id} />
          {canEdit ? (
            <Link
              to={`/business/${profile.slug}/edit`}
              className="rounded-lg bg-white/90 px-3 py-2 text-xs font-bold text-black backdrop-blur"
            >
              Edit profile
            </Link>
          ) : null}
        </div>
        <div className="page-shell relative flex min-h-[72vh] items-end pb-12 text-white md:min-h-[82vh] md:pb-16">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-3">
              {listing.featured ? (
                <span className="rounded-sm bg-gold-light px-2.5 py-1 text-[11px] font-extrabold tracking-[0.08em] text-black">
                  PREMIUM SUPPLIER
                </span>
              ) : null}
              {profile.verified ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                  <BadgeCheck className="size-4" />
                  VERIFIED PARTNER
                </span>
              ) : null}
            </div>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-[-0.04em] md:text-6xl">
              {profile.name}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/85 md:text-base">{copy.lead}</p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              {offerings.length ? (
                <a
                  href="#collections"
                  className="inline-flex min-h-11 items-center rounded-lg bg-white px-5 text-sm font-extrabold tracking-wide text-black"
                >
                  {isMaterialsCatalog ? "VIEW CATALOG" : "VIEW OFFERINGS"}
                </a>
              ) : null}
              <a
                href="#contact"
                className="inline-flex min-h-11 items-center rounded-lg border border-white/80 px-5 text-sm font-extrabold tracking-wide text-white"
              >
                {isMaterialsCatalog ? "CONNECT" : "CONTACT"}
              </a>
              {profile.phone ? (
                <a href={`tel:${profile.phone}`} className="text-sm font-semibold text-white/80 underline-offset-4 hover:underline">
                  {profile.phone}
                </a>
              ) : null}
              {whatsapp ? (
                <a
                  href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`}
                  className="text-sm font-semibold text-white/80 underline-offset-4 hover:underline"
                  rel="noreferrer"
                  target="_blank"
                >
                  WhatsApp
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {canEdit && (profile.status === "pending" || profile.status === "rejected") ? (
        <div className="page-shell">
          <ApprovalBanner
            tone={profile.status === "rejected" ? "rejected" : "pending"}
            title={profile.status === "rejected" ? "This profile needs changes" : "This profile is awaiting review"}
          >
            {profile.rejectionReason}
          </ApprovalBanner>
        </div>
      ) : null}

      <section className="bg-surface-low">
        <div className="page-shell grid items-center gap-12 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-24">
          <div>
            <p className="label-caps text-ink-soft/70">Our Legacy</p>
            <h2 className="mt-4 text-3xl font-extrabold tracking-[-0.03em] text-ink md:text-5xl">{aboutHeading}</h2>
            <p className="mt-6 max-w-xl text-sm leading-7 text-ink-soft md:text-[15px] md:leading-8">{copy.body}</p>
            <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <p className="text-3xl font-extrabold tracking-tight text-ink md:text-4xl">{stat.value}</p>
                  <p className="mt-1 text-[11px] font-medium text-ink-soft">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="overflow-hidden rounded-xl">
            <SafeImage
              src={legacyImage}
              alt={`${profile.name} studio and materials`}
              width={960}
              height={720}
              className="aspect-[5/4] h-full w-full object-cover"
            />
          </div>
        </div>

        {services.isLoading || offerings.length ? (
          <div id="collections" className="page-shell scroll-mt-24 pb-20 lg:pb-24">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="label-caps text-ink-soft/70">Latest selection</p>
                <h2 className="mt-3 text-3xl font-extrabold tracking-[-0.03em] text-ink md:text-4xl">
                  {isMaterialsCatalog ? "Catalog" : "Offerings"}
                </h2>
              </div>
              {listing.category ? (
                <Link
                  to={`/listings/${listing.category.slug}`}
                  className="label-caps inline-flex items-center gap-1 text-ink-soft transition hover:text-ink"
                >
                  Explore full catalog <ArrowRight className="size-3.5" />
                </Link>
              ) : null}
            </div>

            {services.isLoading ? (
              <div className="mt-10 grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
                <div className="h-[28rem] animate-pulse rounded-xl bg-white/70" />
                <div className="grid gap-4">
                  {Array.from({ length: 3 }, (_, index) => (
                    <div key={index} className="h-28 animate-pulse rounded-xl bg-white/70" />
                  ))}
                </div>
              </div>
            ) : featured ? (
              <div className={`mt-10 grid gap-6 ${sideOfferings.length ? "lg:grid-cols-[1.35fr_0.65fr]" : ""}`}>
                <FeaturedOfferingCard service={featured} fields={featuredFields} />
                {sideOfferings.length ? (
                  <ul className="grid gap-4">
                    {sideOfferings.map((service) => (
                      <li key={service.id}>
                        <SideOfferingCard service={service} />
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </section>

      {projectImages.length ? (
        <section className="bg-white py-20 lg:py-24">
          <div className="page-shell">
            <p className="label-caps text-center text-ink-soft/70">Case studies</p>
            <h2 className="mt-3 text-center text-3xl font-extrabold tracking-[-0.03em] text-ink md:text-4xl">
              Legacy Projects
            </h2>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {projectImages.map((image) => (
                <article key={image} className="group overflow-hidden rounded-xl">
                  <div className="relative aspect-[3/4] overflow-hidden rounded-xl">
                    <SafeImage
                      src={image}
                      alt={`${profile.name} ${captionFromSrc(image)}`}
                      width={720}
                      height={960}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-5 text-white">
                      <h3 className="text-lg font-bold">{captionFromSrc(image)}</h3>
                      <p className="mt-1 text-sm text-white/75">{listing.city || "Selected work"}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section id="contact" className="scroll-mt-20 bg-[#111111] text-white">
        <div className="page-shell grid gap-12 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20 lg:py-24">
          <div>
            <h2 className="max-w-lg text-3xl font-extrabold leading-tight tracking-[-0.03em] md:text-5xl">
              {isMaterialsCatalog
                ? "Partner with Excellence for Bulk Logistics."
                : "Partner with excellence for your next project."}
            </h2>
            <p className="mt-6 max-w-md text-sm leading-7 text-white/65">
              {isMaterialsCatalog
                ? "From quarry reservation to climate-controlled delivery, we coordinate procurement for architects, developers, and interior houses that cannot wait on standard lead times."
                : `Share the scope, timeline, and materials you need. ${profile.name} will follow up directly — ${theme.name} does not sit in the middle of the conversation.`}
            </p>
            <ul className="mt-10 grid gap-4">
              {(isMaterialsCatalog
                ? [
                    "Priority Slab Selection & Reservations",
                    "Climate-Controlled Logistics & Warehousing",
                    "Direct Manufacturer Tier Pricing",
                  ]
                : [
                    "Priority consultation and availability checks",
                    "Project coordination from first brief to delivery",
                    "Direct pricing from the provider, not a marketplace bid",
                  ]
              ).map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm font-medium text-white/90">
                  <Check className="mt-0.5 size-5 shrink-0 text-gold" strokeWidth={2.5} />
                  {item}
                </li>
              ))}
            </ul>
            {listing.address || listing.city ? (
              <p className="mt-8 flex items-start gap-2 text-sm text-white/55">
                <MapPin className="mt-0.5 size-4 shrink-0" />
                {[listing.address, listing.city].filter(Boolean).join(", ")}
              </p>
            ) : null}
          </div>
          <form onSubmit={submitInquiry} className="rounded-xl bg-[#1c1c1c] p-6 md:p-8">
            <InquiryField label="Full name">
              <input
                required
                value={inquiry.name}
                onChange={(event) => setInquiry((current) => ({ ...current, name: event.target.value }))}
                className="min-h-12 w-full rounded-md border border-white/10 bg-[#2a2a2a] px-4 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/30"
              />
            </InquiryField>
            <InquiryField label="Firm / company">
              <input
                value={inquiry.firm}
                onChange={(event) => setInquiry((current) => ({ ...current, firm: event.target.value }))}
                className="min-h-12 w-full rounded-md border border-white/10 bg-[#2a2a2a] px-4 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/30"
              />
            </InquiryField>
            <InquiryField label="Email address">
              <input
                type="email"
                required
                value={inquiry.email}
                onChange={(event) => setInquiry((current) => ({ ...current, email: event.target.value }))}
                className="min-h-12 w-full rounded-md border border-white/10 bg-[#2a2a2a] px-4 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/30"
              />
            </InquiryField>
            <InquiryField label="Project description">
              <textarea
                required
                minLength={10}
                rows={5}
                value={inquiry.project}
                onChange={(event) => setInquiry((current) => ({ ...current, project: event.target.value }))}
                className="w-full rounded-md border border-white/10 bg-[#2a2a2a] px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/30"
              />
            </InquiryField>
            {profile.email ? (
              <button
                type="submit"
                className="mt-2 inline-flex min-h-12 w-full items-center justify-center rounded-md bg-white text-sm font-extrabold tracking-wide text-black"
              >
                {inquirySent ? "INQUIRY READY IN YOUR EMAIL" : "SUBMIT BULK INQUIRY"}
              </button>
            ) : (
              <p className="mt-2 text-sm text-white/60">This provider has not published a contact email yet.</p>
            )}
          </form>
        </div>
      </section>

      <section className="page-shell grid gap-10 py-20 lg:grid-cols-2">
        <div>
          <p className="label-caps text-ink-soft/70">Client perspective</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-[-0.03em]">Reviews</h2>
          {reviews.isLoading ? (
            <div className="mt-8 h-32 animate-pulse rounded-xl bg-surface-high" />
          ) : reviews.isError ? (
            <p className="mt-6 text-sm text-red-700">Reviews are temporarily unavailable.</p>
          ) : allReviews.length ? (
            <>
              <div className="mt-8 grid gap-4">
                {allReviews.map((review) => (
                  <article key={review.id} className="rounded-xl border border-line p-6">
                    <div className="flex justify-between gap-4">
                      <div>
                        <strong>{review.user?.name ?? `${theme.name} member`}</strong>
                        <div className="mt-1 flex gap-0.5">
                          {Array.from({ length: 5 }, (_, index) => (
                            <Star
                              key={index}
                              className={`size-4 ${index < review.rating ? "fill-gold text-gold" : "text-line"}`}
                            />
                          ))}
                        </div>
                      </div>
                      {user && (user.id === review.userId || user.role === "admin") ? (
                        <button
                          onClick={() => deleteReview.mutate(review.id)}
                          disabled={deleteReview.isPending}
                          aria-label="Delete review"
                          className="icon-button text-red-700 disabled:opacity-50"
                        >
                          <Trash2 />
                        </button>
                      ) : null}
                    </div>
                    <p className="mt-4 text-sm leading-6 text-ink-soft">{review.comment}</p>
                  </article>
                ))}
              </div>
              {deleteReview.isError ? <p className="mt-4 text-sm text-red-700">{deleteReview.error.message}</p> : null}
            </>
          ) : (
            <p className="mt-6 text-sm text-ink-soft">No reviews yet. Be the first to share your experience.</p>
          )}
        </div>
        <div>
          {canReview ? (
            <form onSubmit={submitReview} className="rounded-xl bg-black p-7 text-white md:p-9">
              <h2 className="text-2xl font-semibold">Share your experience</h2>
              <p className="mt-2 text-sm text-white/65">Your review helps the {theme.name} community choose confidently.</p>
              <div className="mt-6 flex gap-2" aria-label="Rating">
                {Array.from({ length: 5 }, (_, index) => (
                  <button key={index} type="button" onClick={() => setRating(index + 1)} aria-label={`${index + 1} stars`}>
                    <Star className={`size-7 ${index < rating ? "fill-gold-light text-gold-light" : "text-white/30"}`} />
                  </button>
                ))}
              </div>
              <Textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                rows={5}
                minLength={10}
                placeholder="What made the experience stand out?"
                className="mt-5 rounded-md border-white/20 bg-white/10 text-white placeholder:text-white/40"
                required
              />
              {createReview.isError ? <p className="mt-3 text-sm text-red-300">{createReview.error.message}</p> : null}
              <Button variant="gold" className="mt-5 rounded-lg" disabled={createReview.isPending}>
                {createReview.isPending ? "Publishing…" : "Publish review"}
              </Button>
            </form>
          ) : (
            <div className="rounded-xl bg-surface-low p-9">
              <h2 className="text-2xl font-semibold">Have experience with {profile.name}?</h2>
              <p className="mt-3 text-sm text-ink-soft">Sign in with a member account to write a review.</p>
              <Link to="/login" state={{ from: `/business/${profile.slug}` }} className="mt-6 inline-block">
                <Button className="rounded-lg">Sign in to review</Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {typeof listing.lat === "number" && typeof listing.lng === "number" ? (
        <section className="page-shell pb-20">
          <h2 className="mb-6 text-3xl font-extrabold tracking-[-0.03em]">Find {profile.name}</h2>
          <Suspense fallback={<div className="h-80 animate-pulse rounded-xl bg-surface-high" />}>
            <BusinessMap lat={listing.lat} lng={listing.lng} name={profile.name} />
          </Suspense>
        </section>
      ) : null}
    </>
  );
}

function buildLegacyStats({
  fields,
  rating,
  reviewCount,
  listingsCount,
  verified,
}: {
  fields?: FieldValue[];
  rating?: number;
  reviewCount: number;
  listingsCount: number;
  verified: boolean;
}) {
  const years = fieldByKey(fields, "years_of_experience");
  const emergency = fieldByKey(fields, "emergency_timing");
  const stats: Array<{ value: string; label: string }> = [];

  if (years?.value != null && displayValue(years.value)) {
    stats.push({ value: plusLabel(Number(years.value)), label: "Years Experience" });
  } else {
    stats.push({ value: Number(rating ?? 0).toFixed(1), label: "Average rating" });
  }

  if (listingsCount) stats.push({ value: String(listingsCount), label: "Catalog items" });
  stats.push({ value: plusLabel(reviewCount), label: "Client reviews" });

  if (emergency?.value) {
    stats.push({ value: displayValue(emergency.value), label: "Support Turnaround" });
  } else if (verified) {
    stats.push({ value: "Yes", label: `${theme.name} verified` });
  } else {
    stats.push({ value: Number(rating ?? 0).toFixed(1), label: "Average rating" });
  }

  return stats.slice(0, 4);
}

function InquiryField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="mb-5 grid gap-2">
      <span className="label-caps text-white/55">{label}</span>
      {children}
    </label>
  );
}

function FeaturedOfferingCard({ service, fields }: { service: Service; fields: FieldValue[] }) {
  const details: Array<{ fieldId: string; label: string; value: unknown }> = fields.length
    ? fields
    : [
        { fieldId: "price", label: "Price", value: formatListingPrice(service) },
        ...(service.durationMinutes
          ? [{ fieldId: "duration", label: "Duration", value: `${service.durationMinutes} min` }]
          : []),
      ];
  const image = service.images?.[0];
  const inStock = service.isActive && service.approvalStatus !== "rejected";

  return (
    <article>
      <div className="overflow-hidden rounded-xl">
        <div className="aspect-[16/11] overflow-hidden rounded-xl bg-white">
          {image ? (
            <SafeImage src={image} alt={service.name} width={1200} height={800} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-white" />
          )}
        </div>
      </div>
      <div className="pt-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-extrabold text-ink md:text-2xl">{service.name}</h3>
            <p className="mt-1 text-sm text-ink-soft">{service.description}</p>
          </div>
          {inStock ? (
            <span className="rounded-sm bg-emerald-50 px-2 py-1 text-[11px] font-extrabold tracking-wide text-emerald-700">
              IN STOCK
            </span>
          ) : null}
        </div>
        <div className="mt-6 grid gap-4 border-t border-line pt-5 sm:grid-cols-3">
          {details.slice(0, 3).map((item) => (
            <div key={item.fieldId}>
              <p className="label-caps text-ink-soft/70">{item.label}</p>
              <p className="mt-1 text-sm font-semibold text-ink">{displayValue(item.value)}</p>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}

function SideOfferingCard({ service }: { service: Service }) {
  const fields = visibleFields(service.fieldValues);
  const tag = fields.find((item) => item.key === "selection_note") ?? fields[0];
  const tagText = tag ? displayValue(tag.value) : formatListingPrice(service);
  const image = service.images?.[0];

  return (
    <article className="flex gap-4 rounded-xl bg-white p-3.5">
      <div className="size-24 shrink-0 overflow-hidden rounded-lg bg-surface-high sm:size-28">
        {image ? (
          <SafeImage src={image} alt="" width={224} height={224} className="h-full w-full object-cover" />
        ) : null}
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <h3 className="font-extrabold text-ink">{service.name}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-ink-soft">{service.description}</p>
        <p className="label-caps mt-3 text-ink-soft">{tagText}</p>
      </div>
    </article>
  );
}
