import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import {
  DynamicForm,
  toFieldValuePayload,
  valuesFromFieldValues,
  type FieldValueMap,
} from "../components/CategoryFieldsEditor";
import { Button, Field, Input, PageState, Select, Textarea } from "../components/ui";
import { useAuth } from "../context/useAuth";
import { api } from "../lib/api";
import { assignedCategoryId, flattenDescendants } from "../lib/category-tree";

interface BusinessForm {
  name: string;
  email: string;
  phone: string;
  title: string;
  mainCategoryId: string;
  categoryId: string;
  description: string;
  address: string;
  city: string;
  website: string;
  lat: string;
  lng: string;
  instagram: string;
  facebook: string;
  openTime: string;
  closeTime: string;
}

const initialForm: BusinessForm = {
  name: "",
  email: "",
  phone: "",
  title: "",
  mainCategoryId: "",
  categoryId: "",
  description: "",
  address: "",
  city: "",
  website: "",
  lat: "",
  lng: "",
  instagram: "",
  facebook: "",
  openTime: "09:00",
  closeTime: "18:00",
};

export function ListBusiness() {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const queryClient = useQueryClient();
  const categories = useQuery({ queryKey: ["categories"], queryFn: api.categories });
  const [form, setForm] = useState<BusinessForm>(initialForm);
  const [fieldValues, setFieldValues] = useState<FieldValueMap>({});
  const [coverUrl, setCoverUrl] = useState<string | undefined>();
  const [logoUrl, setLogoUrl] = useState<string | undefined>();
  const providerForm = useQuery({
    queryKey: ["category-form", form.categoryId, "provider"],
    queryFn: () => api.categoryForm(form.categoryId, "provider"),
    enabled: Boolean(form.categoryId),
  });
  const selectedMain = (categories.data ?? []).find((category) => category.id === form.mainCategoryId);
  const subcategories = selectedMain ? flattenDescendants(selectedMain) : [];
  const create = useMutation({
    mutationFn: api.createBusiness,
    onSuccess: (result) => {
      if (result.user) queryClient.setQueryData(["auth", "me"], result.user);
    },
  });
  const upload = useMutation({
    mutationFn: async ({ file, kind }: { file: File; kind: "cover" | "logo" }) => {
      const stored = await api.upload(file, { visibility: "public" });
      if (kind === "cover") setCoverUrl(stored.url);
      else setLogoUrl(stored.url);
    },
  });

  useEffect(() => {
    if (!user) return;
    setForm((current) => ({
      ...current,
      email: current.email || user.email,
      phone: current.phone || user.phone || "",
    }));
  }, [user]);

  useEffect(() => {
    if (!providerForm.data?.fields) {
      setFieldValues({});
      return;
    }
    setFieldValues(valuesFromFieldValues(providerForm.data.fields));
  }, [providerForm.data]);

  if (isLoading) return <PageState title="Loading" loading />;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (categories.isError) {
    return (
      <PageState
        title="Categories are unavailable"
        description="The form cannot be submitted safely until categories load."
        action={<Button onClick={() => void categories.refetch()}>Try again</Button>}
      />
    );
  }

  function update<K extends keyof BusinessForm>(key: K, value: BusinessForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const hours = {
      monday: [form.openTime, form.closeTime] as [string, string],
      tuesday: [form.openTime, form.closeTime] as [string, string],
      wednesday: [form.openTime, form.closeTime] as [string, string],
      thursday: [form.openTime, form.closeTime] as [string, string],
      friday: [form.openTime, form.closeTime] as [string, string],
      saturday: [form.openTime, form.closeTime] as [string, string],
      sunday: null,
    };
    const fields = providerForm.data?.fields ?? [];
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
      hours,
      images: coverUrl ? [coverUrl] : [],
      coverUrl,
      logoUrl,
      socialLinks: {
        ...(form.instagram ? { instagram: form.instagram } : {}),
        ...(form.facebook ? { facebook: form.facebook } : {}),
      },
      fieldValues: fields.length ? toFieldValuePayload(fields, fieldValues) : undefined,
    });
  }

  if (create.isSuccess) {
    return (
      <PageState
        title="Your business was submitted"
        description="Your profile is now in the Concierge review queue. Add services and complete identity verification from your account."
        action={
          <div className="flex flex-wrap justify-center gap-3">
            <Link to={`/business/${create.data.business.slug ?? create.data.business.id}/edit`}>
              <Button>
                Manage profile <ArrowRight className="size-4" />
              </Button>
            </Link>
            <Link to="/verification">
              <Button variant="outline">Start verification</Button>
            </Link>
          </div>
        }
      />
    );
  }

  return (
    <section className="page-shell py-14 md:py-20">
      <div className="grid gap-12 lg:grid-cols-[.7fr_1.3fr]">
        <div>
          <p className="label-caps text-gold-dark">Become a provider</p>
          <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight md:text-5xl">
            Add your business when you are ready.
          </h1>
          <p className="mt-5 leading-7 text-ink-soft">
            Use the same account. Choose a category, complete the profile form, and submit for review.
          </p>
          <div className="mt-8 grid gap-4 text-sm">
            {["Curated directory presence", "Verified reviews from members", "Services catalog & nearby discovery"].map(
              (item) => (
                <p key={item} className="flex items-center gap-3">
                  <CheckCircle2 className="size-5 text-emerald-600" />
                  {item}
                </p>
              ),
            )}
          </div>
        </div>
        <form onSubmit={submit} className="grid gap-5 rounded-3xl border border-line bg-white p-6 shadow-sm md:grid-cols-2 md:p-9">
          <Field label="Business name">
            <Input value={form.name} onChange={(event) => update("name", event.target.value)} required />
          </Field>
          <Field label="Profile title">
            <Input
              value={form.title}
              onChange={(event) => update("title", event.target.value)}
              placeholder="e.g. Bespoke Interior Studio"
              required
            />
          </Field>
          <Field label="Business email">
            <Input type="email" value={form.email} onChange={(event) => update("email", event.target.value)} required />
          </Field>
          <Field label="Phone">
            <Input type="tel" value={form.phone} onChange={(event) => update("phone", event.target.value)} />
          </Field>
          <Field label="Category">
            <Select
              value={form.mainCategoryId}
              onChange={(event) => {
                const mainCategoryId = event.target.value;
                const nextId = assignedCategoryId(mainCategoryId, "", categories.data ?? []);
                setForm((current) => ({ ...current, mainCategoryId, categoryId: nextId }));
              }}
              required
            >
              <option value="">Select category</option>
              {categories.data?.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </Field>
          {subcategories.length ? (
            <Field label="Subcategory">
              <Select
                value={form.categoryId}
                onChange={(event) => update("categoryId", event.target.value)}
                required
              >
                <option value="">Select subcategory</option>
                    {subcategories.map(({ category, label }) => (
                      <option key={category.id} value={category.id}>
                        {label}
                      </option>
                    ))}
              </Select>
            </Field>
          ) : null}
          <Field label="Website">
            <Input
              type="url"
              value={form.website}
              onChange={(event) => update("website", event.target.value)}
              placeholder="https://"
            />
          </Field>
          <div className="md:col-span-2">
            <Field label="Description">
              <Textarea
                value={form.description}
                onChange={(event) => update("description", event.target.value)}
                rows={5}
                minLength={20}
                placeholder="Describe your expertise in at least 20 characters."
                required
              />
            </Field>
          </div>
          <Field label="Street address">
            <Input value={form.address} onChange={(event) => update("address", event.target.value)} required />
          </Field>
          <Field label="City">
            <Input value={form.city} onChange={(event) => update("city", event.target.value)} required />
          </Field>
          <Field label="Opens">
            <Input type="time" value={form.openTime} onChange={(event) => update("openTime", event.target.value)} required />
          </Field>
          <Field label="Closes">
            <Input type="time" value={form.closeTime} onChange={(event) => update("closeTime", event.target.value)} required />
          </Field>
          <Field label="Instagram">
            <Input
              type="url"
              value={form.instagram}
              onChange={(event) => update("instagram", event.target.value)}
              placeholder="https://instagram.com/..."
            />
          </Field>
          <Field label="Facebook">
            <Input
              type="url"
              value={form.facebook}
              onChange={(event) => update("facebook", event.target.value)}
              placeholder="https://facebook.com/..."
            />
          </Field>
          <Field label="Latitude (optional)">
            <Input type="number" step="any" value={form.lat} onChange={(event) => update("lat", event.target.value)} />
          </Field>
          <Field label="Longitude (optional)">
            <Input type="number" step="any" value={form.lng} onChange={(event) => update("lng", event.target.value)} />
          </Field>

          {form.categoryId && providerForm.isLoading ? (
            <p className="text-sm text-ink-soft md:col-span-2">Loading category fields…</p>
          ) : null}
          {providerForm.isError ? (
            <p className="text-sm text-red-700 md:col-span-2">Could not load category fields.</p>
          ) : null}
          {providerForm.data?.fields?.length ? (
            <DynamicForm
              fields={providerForm.data.fields}
              values={fieldValues}
              onChange={setFieldValues}
            />
          ) : null}

          <label className="text-sm md:col-span-1">
            <span className="mb-2 block text-xs font-bold uppercase tracking-wider">Logo</span>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) upload.mutate({ file, kind: "logo" });
              }}
            />
            {logoUrl ? <p className="mt-1 text-xs text-emerald-700">Logo ready</p> : null}
          </label>
          <label className="text-sm md:col-span-1">
            <span className="mb-2 block text-xs font-bold uppercase tracking-wider">Cover</span>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) upload.mutate({ file, kind: "cover" });
              }}
            />
            {coverUrl ? <p className="mt-1 text-xs text-emerald-700">Cover ready</p> : null}
          </label>
          {create.isError ? <p className="text-sm text-red-700 md:col-span-2">{create.error.message}</p> : null}
          <Button
            type="submit"
            className="mt-2 md:col-span-2"
            disabled={create.isPending || categories.isLoading || (Boolean(form.categoryId) && providerForm.isLoading)}
          >
            {create.isPending ? "Submitting…" : "Submit business"}
          </Button>
        </form>
      </div>
    </section>
  );
}
