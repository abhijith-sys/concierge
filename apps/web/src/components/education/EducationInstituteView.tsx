import { BadgeCheck, ChevronLeft, ChevronRight, MapPin, Phone, Star, Trash2 } from "lucide-react";
import { Suspense, useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import type { Business, Listing, Review, Service, User } from "../../lib/api";
import { displayValue, fieldByKey } from "../../lib/field-values";
import { lazyWithReload } from "../../lib/lazyWithReload";
import { fieldNumber } from "../../lib/education";
import { theme } from "../../lib/theme";
import { ApprovalBanner } from "../ApprovalBanner";
import { EmptyList } from "../EmptyList";
import { SafeImage } from "../SafeImage";
import { Button, Textarea } from "../ui";
import { WishlistButton } from "../WishlistButton";
import { EducationEnquiryForm } from "./EducationEnquiryForm";
import { EducationCourseCard } from "./EducationCourseCard";
import { EducationCourseModal } from "./EducationCourseModal";

const BusinessMap = lazyWithReload(() => import("../BusinessMap"), (module) => module.default);
const ITEM_PAGE_SIZE = 10;

function splitCopy(text: string) {
  const parts = text.split(/\n\n+/).map((part) => part.trim()).filter(Boolean);
  const lead = parts[0] ?? "";
  const rest = parts.slice(1).join("\n\n");
  return { lead, body: rest.length ? rest : "" };
}

function ItemPagination({
  page,
  pages,
  onPage,
}: {
  page: number;
  pages: number;
  onPage: (page: number) => void;
}) {
  if (pages <= 1) return null;
  return (
    <nav className="mt-8 flex items-center justify-center gap-1.5" aria-label="Course pages">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
        className="grid size-9 place-items-center rounded-lg border border-line bg-white text-ink disabled:opacity-35"
        aria-label="Previous page"
      >
        <ChevronLeft className="size-4" />
      </button>
      {Array.from({ length: pages }, (_, index) => index + 1).map((number) => (
        <button
          key={number}
          type="button"
          onClick={() => onPage(number)}
          aria-current={number === page ? "page" : undefined}
          className={`min-w-9 rounded-lg px-3 py-2 text-sm font-bold ${
            number === page ? "bg-navy text-white" : "border border-line bg-white text-ink-soft hover:text-navy"
          }`}
        >
          {number}
        </button>
      ))}
      <button
        type="button"
        disabled={page >= pages}
        onClick={() => onPage(page + 1)}
        className="grid size-9 place-items-center rounded-lg border border-line bg-white text-ink disabled:opacity-35"
        aria-label="Next page"
      >
        <ChevronRight className="size-4" />
      </button>
    </nav>
  );
}

function ReviewFeed({
  reviews,
  user,
  onDeleteReview,
  deleteReviewError,
}: {
  reviews: Review[];
  user: User | null;
  onDeleteReview: (id: string) => void;
  deleteReviewError?: string;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const showArrows = reviews.length > 3;

  function scroll(direction: -1 | 1) {
    const node = scroller.current;
    if (!node) return;
    const card = node.querySelector<HTMLElement>("[data-review]");
    const step = (card?.offsetWidth ?? 280) + 16;
    node.scrollBy({ left: direction * step, behavior: "smooth" });
  }

  return (
    <>
      <div className="relative mt-6">
        <div
          ref={scroller}
          className="scroll-hint flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-1"
        >
          {reviews.map((review) => (
            <article
              key={review.id}
              data-review
              className="w-[min(18.5rem,85vw)] shrink-0 snap-start rounded-xl border border-line bg-white p-5 sm:w-[calc(50%-0.5rem)] lg:w-[calc((100%-2rem)/3)]"
            >
              <div className="flex justify-between gap-3">
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
                    onClick={() => onDeleteReview(review.id)}
                    aria-label="Delete review"
                    className="icon-button text-red-700 disabled:opacity-50"
                  >
                    <Trash2 />
                  </button>
                ) : null}
              </div>
              <p className="mt-3 line-clamp-4 text-sm leading-6 text-ink-soft">{review.comment}</p>
            </article>
          ))}
        </div>
        {showArrows ? (
          <>
            <button
              type="button"
              className="absolute -left-3 top-1/2 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-white shadow-sm md:grid"
              aria-label="Previous reviews"
              onClick={() => scroll(-1)}
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              className="absolute -right-3 top-1/2 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-white shadow-sm md:grid"
              aria-label="Next reviews"
              onClick={() => scroll(1)}
            >
              <ChevronRight className="size-4" />
            </button>
          </>
        ) : null}
      </div>
      {deleteReviewError ? <p className="mt-3 text-sm text-red-700">{deleteReviewError}</p> : null}
    </>
  );
}

