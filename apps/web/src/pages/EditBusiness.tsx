import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useParams } from "react-router-dom";
import { Button, Field, Input, PageState, Textarea } from "../components/ui";
import { useAuth } from "../context/useAuth";
import { api } from "../lib/api";

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
  const services = useQuery({
    queryKey: ["services", business.data?.id],
    queryFn: () => api.services(business.data!.id),
    enabled: Boolean(business.data?.id),
  });

  const [serviceForm, setServiceForm] = useState({ name: "", description: "", price: "100" });
  const canEdit = useMemo(() => {
    if (!user || !business.data) return false;
    return user.role === "admin" || user.id === business.data.ownerId;
  }, [user, business.data]);

  const save = useMutation({
    mutationFn: (input: Record<string, unknown>) => api.updateBusiness(business.data!.id, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["business", slug] });
    },
  });
  const createService = useMutation({
    mutationFn: () =>
      api.createService({
        businessId: business.data!.id,
        name: serviceForm.name,
        description: serviceForm.description,
        price: Number(serviceForm.price),
        currency: "USD",
      }),
    onSuccess: async () => {
      setServiceForm({ name: "", description: "", price: "100" });
      await queryClient.invalidateQueries({ queryKey: ["services", business.data?.id] });
    },
  });
  const removeService = useMutation({
    mutationFn: api.deleteService,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["services", business.data?.id] });
    },
  });
  const uploadCover = useMutation({
    mutationFn: async (file: File) => {
      const stored = await api.upload(file, "public");
      return api.updateBusiness(business.data!.id, { coverUrl: stored.url });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["business", slug] });
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
        <label className="md:col-span-2">
          <span className="text-xs font-bold uppercase tracking-wider">Cover image</span>
          <input
            type="file"
            accept="image/*"
            className="mt-2 block w-full text-sm"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) uploadCover.mutate(file);
            }}
          />
        </label>
        {save.isError ? <p className="text-sm text-red-700 md:col-span-2">{save.error.message}</p> : null}
        {save.isSuccess ? <p className="text-sm text-emerald-700 md:col-span-2">Saved.</p> : null}
        <div className="flex flex-wrap gap-3 md:col-span-2">
          <Button type="submit" disabled={save.isPending}>{save.isPending ? "Saving…" : "Save changes"}</Button>
          <Link to={`/business/${profile.slug}`}><Button variant="outline">View public profile</Button></Link>
          <Link to="/verification"><Button variant="ghost">Verification</Button></Link>
        </div>
      </form>

      <div className="rounded-3xl border border-line p-6 md:p-9">
        <h2 className="text-2xl font-semibold">Services</h2>
        <ul className="mt-5 grid gap-3">
          {services.data?.map((service) => (
            <li key={service.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-surface-low px-4 py-3">
              <div>
                <p className="font-semibold">{service.name}</p>
                <p className="text-sm text-ink-soft">{service.currency} {service.price} · {service.isActive ? "active" : "inactive"}</p>
              </div>
              {service.isActive ? (
                <Button variant="outline" onClick={() => removeService.mutate(service.id)}>Deactivate</Button>
              ) : null}
            </li>
          ))}
        </ul>
        <form
          className="mt-6 grid gap-3 md:grid-cols-3"
          onSubmit={(event) => {
            event.preventDefault();
            createService.mutate();
          }}
        >
          <Input placeholder="Service name" value={serviceForm.name} onChange={(e) => setServiceForm((s) => ({ ...s, name: e.target.value }))} required />
          <Input placeholder="Price" type="number" value={serviceForm.price} onChange={(e) => setServiceForm((s) => ({ ...s, price: e.target.value }))} required />
          <Input placeholder="Description" value={serviceForm.description} onChange={(e) => setServiceForm((s) => ({ ...s, description: e.target.value }))} required />
          <Button type="submit" className="md:col-span-3" disabled={createService.isPending}>Add service</Button>
        </form>
      </div>
    </section>
  );
}
