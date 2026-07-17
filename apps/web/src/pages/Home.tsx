import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Building2,
  HeartPulse,
  Hotel,
  MapPin,
  Search,
  Sparkles,
  Stethoscope,
  Store,
  Utensils,
  Wrench,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui";
import { api } from "../lib/api";

const heroImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAOZEZhlHZbzI0QOBTz342yHWvc1Ib7Le5AfjUDhmgu0dOVcKFloSalCa9lC6cEs1bVXSYBfAsOztdpWlsT_VgOp1STGPoqwLfUT10gQdrGjaWyTkXgWXjgweEv95r7hinRddWjjMcCTyp1bPpFH3wNOXLdTNgxcgO7ZpqGAkzKSICu_VPiDCWBfruPZTsKTgsiQU6wCVzILVR2LTva8HZPILrX2BZZmCnjkWG144qqvcaWAiAKVu1H9p6bDuvLp5Lu0034E2vGb3s";
const estateImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBZmhD-rbyVF3ft0H9nzyrEWzzHD2LKpuhJyy2qAGNONKOcBv44SN6_SFmxo0MCeqyn7mUqAcJyd3kVvnVfxhW1mcZXzhpr7Bs4y9UcAv0cKIVzcYbmGvblbrl25KP1Jmy33rmGxF7kXGjDVCAMGBKT-eiQ0fUPtltkYBan1OW0DSwRsa8zdkiul45LLLE4VtB5ytlpVvQ35SF8Hc6Loqto8aIuDGADLT2dFVuCD45Dn-V4qyq_3_iW6zRjk_HI8J6Yq7AiSZ8HdKE";

const iconMap = [Utensils, Hotel, Sparkles, Store, Building2, HeartPulse, Wrench, Stethoscope];
const pillars = [
  { title: "B2B Services", slug: "b2b", copy: "Verified vendors and specialists for every stage of growth.", image: heroImage },
  { title: "Home & Repairs", slug: "home-repairs", copy: "Trusted technicians, artisans and master builders.", image: estateImage },
  { title: "Real Estate", slug: "real-estate", copy: "A curated portfolio of exceptional properties and firms.", image: estateImage },
  { title: "Medical Concierge", slug: "medical", copy: "Direct access to leading specialists and wellness care.", image: heroImage },
];

