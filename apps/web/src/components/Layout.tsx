import { useQuery } from "@tanstack/react-query";
import { Menu, UserRound, X } from "lucide-react";
import { Suspense, useEffect, useState, type ReactNode, type SVGProps } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { api } from "../lib/api";
import { isProvider } from "../lib/provider";
import { AuthIntentHandler } from "./AuthIntentHandler";
import { Logo } from "./Logo";
import { RouteErrorBoundary } from "./RouteErrorBoundary";
import { Button } from "./ui";

function SocialIcon({
  label,
  href,
  children,
}: {
  label: string;
  href: string;
  children: ReactNode;
}) {
  return (
    <a href={href} className="icon-button size-10" aria-label={label} rel="noreferrer" target="_blank">
      {children}
    </a>
  );
}

function IconPath({ d, ...props }: SVGProps<SVGSVGElement> & { d: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="size-4" {...props}>
      <path d={d} />
    </svg>
  );
}

export function TopNav() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const provider = isProvider(user);
  const wishlist = useQuery({
    queryKey: ["wishlist"],
    queryFn: api.wishlist,
    enabled: Boolean(user),
  });
  const savedCount = wishlist.data?.length ?? 0;

  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  return (
    <header className="sticky top-0 z-[1000] border-b border-line/70 bg-white/90 backdrop-blur-xl">
      <nav className="page-shell flex min-h-16 items-center justify-between gap-6" aria-label="Main navigation">
        <div className="flex items-center gap-10">
          <Logo onClick={() => setOpen(false)} />
          <div className="hidden items-center gap-7 md:flex">
            <NavLink to="/listings" className={({ isActive }) => `nav-link ${isActive ? "nav-link-active" : ""}`}>
              Explore
            </NavLink>
            <NavLink to="/wishlist" className={({ isActive }) => `nav-link ${isActive ? "nav-link-active" : ""}`}>
              <span className="relative inline-flex items-center">
                Wishlist
                {savedCount > 0 ? (
                  <span className="absolute -right-3.5 -top-2 grid min-w-4 place-items-center rounded-full bg-gold px-1 text-[10px] font-extrabold leading-4 text-navy">
                    {savedCount > 9 ? "9+" : savedCount}
                  </span>
                ) : null}
              </span>
            </NavLink>
            {provider ? (
              <>
                <NavLink to="/provider" className={({ isActive }) => `nav-link ${isActive ? "nav-link-active" : ""}`}>
                  My Business
                </NavLink>
                <NavLink
                  to="/provider/listings"
                  className={({ isActive }) => `nav-link ${isActive ? "nav-link-active" : ""}`}
                >
                  My Listings
                </NavLink>
              </>
            ) : null}
          </div>
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          {provider ? (
            <Link to="/provider/listings/create">
              <Button>Create listing</Button>
            </Link>
          ) : (
            <Link to="/list-business">
              <Button>Become a provider</Button>
            </Link>
          )}
          {user ? (
            <>
              {user.role === "admin" ? (
                <a href={import.meta.env.VITE_ADMIN_URL || "http://localhost:8081"}>
                  <Button variant="outline">Admin</Button>
                </a>
              ) : null}
              <Link to="/account" className="icon-button" aria-label="Account">
                <UserRound />
              </Link>
              <Button variant="ghost" onClick={() => void logout()}>
                Log out
              </Button>
            </>
          ) : (
            <Link to="/login">
              <Button variant="ghost" className="gap-2 text-navy">
                <UserRound className="size-4" />
                Sign in
              </Button>
            </Link>
          )}
        </div>
        <button
          className="icon-button sm:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-label="Toggle navigation"
        >
          {open ? <X /> : <Menu />}
        </button>
      </nav>
      {open ? (
        <div className="animate-fade-in border-t border-line bg-white p-5 sm:hidden" aria-label="Mobile navigation">
          <div className="grid gap-2">
            <Link to="/listings" className="rounded-lg p-3 font-semibold hover:bg-surface-low" onClick={() => setOpen(false)}>
              Explore
            </Link>
            <Link to="/wishlist" className="rounded-lg p-3 font-semibold hover:bg-surface-low" onClick={() => setOpen(false)}>
              Wishlist{savedCount > 0 ? ` (${savedCount})` : ""}
            </Link>
            {provider ? (
              <>
                <Link to="/provider" className="rounded-lg p-3 font-semibold hover:bg-surface-low" onClick={() => setOpen(false)}>
                  My Business
                </Link>
                <Link
                  to="/provider/listings"
                  className="rounded-lg p-3 font-semibold hover:bg-surface-low"
                  onClick={() => setOpen(false)}
                >
                  My Listings
                </Link>
              </>
            ) : null}
            <Link to={provider ? "/provider/listings/create" : "/list-business"} onClick={() => setOpen(false)}>
              <Button className="mt-2 w-full">{provider ? "Create listing" : "Become a provider"}</Button>
            </Link>
            <Link to={user ? "/account" : "/login"} onClick={() => setOpen(false)}>
              <Button variant="outline" className="w-full">
                {user ? "My account" : "Sign in"}
              </Button>
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}

export function Footer() {
  const categories = useQuery({ queryKey: ["categories"], queryFn: api.categories });
  const featured = categories.data?.slice(0, 3) ?? [];

  return (
    <footer className="border-t border-line bg-white">
      <div className="page-shell grid gap-12 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-6 text-ink-soft">
            Redefining professional and lifestyle discovery. Quality curated, expertly delivered.
          </p>
          <div className="mt-6 flex items-center gap-1 text-navy">
            <SocialIcon label="Facebook" href="https://facebook.com">
              <IconPath d="M14 9h3V6h-3c-2.2 0-4 1.8-4 4v2H8v3h2v7h3v-7h2.6l.4-3H13v-2c0-.6.4-1 1-1Z" />
            </SocialIcon>
            <SocialIcon label="Instagram" href="https://instagram.com">
              <IconPath d="M7.5 3h9A4.5 4.5 0 0 1 21 7.5v9A4.5 4.5 0 0 1 16.5 21h-9A4.5 4.5 0 0 1 3 16.5v-9A4.5 4.5 0 0 1 7.5 3Zm0 2A2.5 2.5 0 0 0 5 7.5v9A2.5 2.5 0 0 0 7.5 19h9a2.5 2.5 0 0 0 2.5-2.5v-9A2.5 2.5 0 0 0 16.5 5h-9Zm9.25 1.25a1 1 0 1 1 0 2 1 1 0 0 1 0-2ZM12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8Zm0 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z" />
            </SocialIcon>
            <SocialIcon label="LinkedIn" href="https://linkedin.com">
              <IconPath d="M6.5 9H4v11h2.5V9ZM5.25 3A1.75 1.75 0 1 0 5.26 6.5 1.75 1.75 0 0 0 5.25 3ZM20 13.4c0-3.2-1.7-4.7-4-4.7-1.8 0-2.6 1-3.1 1.7V9H10.4c0 1.7 0 11 0 11H13v-6.1c0-.3 0-.7.1-1 .3-.7.9-1.4 1.9-1.4 1.3 0 1.9.9 1.9 2.3V20H20v-6.6Z" />
            </SocialIcon>
            <SocialIcon label="X" href="https://x.com">
              <IconPath d="M14.7 10.3 22.2 2h-2.2l-6.2 6.9L9.1 2H2.5l8 11.3L2.2 22h2.2l6.8-7.6L15.3 22h6.6l-7.2-11.7Zm-2.4 2.7-.8-1.1-6.2-8.6h2.7l5 7 .8 1.1 6.5 9h-2.7l-5.3-7.4Z" />
            </SocialIcon>
          </div>
        </div>
        <div>
          <p className="label-caps text-ink-soft">Discover</p>
          <div className="mt-5 grid gap-3 text-sm text-ink-soft [&_a]:transition hover:[&_a]:text-navy">
            <Link to="/listings">Explore</Link>
            <Link to="/wishlist">Wishlist</Link>
            {featured.map((category) => (
              <Link key={category.id} to={`/listings/${category.slug}`}>
                {category.name}
              </Link>
            ))}
            <Link to="/listings">View all industries</Link>
          </div>
        </div>
        <div>
          <p className="label-caps text-ink-soft">For providers</p>
          <div className="mt-5 grid gap-3 text-sm text-ink-soft [&_a]:transition hover:[&_a]:text-navy">
            <Link to="/list-business">Become a provider</Link>
            <Link to="/provider">My Business</Link>
            <Link to="/list-business">Provider Resources</Link>
            <Link to="/contact">Help & Support</Link>
          </div>
        </div>
        <div>
          <p className="label-caps text-ink-soft">Company</p>
          <div className="mt-5 grid gap-3 text-sm text-ink-soft [&_a]:transition hover:[&_a]:text-navy">
            <Link to="/about">About us</Link>
            <Link to="/careers">Careers</Link>
            <Link to="/terms">Terms & Conditions</Link>
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/contact">Contact us</Link>
          </div>
        </div>
      </div>
      <div className="page-shell flex flex-wrap items-center justify-between gap-3 border-t border-line py-6 text-xs text-ink-soft">
        <p>© 2026 Concierge Digital Services. All rights reserved.</p>
        <p className="inline-flex items-center gap-2 font-semibold text-navy">
          <span aria-hidden="true">🇮🇳</span> India
        </p>
      </div>
    </footer>
  );
}

function RouteLoading() {
  return (
    <div className="page-shell min-h-[65vh] py-10" aria-live="polite" aria-busy="true">
      <span className="sr-only">Opening page</span>
      <div className="route-loading-shimmer h-[min(48vh,28rem)] rounded-[2rem] bg-surface-high" />
      <div className="mt-8 grid max-w-3xl gap-3">
        <div className="route-loading-shimmer h-8 w-2/3 rounded-lg bg-surface-high" />
        <div className="route-loading-shimmer h-4 w-full rounded bg-surface-high" />
        <div className="route-loading-shimmer h-4 w-4/5 rounded bg-surface-high" />
      </div>
    </div>
  );
}

export function Layout() {
  const location = useLocation();

  return (
    <>
      <AuthIntentHandler />
      <TopNav />
      <main>
        <RouteErrorBoundary key={`${location.pathname}${location.search}`}>
          <Suspense fallback={<RouteLoading />}>
            <Outlet />
          </Suspense>
        </RouteErrorBoundary>
      </main>
      <Footer />
    </>
  );
}
