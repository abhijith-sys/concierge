import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useParams } from "react-router-dom";
import { ApprovalBanner } from "../components/ApprovalBanner";
import {
  DynamicForm,
  toFieldValuePayload,
  valuesFromFieldValues,
  type FieldValueMap,
} from "../components/CategoryFieldsEditor";
import { ImagePreviewUpload } from "../components/ImagePreviewUpload";
import { Button, Field, Input, PageState, Textarea } from "../components/ui";
import { useAuth } from "../context/useAuth";
import { api } from "../lib/api";
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
import { theme } from "../lib/theme";

const defaultHours = {
  monday: ["09:00", "18:00"] as [string, string],
  tuesday: ["09:00", "18:00"] as [string, string],
  wednesday: ["09:00", "18:00"] as [string, string],
  thursday: ["09:00", "18:00"] as [string, string],
  friday: ["09:00", "18:00"] as [string, string],
  saturday: ["10:00", "16:00"] as [string, string],
  sunday: null as [string, string] | null,
};

export function EditBusiness() {
  const { slug = "" } = useParams();
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const queryClient = useQueryClient();
  const business = useQuery({ queryKey: ["business", slug], queryFn: () => api.business(slug) });
  const [fieldValues, setFieldValues] = useState<FieldValueMap>({});
  const canEdit = useMemo(() => {
    if (!user || !business.data) return false;
    return user.role === "admin" || user.id === business.data.ownerId;
  }, [user, business.data]);

  const categoryId = business.data?.listing?.category?.id;
  const providerForm = useQuery({
    queryKey: ["category-form", categoryId, "provider"],
    queryFn: () => api.categoryForm(categoryId!, "provider"),
    enabled: Boolean(categoryId),
  });

  useEffect(() => {
    if (!providerForm.data?.fields) return;
    setFieldValues(valuesFromFieldValues(providerForm.data.fields, business.data?.fieldValues));
  }, [providerForm.data, business.data?.fieldValues]);

  const save = useMutation({
    mutationFn: (input: Record<string, unknown>) => api.updateBusiness(business.data!.id, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["business", slug] });
      await queryClient.invalidateQueries({ queryKey: ["businesses", "mine"] });
    },
  });
  const uploadCover = useMutation({
    mutationFn: async (file: File) => {
      const stored = await api.upload(file, {
        visibility: "public",
        entityType: "business",
        entityId: business.data!.id,
        purpose: "cover",
      });
      return api.updateBusiness(business.data!.id, { coverUrl: stored.url });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["business", slug] });
      await queryClient.invalidateQueries({ queryKey: ["businesses", "mine"] });
    },
  });
  const uploadLogo = useMutation({
    mutationFn: async (file: File) => {
      const stored = await api.upload(file, {
        visibility: "public",
        entityType: "business",
        entityId: business.data!.id,
        purpose: "logo",
      });
      return api.updateBusiness(business.data!.id, { logoUrl: stored.url });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["business", slug] });
      await queryClient.invalidateQueries({ queryKey: ["businesses", "mine"] });
    },
  });

  if (isLoading || business.isLoading) return <PageState title="Loading" loading />;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (business.isError || !business.data) return <PageState title="Business not found" />;
  if (!canEdit) return <PageState title="Not authorized" description="Only the owner or an admin can edit this profile." />;

  const profile = business.data;
  const listing = profile.listing;

  function onSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const fields = providerForm.data?.fields ?? [];
    save.mutate({
      name: String(form.get("name") || ""),
      phone: String(form.get("phone") || "") || null,
      description: String(form.get("description") || ""),
      address: String(form.get("address") || ""),
      city: String(form.get("city") || ""),
      website: String(form.get("website") || "") || null,
      socialLinks: {
        instagram: String(form.get("instagram") || "") || undefined,
        facebook: String(form.get("facebook") || "") || undefined,
      },
      hours: defaultHours,
      fieldValues: fields.length ? toFieldValuePayload(fields, fieldValues) : undefined,
    });
  }

  return (
    <section className="page-shell grid gap-10 py-14 md:py-20">
      <div>
        <p className="label-caps text-gold-dark">Owner tools</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">Edit {profile.name}</h1>
        <p className="mt-3 text-sm text-ink-soft">
          Status: <span className="capitalize">{profile.status}</span>
          {profile.verified ? " · Verified" : ""}
        </p>
        {profile.status === "pending" ? (
          <ApprovalBanner tone="pending" title="This profile is waiting for review">
            Visitors cannot see it until {theme.name} activates the listing.
          </ApprovalBanner>
        ) : null}
        {profile.status === "rejected" ? (
          <ApprovalBanner tone="rejected" title="This profile was not approved">
            {profile.rejectionReason || "Update your details and wait for another review."}
          </ApprovalBanner>
        ) : null}
      </div>

      <form onSubmit={onSave} className="grid gap-5 rounded-3xl border border-line bg-white p-6 md:grid-cols-2 md:p-9">
        <Field label="Business name"><Input name="name" defaultValue={profile.name} required /></Field>
        <Field label="Phone"><Input name="phone" defaultValue={profile.phone ?? ""} /></Field>
        <div className="md:col-span-2">
          <Field label="Description">
            <Textarea name="description" defaultValue={listing?.description ?? ""} rows={5} minLength={20} required />
          </Field>
        </div>
        <Field label="Address"><Input name="address" defaultValue={listing?.address ?? ""} required /></Field>
        <Field label="City"><Input name="city" defaultValue={listing?.city ?? ""} required /></Field>
        <Field label="Website"><Input name="website" defaultValue={listing?.website ?? ""} /></Field>
        <Field label="Instagram"><Input name="instagram" defaultValue={profile.socialLinks?.instagram ?? ""} /></Field>
        <Field label="Facebook"><Input name="facebook" defaultValue={profile.socialLinks?.facebook ?? ""} /></Field>

        {providerForm.data?.fields?.length ? (
          <DynamicForm
            fields={providerForm.data.fields}
            values={fieldValues}
            onChange={setFieldValues}
          />
        ) : null}

        <ImagePreviewUpload
          label="Profile image"
          value={profile.logoUrl}
          uploading={uploadLogo.isPending}
          onSelect={(file) => uploadLogo.mutate(file)}
        />
        <ImagePreviewUpload
          label="Banner image"
          value={profile.coverUrl}
          aspect="banner"
          uploading={uploadCover.isPending}
          onSelect={(file) => uploadCover.mutate(file)}
        />
        {save.isError ? <p className="text-sm text-red-700 md:col-span-2">{save.error.message}</p> : null}
        {save.isSuccess ? <p className="text-sm text-emerald-700 md:col-span-2">Saved.</p> : null}
        <div className="flex flex-wrap gap-3 md:col-span-2">
          <Button type="submit" disabled={save.isPending}>{save.isPending ? "Saving…" : "Save changes"}</Button>
          <Link to={`/business/${profile.slug}`}><Button variant="outline">View public profile</Button></Link>
          <Link to="/verification"><Button variant="ghost">Verification</Button></Link>
        </div>
      </form>

      <div className="rounded-3xl border border-line p-6 md:p-9">
        <h2 className="text-2xl font-semibold">
          {isStayListing(listing)
            ? "Rooms & cottages"
            : isRentalListing(listing)
              ? "Hire items"
              : isTravelListing(listing)
                ? "Fleet & trips"
                : isEventListing(listing)
                  ? "Packages"
                  : isLogisticsListing(listing)
                    ? "Services"
                    : isEducationListing(listing)
                      ? "Courses"
                      : isHealthListing(listing)
                        ? "Treatments"
                        : isProfessionalListing(listing)
                          ? "Services"
                          : isHomeListing(listing) || isAutomotiveListing(listing) || isElectronicsListing(listing)
                            ? "Packages"
                            : "Listings"}
        </h2>
        <p className="mt-2 text-sm text-ink-soft">
          {isStayListing(listing)
            ? "Add rooms, cottages, and stay options with photos and nightly rates."
            : isRentalListing(listing)
            ? "Add vehicles, cameras, or equipment with photos, stock, and hire rates."
            : isTravelListing(listing)
            ? "Add taxis, airport cars, or tour packages with photos, seats, and trip rates."
            : isEventListing(listing)
            ? "Add photography, catering, or wedding packages with photos, guests, and day rates."
            : isLogisticsListing(listing)
            ? "Add courier, move, or security offerings with photos, capacity, and job rates."
            : isEducationListing(listing)
            ? "Add coaching, tuition, or training courses with photos, batch size, and course rates."
            : isHealthListing(listing)
            ? "Add consultations or treatments with photos, duration, and session rates."
            : isProfessionalListing(listing)
            ? "Add advisory or consulting services with photos, duration, and engagement rates."
            : isHomeListing(listing)
            ? "Add electrical, plumbing, or home job packages with photos, duration, and job rates."
            : isAutomotiveListing(listing)
            ? "Add repair, wash, or tow packages with photos, duration, and job rates."
            : isElectronicsListing(listing)
            ? "Add device or IT repair packages with photos, duration, and job rates."
            : "Open the listings table to add or edit items for this business."}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link to={`/provider/listings?business=${profile.id}`}>
            <Button>
              {isStayListing(listing)
                ? "Manage rooms"
                : isRentalListing(listing)
                  ? "Manage items"
                  : isTravelListing(listing)
                    ? "Manage fleet"
                    : isEventListing(listing)
                      ? "Manage packages"
                      : isLogisticsListing(listing)
                        ? "Manage services"
                        : isEducationListing(listing)
                          ? "Manage courses"
                          : isHealthListing(listing)
                            ? "Manage treatments"
                            : isProfessionalListing(listing)
                              ? "Manage services"
                              : isHomeListing(listing) ||
                                  isAutomotiveListing(listing) ||
                                  isElectronicsListing(listing)
                                ? "Manage packages"
                                : "View listings"}
            </Button>
          </Link>
          {isStayListing(listing) ||
          isRentalListing(listing) ||
          isTravelListing(listing) ||
          isEventListing(listing) ||
          isLogisticsListing(listing) ||
          isEducationListing(listing) ||
          isHealthListing(listing) ||
          isProfessionalListing(listing) ||
          isHomeListing(listing) ||
          isAutomotiveListing(listing) ||
          isElectronicsListing(listing) ? (
            <Link to={`/provider/enquiries?business=${profile.id}`}>
              <Button variant="outline">
                {isStayListing(listing)
                  ? "Stay enquiries"
                  : isRentalListing(listing)
                    ? "Hire enquiries"
                    : isTravelListing(listing)
                      ? "Trip enquiries"
                      : isEventListing(listing)
                        ? "Event enquiries"
                        : isLogisticsListing(listing)
                          ? "Move enquiries"
                          : isEducationListing(listing)
                            ? "Learning enquiries"
                            : isHealthListing(listing)
                              ? "Health enquiries"
                              : isProfessionalListing(listing)
                                ? "Professional enquiries"
                                : isHomeListing(listing)
                                  ? "Job enquiries"
                                  : isAutomotiveListing(listing)
                                    ? "Workshop enquiries"
                                    : "Repair enquiries"}
              </Button>
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
