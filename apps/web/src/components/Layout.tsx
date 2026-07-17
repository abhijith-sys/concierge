import { Menu, UserRound, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { Button } from "./ui";

const pillars = [
  ["B2B", "b2b"],
  ["Real Estate", "real-estate"],
  ["Home Services", "home-repairs"],
  ["Medical", "medical"],
] as const;

export function TopNav() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

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
    <header className="sticky top-0 z-[1000] border-b border-line/60 bg-surface/90 backdrop-blur-xl">
      <nav className="page-shell flex min-h-[72px] items-center justify-between gap-6" aria-label="Main navigation">
        <div className="flex items-center gap-8">
          <Link to="/" className="text-2xl font-bold tracking-[-.04em]" onClick={() => setOpen(false)}>
            Concierge
          </Link>
          <div className="hidden items-center gap-6 md:flex">
            {pillars.map(([name, slug]) => (
              <NavLink
                key={slug}
                to={`/listings/${slug}`}
                className={({ isActive }) =>
                  `nav-link ${isActive || location.pathname.includes(slug) ? "nav-link-active" : ""}`
                }
              >
                {name}
              </NavLink>
            ))}
          </div>
        </div>
        <div className="hidden items-center gap-3 sm:flex">
          <Link to="/list-business"><Button>List Business</Button></Link>
          {user ? (
            <>
              <Link to="/account" className="icon-button" aria-label="Account"><UserRound /></Link>
              <Button variant="ghost" onClick={() => void logout()}>Log out</Button>
            </>
          ) : (
            <Link to="/login"><Button variant="ghost">Sign in</Button></Link>
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
            {pillars.map(([name, slug]) => (
              <Link key={slug} to={`/listings/${slug}`} className="rounded-lg p-3 font-semibold hover:bg-surface-low" onClick={() => setOpen(false)}>
                {name}
              </Link>
            ))}
            <Link to="/list-business" onClick={() => setOpen(false)}><Button className="mt-2 w-full">List Business</Button></Link>
            <Link to={user ? "/account" : "/login"} onClick={() => setOpen(false)}><Button variant="outline" className="w-full">{user ? "My account" : "Sign in"}</Button></Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-line bg-surface-low">
      <div className="page-shell grid gap-10 py-14 md:grid-cols-[2fr_1fr_1fr]">
        <div>
          <Link to="/" className="text-2xl font-bold tracking-[-.04em]">Concierge</Link>
          <p className="mt-4 max-w-sm text-sm leading-6 text-ink-soft">
            Redefining professional and lifestyle discovery. Quality curated, expertly delivered.
          </p>
        </div>
        <div>
          <p className="label-caps">Discover</p>
          <div className="mt-5 grid gap-3 text-sm text-ink-soft">
            <Link to="/listings/b2b">B2B Directory</Link>
            <Link to="/listings/real-estate">Real Estate</Link>
            <Link to="/listings/medical">Medical Concierge</Link>
          </div>
        </div>
        <div>
          <p className="label-caps">For partners</p>
          <div className="mt-5 grid gap-3 text-sm text-ink-soft">
            <Link to="/list-business">List Business</Link>
            <Link to="/account">Merchant Account</Link>
            <Link to="/register">Join Concierge</Link>
          </div>
        </div>
      </div>
      <div className="page-shell border-t border-line py-6 text-xs text-ink-soft">
        © 2026 Concierge Digital Services. All rights reserved.
      </div>
    </footer>
  );
}

export function Layout() {
  return (
    <>
      <TopNav />
      <main><Outlet /></main>
      <Footer />
    </>
  );
}
