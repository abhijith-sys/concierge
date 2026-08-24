import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { EmptyList } from "../components/EmptyList";
import { PageState, Select } from "../components/ui";
import { useAuth } from "../context/useAuth";
import {
  ApiError,
  api,
  type EducationEnquiry,
  type EventEnquiry,
  type HealthEnquiry,
  type HomeTradeEnquiry,
  type AutomotiveEnquiry,
  type ElectronicsEnquiry,
  type LogisticsEnquiry,
  type ProfessionalEnquiry,
  type RentalEnquiry,
  type StayEnquiry,
  type StayEnquiryStatus,
  type TravelEnquiry,
} from "../lib/api";
import { isEducationListing } from "../lib/education";
import { isEventListing } from "../lib/events";
import { isHealthListing } from "../lib/health";
import { isLogisticsListing } from "../lib/logistics";
import { isProfessionalListing } from "../lib/professional";
import { isHomeListing } from "../lib/home";
import { isAutomotiveListing } from "../lib/automotive";
import { isElectronicsListing } from "../lib/electronics";
import { isProvider } from "../lib/provider";
import { isRentalListing } from "../lib/rentals";
import { isStayListing } from "../lib/stays";
import { isTravelListing } from "../lib/travel";

const STATUSES: StayEnquiryStatus[] = ["new", "viewed", "responded", "closed"];

function roomsLabel(enquiry: StayEnquiry) {
  const rows = Array.isArray(enquiry.roomSelections) ? enquiry.roomSelections : [];
  return rows.map((row) => `${row.name ?? "Room"} × ${row.quantity}`).join(", ");
}

function itemsLabel(enquiry: RentalEnquiry) {
  const rows = Array.isArray(enquiry.itemSelections) ? enquiry.itemSelections : [];
  return rows.map((row) => `${row.name ?? "Item"} × ${row.quantity}`).join(", ");
}

function vehiclesLabel(enquiry: TravelEnquiry) {
  const rows = Array.isArray(enquiry.vehicleSelections) ? enquiry.vehicleSelections : [];
  return rows.map((row) => `${row.name ?? "Vehicle"} × ${row.quantity}`).join(", ");
}

function packagesLabel(enquiry: EventEnquiry) {
  const rows = Array.isArray(enquiry.packageSelections) ? enquiry.packageSelections : [];
  return rows.map((row) => `${row.name ?? "Package"} × ${row.quantity}`).join(", ");
}

function servicesLabel(enquiry: LogisticsEnquiry | HealthEnquiry | ProfessionalEnquiry | HomeTradeEnquiry | AutomotiveEnquiry | ElectronicsEnquiry) {
  const rows = Array.isArray(enquiry.serviceSelections) ? enquiry.serviceSelections : [];
  return rows.map((row) => `${row.name ?? "Service"} × ${row.quantity}`).join(", ");
}

function coursesLabel(enquiry: EducationEnquiry) {
  const rows = Array.isArray(enquiry.courseSelections) ? enquiry.courseSelections : [];
  return rows.map((row) => `${row.name ?? "Course"} × ${row.quantity}`).join(", ");
}

function dateLabel(value: string) {
  return new Date(value).toLocaleDateString();
}