export function Home() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const categories = useQuery({ queryKey: ["categories"], queryFn: api.categories });

  function submit(event: FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (city.trim()) params.set("city", city.trim());
    navigate(`/listings?${params.toString()}`);
  }

  return (
    <>
      <section className="bg-white py-8 md:py-10">
        <div className="page-shell">
          <div className="grid min-h-[480px] gap-4 lg:grid-cols-[2fr_1fr]">
            <div className="group relative min-h-[390px] overflow-hidden rounded-[2rem]">
              <img src={heroImage} alt="Premium architectural workspace" className="h-full w-full object-cover transition duration-1000 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 to-transparent p-8 text-white md:p-12">
                <div className="flex h-full max-w-xl flex-col justify-center">
                  <span className="label-caps mb-5 w-fit rounded-full bg-gold-light px-3 py-2 text-gold-dark">Limited offer</span>
                  <h1 className="text-4xl font-bold leading-[1.08] tracking-[-.04em] md:text-6xl">
                    Exceptional service, carefully found.
                  </h1>
                  <p className="mt-5 max-w-lg text-white/80">Discover verified businesses for ambitious projects and considered living.</p>
                  <Link to="/listings" className="mt-7 w-fit"><Button variant="gold">Explore Concierge <ArrowRight className="size-4" /></Button></Link>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                ["B2B", "Verified vendors", "b2b", "bg-navy text-white"],
                ["Real Estate", "Luxury listings", "real-estate", "bg-gold-light text-gold-dark"],
                ["Medical", "Top specialists", "medical", "bg-surface-high"],
                ["Services", "Home & auto", "home-repairs", "bg-surface"],
              ].map(([title, copy, slug, color]) => (
                <Link key={slug} to={`/listings/${slug}`} className={`${color} group flex min-h-40 flex-col justify-between rounded-3xl p-5 transition hover:-translate-y-1 hover:shadow-lg`}>
                  <div><h2 className="font-bold">{title}</h2><p className="mt-1 text-xs opacity-65">{copy}</p></div>
                  <ArrowRight className="self-end transition group-hover:translate-x-1" />
                </Link>
              ))}
            </div>
          </div>
          <form onSubmit={submit} className="search-panel relative z-10 mx-auto -mt-7 flex max-w-4xl flex-col gap-2 rounded-2xl border border-line bg-white p-2 shadow-xl shadow-black/10 md:flex-row">
            <label className="flex flex-1 items-center gap-3 px-3">
              <MapPin className="size-5" aria-hidden="true" />
              <span className="sr-only">City</span>
              <input value={city} onChange={(event) => setCity(event.target.value)} className="h-12 w-full bg-transparent text-sm outline-none" placeholder="City" />
            </label>
            <label className="flex flex-[2] items-center gap-3 border-t border-line px-3 md:border-l md:border-t-0">
              <Search className="size-5" aria-hidden="true" />
              <span className="sr-only">What are you looking for?</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} className="h-12 w-full bg-transparent text-sm outline-none" placeholder="Search doctors, real estate, or B2B services…" />
            </label>
            <Button type="submit" className="px-8">Search</Button>
          </form>
        </div>
      </section>

      <section className="py-14">
        <div className="page-shell">
          <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2 lg:grid lg:grid-cols-8">
            {categories.isLoading
              ? Array.from({ length: 8 }, (_, index) => <div key={index} className="h-24 min-w-28 animate-pulse rounded-2xl bg-surface-high" />)
              : categories.data?.slice(0, 8).map((category, index) => {
                  const Icon = iconMap[index % iconMap.length];
                  return (
                    <Link key={category.id} to={`/listings/${category.slug}`} className="group flex min-w-28 flex-col items-center gap-3 rounded-2xl border border-line bg-white p-4 text-center transition hover:-translate-y-1 hover:border-black">
                      <Icon className="size-5 transition group-hover:scale-110" />
                      <span className="text-xs font-bold">{category.name}</span>
                    </Link>
                  );
                })}
          </div>
          {categories.isError ? <p className="mt-3 text-center text-xs text-ink-soft">Categories are temporarily unavailable. Search still works.</p> : null}
        </div>
      </section>

      <section className="bg-surface-low py-20">
        <div className="page-shell">
          <p className="label-caps text-gold-dark">Our expertise</p>
          <div className="mt-2 flex items-end justify-between gap-6">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Explore by industry</h2>
            <Link to="/listings" className="hidden items-center gap-2 text-sm font-bold md:flex">View all <ArrowRight className="size-4" /></Link>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {pillars.map((pillar) => (
              <Link key={pillar.slug} to={`/listings/${pillar.slug}`} className="group overflow-hidden rounded-3xl border border-line bg-white transition hover:-translate-y-1 hover:shadow-xl">
                <div className="h-52 overflow-hidden"><img src={pillar.image} alt="" className="h-full w-full object-cover transition duration-700 group-hover:scale-110" /></div>
                <div className="p-6"><h3 className="text-xl font-semibold">{pillar.title}</h3><p className="mt-3 text-sm leading-6 text-ink-soft">{pillar.copy}</p><span className="mt-6 flex items-center gap-2 text-sm font-bold">Discover <ArrowRight className="size-4 transition group-hover:translate-x-1" /></span></div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="page-shell py-20">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-black p-10 text-white md:p-20">
          <div className="relative z-10 max-w-2xl">
            <p className="label-caps text-gold-light">The exceptional, on demand</p>
            <h2 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">Concierge Elite</h2>
            <p className="mt-5 max-w-xl leading-7 text-white/70">Unlock priority introductions, exclusive partner access, and considered guidance for your next project.</p>
            <Link to="/register" className="mt-8 inline-block"><Button variant="gold">Join Elite today</Button></Link>
          </div>
          <Sparkles className="absolute -bottom-12 right-6 size-64 text-gold-light/20" aria-hidden="true" />
        </div>
      </section>
    </>
  );
}
