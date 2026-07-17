import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { Button, Field, Input, PageState, Select, Textarea } from "../components/ui";
import { useAuth } from "../context/useAuth";
import { api } from "../lib/api";

interface BusinessForm {
  name: string;
  email: string;
  phone: string;
  title: string;
  categoryId: string;
  description: string;
  address: string;
  city: string;
  website: string;
  lat: string;
  lng: string;
}

const initialForm: BusinessForm = {
  name: "", email: "", phone: "", title: "", categoryId: "", description: "",
  address: "", city: "", website: "", lat: "", lng: "",
};

export function ListBusiness() {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const categories = useQuery({ queryKey: ["categories"], queryFn: api.categories });
  const [form, setForm] = useState<BusinessForm>(initialForm);
  const create = useMutation({ mutationFn: api.createBusiness });

  if (isLoading) return <PageState title="Loading" loading />;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (user.role === "user") {
    return <PageState title="Business account required" description="Create a business account to publish a listing." action={<Link to="/register"><Button>Create business account</Button></Link>} />;
  }

  function update<K extends keyof BusinessForm>(key: K, value: BusinessForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    create.mutate({
      name: form.name,
      email: form.email,
      phone: form.phone || undefined,
      title: form.title || form.name,
      categoryId: form.categoryId,
      description: form.description,
      address: form.address,
      city: form.city,
      website: form.website || undefined,
      lat: form.lat ? Number(form.lat) : undefined,
      lng: form.lng ? Number(form.lng) : undefined,
      images: [],
    });
  }

  if (create.isSuccess) {
    return (
      <PageState
        title="Your business was submitted"
        description="Your profile is now in the Concierge review queue."
        action={<Link to={`/business/${create.data.slug ?? create.data.id}`}><Button>View business <ArrowRight className="size-4" /></Button></Link>}
      />
    );
  }

  return (
    <section className="page-shell py-14 md:py-20">
      <div className="grid gap-12 lg:grid-cols-[.7fr_1.3fr]">
        <div>
          <p className="label-caps text-gold-dark">For exceptional businesses</p>
          <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight md:text-5xl">Be discovered by the right clients.</h1>
          <p className="mt-5 leading-7 text-ink-soft">Build a focused profile that communicates your expertise, location, and point of difference.</p>
          <div className="mt-8 grid gap-4 text-sm">
            {["Curated directory presence", "Verified reviews from members", "A profile designed for your work"].map((item) => <p key={item} className="flex items-center gap-3"><CheckCircle2 className="size-5 text-emerald-600" />{item}</p>)}
          </div>
        </div>
        <form onSubmit={submit} className="grid gap-5 rounded-3xl border border-line bg-white p-6 shadow-sm md:grid-cols-2 md:p-9">
          <Field label="Business name"><Input value={form.name} onChange={(event) => update("name", event.target.value)} required /></Field>
          <Field label="Profile title"><Input value={form.title} onChange={(event) => update("title", event.target.value)} placeholder="e.g. Bespoke Interior Studio" required /></Field>
          <Field label="Business email"><Input type="email" value={form.email} onChange={(event) => update("email", event.target.value)} required /></Field>
          <Field label="Phone"><Input type="tel" value={form.phone} onChange={(event) => update("phone", event.target.value)} /></Field>
          <Field label="Category"><Select value={form.categoryId} onChange={(event) => update("categoryId", event.target.value)} required><option value="">Select category</option>{categories.data?.flatMap((category) => [category, ...(category.children ?? [])]).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</Select></Field>
          <Field label="Website"><Input type="url" value={form.website} onChange={(event) => update("website", event.target.value)} placeholder="https://" /></Field>
          <div className="md:col-span-2"><Field label="Description"><Textarea value={form.description} onChange={(event) => update("description", event.target.value)} rows={5} required /></Field></div>
          <Field label="Street address"><Input value={form.address} onChange={(event) => update("address", event.target.value)} required /></Field>
          <Field label="City"><Input value={form.city} onChange={(event) => update("city", event.target.value)} required /></Field>
          <Field label="Latitude (optional)"><Input type="number" step="any" value={form.lat} onChange={(event) => update("lat", event.target.value)} /></Field>
          <Field label="Longitude (optional)"><Input type="number" step="any" value={form.lng} onChange={(event) => update("lng", event.target.value)} /></Field>
          {create.isError ? <p className="text-sm text-red-700 md:col-span-2">{create.error.message}</p> : null}
          <Button type="submit" className="mt-2 md:col-span-2" disabled={create.isPending || categories.isLoading}>{create.isPending ? "Submitting…" : "Submit business"}</Button>
        </form>
      </div>
    </section>
  );
}
