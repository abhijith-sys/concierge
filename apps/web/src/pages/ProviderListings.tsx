import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { ApprovalBanner } from "../components/ApprovalBanner";
import {
  DynamicForm,
  toFieldValuePayload,
  valuesFromFieldValues,
  type FieldValueMap,
} from "../components/CategoryFieldsEditor";
import { EmptyList } from "../components/EmptyList";
import { ProviderListingsTable } from "../components/ProviderListingsTable";
import { Button, Field, Input, PageState, Select, Textarea } from "../components/ui";
import { useAuth } from "../context/useAuth";
import { ApiError, api, type Business, type Service } from "../lib/api";
import { assignedCategoryId, flattenDescendants, locateInTree } from "../lib/category-tree";
import { listingKind as marketplaceKindOf } from "../lib/listing-kind";
import { isProvider } from "../lib/provider";
import { businessStatus, canAddItems, StatusBadge } from "../lib/status";
import { theme } from "../lib/theme";
import { firstFormError, isFieldRequired, validateForm, type FieldKey } from "../lib/validation";

const PRICING_TYPES = [
  { value: "fixed", label: "Fixed price" },
  { value: "starting_from", label: "Starting from" },
  { value: "hourly", label: "Hourly" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "contact", label: "Contact for price" },
  { value: "custom", label: "Custom" },
];

