import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { ApprovalBanner } from "../components/ApprovalBanner";
import { EmptyList } from "../components/EmptyList";
import { SafeImage } from "../components/SafeImage";
import { Button, PageState } from "../components/ui";
import { useAuth } from "../context/useAuth";
import { api, type Business } from "../lib/api";
import { isStayListing } from "../lib/stays";
import { isRentalListing } from "../lib/rentals";
import { isTravelListing } from "../lib/travel";
import { isEventListing } from "../lib/events";
import { isLogisticsListing } from "../lib/logistics";
import { isEducationListing } from "../lib/education";
import { isHealthListing } from "../lib/health";
import { isProfessionalListing } from "../lib/professional";
import { isHomeListing } from "../lib/home";
import { isAutomotiveListing } from "../lib/automotive";
import { isElectronicsListing } from "../lib/electronics";
import { businessStatus, StatusBadge } from "../lib/status";
import { theme } from "../lib/theme";

export function ProviderDashboard() {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const mine = useQuery({
    queryKey: ["businesses", "mine"],
    queryFn: api.myBusinesses,
    enabled: Boolean(user),
  });

  if (isLoading || (Boolean(user) && mine.isLoading && !mine.data)) {
    return <PageState title="Loading" loading />;
  }
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  const businesses = mine.data ?? [];
  const pending = businesses.filter((business) => business.status === "pending");
  const rejected = businesses.filter((business) => business.status === "rejected");
  const suspended = businesses.filter((business) => business.status === "suspended");

  return (
    <section className="page-shell py-14 md:py-20">
      <p className="label-caps text-gold-dark">My Business</p>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Your businesses</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-ink-soft">
            Open a business to see its items. You can also register another shop from here.
          </p>
        </div>
        <Link to="/list-business">
          <Button>
            <Plus className="size-4" /> Add new business
          </Button>
        </Link>
      </div>

      {pending.length ? (
        <ApprovalBanner tone="pending" title="A profile is waiting for review">
          The shop stays hidden until {theme.name} activates it. You can still add items; they stay in verification.
        </ApprovalBanner>
      ) : null}
      {suspended.map((business) => (
        <ApprovalBanner key={business.id} tone="suspended" title={`${business.name} is disabled by admin`}>
          This shop is hidden from search until {theme.name} restores it.
        </ApprovalBanner>
      ))}
      {rejected.map((business) => (
        <ApprovalBanner key={business.id} tone="rejected" title={`${business.name} was not approved`}>
          {business.rejectionReason || "Update your profile and wait for another review."}
        </ApprovalBanner>
      ))}

      {mine.isError ? (
        <PageState
          title="Could not load your businesses"
          description="Your shops are still saved. Try loading them again."
          action={<Button onClick={() => void mine.refetch()}>Try again</Button>}
        />
      ) : null}

      {!mine.isError && !businesses.length ? (
        <EmptyList
          title="Add your first business"
          description="Create a business profile, then list items from that shop."
          action={
            <Link to="/list-business">
              <Button>Add new business</Button>
            </Link>
          }
        />
      ) : null}

      {businesses.length ? <BusinessesTable businesses={businesses} /> : null}
    </section>
  );
}

function BusinessesTable({ businesses }: { businesses: Business[] }) {
  const navigate = useNavigate();
  return (
    <section className="mt-10">
      <div className="overflow-x-auto rounded-2xl border border-line">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead className="border-b border-line bg-surface-low text-xs font-bold uppercase tracking-wider text-ink-soft">
            <tr>
              <th className="px-4 py-3">Business</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {businesses.map((business) => {
              const status = businessStatus(business);
              return (
                <tr
                  key={business.id}
                  className="cursor-pointer border-t border-line hover:bg-cream/40"
                  onClick={() => navigate(`/provider/listings?business=${business.id}`)}
                >
                  <td className="px-4 py-3">
                    <Link
                      to={`/provider/listings?business=${business.id}`}
                      className="flex items-center gap-3 font-semibold"
                      onClick={(event) => event.stopPropagation()}
                    >
                      {business.logoUrl ? (
                        <SafeImage src={business.logoUrl} alt="" className="size-10 rounded-lg object-cover" />
                      ) : (
                        <span className="grid size-10 place-items-center rounded-lg bg-surface-low text-xs text-ink-soft">
                          {business.name.slice(0, 1)}
                        </span>
                      )}
                      {business.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{business.listing?.category?.name ?? "—"}</td>
                  <td className="px-4 py-3">
                    <StatusBadge label={status.label} tone={status.tone} />
                  </td>
                  <td className="px-4 py-3">{business._count?.services ?? 0}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap justify-end gap-2" onClick={(event) => event.stopPropagation()}>
                      <Link to={`/provider/listings?business=${business.id}`}>
                        <Button>Open</Button>
                      </Link>
                      {isStayListing(business.listing) ||
                      isRentalListing(business.listing) ||
                      isTravelListing(business.listing) ||
                      isEventListing(business.listing) ||
                      isLogisticsListing(business.listing) ||
                      isEducationListing(business.listing) ||
                      isHealthListing(business.listing) ||
                      isProfessionalListing(business.listing) ||
                      isHomeListing(business.listing) ||
                      isAutomotiveListing(business.listing) ||
                      isElectronicsListing(business.listing) ? (
                        <Link to={`/provider/enquiries?business=${business.id}`}>
                          <Button variant="outline">Enquiries</Button>
                        </Link>
                      ) : null}
                      <Link to={`/business/${business.slug}/edit`}>
                        <Button variant="ghost">Edit profile</Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
