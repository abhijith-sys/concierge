import { useQuery } from "@tanstack/react-query";
import { Building2, ClipboardList, Plus } from "lucide-react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { ApprovalBanner } from "../components/ApprovalBanner";
import { Button, PageState } from "../components/ui";
import { useAuth } from "../context/useAuth";
import { api } from "../lib/api";
import { isProvider } from "../lib/provider";

export function ProviderDashboard() {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const mine = useQuery({
    queryKey: ["businesses", "mine"],
    queryFn: api.myBusinesses,
    enabled: Boolean(user),
  });

  if (isLoading) return <PageState title="Loading" loading />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (!isProvider(user) && !mine.data?.length) {
    return <Navigate to="/list-business" replace />;
  }

  const businesses = mine.data ?? [];
  const pending = businesses.filter((business) => business.status === "pending");
  const rejected = businesses.filter((business) => business.status === "rejected");
  const active = businesses.filter((business) => business.status === "active");
  const canCreateListings = active.length > 0;

  return (
    <section className="page-shell py-14 md:py-20">
      <p className="label-caps text-gold-dark">Provider</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">My business</h1>
      <p className="mt-3 max-w-xl text-sm leading-6 text-ink-soft">
        Manage your public profile and the services you offer. This is part of the same Concierge account.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-line p-6">
          <p className="text-xs font-bold uppercase tracking-wider text-ink-soft">Profiles</p>
          <p className="mt-2 text-3xl font-bold">{businesses.length}</p>
        </div>
        <div className="rounded-3xl border border-line p-6">
          <p className="text-xs font-bold uppercase tracking-wider text-ink-soft">Active</p>
          <p className="mt-2 text-3xl font-bold">{active.length}</p>
        </div>
        <div className="rounded-3xl border border-line p-6">
          <p className="text-xs font-bold uppercase tracking-wider text-ink-soft">Pending review</p>
          <p className="mt-2 text-3xl font-bold">{pending.length}</p>
        </div>
      </div>

      {pending.length ? (
        <ApprovalBanner tone="pending" title="A profile is waiting for review">
          You can edit details, but listings stay hidden until Concierge activates the profile.
        </ApprovalBanner>
      ) : null}
      {rejected.map((business) => (
        <ApprovalBanner key={business.id} tone="rejected" title={`${business.name} was not approved`}>
          {business.rejectionReason || "Update your profile and wait for another review."}
        </ApprovalBanner>
      ))}

      <div className="mt-8 flex flex-wrap gap-3">
        <Link to="/provider/listings">
          <Button>
            <ClipboardList className="size-4" /> My listings
          </Button>
        </Link>
        {canCreateListings ? (
          <Link to="/provider/listings/create">
            <Button variant="outline">
              <Plus className="size-4" /> Create listing
            </Button>
          </Link>
        ) : null}
        <Link to="/list-business">
          <Button variant="ghost">
            <Building2 className="size-4" /> Add another profile
          </Button>
        </Link>
      </div>

      <ul className="mt-10 grid gap-3">
        {businesses.map((business) => (
          <li
            key={business.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-surface-low px-4 py-4"
          >
            <div>
              <p className="font-semibold">{business.name}</p>
              <p className="text-xs capitalize text-ink-soft">
                {business.status}
                {business.verified ? " · verified" : ""}
              </p>
              {business.status === "rejected" && business.rejectionReason ? (
                <p className="mt-1 text-xs text-red-700">{business.rejectionReason}</p>
              ) : null}
            </div>
            <div className="flex gap-2">
              <Link to={`/business/${business.slug}`}>
                <Button variant="ghost">View</Button>
              </Link>
              <Link to={`/business/${business.slug}/edit`}>
                <Button variant="outline">Edit profile</Button>
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