export function ProviderListings({ mode }: { mode?: "create" | "edit" }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { serviceId } = useParams();
  const [params, setParams] = useSearchParams();
  const queryClient = useQueryClient();
  const creating = mode === "create" || location.pathname.endsWith("/create");
  const editing = mode === "edit" || Boolean(serviceId);
  const formMode = creating || editing;

  const mine = useQuery({
    queryKey: ["businesses", "mine"],
    queryFn: api.myBusinesses,
    enabled: Boolean(user),
  });
  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: api.categories,
    enabled: formMode,
  });

  const businesses = mine.data ?? [];
  const selectedId = params.get("business") || businesses[0]?.id || "";
  const selected = businesses.find((business) => business.id === selectedId) ?? businesses[0];

  const services = useQuery({
    queryKey: ["services", selected?.id],
    queryFn: () => api.services(selected!.id),
    enabled: Boolean(selected?.id),
  });

  const editingService = editing
    ? services.data?.find((service) => service.id === serviceId)
    : undefined;

  const [mainId, setMainId] = useState("");
  const [subId, setSubId] = useState("");
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "100",
    pricingType: "fixed",
  });
  const [fieldValues, setFieldValues] = useState<FieldValueMap>({});
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const seededFor = useRef("");

  const listingCategoryId = assignedCategoryId(mainId, subId, categories.data ?? []);
  const shopKind = marketplaceKindOf(selected?.listing);
  const selectedMain = (categories.data ?? []).find((category) => category.id === mainId);
  const subcategoryOptions = selectedMain
    ? flattenDescendants(selectedMain).filter((entry) => entry.category.kind === shopKind)
    : [];
  const listingForm = useQuery({
    queryKey: ["category-form", listingCategoryId, "listing"],
    queryFn: () => api.categoryForm(listingCategoryId, "listing"),
    enabled: Boolean(listingCategoryId) && formMode,
  });

  useEffect(() => {
    if (!categories.data?.length) return;
    if (editing && !editingService) return;
    const seedKey = editing ? `edit:${editingService?.id}` : `create:${selected?.id}`;
    if (seededFor.current === seedKey) return;
    seededFor.current = seedKey;
    const defaultId = editing
      ? editingService?.categoryId ?? selected?.listing?.category?.id
      : selected?.listing?.category?.id;
    const located = locateInTree(categories.data, defaultId);
    setMainId(located.main?.id ?? "");
    setSubId(located.sub?.id ?? "");
  }, [categories.data, editing, editingService, selected?.id, selected?.listing?.category?.id]);

  useEffect(() => {
    if (!editingService) return;
    setForm({
      name: editingService.name,
      description: editingService.description,
      price: String(editingService.price),
      pricingType: editingService.pricingType || "fixed",
    });
  }, [editingService]);

  useEffect(() => {
    if (!listingForm.data?.fields) {
      setFieldValues({});
      return;
    }
    setFieldValues(valuesFromFieldValues(listingForm.data.fields, editingService?.fieldValues));
  }, [listingForm.data, editingService?.fieldValues]);

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        description: form.description,
        price: Number(form.price),
        currency: "USD",
        pricingType: form.pricingType,
        categoryId: listingCategoryId || undefined,
        fieldValues: listingForm.data?.fields?.length
          ? toFieldValuePayload(listingForm.data.fields, fieldValues)
          : undefined,
      };
      if (editing && editingService) {
        return api.updateService(editingService.id, payload);
      }
      return api.createService({
        ...payload,
        businessId: selected!.id,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["services", selected?.id] });
      await queryClient.invalidateQueries({ queryKey: ["businesses", "mine"] });
      toast.success(editing ? "Listing saved." : "Listing submitted for review.");
      navigate(selected ? `/provider/listings?business=${selected.id}` : "/provider");
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Unable to save this listing.");
    },
  });

  if (isLoading || (Boolean(user) && mine.isLoading && !mine.data)) {
    return <PageState title="Loading" loading />;
  }
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (!isProvider(user) && !businesses.length) {
    return <Navigate to="/provider" replace />;
  }
  if (!formMode) {
    if (!selected) return <Navigate to="/provider" replace />;
    return (
      <BusinessItemsPage
        business={selected}
        services={services.data}
        isLoading={services.isLoading}
        onChanged={() => {
          void queryClient.invalidateQueries({ queryKey: ["services", selected.id] });
          void queryClient.invalidateQueries({ queryKey: ["businesses", "mine"] });
        }}
      />
    );
  }
  if (editing && services.isSuccess && !editingService) {
    return <PageState title="Listing not found" description="This listing is not on the selected business." />;
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!selected) return;
    const extra: FieldKey[] = subcategoryOptions.length ? ["subcategoryId"] : [];
    const nextErrors = validateForm(
      "listing",
      {
        categoryId: mainId,
        subcategoryId: subId,
        listingName: form.name,
        price: form.price,
        pricingType: form.pricingType,
        listingDescription: form.description,
      },
      extra,
    );
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      toast.error(firstFormError(nextErrors) ?? "Please fix the highlighted fields.");
      return;
    }
    save.mutate();
  }

  return (
    <section className="page-shell py-14 md:py-20">
      <Link
        to={selected ? `/provider/listings?business=${selected.id}` : "/provider"}
        className="inline-flex items-center gap-2 text-sm font-semibold text-ink-soft hover:text-navy"
      >
        <ArrowLeft className="size-4" /> Back to items
      </Link>
      <p className="label-caps mt-5 text-gold-dark">{shopKind === "supplier" ? "Seller" : "Provider"}</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">{editing ? "Edit item" : "Add item"}</h1>
      <p className="mt-3 max-w-xl text-sm leading-6 text-ink-soft">
        Fill in the item details, then submit for review.
      </p>

      {selected?.status === "pending" ? (
        <ApprovalBanner tone="pending" title={`${selected.name} is waiting for review`}>
          You can add items now. They stay in verification until {theme.name} approves them.
        </ApprovalBanner>
      ) : null}
      {selected?.status === "suspended" ? (
        <ApprovalBanner tone="suspended" title={`${selected.name} is disabled by admin`}>
          New items cannot be added while this shop is disabled.
        </ApprovalBanner>
      ) : null}
      {selected?.status === "rejected" ? (
        <ApprovalBanner tone="rejected" title={`${selected.name} was not approved`}>
          {selected.rejectionReason || "Update the profile, then wait for another review."}
        </ApprovalBanner>
      ) : null}

      {mine.isLoading ? <PageState title="Loading businesses" loading /> : null}
      {!businesses.length && !mine.isLoading ? (
        <EmptyList
          title="Create a business profile first"
          description="You need a provider profile before adding listings."
          action={
            <Link to="/list-business">
              <Button>Add new business</Button>
            </Link>
          }
        />
      ) : creating && selected && !canAddItems(selected) ? (
        <PageState
          title={selected.status === "suspended" ? "Disabled by admin" : "Cannot add items"}
          description={
            selected.status === "suspended"
              ? "This shop is disabled by admin, so new items cannot be added."
              : "This business cannot accept new listings right now."
          }
          action={
            <Link to={`/provider/listings?business=${selected.id}`}>
              <Button>Back to items</Button>
            </Link>
          }
        />
      ) : (
        <>
          {businesses.length > 1 && creating ? (
            <div className="mt-8 max-w-md">
              <Field label="Business">
                <Select
                  value={selected?.id ?? ""}
                  onChange={(event) => {
                    const next = new URLSearchParams(params);
                    next.set("business", event.target.value);
                    setParams(next, { replace: true });
                  }}
                >
                  {businesses.map((business) => (
                    <option key={business.id} value={business.id}>
                      {business.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          ) : null}

          <form
            onSubmit={submit}
            className="mt-10 grid gap-5 rounded-3xl border border-line bg-white p-6 md:grid-cols-2 md:p-9"
          >
            <Field label="Category" error={errors.categoryId} required={isFieldRequired("categoryId")}>
              <Select
                value={mainId}
                onChange={(event) => {
                  setMainId(event.target.value);
                  setSubId("");
                  setErrors((current) => ({ ...current, categoryId: undefined, subcategoryId: undefined }));
                }}
                aria-invalid={Boolean(errors.categoryId)}
              >
                <option value="">Select category</option>
                {categories.data
                  ?.filter(
                    (category) =>
                      flattenDescendants(category).some((entry) => entry.category.kind === shopKind) ||
                      category.kind === shopKind,
                  )
                  .map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
              </Select>
            </Field>
            {subcategoryOptions.length ? (
              <Field label="Subcategory" error={errors.subcategoryId} required={isFieldRequired("subcategoryId")}>
                <Select
                  value={subId}
                  onChange={(event) => {
                    setSubId(event.target.value);
                    setErrors((current) => ({ ...current, subcategoryId: undefined }));
                  }}
                  aria-invalid={Boolean(errors.subcategoryId)}
                >
                  <option value="">Select subcategory</option>
                  {subcategoryOptions.map(({ category, label }) => (
                    <option key={category.id} value={category.id}>
                      {label}
                    </option>
                  ))}
                </Select>
              </Field>
            ) : null}
            <Field label="Listing name" error={errors.listingName} required={isFieldRequired("listingName")}>
              <Input
                value={form.name}
                onChange={(event) => {
                  setForm((current) => ({ ...current, name: event.target.value }));
                  setErrors((current) => ({ ...current, listingName: undefined }));
                }}
                aria-invalid={Boolean(errors.listingName)}
              />
            </Field>
            <Field label="Starting price" error={errors.price} required={isFieldRequired("price")}>
              <Input
                type="number"
                min="0"
                value={form.price}
                onChange={(event) => {
                  setForm((current) => ({ ...current, price: event.target.value }));
                  setErrors((current) => ({ ...current, price: undefined }));
                }}
                aria-invalid={Boolean(errors.price)}
              />
            </Field>
            <Field label="Pricing type" error={errors.pricingType} required={isFieldRequired("pricingType")}>
              <Select
                value={form.pricingType}
                onChange={(event) => setForm((current) => ({ ...current, pricingType: event.target.value }))}
                aria-invalid={Boolean(errors.pricingType)}
              >
                {PRICING_TYPES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="md:col-span-2">
              <Field label="Description" error={errors.listingDescription} required={isFieldRequired("listingDescription")}>
                <Textarea
                  rows={5}
                  value={form.description}
                  onChange={(event) => {
                    setForm((current) => ({ ...current, description: event.target.value }));
                    setErrors((current) => ({ ...current, listingDescription: undefined }));
                  }}
                  aria-invalid={Boolean(errors.listingDescription)}
                />
              </Field>
            </div>
            {listingCategoryId && listingForm.isLoading ? (
              <p className="text-sm text-ink-soft md:col-span-2">Loading listing fields…</p>
            ) : null}
            {listingForm.isError ? (
              <p className="text-sm text-red-700 md:col-span-2">Could not load listing fields.</p>
            ) : null}
            {listingForm.data?.fields?.length ? (
              <DynamicForm fields={listingForm.data.fields} values={fieldValues} onChange={setFieldValues} />
            ) : null}
            {save.isError ? <p className="text-sm text-red-700 md:col-span-2">{save.error.message}</p> : null}
            {creating ? (
              <p className="text-sm text-ink-soft md:col-span-2">
                New listings are submitted for review before they appear on your public profile.
              </p>
            ) : null}
            <div className="flex flex-wrap gap-3 md:col-span-2">
              <Button type="submit" disabled={save.isPending || !selected || !listingCategoryId}>
                {save.isPending ? "Saving…" : editing ? "Save changes" : "Submit listing"}
              </Button>
              <Link to={selected ? `/provider/listings?business=${selected.id}` : "/provider"}>
                <Button type="button" variant="outline">
                  Back to items
                </Button>
              </Link>
            </div>
          </form>
        </>
      )}
    </section>
  );
}

function BusinessItemsPage({
  business,
  services,
  isLoading,
  onChanged,
}: {
  business: Business;
  services?: Service[];
  isLoading: boolean;
  onChanged: () => void;
}) {
  const status = businessStatus(business);
  const canAdd = canAddItems(business);

  return (
    <section className="page-shell py-14 md:py-20">
      <Link to="/provider" className="inline-flex items-center gap-2 text-sm font-semibold text-ink-soft hover:text-navy">
        <ArrowLeft className="size-4" /> Back to businesses
      </Link>
      <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label-caps text-gold-dark">Items</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight">{business.name}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-ink-soft">
            <StatusBadge label={status.label} tone={status.tone} />
            <span>{business.listing?.category?.name ?? "No category"}</span>
          </div>
        </div>
        {canAdd ? (
          <Link to={`/provider/listings/create?business=${business.id}`}>
            <Button>
              <Plus className="size-4" /> Add item
            </Button>
          </Link>
        ) : null}
      </div>

      {business.status === "pending" ? (
        <ApprovalBanner tone="pending" title={`${business.name} is waiting for review`}>
          You can add items now. They stay in verification until {theme.name} approves them.
        </ApprovalBanner>
      ) : null}
      {business.status === "suspended" ? (
        <ApprovalBanner tone="suspended" title={`${business.name} is disabled by admin`}>
          This shop is hidden until {theme.name} restores it.
        </ApprovalBanner>
      ) : null}
      {business.status === "rejected" ? (
        <ApprovalBanner tone="rejected" title={`${business.name} was not approved`}>
          {business.rejectionReason || "Update the profile, then wait for another review."}
        </ApprovalBanner>
      ) : null}

      <div className="mt-8">
        <ProviderListingsTable
          business={business}
          services={services}
          isLoading={isLoading}
          onChanged={onChanged}
        />
      </div>
    </section>
  );
}