export function EducationInstituteView({
  profile,
  listing,
  courses,
  coursesLoading,
  reviews,
  reviewsLoading,
  reviewsError,
  user,
  canEdit,
  canReview,
  rating,
  comment,
  setRating,
  setComment,
  onSubmitReview,
  onDeleteReview,
  createReviewPending,
  createReviewError,
  deleteReviewError,
}: {
  profile: Business;
  listing: Listing;
  courses: Service[];
  coursesLoading: boolean;
  reviews: Review[];
  reviewsLoading: boolean;
  reviewsError: boolean;
  user: User | null;
  canEdit: boolean;
  canReview: boolean;
  rating: number;
  comment: string;
  setRating: (value: number) => void;
  setComment: (value: string) => void;
  onSubmitReview: (event: FormEvent) => void;
  onDeleteReview: (id: string) => void;
  createReviewPending: boolean;
  createReviewError?: string;
  deleteReviewError?: string;
}) {
  const images = listing.images?.length
    ? listing.images
    : profile.coverUrl
      ? [profile.coverUrl]
      : [theme.assets.banner];
  const heroImage = images[0];
  const copy = splitCopy(listing.description ?? "");
  const instituteFields = profile.fieldValues?.length ? profile.fieldValues : listing.fieldValues;
  const serviceHours = displayValue(fieldByKey(instituteFields, "service_hours")?.value);
  const subjects = displayValue(fieldByKey(instituteFields, "subjects")?.value);
  const modesOffered = displayValue(fieldByKey(instituteFields, "modes_offered")?.value);
  const languages = displayValue(fieldByKey(instituteFields, "languages")?.value);
  const cancellation = displayValue(fieldByKey(instituteFields, "cancellation_policy")?.value);
  const whatsapp = displayValue(fieldByKey(instituteFields, "whatsapp")?.value);
  const [openItem, setOpenItem] = useState<Service | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [itemPage, setItemPage] = useState(1);
  const itemPages = Math.max(1, Math.ceil(courses.length / ITEM_PAGE_SIZE));
  const pagedItems = courses.slice((itemPage - 1) * ITEM_PAGE_SIZE, itemPage * ITEM_PAGE_SIZE);

  useEffect(() => {
    setItemPage((current) => Math.min(current, itemPages));
  }, [itemPages]);

  function toggleItem(id: string) {
    setSelectedIds((current) => (current.includes(id) ? current.filter((row) => row !== id) : [...current, id]));
  }

  function enquireItem(service: Service) {
    setSelectedIds((current) => (current.includes(service.id) ? current : [...current, service.id]));
    setOpenItem(null);
    document.getElementById("enquiry")?.scrollIntoView({ behavior: "smooth" });
  }

  function goToItemPage(next: number) {
    setItemPage(next);
    document.getElementById("courses")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      <section className="relative min-h-[280px] overflow-hidden md:min-h-[360px]">
        <SafeImage
          src={heroImage}
          alt={profile.name}
          width={1600}
          height={1000}
          loading="eager"
          fetchPriority="high"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
        <div className="absolute right-4 top-4 z-10 flex items-center gap-2 md:right-8 md:top-6">
          <WishlistButton listingId={profile.listing?.id} />
          {canEdit ? (
            <Link
              to={`/business/${profile.slug}/edit`}
              className="rounded-lg bg-white/90 px-3 py-2 text-xs font-bold text-black backdrop-blur"
            >
              Edit institute
            </Link>
          ) : null}
        </div>
        <div className="page-shell relative flex min-h-[280px] items-end py-8 text-white md:min-h-[360px] md:py-10">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-3">
              {listing.category?.name ? (
                <span className="rounded-sm bg-gold-light px-2.5 py-1 text-[11px] font-extrabold tracking-[0.08em] text-black">
                  {listing.category.name.toUpperCase()}
                </span>
              ) : null}
              {profile.verified ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                  <BadgeCheck className="size-4" />
                  VERIFIED EDUCATION
                </span>
              ) : null}
            </div>
            <h1 className="mt-3 text-3xl font-extrabold leading-[1.05] tracking-[-0.04em] md:text-5xl">
              {profile.name}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/85">{copy.lead}</p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              {profile.phone ? (
                <a
                  href={`tel:${profile.phone}`}
                  className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-white px-5 text-sm font-extrabold tracking-wide text-black"
                >
                  <Phone className="size-4" />
                  {profile.phone}
                </a>
              ) : null}
              {whatsapp ? (
                <a
                  href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`}
                  className="inline-flex min-h-11 items-center rounded-lg border border-white/80 px-5 text-sm font-extrabold tracking-wide text-white"
                  rel="noreferrer"
                  target="_blank"
                >
                  WhatsApp
                </a>
              ) : null}
              <a
                href="#enquiry"
                className="inline-flex min-h-11 items-center rounded-lg border border-white/80 px-5 text-sm font-extrabold tracking-wide text-white"
              >
                Enquire
              </a>
              <Link
                to={`/business/${profile.slug}#reviews`}
                className="inline-flex items-center gap-1.5 text-sm font-bold text-white/85"
              >
                <Star className="size-4 fill-gold-light text-gold-light" />
                {Number(listing.avgRating ?? 0).toFixed(1)}
                <span className="font-semibold text-white/70">({listing.reviewCount ?? reviews.length} reviews)</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {canEdit && (profile.status === "pending" || profile.status === "rejected") ? (
        <div className="page-shell">
          <ApprovalBanner
            tone={profile.status === "rejected" ? "rejected" : "pending"}
            title={profile.status === "rejected" ? "This institute needs changes" : "This institute is awaiting review"}
          >
            {profile.rejectionReason}
          </ApprovalBanner>
        </div>
      ) : null}

      <section id="courses" className="scroll-mt-24 bg-surface-low">
        <div className="page-shell py-16 lg:py-24">
          <p className="label-caps text-ink-soft/70">{profile.name}</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-[-0.03em] text-ink md:text-4xl">Courses</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-soft">
            Coaching, tuition, and training courses with rates. Enquire to add one to your request.
          </p>
          {coursesLoading ? (
            <div className="mt-10 grid gap-4">
              {Array.from({ length: 3 }, (_, index) => (
                <div key={index} className="h-56 animate-pulse rounded-xl bg-white/70" />
              ))}
            </div>
          ) : courses.length ? (
            <>
              <div className="mt-10 grid gap-4">
                {pagedItems.map((service) => (
                  <EducationCourseCard
                    key={service.id}
                    service={service}
                    listingFields={instituteFields}
                    categoryName={listing.category?.name}
                    selected={selectedIds.includes(service.id)}
                    onOpen={setOpenItem}
                    onEnquire={enquireItem}
                  />
                ))}
              </div>
              <ItemPagination page={itemPage} pages={itemPages} onPage={goToItemPage} />
            </>
          ) : (
            <EmptyList
              compact
              className="mt-10"
              title="No courses listed yet"
              description="This institute has not published courses yet."
            />
          )}
        </div>
      </section>

      <section className="page-shell py-16 lg:py-24">
        <h2 className="text-3xl font-extrabold tracking-[-0.03em] text-ink">About this institute</h2>
        {copy.body || copy.lead ? (
          <p className="mt-4 max-w-3xl whitespace-pre-line text-sm leading-7 text-ink-soft md:text-[15px] md:leading-8">
            {copy.body || copy.lead}
          </p>
        ) : null}
        <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {serviceHours ? (
            <div className="rounded-xl border border-line p-4">
              <dt className="label-caps text-ink-soft/70">Hours</dt>
              <dd className="mt-1 font-semibold">{serviceHours}</dd>
            </div>
          ) : null}
          {subjects ? (
            <div className="rounded-xl border border-line p-4">
              <dt className="label-caps text-ink-soft/70">Subjects</dt>
              <dd className="mt-1 font-semibold">{subjects}</dd>
            </div>
          ) : null}
          {modesOffered ? (
            <div className="rounded-xl border border-line p-4">
              <dt className="label-caps text-ink-soft/70">Modes</dt>
              <dd className="mt-1 font-semibold">{modesOffered}</dd>
            </div>
          ) : null}
          {languages ? (
            <div className="rounded-xl border border-line p-4">
              <dt className="label-caps text-ink-soft/70">Languages</dt>
              <dd className="mt-1 font-semibold">{languages}</dd>
            </div>
          ) : null}
          {cancellation ? (
            <div className="rounded-xl border border-line p-4">
              <dt className="label-caps text-ink-soft/70">Cancellation</dt>
              <dd className="mt-1 font-semibold">{cancellation}</dd>
            </div>
          ) : null}
        </dl>
        {listing.address || listing.city ? (
          <p className="mt-6 flex items-start gap-2 text-sm text-ink-soft">
            <MapPin className="mt-0.5 size-4 shrink-0" />
            {[listing.address, listing.city].filter(Boolean).join(", ")}
          </p>
        ) : null}
      </section>

      <section id="enquiry" className="scroll-mt-20 bg-[#111111] text-white">
        <div className="page-shell py-7 lg:py-9">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-extrabold tracking-[-0.03em] md:text-2xl">Send a learning request</h2>
              <p className="mt-1 text-sm text-white/60">
                {profile.name} receives this directly — {theme.name} is not in the middle.
              </p>
            </div>
            {profile.phone ? (
              <a href={`tel:${profile.phone}`} className="inline-flex items-center gap-2 text-sm font-extrabold">
                <Phone className="size-4" />
                {profile.phone}
              </a>
            ) : null}
          </div>
          <EducationEnquiryForm
            businessId={profile.id}
            courses={courses}
            selectedIds={selectedIds}
            onToggleCourse={toggleItem}
          />
        </div>
      </section>

      <section id="reviews" className="page-shell scroll-mt-20 py-12 lg:py-16">
        <p className="label-caps text-ink-soft/70">Learner perspective</p>
        <h2 className="mt-3 text-3xl font-extrabold tracking-[-0.03em]">Reviews</h2>
        {reviewsLoading ? (
          <div className="mt-6 h-36 animate-pulse rounded-xl bg-surface-high" />
        ) : reviewsError ? (
          <p className="mt-4 text-sm text-red-700">Reviews are temporarily unavailable.</p>
        ) : reviews.length ? (
          <ReviewFeed
            reviews={reviews}
            user={user}
            onDeleteReview={onDeleteReview}
            deleteReviewError={deleteReviewError}
          />
        ) : (
          <EmptyList compact className="mt-4" title="No reviews yet" description="Be the first to share a course here." />
        )}
        <div className="mt-8">
          {canReview ? (
            <form onSubmit={onSubmitReview} className="rounded-xl bg-black p-6 text-white md:p-8">
              <h2 className="text-xl font-semibold">Share this institute</h2>
              <p className="mt-1 text-sm text-white/65">Your review helps others choose a course confidently.</p>
              <div className="mt-4 flex gap-2" aria-label="Rating">
                {Array.from({ length: 5 }, (_, index) => (
                  <button key={index} type="button" onClick={() => setRating(index + 1)} aria-label={`${index + 1} stars`}>
                    <Star className={`size-7 ${index < rating ? "fill-gold-light text-gold-light" : "text-white/30"}`} />
                  </button>
                ))}
              </div>
              <Textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                rows={3}
                minLength={10}
                placeholder="Was the teaching clear? Did the course match the listing?"
                className="mt-4 rounded-md border-white/20 bg-white/10 text-white placeholder:text-white/40"
                required
              />
              {createReviewError ? <p className="mt-3 text-sm text-red-300">{createReviewError}</p> : null}
              <Button variant="gold" className="mt-4 rounded-lg" disabled={createReviewPending}>
                {createReviewPending ? "Publishing…" : "Publish review"}
              </Button>
            </form>
          ) : (
            <div className="rounded-xl bg-surface-low p-6 md:flex md:items-center md:justify-between md:gap-6 md:p-7">
              <div>
                <h2 className="text-xl font-semibold">Studied with {profile.name}?</h2>
                <p className="mt-1 text-sm text-ink-soft">Sign in with a member account to write a review.</p>
              </div>
              <Link to="/login" state={{ from: `/business/${profile.slug}` }} className="mt-4 inline-block md:mt-0">
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

      {openItem ? (
        <EducationCourseModal
          key={openItem.id}
          service={openItem}
          onClose={() => setOpenItem(null)}
          onEnquire={enquireItem}
        />
      ) : null}
    </>
  );
}
