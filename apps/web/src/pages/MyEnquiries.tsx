import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, Navigate } from "react-router-dom";
import { EmptyList } from "../components/EmptyList";
import { PageState } from "../components/ui";
import { useAuth } from "../context/useAuth";
import { api, type MineEnquiry } from "../lib/api";

const VERTICAL_LABELS: Record<MineEnquiry["vertical"], string> = {
  stay: "Stay",
  rental: "Rental",
  travel: "Travel",
  event: "Event",
  logistics: "Logistics",
  education: "Education",
  health: "Health",
  professional: "Professional",
  home_trade: "Home trade",
  automotive: "Automotive",
  electronics: "Electronics",
};

export function MyEnquiries() {
  const { user, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const list = useQuery({
    queryKey: ["enquiries", "mine"],
    queryFn: () => api.myEnquiries(),
    enabled: Boolean(user),
  });

  const invalidate = useMutation({
    mutationFn: async () => {
      await queryClient.invalidateQueries({ queryKey: ["enquiries", "mine"] });
    },
  });

  if (isLoading) return <PageState title="Loading your enquiries" loading />;
  if (!user) return <Navigate to="/login" replace />;

  const items = list.data?.items ?? [];

  return (
    <section className="page-shell py-14 md:py-20">
      <p className="label-caps text-gold-dark">Your activity</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">My enquiries</h1>
      <p className="mt-3 max-w-xl text-sm leading-6 text-ink-soft">
        Enquiries you submitted while signed in appear here. Businesses contact you directly by phone or email.
      </p>
      <div className="mt-10 overflow-x-auto rounded-2xl border border-line">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead className="border-b border-line bg-surface-low text-xs font-bold uppercase tracking-wider text-ink-soft">
            <tr>
              <th className="px-4 py-3">Business</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Summary</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Submitted</th>
            </tr>
          </thead>
          <tbody>
            {list.isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-ink-soft">
                  Loading enquiries…
                </td>
              </tr>
            ) : items.length ? (
              items.map((enquiry) => (
                <tr key={`${enquiry.vertical}-${enquiry.id}`} className="border-t border-line align-top">
                  <td className="px-4 py-3">
                    {enquiry.business ? (
                      <Link to={`/business/${enquiry.business.slug}`} className="font-semibold hover:text-navy">
                        {enquiry.business.name}
                      </Link>
                    ) : (
                      "—"
                    )}
                    <p className="mt-1 text-xs text-ink-soft">Ref {enquiry.id.slice(0, 8).toUpperCase()}</p>
                  </td>
                  <td className="px-4 py-3">{VERTICAL_LABELS[enquiry.vertical]}</td>
                  <td className="px-4 py-3 text-ink-soft">{enquiry.summary}</td>
                  <td className="px-4 py-3 capitalize">{enquiry.status}</td>
                  <td className="whitespace-nowrap px-4 py-3">{new Date(enquiry.createdAt).toLocaleDateString()}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-8">
                  <EmptyList
                    compact
                    title="No enquiries yet"
                    description="Submit an enquiry from a business profile while signed in to track it here."
                    action={
                      <Link to="/listings" className="inline-flex">
                        Browse listings
                      </Link>
                    }
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {list.isError ? (
        <p className="mt-4 text-sm text-red-700">
          Could not load enquiries.{" "}
          <button type="button" className="underline" onClick={() => invalidate.mutate()}>
            Retry
          </button>
        </p>
      ) : null}
    </section>
  );
}
