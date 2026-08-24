import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
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
import { assignedCategoryId, flattenDescendants } from "../lib/category-tree";
import { mainsForKind, type MarketplaceKind } from "../lib/listing-kind";
import { isStayCategory } from "../lib/stays";
import { isRentalCategory } from "../lib/rentals";
import { isTravelCategory } from "../lib/travel";
import { isEventsRoot } from "../lib/events";
import { isLogisticsRoot } from "../lib/logistics";
import { isEducationRoot } from "../lib/education";
import { isHealthRoot } from "../lib/health";
import { isProfessionalRoot } from "../lib/professional";
import { isHomeRoot } from "../lib/home";
import { isAutomotiveRoot } from "../lib/automotive";
import { isElectronicsRoot } from "../lib/electronics";
import { firstFormError, isFieldRequired, validateForm, type FieldKey } from "../lib/validation";

const DRAFT_KEY = "conforge-list-business-draft";

const STEPS = [
  { id: "category", label: "Category" },
  { id: "info", label: "Business info" },
  { id: "hours", label: "Hours" },
  { id: "photos", label: "Photos" },
  { id: "fields", label: "Details" },
  { id: "review", label: "Review" },
] as const;

type StepId = (typeof STEPS)[number]["id"];

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

interface ListBusinessDraft {
  step: number;
  form: BusinessForm;
  intent: MarketplaceKind | "";
  subId: string;
  fieldValues: FieldValueMap;
  coverUrl?: string;
  logoUrl?: string;
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

function loadDraft(): ListBusinessDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ListBusinessDraft;
  } catch {
    return null;
  }
}

