import { Building2, Mail, ShieldCheck, UserRound } from "lucide-react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { Button, PageState } from "../components/ui";
import { useAuth } from "../context/useAuth";

export function Account() {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return <PageState title="Loading your account" loading />;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;

  return (
    <section className="page-shell py-14 md:py-20">
      <p className="label-caps text-gold-dark">Your Concierge</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">Account</h1>
      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_2fr]">
        <aside className="rounded-3xl bg-black p-8 text-white">
          <div className="flex size-16 items-center justify-center rounded-full bg-white/10"><UserRound className="size-8" /></div>
          <h2 className="mt-6 text-2xl font-semibold">{user.name}</h2>
          <p className="mt-2 flex items-center gap-2 text-sm text-white/65"><Mail className="size-4" />{user.email}</p>
          <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-gold-light px-3 py-1.5 text-xs font-bold capitalize text-gold-dark"><ShieldCheck className="size-4" />{user.role} account</span>
        </aside>
        <div className="rounded-3xl border border-line p-8">
          <h2 className="text-2xl font-semibold">{user.role === "business" ? "Grow your presence" : "Your activity"}</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-ink-soft">
            {user.role === "business"
              ? "Introduce your business to the Concierge network with a complete, considered profile."
              : "Explore verified partners and add reviews directly from each business profile."}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/listings"><Button variant="outline">Explore listings</Button></Link>
            {user.role === "business" || user.role === "admin" ? <Link to="/list-business"><Button><Building2 className="size-4" /> Create business</Button></Link> : null}
          </div>
        </div>
      </div>
    </section>
  );
}
