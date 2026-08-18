import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  DynamicForm,
  toFieldValuePayload,
  valuesFromFieldValues,
  type FieldValueMap,
} from "../components/CategoryFieldsEditor";
import { FlagPhoneInput } from "../components/FlagPhoneInput";
import { ImagePreviewUpload } from "../components/ImagePreviewUpload";
import { Button, Field, Input, PageState, Select, Textarea } from "../components/ui";
import { useAuth } from "../context/useAuth";
import { ApiError, api, type Business } from "../lib/api";
import { mainsForKind, type MarketplaceKind } from "../lib/listing-kind";
import { firstFormError, isFieldRequired, validateForm, type FieldKey } from "../lib/validation";

interface BusinessForm {
  name: string;
  email: string;
  phone: string;
  title: string;
  mainCategoryId: string;
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
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const categories = useQuery({ queryKey: ["categories"], queryFn: api.categories });
  const [form, setForm] = useState<BusinessForm>(initialForm);
  const [intent, setIntent] = useState<MarketplaceKind | "">("");
  const [fieldValues, setFieldValues] = useState<FieldValueMap>({});
  const [coverUrl, setCoverUrl] = useState<string | undefined>();
  const [logoUrl, setLogoUrl] = useState<string | undefined>();
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const providerForm = useQuery({
    queryKey: ["category-form", form.mainCategoryId, "provider"],
    queryFn: () => api.categoryForm(form.mainCategoryId, "provider"),
    enabled: Boolean(form.mainCategoryId),
  });
  const visibleMains = intent ? mainsForKind(categories.data ?? [], intent) : (categories.data ?? []);
  const create = useMutation({
    mutationFn: api.createBusiness,
    onSuccess: (result) => {
      if (result.user) queryClient.setQueryData(["auth", "me"], result.user);
      queryClient.setQueryData(["businesses", "mine"], (current: Business[] | undefined) => {
        const next = current?.filter((business) => business.id !== result.business.id) ?? [];
        return [result.business, ...next];
      });
      void queryClient.invalidateQueries({ queryKey: ["businesses", "mine"] });
      toast.success("Business submitted for review.");
      navigate(`/provider?business=${result.business.id}`, { replace: true });
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Unable to submit this business.");
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
  if (!user.emailVerifiedAt) {
    return (
      <PageState
        title="Verify your email first"
        description="We need a verified email before you can list a business."
        action={
          <Link to="/verify-email" state={{ from: location.pathname }}>
            <Button>Verify email</Button>
          </Link>
        }
      />
    );
  }
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
    const mapped: Record<string, FieldKey> = {
      name: "businessName",
      title: "businessTitle",
      email: "businessEmail",
      phone: "businessPhone",
      mainCategoryId: "categoryId",
    };
    const errorKey = mapped[key as string] ?? (key as FieldKey);
    setErrors((current) => ({ ...current, [errorKey]: undefined }));
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const values = {
      businessName: form.name,
      businessTitle: form.title,
      businessEmail: form.email,
      businessPhone: form.phone,
      intent,
      categoryId: form.mainCategoryId,
      description: form.description,
      address: form.address,
      city: form.city,
      website: form.website,
      instagram: form.instagram,
      facebook: form.facebook,
      openTime: form.openTime,
      closeTime: form.closeTime,
      lat: form.lat,
      lng: form.lng,
    };
    const nextErrors = validateForm("business", values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      toast.error(firstFormError(nextErrors) ?? "Please fix the highlighted fields.");
      return;
    }
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
      categoryId: form.mainCategoryId,
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

  return (
    <section className="page-shell py-14 md:py-20">
      <div className="grid gap-12 lg:grid-cols-[.7fr_1.3fr]">
        <div>
          <p className="label-caps text-gold-dark">Become a provider</p>
          <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight md:text-5xl">
            List your business when you are ready.
          </h1>
          <p className="mt-5 leading-7 text-ink-soft">
            Selling goods is the main path. Technicians can still list a trade. Choose a category, complete the form, and submit for review.
          </p>
          <div className="mt-8 grid gap-4 text-sm">
            {["Shop catalog with bulk and piece rates", "Direct connect with buyers", "Verified reviews from members"].map(
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
          <Field label="Business name" error={errors.businessName} required={isFieldRequired("businessName")}>
            <Input value={form.name} onChange={(event) => update("name", event.target.value)} aria-invalid={Boolean(errors.businessName)} />
          </Field>
          <Field label="Profile title" error={errors.businessTitle} required={isFieldRequired("businessTitle")}>
            <Input
              value={form.title}
              onChange={(event) => update("title", event.target.value)}
              placeholder="e.g. Bespoke Interior Studio"
              aria-invalid={Boolean(errors.businessTitle)}
            />
          </Field>
          <Field label="Business email" error={errors.businessEmail} required={isFieldRequired("businessEmail")}>
            <Input type="email" value={form.email} onChange={(event) => update("email", event.target.value)} aria-invalid={Boolean(errors.businessEmail)} />
          </Field>
          <Field label="Phone" error={errors.businessPhone}>
            <FlagPhoneInput value={form.phone} onChange={(value) => update("phone", value)} error={Boolean(errors.businessPhone)} />
          </Field>
          <ImagePreviewUpload
            label="Profile image"
            value={logoUrl}
            uploading={upload.isPending && upload.variables?.kind === "logo"}
            onSelect={(file) => upload.mutate({ file, kind: "logo" })}
          />
          <ImagePreviewUpload
            label="Banner image"
            value={coverUrl}
            aspect="banner"
            className="md:col-span-1"
            uploading={upload.isPending && upload.variables?.kind === "cover"}
            onSelect={(file) => upload.mutate({ file, kind: "cover" })}
          />
          <div className="md:col-span-2">
            <Field label="I am" error={errors.intent} required={isFieldRequired("intent")}>
            <Select
              value={intent}
              onChange={(event) => {
                const next = event.target.value as MarketplaceKind | "";
                setIntent(next);
                setForm((current) => ({ ...current, mainCategoryId: "" }));
                setErrors((current) => ({ ...current, intent: undefined, categoryId: undefined }));
              }}
              aria-invalid={Boolean(errors.intent)}
            >
              <option value="">Select what you offer</option>
              <option value="supplier">Selling goods (shop / wholesale)</option>
              <option value="service">Offering a trade (technician)</option>
            </Select>
            </Field>
          </div>
          <Field label="Category" error={errors.categoryId} required={isFieldRequired("categoryId")}>
            <Select
              value={form.mainCategoryId}
              onChange={(event) => update("mainCategoryId", event.target.value)}
              disabled={!intent}
              aria-invalid={Boolean(errors.categoryId)}
            >
              <option value="">{intent ? "Select main category" : "Choose selling vs trade first"}</option>
              {visibleMains.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Website" error={errors.website}>
            <Input
              type="url"
              value={form.website}
              onChange={(event) => update("website", event.target.value)}
              placeholder="https://"
              aria-invalid={Boolean(errors.website)}
            />
          </Field>
          {form.mainCategoryId && providerForm.isLoading ? (
            <p className="text-sm text-ink-soft md:col-span-2">Loading category fields…</p>
          ) : null}
          {providerForm.isError ? (
            <p className="text-sm text-red-700 md:col-span-2">Could not load category fields.</p>
          ) : null}
          {providerForm.data?.fields?.length ? (
            <div className="rounded-2xl border border-line bg-surface-low/60 p-4 md:col-span-2 md:p-5">
              <p className="text-sm font-semibold">Category details</p>
              <p className="mt-1 text-xs font-normal text-ink-soft">
                Extra fields for this category, including license number when it applies.
              </p>
              <div className="mt-4">
                <DynamicForm
                  fields={providerForm.data.fields}
                  values={fieldValues}
                  onChange={setFieldValues}
                />
              </div>
            </div>
          ) : null}
          <div className="md:col-span-2">
            <Field label="Description" error={errors.description} required={isFieldRequired("description")}>
              <Textarea
                value={form.description}
                onChange={(event) => update("description", event.target.value)}
                rows={5}
                placeholder="Describe your expertise in at least 20 characters."
                aria-invalid={Boolean(errors.description)}
              />
            </Field>
          </div>
          <Field label="Street address" error={errors.address} required={isFieldRequired("address")}>
            <Input value={form.address} onChange={(event) => update("address", event.target.value)} aria-invalid={Boolean(errors.address)} />
          </Field>
          <Field label="City" error={errors.city} required={isFieldRequired("city")}>
            <Input value={form.city} onChange={(event) => update("city", event.target.value)} aria-invalid={Boolean(errors.city)} />
          </Field>
          <Field label="Opens" error={errors.openTime} required={isFieldRequired("openTime")}>
            <Input type="time" value={form.openTime} onChange={(event) => update("openTime", event.target.value)} aria-invalid={Boolean(errors.openTime)} />
          </Field>
          <Field label="Closes" error={errors.closeTime} required={isFieldRequired("closeTime")}>
            <Input type="time" value={form.closeTime} onChange={(event) => update("closeTime", event.target.value)} aria-invalid={Boolean(errors.closeTime)} />
          </Field>
          <Field label="Instagram" error={errors.instagram}>
            <Input
              type="url"
              value={form.instagram}
              onChange={(event) => update("instagram", event.target.value)}
              placeholder="https://instagram.com/..."
              aria-invalid={Boolean(errors.instagram)}
            />
          </Field>
          <Field label="Facebook" error={errors.facebook}>
            <Input
              type="url"
              value={form.facebook}
              onChange={(event) => update("facebook", event.target.value)}
              placeholder="https://facebook.com/..."
              aria-invalid={Boolean(errors.facebook)}
            />
          </Field>
          <Field label="Latitude (optional)" error={errors.lat}>
            <Input type="number" step="any" value={form.lat} onChange={(event) => update("lat", event.target.value)} aria-invalid={Boolean(errors.lat)} />
          </Field>
          <Field label="Longitude (optional)" error={errors.lng}>
            <Input type="number" step="any" value={form.lng} onChange={(event) => update("lng", event.target.value)} aria-invalid={Boolean(errors.lng)} />
          </Field>

          {create.isError ? <p className="text-sm text-red-700 md:col-span-2">{create.error.message}</p> : null}
          <Button
            type="submit"
            className="mt-2 md:col-span-2"
            disabled={create.isPending || categories.isLoading || (Boolean(form.mainCategoryId) && providerForm.isLoading)}
          >
            {create.isPending ? "Submitting…" : "Submit business"}
          </Button>
        </form>
      </div>
    </section>
  );
}