function saveDraft(draft: ListBusinessDraft) {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

function clearDraft() {
  localStorage.removeItem(DRAFT_KEY);
}

export function ListBusiness() {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const categories = useQuery({ queryKey: ["categories"], queryFn: api.categories });

  const saved = useMemo(() => loadDraft(), []);
  const [step, setStep] = useState(saved?.step ?? 0);
  const [form, setForm] = useState<BusinessForm>(saved?.form ?? initialForm);
  const [intent, setIntent] = useState<MarketplaceKind | "">(saved?.intent ?? "");
  const [subId, setSubId] = useState(saved?.subId ?? "");
  const [fieldValues, setFieldValues] = useState<FieldValueMap>(saved?.fieldValues ?? {});
  const [coverUrl, setCoverUrl] = useState<string | undefined>(saved?.coverUrl);
  const [logoUrl, setLogoUrl] = useState<string | undefined>(saved?.logoUrl);
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});

  const visibleMains = intent ? mainsForKind(categories.data ?? [], intent) : (categories.data ?? []);
  const selectedMain = visibleMains.find((category) => category.id === form.mainCategoryId);
  const subcategoryOptions = selectedMain
    ? flattenDescendants(selectedMain).filter((entry) => !intent || entry.category.kind === intent)
    : [];
  const listingCategoryId = assignedCategoryId(form.mainCategoryId, subId, categories.data ?? []);
  const stayForm = isStayCategory(selectedMain);
  const rentalForm = isRentalCategory(selectedMain);
  const travelForm = isTravelCategory(selectedMain);
  const eventForm = isEventsRoot(selectedMain) && intent === "service";
  const logisticsForm = isLogisticsRoot(selectedMain) && intent === "service";
  const educationForm = isEducationRoot(selectedMain) && intent === "service";
  const healthForm = isHealthRoot(selectedMain) && intent === "service";
  const professionalForm = isProfessionalRoot(selectedMain) && intent === "service";
  const homeForm = isHomeRoot(selectedMain) && intent === "service";
  const automotiveForm = isAutomotiveRoot(selectedMain) && intent === "service";
  const electronicsForm = isElectronicsRoot(selectedMain) && intent === "service";
  const operatorForm =
    travelForm ||
    eventForm ||
    logisticsForm ||
    educationForm ||
    healthForm ||
    professionalForm ||
    homeForm ||
    automotiveForm ||
    electronicsForm;

  const providerForm = useQuery({
    queryKey: ["category-form", listingCategoryId || form.mainCategoryId, "provider"],
    queryFn: () => api.categoryForm(listingCategoryId || form.mainCategoryId, "provider"),
    enabled: Boolean(listingCategoryId || form.mainCategoryId),
  });

  const persistDraft = useCallback(() => {
    saveDraft({ step, form, intent, subId, fieldValues, coverUrl, logoUrl });
  }, [step, form, intent, subId, fieldValues, coverUrl, logoUrl]);

  useEffect(() => {
    persistDraft();
  }, [persistDraft]);

  const create = useMutation({
    mutationFn: api.createBusiness,
    onSuccess: (result) => {
      clearDraft();
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

  const uploadFieldAsset = useCallback(async (file: File) => {
    const stored = await api.upload(file, { visibility: "public" });
    return stored.url;
  }, []);

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
    if (saved?.fieldValues && Object.keys(saved.fieldValues).length) return;
    setFieldValues(valuesFromFieldValues(providerForm.data.fields));
  }, [providerForm.data, saved?.fieldValues]);

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

  function formValues(extra: FieldKey[] = []) {
    return validateForm(
      "business",
      {
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
        subcategoryId: subId,
      },
      extra,
    );
  }

  function validateStep(current: StepId): boolean {
    const all = formValues(subcategoryOptions.length ? ["subcategoryId"] : []);
    let nextErrors: Partial<Record<FieldKey, string>> = {};
    if (current === "category") {
      const keys: FieldKey[] = ["intent", "categoryId"];
      if (subcategoryOptions.length) keys.push("subcategoryId");
      nextErrors = Object.fromEntries(
        Object.entries(all).filter(([key]) => keys.includes(key as FieldKey)),
      ) as Partial<Record<FieldKey, string>>;
    } else if (current === "info") {
      nextErrors = Object.fromEntries(
        Object.entries(all).filter(([key]) =>
          ["businessName", "businessTitle", "businessEmail", "description", "address", "city", "website", "instagram", "facebook", "lat", "lng"].includes(key),
        ),
      ) as Partial<Record<FieldKey, string>>;
    } else if (current === "hours") {
      nextErrors = Object.fromEntries(
        Object.entries(all).filter(([key]) => ["openTime", "closeTime"].includes(key)),
      ) as Partial<Record<FieldKey, string>>;
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      toast.error(firstFormError(nextErrors) ?? "Please fix the highlighted fields.");
      return false;
    }
    return true;
  }

  function goNext() {
    const current = STEPS[step]!.id;
    if (!validateStep(current)) return;
    setStep((value) => Math.min(value + 1, STEPS.length - 1));
  }

  function goBack() {
    setStep((value) => Math.max(value - 1, 0));
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const extra: FieldKey[] = subcategoryOptions.length ? ["subcategoryId"] : [];
    const nextErrors = formValues(extra);
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
      categoryId: listingCategoryId || form.mainCategoryId,
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

  const currentStep = STEPS[step]!.id;
  const categoryName =
    subcategoryOptions.find((entry) => entry.category.id === subId)?.category.name ??
    selectedMain?.name ??
    "—";

  return (
    <section className="page-shell py-14 md:py-20">
      <div className="grid gap-12 lg:grid-cols-[.7fr_1.3fr]">
        <div>
          <p className="label-caps text-gold-dark">Become a provider</p>
          <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight md:text-5xl">
            List your business when you are ready.
          </h1>
          <p className="mt-5 leading-7 text-ink-soft">
            Work through each step — your progress is saved locally until you submit.
          </p>
          <ol className="mt-8 grid gap-2 text-sm">
            {STEPS.map((item, index) => (
              <li
                key={item.id}
                className={`flex items-center gap-3 rounded-xl px-3 py-2 ${index === step ? "bg-gold/10 font-semibold" : index < step ? "text-emerald-700" : "text-ink-soft"}`}
              >
                {index < step ? <CheckCircle2 className="size-5 shrink-0" /> : <span className="grid size-5 shrink-0 place-items-center rounded-full border border-line text-xs">{index + 1}</span>}
                {item.label}
              </li>
            ))}
          </ol>
        </div>

        <form
          onSubmit={currentStep === "review" ? submit : (event) => { event.preventDefault(); goNext(); }}
          className="grid gap-5 rounded-3xl border border-line bg-white p-6 shadow-sm md:p-9"
        >
          <div className="flex items-center justify-between gap-3 border-b border-line pb-4">
            <p className="text-sm font-semibold">
              Step {step + 1} of {STEPS.length}: {STEPS[step]!.label}
            </p>
            <button
              type="button"
              className="text-xs font-semibold text-ink-soft underline"
              onClick={() => {
                if (window.confirm("Clear saved draft and start over?")) {
                  clearDraft();
                  setStep(0);
                  setForm(initialForm);
                  setIntent("");
                  setSubId("");
                  setFieldValues({});
                  setCoverUrl(undefined);
                  setLogoUrl(undefined);
                }
              }}
            >
              Clear draft
            </button>
          </div>

          {currentStep === "category" ? (
            <>
              <Field label="I am" error={errors.intent} required={isFieldRequired("intent")}>
                <Select
                  value={intent}
                  onChange={(event) => {
                    const next = event.target.value as MarketplaceKind | "";
                    setIntent(next);
                    setSubId("");
                    setForm((current) => ({ ...current, mainCategoryId: "" }));
                    setErrors((current) => ({ ...current, intent: undefined, categoryId: undefined }));
                  }}
                >
                  <option value="">Select what you offer</option>
                  <option value="supplier">Selling goods (shop / wholesale)</option>
                  <option value="service">Offering a service (stays, trades, transport)</option>
                </Select>
              </Field>
              <Field label="Category" error={errors.categoryId} required={isFieldRequired("categoryId")}>
                <Select
                  value={form.mainCategoryId}
                  onChange={(event) => {
                    update("mainCategoryId", event.target.value);
                    setSubId("");
                  }}
                  disabled={!intent}
                >
                  <option value="">{intent ? "Select main category" : "Choose selling vs trade first"}</option>
                  {visibleMains.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </Select>
              </Field>
              {subcategoryOptions.length ? (
                <Field label="Subcategory" error={errors.subcategoryId} required>
                  <Select value={subId} onChange={(event) => { setSubId(event.target.value); setErrors((c) => ({ ...c, subcategoryId: undefined })); }}>
                    <option value="">Select subcategory</option>
                    {subcategoryOptions.map(({ category, label }) => (
                      <option key={category.id} value={category.id}>{label}</option>
                    ))}
                  </Select>
                </Field>
              ) : null}
            </>
          ) : null}

          {currentStep === "info" ? (
            <>
              <Field label="Business name" error={errors.businessName} required>
                <Input value={form.name} onChange={(e) => update("name", e.target.value)} />
              </Field>
              <Field label="Profile title" error={errors.businessTitle} required>
                <Input value={form.title} onChange={(e) => update("title", e.target.value)} />
              </Field>
              <Field label="Business email" error={errors.businessEmail} required>
                <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
              </Field>
              <Field label="Phone" error={errors.businessPhone}>
                <FlagPhoneInput value={form.phone} onChange={(value) => update("phone", value)} />
              </Field>
              <div className="md:col-span-2">
                <Field label="Description" error={errors.description} required>
                  <Textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={5} />
                </Field>
              </div>
              <Field label="Street address" error={errors.address} required>
                <Input value={form.address} onChange={(e) => update("address", e.target.value)} />
              </Field>
              <Field label="City" error={errors.city} required>
                <Input value={form.city} onChange={(e) => update("city", e.target.value)} />
              </Field>
              <Field label="Website" error={errors.website}>
                <Input type="url" value={form.website} onChange={(e) => update("website", e.target.value)} placeholder="https://" />
              </Field>
              <Field label="Instagram" error={errors.instagram}>
                <Input type="url" value={form.instagram} onChange={(e) => update("instagram", e.target.value)} />
              </Field>
              <Field label="Facebook" error={errors.facebook}>
                <Input type="url" value={form.facebook} onChange={(e) => update("facebook", e.target.value)} />
              </Field>
              <Field label="Latitude (optional)" error={errors.lat}>
                <Input type="number" step="any" value={form.lat} onChange={(e) => update("lat", e.target.value)} />
              </Field>
              <Field label="Longitude (optional)" error={errors.lng}>
                <Input type="number" step="any" value={form.lng} onChange={(e) => update("lng", e.target.value)} />
              </Field>
            </>
          ) : null}

          {currentStep === "hours" ? (
            <>
              <Field label="Opens" error={errors.openTime} required>
                <Input type="time" value={form.openTime} onChange={(e) => update("openTime", e.target.value)} />
              </Field>
              <Field label="Closes" error={errors.closeTime} required>
                <Input type="time" value={form.closeTime} onChange={(e) => update("closeTime", e.target.value)} />
              </Field>
              <p className="text-sm text-ink-soft md:col-span-2">
                Same hours apply Monday–Saturday. You can fine-tune per day after approval from your profile editor.
              </p>
            </>
          ) : null}

          {currentStep === "photos" ? (
            <>
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
                uploading={upload.isPending && upload.variables?.kind === "cover"}
                onSelect={(file) => upload.mutate({ file, kind: "cover" })}
              />
            </>
          ) : null}

          {currentStep === "fields" ? (
            <>
              {form.mainCategoryId && providerForm.isLoading ? (
                <p className="text-sm text-ink-soft">Loading category fields…</p>
              ) : null}
              {providerForm.data?.fields?.length ? (
                <div className="rounded-2xl border border-line bg-surface-low/60 p-4 md:col-span-2">
                  <p className="text-sm font-semibold">
                    {stayForm ? "Property details" : rentalForm ? "Shop details" : operatorForm ? "Operator details" : "Category details"}
                  </p>
                  <div className="mt-4">
                    <DynamicForm
                      fields={providerForm.data.fields}
                      values={fieldValues}
                      onChange={setFieldValues}
                      onUpload={uploadFieldAsset}
                    />
                  </div>
                </div>
              ) : (
                <p className="text-sm text-ink-soft">No extra fields for this category.</p>
              )}
            </>
          ) : null}

          {currentStep === "review" ? (
            <div className="grid gap-3 text-sm md:col-span-2">
              <p className="font-semibold">Review your listing</p>
              <dl className="grid gap-2 rounded-2xl border border-line bg-surface-low/60 p-4">
                <div className="flex justify-between gap-4"><dt className="text-ink-soft">Category</dt><dd className="font-medium">{categoryName}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-ink-soft">Business</dt><dd className="font-medium">{form.name}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-ink-soft">City</dt><dd className="font-medium">{form.city}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-ink-soft">Hours</dt><dd className="font-medium">{form.openTime} – {form.closeTime}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-ink-soft">Photos</dt><dd className="font-medium">{logoUrl || coverUrl ? "Added" : "None"}</dd></div>
              </dl>
            </div>
          ) : null}

          <div className="mt-2 flex flex-wrap gap-3 md:col-span-2">
            {step > 0 ? (
              <Button type="button" variant="outline" onClick={goBack}>
                <ChevronLeft className="size-4" /> Back
              </Button>
            ) : null}
            {currentStep !== "review" ? (
              <Button type="submit" disabled={categories.isLoading}>
                Continue <ChevronRight className="size-4" />
              </Button>
            ) : (
              <Button type="submit" disabled={create.isPending || (Boolean(form.mainCategoryId) && providerForm.isLoading)}>
                {create.isPending ? "Submitting…" : "Submit business"}
              </Button>
            )}
          </div>
          {create.isError ? <p className="text-sm text-red-700 md:col-span-2">{create.error.message}</p> : null}
        </form>
      </div>
    </section>
  );
}
