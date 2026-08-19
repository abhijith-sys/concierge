import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { EmptyList } from "../components/EmptyList";
import { PageState, Select } from "../components/ui";
import { useAuth } from "../context/useAuth";
import { ApiError, api, type StayEnquiry, type StayEnquiryStatus } from "../lib/api";
import { isProvider } from "../lib/provider";
import { isStayListing } from "../lib/stays";

const STATUSES: StayEnquiryStatus[] = ["new", "viewed", "responded", "closed"];

function roomsLabel(enquiry: StayEnquiry) {
  const rows = Array.isArray(enquiry.roomSelections) ? enquiry.roomSelections : [];
  return rows.map((row) => `${row.name ?? "Room"} × ${row.quantity}`).join(", ");
}

function dateLabel(value: string) {
  return new Date(value).toLocaleDateString();
}

export function ProviderEnquiries() {
  const { user, isLoading } = useAuth();
  const [params] = useSearchParams();
  const queryClient = useQueryClient();
  const mine = useQuery({
    queryKey: ["businesses", "mine"],
    queryFn: api.myBusinesses,
    enabled: Boolean(user),
  });
  const businesses = mine.data ?? [];
  const selectedId =
    params.get("business") || businesses.find((business) => isStayListing(business.listing))?.id || "";
  const selected = businesses.find((business) => business.id === selectedId) ?? businesses[0];
  const listParams = new URLSearchParams({ pageSize: "50" });
  if (selected?.id) listParams.set("businessId", selected.id);

  const enquiries = useQuery({
    queryKey: ["stay-enquiries", listParams.toString()],
    queryFn: () => api.stayEnquiries(listParams),
    enabled: Boolean(user && selected?.id),
  });

  const update = useMutation({
    mutationFn: ({ id, status }: { id: string; status: StayEnquiryStatus }) =>
      api.updateStayEnquiry(id, { status }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["stay-enquiries"] });
      toast.success("Enquiry updated.");
    },
    onError: (error) => toast.error(error instanceof ApiError ? error.message : "Unable to update enquiry."),
  });

  if (isLoading || (Boolean(user) && mine.isLoading && !mine.data)) {
    return <PageState title="Loading" loading />;
  }
  if (!user) return <Navigate to="/login" replace />;
  if (!isProvider(user) && !businesses.length) return <Navigate to="/provider" replace />;

  return (
    <section className="page-shell py-14 md:py-20">
      <Link
        to={selected ? `/provider/listings?business=${selected.id}` : "/provider"}
        className="inline-flex items-center gap-2 text-sm font-semibold text-ink-soft hover:text-navy"
      >
        <ArrowLeft className="size-4" /> Back to rooms
      </Link>
      <p className="label-caps mt-5 text-gold-dark">Stay requests</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">Enquiries</h1>
      <p className="mt-3 max-w-xl text-sm leading-6 text-ink-soft">
        Guests send room, date, and occupancy requests here. Reply to them directly by phone or email.
      </p>

      {!selected ? (
        <EmptyList className="mt-10" title="No stay listed yet" description="Add a hotel, resort, or homestay first." />
      ) : (
        <div className="mt-10 overflow-x-auto rounded-2xl border border-line">
          <table className="w-full min-w-[52rem] text-left text-sm">
            <thead className="border-b border-line bg-surface-low text-xs font-bold uppercase tracking-wider text-ink-soft">
              <tr>
                <th className="px-4 py-3">Guest</th>
                <th className="px-4 py-3">Dates</th>
                <th className="px-4 py-3">Guests</th>
                <th className="px-4 py-3">Rooms</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {enquiries.isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-ink-soft">
                    Loading enquiries…
                  </td>
                </tr>
              ) : enquiries.data?.items.length ? (
                enquiries.data.items.map((enquiry) => (
                  <tr key={enquiry.id} className="border-t border-line align-top">
                    <td className="px-4 py-3">
                      <strong>{enquiry.guestName}</strong>
                      <p className="text-xs text-ink-soft">{enquiry.guestEmail}</p>
                      {enquiry.guestPhone ? <p className="text-xs text-ink-soft">{enquiry.guestPhone}</p> : null}
                      {enquiry.notes ? <p className="mt-2 text-xs text-ink-soft">{enquiry.notes}</p> : null}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {dateLabel(enquiry.checkIn)} → {dateLabel(enquiry.checkOut)}
                    </td>
                    <td className="px-4 py-3">
                      {enquiry.adults} adult{enquiry.adults === 1 ? "" : "s"}
                      {enquiry.children ? `, ${enquiry.children} child${enquiry.children === 1 ? "" : "ren"}` : ""}
                    </td>
                    <td className="px-4 py-3">{roomsLabel(enquiry)}</td>
                    <td className="px-4 py-3">
                      <Select
                        value={enquiry.status}
                        onChange={(event) =>
                          update.mutate({ id: enquiry.id, status: event.target.value as StayEnquiryStatus })
                        }
                        className="min-h-10"
                      >
                        {STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </Select>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-8">
                    <EmptyList compact title="No enquiries yet" description="Guest stay requests will appear here." />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      {enquiries.isError ? <p className="mt-4 text-sm text-red-700">Could not load enquiries.</p> : null}
    </section>
  );
}
