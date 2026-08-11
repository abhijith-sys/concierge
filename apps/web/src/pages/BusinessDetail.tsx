import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, Clock3, Globe2, MapPin, Phone, Star, Trash2 } from "lucide-react";
import { Suspense, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { SafeImage } from "../components/SafeImage";
import { Button, PageState, Textarea } from "../components/ui";
import { useAuth } from "../context/useAuth";
import { api, type Listing } from "../lib/api";
import { lazyWithReload } from "../lib/lazyWithReload";

const BusinessMap = lazyWithReload(() => import("../components/BusinessMap"), (module) => module.default);
const fallbackHero = "/assets/concierge-architectural-hero.jpg";

export function BusinessDetail() {
  const { slug = "" } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
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

  if (business.isLoading) return <PageState title="Preparing this profile" loading />;
  if (business.isError || !business.data) return <PageState title="Business not found" description="This profile may be unavailable or the link may have changed." action={<Link to="/listings"><Button>Browse listings</Button></Link>} />;

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
  const isAura = profile.slug === "aura-interior-furniture";
  const isElite = profile.slug === "elite-build-masonry";
  const socials = profile.socialLinks ?? {};

  function submitReview(event: FormEvent) {
    event.preventDefault();
    if (!comment.trim()) return;
    createReview.mutate({ businessId: profile.id, rating, comment: comment.trim() });
  }

  return (
    <>
      <section className="animate-reveal relative min-h-[68vh] overflow-hidden">
        <SafeImage src={images[0]} alt={`${profile.name} signature work`} width={1600} height={1000} loading="eager" fetchPriority="high" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
        <div className="page-shell relative flex min-h-[68vh] items-end pb-12 text-white md:pb-16">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-3">
              {profile.verified ? <span className="flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-bold"><BadgeCheck className="size-4" /> Verified partner</span> : null}
              {listing.category ? <span className="label-caps rounded-full bg-gold-light px-3 py-2 text-gold-dark">{listing.category.name}</span> : null}
            </div>
            <h1 className="mt-5 text-4xl font-bold leading-tight tracking-[-.04em] md:text-6xl">{profile.name}</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/80 md:text-lg">{listing.description}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              {profile.phone ? <a href={`tel:${profile.phone}`}><Button variant="gold"><Phone className="size-4" /> Call business</Button></a> : null}
              {listing.website ? <a href={listing.website} target="_blank" rel="noreferrer"><Button className="border border-white/40 bg-white/10 backdrop-blur hover:bg-white/20"><Globe2 className="size-4" /> Website</Button></a> : null}
              {canEdit ? <Link to={`/business/${profile.slug}/edit`}><Button variant="outline" className="border-white/40 bg-white/10 text-white hover:bg-white/20">Edit profile</Button></Link> : null}
            </div>
          </div>
        </div>
      </section>

      <section className="page-shell grid gap-12 py-20 lg:grid-cols-[1.4fr_.6fr]">
        <div>
          <p className="label-caps text-gold-dark">About the business</p>
          <h2 className="mt-3 text-3xl font-semibold">Craft, expertise, and considered service.</h2>
          <p className="mt-6 max-w-3xl leading-8 text-ink-soft">{listing.description}</p>
          <div className="mt-10 grid grid-cols-3 gap-4 border-y border-line py-8">
            <div><strong className="text-3xl">{Number(listing.avgRating ?? 0).toFixed(1)}</strong><span className="mt-1 block text-xs text-ink-soft">Average rating</span></div>
            <div><strong className="text-3xl">{listing.reviewCount ?? allReviews.length}</strong><span className="mt-1 block text-xs text-ink-soft">Client reviews</span></div>
            <div><strong className="text-3xl">{profile.verified ? "Yes" : "New"}</strong><span className="mt-1 block text-xs text-ink-soft">Concierge verified</span></div>
          </div>
        </div>
        <aside className="rounded-3xl bg-surface-low p-7">
          <h2 className="text-lg font-semibold">Business details</h2>
          <div className="mt-6 grid gap-5 text-sm">
            {listing.address || listing.city ? <div className="flex gap-3"><MapPin className="mt-0.5 size-5 shrink-0" /><span>{listing.address}{listing.address && listing.city ? ", " : ""}{listing.city}</span></div> : null}
            {listing.hours ? <div className="flex gap-3"><Clock3 className="mt-0.5 size-5 shrink-0" /><div>{Object.entries(listing.hours).map(([day, value]) => <p key={day}><span className="capitalize">{day}</span>: {value ? `${value[0]}–${value[1]}` : "Closed"}</p>)}</div></div> : null}
            {profile.email ? <a className="font-semibold underline" href={`mailto:${profile.email}`}>{profile.email}</a> : null}
            {socials.instagram ? <a className="font-semibold underline" href={socials.instagram} target="_blank" rel="noreferrer">Instagram</a> : null}
            {socials.facebook ? <a className="font-semibold underline" href={socials.facebook} target="_blank" rel="noreferrer">Facebook</a> : null}
          </div>
        </aside>
      </section>

      {services.data?.length ? (
        <section className="page-shell py-16">
          <p className="label-caps text-gold-dark">Services</p>
          <h2 className="mt-3 text-3xl font-semibold">What this partner offers</h2>
          <ul className="mt-8 grid gap-4 md:grid-cols-2">
            {services.data.map((service) => (
              <li key={service.id} className="rounded-3xl border border-line p-6">
                <h3 className="text-lg font-semibold">{service.name}</h3>
                <p className="mt-2 text-sm leading-6 text-ink-soft">{service.description}</p>
                <p className="mt-4 text-sm font-bold">
                  {service.currency} {Number(service.price).toFixed(2)}
                  {service.durationMinutes ? ` · ${service.durationMinutes} min` : ""}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {isElite ? (
        <section className="bg-surface-low py-20">
          <div className="page-shell">
            <p className="label-caps text-gold-dark">Live inventory</p>
            <h2 className="mt-3 text-3xl font-semibold">Products &amp; architectural materials</h2>
            <div className="mt-8 grid gap-6 lg:grid-cols-[1.25fr_.75fr]">
              <article className="overflow-hidden rounded-3xl bg-white shadow-sm">
                <SafeImage src="/assets/elite-slab.jpg" alt="Calacatta marble slab selection" width={900} height={600} className="aspect-[16/10] w-full object-cover" />
                <div className="p-7"><p className="label-caps text-emerald-700">In stock</p><h3 className="mt-2 text-2xl font-semibold">Calacatta Borghini selection</h3><p className="mt-2 text-sm text-ink-soft">Exclusive stone, engineered timber, architectural steel, and structural glass.</p></div>
              </article>
              <article className="overflow-hidden rounded-3xl bg-navy text-white">
                <SafeImage src="/assets/elite-plans.jpg" alt="Architectural plans and material samples" width={640} height={640} className="aspect-square w-full object-cover opacity-90" />
                <div className="p-7"><p className="label-caps text-gold-light">Our legacy</p><h3 className="mt-2 text-2xl font-semibold">Artistry in every atom.</h3><p className="mt-3 text-sm leading-6 text-white/70">Three decades of global sourcing and structural integration expertise.</p></div>
              </article>
            </div>
          </div>
        </section>
      ) : null}

      {isAura ? (
        <section className="bg-surface-low py-20">
          <div className="page-shell">
            <p className="label-caps text-gold-dark">Designer collections</p>
            <h2 className="mt-3 text-3xl font-semibold">The Aura showroom experience</h2>
            <div className="mt-8 grid overflow-hidden rounded-3xl bg-white shadow-sm md:grid-cols-2">
              <SafeImage src="/assets/aura-chair.jpg" alt="Emerald velvet lounge chair with walnut frame" width={800} height={800} className="h-full min-h-96 w-full object-cover" />
              <div className="flex flex-col justify-center p-8 md:p-12">
                <p className="label-caps text-gold-dark">Featured piece</p>
                <h3 className="mt-4 text-3xl font-semibold">The Emerald Lounge Chair</h3>
                <p className="mt-5 leading-7 text-ink-soft">Solid walnut framing meets Italian velvet in a considered expression of bespoke living.</p>
                <div className="mt-8 border-t border-line pt-6"><strong>Artisanal precision</strong><p className="mt-2 text-sm leading-6 text-ink-soft">Material sourcing, heritage joinery, and white-glove installation tailored to each interior.</p></div>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {images.length > 1 ? (
        <section className="bg-surface-low py-20">
          <div className="page-shell"><p className="label-caps text-gold-dark">Selected work</p><h2 className="mt-3 text-3xl font-semibold">Gallery</h2>
            <div className="mt-8 grid auto-rows-[240px] gap-5 md:grid-cols-3">
              {images.slice(1, 7).map((image, index) => <div key={image} className={`group overflow-hidden rounded-2xl ${index === 0 ? "md:col-span-2" : ""}`}><SafeImage src={image} alt={`${profile.name} project ${index + 1}`} width={800} height={560} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" /></div>)}
            </div>
          </div>
        </section>
      ) : null}

      <section className="page-shell grid gap-10 py-20 lg:grid-cols-2">
        <div>
          <p className="label-caps text-gold-dark">Client perspective</p>
          <h2 className="mt-3 text-3xl font-semibold">Reviews</h2>
          {reviews.isLoading ? <div className="mt-8 h-32 animate-pulse rounded-2xl bg-surface-high" /> : reviews.isError ? (
            <p className="mt-6 text-sm text-red-700">Reviews are temporarily unavailable.</p>
          ) : allReviews.length ? (
            <>
              <div className="mt-8 grid gap-4">
                {allReviews.map((review) => (
                  <article key={review.id} className="rounded-2xl border border-line p-6">
                    <div className="flex justify-between gap-4"><div><strong>{review.user?.name ?? "Concierge member"}</strong><div className="mt-1 flex gap-0.5">{Array.from({ length: 5 }, (_, index) => <Star key={index} className={`size-4 ${index < review.rating ? "fill-gold text-gold" : "text-line"}`} />)}</div></div>
                      {user && (user.id === review.userId || user.role === "admin") ? <button onClick={() => deleteReview.mutate(review.id)} disabled={deleteReview.isPending} aria-label="Delete review" className="icon-button text-red-700 disabled:opacity-50"><Trash2 /></button> : null}
                    </div>
                    <p className="mt-4 text-sm leading-6 text-ink-soft">{review.comment}</p>
                  </article>
                ))}
              </div>
              {deleteReview.isError ? <p className="mt-4 text-sm text-red-700">{deleteReview.error.message}</p> : null}
            </>
          ) : <p className="mt-6 text-sm text-ink-soft">No reviews yet. Be the first to share your experience.</p>}
        </div>
        <div>
          {canReview ? (
            <form onSubmit={submitReview} className="rounded-3xl bg-black p-7 text-white md:p-9">
              <h2 className="text-2xl font-semibold">Share your experience</h2>
              <p className="mt-2 text-sm text-white/65">Your review helps the Concierge community choose confidently.</p>
              <div className="mt-6 flex gap-2" aria-label="Rating">
                {Array.from({ length: 5 }, (_, index) => <button key={index} type="button" onClick={() => setRating(index + 1)} aria-label={`${index + 1} stars`}><Star className={`size-7 ${index < rating ? "fill-gold-light text-gold-light" : "text-white/30"}`} /></button>)}
              </div>
              <Textarea value={comment} onChange={(event) => setComment(event.target.value)} rows={5} minLength={10} placeholder="What made the experience stand out?" className="mt-5 border-white/20 bg-white/10 text-white placeholder:text-white/40" required />
              {createReview.isError ? <p className="mt-3 text-sm text-red-300">{createReview.error.message}</p> : null}
              <Button variant="gold" className="mt-5" disabled={createReview.isPending}>{createReview.isPending ? "Publishing…" : "Publish review"}</Button>
            </form>
          ) : (
            <div className="rounded-3xl bg-surface-low p-9"><h2 className="text-2xl font-semibold">Have experience with {profile.name}?</h2><p className="mt-3 text-sm text-ink-soft">Sign in with a member account to write a review.</p><Link to="/login" className="mt-6 inline-block"><Button>Sign in to review</Button></Link></div>
          )}
        </div>
      </section>

      {typeof listing.lat === "number" && typeof listing.lng === "number" ? (
        <section className="page-shell pb-20"><h2 className="mb-6 text-3xl font-semibold">Find {profile.name}</h2><Suspense fallback={<div className="h-80 animate-pulse rounded-2xl bg-surface-high" />}><BusinessMap lat={listing.lat} lng={listing.lng} name={profile.name} /></Suspense></section>
      ) : null}
    </>
  );
}