function isEnquiryListing(listing: Parameters<typeof isStayListing>[0]) {
  return (
    isStayListing(listing) ||
    isRentalListing(listing) ||
    isTravelListing(listing) ||
    isEventListing(listing) ||
    isLogisticsListing(listing) ||
    isEducationListing(listing) ||
    isHealthListing(listing) ||
    isProfessionalListing(listing) ||
    isHomeListing(listing) ||
    isAutomotiveListing(listing) ||
    isElectronicsListing(listing)
  );
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
    params.get("business") ||
    businesses.find((business) => isEnquiryListing(business.listing))?.id ||
    "";
  const selected = businesses.find((business) => business.id === selectedId) ?? businesses[0];
  const rental = isRentalListing(selected?.listing);
  const stay = isStayListing(selected?.listing);
  const travel = isTravelListing(selected?.listing);
  const eventCrew = isEventListing(selected?.listing);
  const logistics = isLogisticsListing(selected?.listing);
  const education = isEducationListing(selected?.listing);
  const health = isHealthListing(selected?.listing);
  const professional = isProfessionalListing(selected?.listing);
  const homeTrade = isHomeListing(selected?.listing);
  const automotive = isAutomotiveListing(selected?.listing);
  const electronics = isElectronicsListing(selected?.listing);
  const listParams = new URLSearchParams({ pageSize: "50" });
  if (selected?.id) listParams.set("businessId", selected.id);

  const stayEnquiries = useQuery({
    queryKey: ["stay-enquiries", listParams.toString()],
    queryFn: () => api.stayEnquiries(listParams),
    enabled: Boolean(user && selected?.id && stay),
  });
  const rentalEnquiries = useQuery({
    queryKey: ["rental-enquiries", listParams.toString()],
    queryFn: () => api.rentalEnquiries(listParams),
    enabled: Boolean(user && selected?.id && rental),
  });
  const travelEnquiries = useQuery({
    queryKey: ["travel-enquiries", listParams.toString()],
    queryFn: () => api.travelEnquiries(listParams),
    enabled: Boolean(user && selected?.id && travel),
  });
  const eventEnquiries = useQuery({
    queryKey: ["event-enquiries", listParams.toString()],
    queryFn: () => api.eventEnquiries(listParams),
    enabled: Boolean(user && selected?.id && eventCrew),
  });
  const logisticsEnquiries = useQuery({
    queryKey: ["logistics-enquiries", listParams.toString()],
    queryFn: () => api.logisticsEnquiries(listParams),
    enabled: Boolean(user && selected?.id && logistics),
  });
  const educationEnquiries = useQuery({
    queryKey: ["education-enquiries", listParams.toString()],
    queryFn: () => api.educationEnquiries(listParams),
    enabled: Boolean(user && selected?.id && education),
  });
  const healthEnquiries = useQuery({
    queryKey: ["health-enquiries", listParams.toString()],
    queryFn: () => api.healthEnquiries(listParams),
    enabled: Boolean(user && selected?.id && health),
  });
  const professionalEnquiries = useQuery({
    queryKey: ["professional-enquiries", listParams.toString()],
    queryFn: () => api.professionalEnquiries(listParams),
    enabled: Boolean(user && selected?.id && professional),
  });
  const homeTradeEnquiries = useQuery({
    queryKey: ["home-trade-enquiries", listParams.toString()],
    queryFn: () => api.homeTradeEnquiries(listParams),
    enabled: Boolean(user && selected?.id && homeTrade),
  });
  const automotiveEnquiries = useQuery({
    queryKey: ["automotive-enquiries", listParams.toString()],
    queryFn: () => api.automotiveEnquiries(listParams),
    enabled: Boolean(user && selected?.id && automotive),
  });
  const electronicsEnquiries = useQuery({
    queryKey: ["electronics-enquiries", listParams.toString()],
    queryFn: () => api.electronicsEnquiries(listParams),
    enabled: Boolean(user && selected?.id && electronics),
  });

  const updateStay = useMutation({
    mutationFn: ({ id, status }: { id: string; status: StayEnquiryStatus }) =>
      api.updateStayEnquiry(id, { status }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["stay-enquiries"] });
      toast.success("Enquiry updated.");
    },
    onError: (error) => toast.error(error instanceof ApiError ? error.message : "Unable to update enquiry."),
  });
  const updateRental = useMutation({
    mutationFn: ({ id, status }: { id: string; status: StayEnquiryStatus }) =>
      api.updateRentalEnquiry(id, { status }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["rental-enquiries"] });
      toast.success("Enquiry updated.");
    },
    onError: (error) => toast.error(error instanceof ApiError ? error.message : "Unable to update enquiry."),
  });
  const updateTravel = useMutation({
    mutationFn: ({ id, status }: { id: string; status: StayEnquiryStatus }) =>
      api.updateTravelEnquiry(id, { status }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["travel-enquiries"] });
      toast.success("Enquiry updated.");
    },
    onError: (error) => toast.error(error instanceof ApiError ? error.message : "Unable to update enquiry."),
  });
  const updateEvent = useMutation({
    mutationFn: ({ id, status }: { id: string; status: StayEnquiryStatus }) =>
      api.updateEventEnquiry(id, { status }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["event-enquiries"] });
      toast.success("Enquiry updated.");
    },
    onError: (error) => toast.error(error instanceof ApiError ? error.message : "Unable to update enquiry."),
  });
  const updateLogistics = useMutation({
    mutationFn: ({ id, status }: { id: string; status: StayEnquiryStatus }) =>
      api.updateLogisticsEnquiry(id, { status }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["logistics-enquiries"] });
      toast.success("Enquiry updated.");
    },
    onError: (error) => toast.error(error instanceof ApiError ? error.message : "Unable to update enquiry."),
  });
  const updateEducation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: StayEnquiryStatus }) =>
      api.updateEducationEnquiry(id, { status }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["education-enquiries"] });
      toast.success("Enquiry updated.");
    },
    onError: (error) => toast.error(error instanceof ApiError ? error.message : "Unable to update enquiry."),
  });
  const updateHealth = useMutation({
    mutationFn: ({ id, status }: { id: string; status: StayEnquiryStatus }) =>
      api.updateHealthEnquiry(id, { status }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["health-enquiries"] });
      toast.success("Enquiry updated.");
    },
    onError: (error) => toast.error(error instanceof ApiError ? error.message : "Unable to update enquiry."),
  });
  const updateProfessional = useMutation({
    mutationFn: ({ id, status }: { id: string; status: StayEnquiryStatus }) =>
      api.updateProfessionalEnquiry(id, { status }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["professional-enquiries"] });
      toast.success("Enquiry updated.");
    },
    onError: (error) => toast.error(error instanceof ApiError ? error.message : "Unable to update enquiry."),
  });
  const updateHomeTrade = useMutation({
    mutationFn: ({ id, status }: { id: string; status: StayEnquiryStatus }) =>
      api.updateHomeTradeEnquiry(id, { status }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["home-trade-enquiries"] });
      toast.success("Enquiry updated.");
    },
    onError: (error) => toast.error(error instanceof ApiError ? error.message : "Unable to update enquiry."),
  });
  const updateAutomotive = useMutation({
    mutationFn: ({ id, status }: { id: string; status: StayEnquiryStatus }) =>
      api.updateAutomotiveEnquiry(id, { status }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["automotive-enquiries"] });
      toast.success("Enquiry updated.");
    },
    onError: (error) => toast.error(error instanceof ApiError ? error.message : "Unable to update enquiry."),
  });
  const updateElectronics = useMutation({
    mutationFn: ({ id, status }: { id: string; status: StayEnquiryStatus }) =>
      api.updateElectronicsEnquiry(id, { status }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["electronics-enquiries"] });
      toast.success("Enquiry updated.");
    },
    onError: (error) => toast.error(error instanceof ApiError ? error.message : "Unable to update enquiry."),
  });

  if (isLoading || (Boolean(user) && mine.isLoading && !mine.data)) {
    return <PageState title="Loading" loading />;
  }
  if (!user) return <Navigate to="/login" replace />;
  if (!isProvider(user) && !businesses.length) return <Navigate to="/provider" replace />;

  const loading = stay
    ? stayEnquiries.isLoading
    : rental
      ? rentalEnquiries.isLoading
      : travel
        ? travelEnquiries.isLoading
        : eventCrew
          ? eventEnquiries.isLoading
          : logistics
            ? logisticsEnquiries.isLoading
            : education
              ? educationEnquiries.isLoading
              : health
                ? healthEnquiries.isLoading
                : professional
                  ? professionalEnquiries.isLoading
                  : homeTrade
                    ? homeTradeEnquiries.isLoading
                    : automotive
                      ? automotiveEnquiries.isLoading
                      : electronicsEnquiries.isLoading;
  const error = stay
    ? stayEnquiries.isError
    : rental
      ? rentalEnquiries.isError
      : travel
        ? travelEnquiries.isError
        : eventCrew
          ? eventEnquiries.isError
          : logistics
            ? logisticsEnquiries.isError
            : education
              ? educationEnquiries.isError
              : health
                ? healthEnquiries.isError
                : professional
                  ? professionalEnquiries.isError
                  : homeTrade
                    ? homeTradeEnquiries.isError
                    : automotive
                      ? automotiveEnquiries.isError
                      : electronicsEnquiries.isError;
  const stayItems = stayEnquiries.data?.items ?? [];
  const rentalItems = rentalEnquiries.data?.items ?? [];
  const travelItems = travelEnquiries.data?.items ?? [];
  const eventItems = eventEnquiries.data?.items ?? [];
  const logisticsItems = logisticsEnquiries.data?.items ?? [];
  const educationItems = educationEnquiries.data?.items ?? [];
  const healthItems = healthEnquiries.data?.items ?? [];
  const professionalItems = professionalEnquiries.data?.items ?? [];
  const homeTradeItems = homeTradeEnquiries.data?.items ?? [];
  const automotiveItems = automotiveEnquiries.data?.items ?? [];
  const electronicsItems = electronicsEnquiries.data?.items ?? [];
  const hasEnquiryType =
    stay ||
    rental ||
    travel ||
    eventCrew ||
    logistics ||
    education ||
    health ||
    professional ||
    homeTrade ||
    automotive ||
    electronics;

  const backLabel = stay
    ? "rooms"
    : travel
      ? "fleet"
      : eventCrew
        ? "packages"
        : logistics
          ? "services"
          : education
            ? "courses"
            : health
              ? "treatments"
              : professional
                ? "services"
                : homeTrade || automotive || electronics
                  ? "packages"
                  : "items";

  const thirdColumn = stay
    ? "Guests"
    : rental
      ? "Delivery"
      : travel
        ? "Route"
        : eventCrew
          ? "Venue"
          : logistics
            ? "Route"
            : education
              ? "Learning mode"
              : health
                ? "Patients"
                : professional
                  ? "Topic"
                  : homeTrade
                    ? "Location"
                    : automotive
                      ? "Vehicle"
                      : electronics
                        ? "Device"
                        : "Details";

  const fourthColumn = stay
    ? "Rooms"
    : rental
      ? "Items"
      : travel
        ? "Vehicles"
        : eventCrew
          ? "Packages"
          : logistics
            ? "Services"
            : education
              ? "Courses"
              : health
                ? "Treatments"
                : professional
                  ? "Services"
                  : homeTrade || automotive || electronics
                    ? "Packages"
                    : "Selections";

  return (
    <section className="page-shell py-14 md:py-20">
      <Link
        to={selected ? `/provider/listings?business=${selected.id}` : "/provider"}
        className="inline-flex items-center gap-2 text-sm font-semibold text-ink-soft hover:text-navy"
      >
        <ArrowLeft className="size-4" /> Back to {backLabel}
      </Link>
      <p className="label-caps mt-5 text-gold-dark">
        {stay
          ? "Stay requests"
          : rental
            ? "Hire requests"
            : travel
              ? "Trip requests"
              : eventCrew
                ? "Event requests"
                : logistics
                  ? "Move requests"
                  : education
                    ? "Learning requests"
                    : health
                      ? "Health requests"
                      : professional
                        ? "Professional requests"
                        : homeTrade
                          ? "Job requests"
                          : automotive
                            ? "Workshop requests"
                            : electronics
                              ? "Repair requests"
                              : "Requests"}
      </p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">Enquiries</h1>
      <p className="mt-3 max-w-xl text-sm leading-6 text-ink-soft">
        {stay
          ? "Guests send room, date, and occupancy requests here. Reply to them directly by phone or email."
          : rental
            ? "Customers send item, date, and delivery requests here. Reply to them directly by phone or email."
            : travel
              ? "Customers send pickup, drop-off, and vehicle requests here. Reply to them directly by phone or email."
              : eventCrew
                ? "Customers send date, venue, and package requests here. Reply to them directly by phone or email."
                : logistics
                  ? "Customers send pickup, drop-off, and service requests here. Reply to them directly by phone or email."
                  : education
                    ? "Customers send start date, learning mode, and course requests here. Reply to them directly by phone or email."
                    : health
                      ? "Customers send appointment date, concern, and treatment requests here. Reply to them directly by phone or email."
                      : professional
                        ? "Customers send preferred date, topic, and service requests here. Reply to them directly by phone or email."
                        : homeTrade
                          ? "Customers send preferred date, job location, and package requests here. Reply to them directly by phone or email."
                          : automotive
                            ? "Customers send preferred date, vehicle info, and package requests here. Reply to them directly by phone or email."
                            : electronics
                              ? "Customers send preferred date, device info, and package requests here. Reply to them directly by phone or email."
                              : "Enquiries for this listing type appear here."}
      </p>

      {!selected || !hasEnquiryType ? (
        <EmptyList
          className="mt-10"
          title="No enquiry listings yet"
          description="Add a rental shop, hotel, taxi operator, event crew, logistics operator, institute, practice, professional firm, home trade, workshop, or repair shop first."
        />
      ) : (
        <div className="mt-10 overflow-x-auto rounded-2xl border border-line">
          <table className="w-full min-w-[52rem] text-left text-sm">
            <thead className="border-b border-line bg-surface-low text-xs font-bold uppercase tracking-wider text-ink-soft">
              <tr>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Dates</th>
                <th className="px-4 py-3">{thirdColumn}</th>
                <th className="px-4 py-3">{fourthColumn}</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-ink-soft">
                    Loading enquiries…
                  </td>
                </tr>
              ) : stay && stayItems.length ? (
                stayItems.map((enquiry) => (
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
                          updateStay.mutate({ id: enquiry.id, status: event.target.value as StayEnquiryStatus })
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
              ) : rental && rentalItems.length ? (
                rentalItems.map((enquiry) => (
                  <tr key={enquiry.id} className="border-t border-line align-top">
                    <td className="px-4 py-3">
                      <strong>{enquiry.guestName}</strong>
                      <p className="text-xs text-ink-soft">{enquiry.guestEmail}</p>
                      {enquiry.guestPhone ? <p className="text-xs text-ink-soft">{enquiry.guestPhone}</p> : null}
                      {enquiry.notes ? <p className="mt-2 text-xs text-ink-soft">{enquiry.notes}</p> : null}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {dateLabel(enquiry.hireFrom)} → {dateLabel(enquiry.hireTo)}
                    </td>
                    <td className="px-4 py-3">{enquiry.deliveryRequested ? "Delivery requested" : "Pickup"}</td>
                    <td className="px-4 py-3">{itemsLabel(enquiry)}</td>
                    <td className="px-4 py-3">
                      <Select
                        value={enquiry.status}
                        onChange={(event) =>
                          updateRental.mutate({ id: enquiry.id, status: event.target.value as StayEnquiryStatus })
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
              ) : travel && travelItems.length ? (
                travelItems.map((enquiry) => (
                  <tr key={enquiry.id} className="border-t border-line align-top">
                    <td className="px-4 py-3">
                      <strong>{enquiry.guestName}</strong>
                      <p className="text-xs text-ink-soft">{enquiry.guestEmail}</p>
                      {enquiry.guestPhone ? <p className="text-xs text-ink-soft">{enquiry.guestPhone}</p> : null}
                      {enquiry.notes ? <p className="mt-2 text-xs text-ink-soft">{enquiry.notes}</p> : null}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {dateLabel(enquiry.pickupDate)}
                      {enquiry.pickupTime ? ` · ${enquiry.pickupTime}` : ""}
                    </td>
                    <td className="px-4 py-3">
                      {enquiry.pickupLocation} → {enquiry.dropoffLocation}
                      <p className="text-xs text-ink-soft">
                        {enquiry.passengers} passenger{enquiry.passengers === 1 ? "" : "s"}
                        {enquiry.roundTrip ? " · round trip" : ""}
                      </p>
                    </td>
                    <td className="px-4 py-3">{vehiclesLabel(enquiry)}</td>
                    <td className="px-4 py-3">
                      <Select
                        value={enquiry.status}
                        onChange={(event) =>
                          updateTravel.mutate({ id: enquiry.id, status: event.target.value as StayEnquiryStatus })
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
              ) : eventCrew && eventItems.length ? (
                eventItems.map((enquiry) => (
                  <tr key={enquiry.id} className="border-t border-line align-top">
                    <td className="px-4 py-3">
                      <strong>{enquiry.guestName}</strong>
                      <p className="text-xs text-ink-soft">{enquiry.guestEmail}</p>
                      {enquiry.guestPhone ? <p className="text-xs text-ink-soft">{enquiry.guestPhone}</p> : null}
                      {enquiry.notes ? <p className="mt-2 text-xs text-ink-soft">{enquiry.notes}</p> : null}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {dateLabel(enquiry.eventDate)}
                      {enquiry.eventTime ? ` · ${enquiry.eventTime}` : ""}
                    </td>
                    <td className="px-4 py-3">
                      {enquiry.venue}
                      <p className="text-xs text-ink-soft">
                        {enquiry.guests} guest{enquiry.guests === 1 ? "" : "s"}
                      </p>
                    </td>
                    <td className="px-4 py-3">{packagesLabel(enquiry)}</td>
                    <td className="px-4 py-3">
                      <Select
                        value={enquiry.status}
                        onChange={(event) =>
                          updateEvent.mutate({ id: enquiry.id, status: event.target.value as StayEnquiryStatus })
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
              ) : logistics && logisticsItems.length ? (
                logisticsItems.map((enquiry) => (
                  <tr key={enquiry.id} className="border-t border-line align-top">
                    <td className="px-4 py-3">
                      <strong>{enquiry.guestName}</strong>
                      <p className="text-xs text-ink-soft">{enquiry.guestEmail}</p>
                      {enquiry.guestPhone ? <p className="text-xs text-ink-soft">{enquiry.guestPhone}</p> : null}
                      {enquiry.notes ? <p className="mt-2 text-xs text-ink-soft">{enquiry.notes}</p> : null}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {dateLabel(enquiry.pickupDate)}
                      {enquiry.pickupTime ? ` · ${enquiry.pickupTime}` : ""}
                    </td>
                    <td className="px-4 py-3">
                      {enquiry.pickupLocation} → {enquiry.dropoffLocation}
                      <p className="text-xs text-ink-soft">{enquiry.packingRequired ? "Packing required" : "No packing"}</p>
                    </td>
                    <td className="px-4 py-3">{servicesLabel(enquiry)}</td>
                    <td className="px-4 py-3">
                      <Select
                        value={enquiry.status}
                        onChange={(event) =>
                          updateLogistics.mutate({ id: enquiry.id, status: event.target.value as StayEnquiryStatus })
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
              ) : education && educationItems.length ? (
                educationItems.map((enquiry) => (
                  <tr key={enquiry.id} className="border-t border-line align-top">
                    <td className="px-4 py-3">
                      <strong>{enquiry.guestName}</strong>
                      <p className="text-xs text-ink-soft">{enquiry.guestEmail}</p>
                      {enquiry.guestPhone ? <p className="text-xs text-ink-soft">{enquiry.guestPhone}</p> : null}
                      {enquiry.notes ? <p className="mt-2 text-xs text-ink-soft">{enquiry.notes}</p> : null}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {dateLabel(enquiry.startDate)}
                      {enquiry.preferredTime ? ` · ${enquiry.preferredTime}` : ""}
                    </td>
                    <td className="px-4 py-3">
                      {enquiry.learningMode || "—"}
                      <p className="text-xs text-ink-soft">
                        {enquiry.learners} learner{enquiry.learners === 1 ? "" : "s"}
                      </p>
                    </td>
                    <td className="px-4 py-3">{coursesLabel(enquiry)}</td>
                    <td className="px-4 py-3">
                      <Select
                        value={enquiry.status}
                        onChange={(event) =>
                          updateEducation.mutate({ id: enquiry.id, status: event.target.value as StayEnquiryStatus })
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
              ) : health && healthItems.length ? (
                healthItems.map((enquiry) => (
                  <tr key={enquiry.id} className="border-t border-line align-top">
                    <td className="px-4 py-3">
                      <strong>{enquiry.guestName}</strong>
                      <p className="text-xs text-ink-soft">{enquiry.guestEmail}</p>
                      {enquiry.guestPhone ? <p className="text-xs text-ink-soft">{enquiry.guestPhone}</p> : null}
                      {enquiry.concern ? <p className="mt-1 text-xs text-ink-soft">Concern: {enquiry.concern}</p> : null}
                      {enquiry.notes ? <p className="mt-2 text-xs text-ink-soft">{enquiry.notes}</p> : null}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {dateLabel(enquiry.appointmentDate)}
                      {enquiry.appointmentTime ? ` · ${enquiry.appointmentTime}` : ""}
                    </td>
                    <td className="px-4 py-3">
                      {enquiry.patients} patient{enquiry.patients === 1 ? "" : "s"}
                    </td>
                    <td className="px-4 py-3">{servicesLabel(enquiry)}</td>
                    <td className="px-4 py-3">
                      <Select
                        value={enquiry.status}
                        onChange={(event) =>
                          updateHealth.mutate({ id: enquiry.id, status: event.target.value as StayEnquiryStatus })
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
              ) : professional && professionalItems.length ? (
                professionalItems.map((enquiry) => (
                  <tr key={enquiry.id} className="border-t border-line align-top">
                    <td className="px-4 py-3">
                      <strong>{enquiry.guestName}</strong>
                      <p className="text-xs text-ink-soft">{enquiry.guestEmail}</p>
                      {enquiry.guestPhone ? <p className="text-xs text-ink-soft">{enquiry.guestPhone}</p> : null}
                      {enquiry.notes ? <p className="mt-2 text-xs text-ink-soft">{enquiry.notes}</p> : null}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {dateLabel(enquiry.preferredDate)}
                      {enquiry.preferredTime ? ` · ${enquiry.preferredTime}` : ""}
                    </td>
                    <td className="px-4 py-3">{enquiry.topic || "—"}</td>
                    <td className="px-4 py-3">{servicesLabel(enquiry)}</td>
                    <td className="px-4 py-3">
                      <Select
                        value={enquiry.status}
                        onChange={(event) =>
                          updateProfessional.mutate({
                            id: enquiry.id,
                            status: event.target.value as StayEnquiryStatus,
                          })
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
              ) : homeTrade && homeTradeItems.length ? (
                homeTradeItems.map((enquiry) => (
                  <tr key={enquiry.id} className="border-t border-line align-top">
                    <td className="px-4 py-3">
                      <strong>{enquiry.guestName}</strong>
                      <p className="text-xs text-ink-soft">{enquiry.guestEmail}</p>
                      {enquiry.guestPhone ? <p className="text-xs text-ink-soft">{enquiry.guestPhone}</p> : null}
                      {enquiry.notes ? <p className="mt-2 text-xs text-ink-soft">{enquiry.notes}</p> : null}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {dateLabel(enquiry.preferredDate)}
                      {enquiry.preferredTime ? ` · ${enquiry.preferredTime}` : ""}
                    </td>
                    <td className="px-4 py-3">{enquiry.jobLocation}</td>
                    <td className="px-4 py-3">{servicesLabel(enquiry)}</td>
                    <td className="px-4 py-3">
                      <Select
                        value={enquiry.status}
                        onChange={(event) =>
                          updateHomeTrade.mutate({
                            id: enquiry.id,
                            status: event.target.value as StayEnquiryStatus,
                          })
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
              ) : automotive && automotiveItems.length ? (
                automotiveItems.map((enquiry) => (
                  <tr key={enquiry.id} className="border-t border-line align-top">
                    <td className="px-4 py-3">
                      <strong>{enquiry.guestName}</strong>
                      <p className="text-xs text-ink-soft">{enquiry.guestEmail}</p>
                      {enquiry.guestPhone ? <p className="text-xs text-ink-soft">{enquiry.guestPhone}</p> : null}
                      {enquiry.notes ? <p className="mt-2 text-xs text-ink-soft">{enquiry.notes}</p> : null}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {dateLabel(enquiry.preferredDate)}
                      {enquiry.preferredTime ? ` · ${enquiry.preferredTime}` : ""}
                    </td>
                    <td className="px-4 py-3">{enquiry.vehicleInfo || "—"}</td>
                    <td className="px-4 py-3">{servicesLabel(enquiry)}</td>
                    <td className="px-4 py-3">
                      <Select
                        value={enquiry.status}
                        onChange={(event) =>
                          updateAutomotive.mutate({
                            id: enquiry.id,
                            status: event.target.value as StayEnquiryStatus,
                          })
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
              ) : electronics && electronicsItems.length ? (
                electronicsItems.map((enquiry) => (
                  <tr key={enquiry.id} className="border-t border-line align-top">
                    <td className="px-4 py-3">
                      <strong>{enquiry.guestName}</strong>
                      <p className="text-xs text-ink-soft">{enquiry.guestEmail}</p>
                      {enquiry.guestPhone ? <p className="text-xs text-ink-soft">{enquiry.guestPhone}</p> : null}
                      {enquiry.notes ? <p className="mt-2 text-xs text-ink-soft">{enquiry.notes}</p> : null}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {dateLabel(enquiry.preferredDate)}
                      {enquiry.preferredTime ? ` · ${enquiry.preferredTime}` : ""}
                    </td>
                    <td className="px-4 py-3">{enquiry.deviceInfo || "—"}</td>
                    <td className="px-4 py-3">{servicesLabel(enquiry)}</td>
                    <td className="px-4 py-3">
                      <Select
                        value={enquiry.status}
                        onChange={(event) =>
                          updateElectronics.mutate({
                            id: enquiry.id,
                            status: event.target.value as StayEnquiryStatus,
                          })
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
                    <EmptyList
                      compact
                      title="No enquiries yet"
                      description={
                        stay
                          ? "Guest stay requests will appear here."
                          : rental
                            ? "Hire requests will appear here."
                            : travel
                              ? "Trip requests will appear here."
                              : eventCrew
                                ? "Event requests will appear here."
                                : logistics
                                  ? "Move requests will appear here."
                                  : education
                                    ? "Learning requests will appear here."
                                    : health
                                      ? "Health requests will appear here."
                                      : professional
                                        ? "Professional requests will appear here."
                                        : homeTrade
                                          ? "Job requests will appear here."
                                          : automotive
                                            ? "Workshop requests will appear here."
                                            : "Repair requests will appear here."
                      }
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      {error ? <p className="mt-4 text-sm text-red-700">Could not load enquiries.</p> : null}
    </section>
  );
}
