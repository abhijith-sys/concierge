import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ApprovalBanner } from "../components/ApprovalBanner";
import {
  DynamicForm,
  toFieldValuePayload,
  valuesFromFieldValues,
  type FieldValueMap,
} from "../components/CategoryFieldsEditor";
import { Button, Field, Input, PageState, Select, Textarea } from "../components/ui";
import { useAuth } from "../context/useAuth";
import { api, type Business, type Service } from "../lib/api";
import { assignedCategoryId, flattenDescendants, locateInTree } from "../lib/category-tree";
import { isProvider } from "../lib/provider";

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

function approvalLabel(service: Service) {
  if (service.approvalStatus === "pending") return "pending review";
  if (service.approvalStatus === "rejected") return "rejected";
  if (service.approvalStatus === "draft") return "draft";
  return service.isActive ? "published" : "unpublished";
}

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
  const seededFor = useRef("");

  const listingCategoryId = assignedCategoryId(mainId, subId, categories.data ?? []);
  const selectedMain = (categories.data ?? []).find((category) => category.id === mainId);
  const subcategoryOptions = selectedMain ? flattenDescendants(selectedMain) : [];
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
      navigate(selected ? `/provider/listings?business=${selected.id}` : "/provider/listings");
    },
  });
  const unpublish = useMutation({
    mutationFn: api.deleteService,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["services", selected?.id] });
    },
  });
  const publish = useMutation({
    mutationFn: (id: string) => api.updateService(id, { isActive: true }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["services", selected?.id] });
    },
  });

  const grouped = useMemo(() => {
    const map = new Map<string, { business: Business; services: Service[] }>();
    if (selected && services.data) {
      map.set(selected.id, { business: selected, services: services.data });
    }
    return [...map.values()];
  }, [selected, services.data]);

  if (isLoading) return <PageState title="Loading" loading />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (!isProvider(user) && !businesses.length && !mine.isLoading) {
    return <Navigate to="/list-business" replace />;
  }
  if (editing && services.isSuccess && !editingService) {
    return <PageState title="Listing not found" description="This listing is not on the selected business." />;
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!selected) return;
    save.mutate();
  }

  return (
    <section className="page-shell py-14 md:py-20">
      <p className="label-caps text-gold-dark">Provider</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">
        {editing ? "Edit listing" : creating ? "Create listing" : "My listings"}
      </h1>
      <p className="mt-3 max-w-xl text-sm leading-6 text-ink-soft">
        Listings are what you offer. Your business profile is who you are.
      </p>

      {selected?.status === "pending" ? (
        <ApprovalBanner tone="pending" title={`${selected.name} is waiting for review`}>
          You can prepare listings after this profile is approved.
        </ApprovalBanner>
      ) : null}
      {selected?.status === "rejected" ? (
        <ApprovalBanner tone="rejected" title={`${selected.name} was not approved`}>
          {selected.rejectionReason || "Update the profile, then wait for another review."}
        </ApprovalBanner>
      ) : null}
      {!formMode && services.data?.some((service) => service.approvalStatus === "pending") ? (
        <ApprovalBanner tone="pending" title="Some listings are waiting for review">
          They stay hidden on your public profile until Concierge approves them.
        </ApprovalBanner>
      ) : null}
      {!formMode && services.data?.some((service) => service.approvalStatus === "rejected") ? (
        <ApprovalBanner tone="rejected" title="A listing was not approved">
          Open the listing to see the reason, update it, and wait for another review.
        </ApprovalBanner>
      ) : null}

      {mine.isLoading ? <PageState title="Loading businesses" loading /> : null}
      {!businesses.length && !mine.isLoading ? (
        <PageState
          title="Create a business profile first"
          description="You need a provider profile before adding listings."
          action={
            <Link to="/list-business">
              <Button>Become a provider</Button>
            </Link>
          }
        />
      ) : (
        <>
          {businesses.length > 1 ? (
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

          {!formMode ? (
            <div className="mt-8 flex flex-wrap gap-3">
              {selected?.status === "active" ? (
                <Link to={`/provider/listings/create?business=${selected.id}`}>
                  <Button>Create listing</Button>
                </Link>
              ) : null}
              <Link to="/provider">
                <Button variant="outline">Dashboard</Button>
              </Link>
            </div>
          ) : null}

          {formMode && creating && selected && selected.status !== "active" ? (
            <PageState
              title="Profile must be approved first"
              description="Listings can be created after Concierge activates this business profile."
              action={
                <Link to="/provider">
                  <Button>Back to dashboard</Button>
                </Link>
              }
            />
          ) : formMode ? (
            <form
              onSubmit={submit}
              className="mt-10 grid gap-5 rounded-3xl border border-line bg-white p-6 md:grid-cols-2 md:p-9"
            >
              <Field label="Category">
                <Select
                  value={mainId}
                  onChange={(event) => {
                    setMainId(event.target.value);
                    setSubId("");
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
              {subcategoryOptions.length ? (
                <Field label="Subcategory">
                  <Select value={subId} onChange={(event) => setSubId(event.target.value)} required>
                    <option value="">Select subcategory</option>
                    {subcategoryOptions.map(({ category, label }) => (
                      <option key={category.id} value={category.id}>
                        {label}
                      </option>
                    ))}
                  </Select>
                </Field>
              ) : null}
              <Field label="Listing name">
                <Input
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  required
                />
              </Field>
              <Field label="Starting price">
                <Input
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
                  required
                />
              </Field>
              <Field label="Pricing type">
                <Select
                  value={form.pricingType}
                  onChange={(event) => setForm((current) => ({ ...current, pricingType: event.target.value }))}
                >
                  {PRICING_TYPES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <div className="md:col-span-2">
                <Field label="Description">
                  <Textarea
                    rows={5}
                    minLength={10}
                    value={form.description}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, description: event.target.value }))
                    }
                    required
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
                <DynamicForm
                  fields={listingForm.data.fields}
                  values={fieldValues}
                  onChange={setFieldValues}
                />
              ) : null}
              {save.isError ? (
                <p className="text-sm text-red-700 md:col-span-2">{save.error.message}</p>
              ) : null}
              {creating ? (
                <p className="text-sm text-ink-soft md:col-span-2">
                  New listings are submitted for review before they appear on your public profile.
                </p>
              ) : null}
              <div className="flex flex-wrap gap-3 md:col-span-2">
                <Button type="submit" disabled={save.isPending || !selected || !listingCategoryId}>
                  {save.isPending ? "Saving…" : editing ? "Save changes" : "Submit listing"}
                </Button>
                <Link to="/provider/listings">
                  <Button type="button" variant="outline">
                    Back to listings
                  </Button>
                </Link>
              </div>
            </form>
          ) : (
            <ul className="mt-10 grid gap-3">
              {grouped.flatMap(({ business, services: rows }) =>
                rows.length
                  ? rows.map((service) => (
                      <li
                        key={service.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-surface-low px-4 py-4"
                      >
                        <div>
                          <p className="font-semibold">{service.name}</p>
                          <p className="text-sm text-ink-soft">
                            {business.name} · {service.currency} {service.price} · {approvalLabel(service)}
                          </p>
                          {service.approvalStatus === "rejected" && service.rejectionReason ? (
                            <p className="mt-1 text-xs text-red-700">{service.rejectionReason}</p>
                          ) : null}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Link to={`/provider/listings/${service.id}/edit?business=${business.id}`}>
                            <Button variant="outline">Edit</Button>
                          </Link>
                          {service.approvalStatus === "approved" && service.isActive ? (
                            <Button variant="outline" onClick={() => unpublish.mutate(service.id)}>
                              Unpublish
                            </Button>
                          ) : null}
                          {service.approvalStatus === "approved" && !service.isActive ? (
                            <Button variant="outline" onClick={() => publish.mutate(service.id)}>
                              Publish
                            </Button>
                          ) : null}
                        </div>
                      </li>
                    ))
                  : [
                      <li key={`${business.id}-empty`} className="rounded-2xl bg-surface-low px-4 py-6 text-sm text-ink-soft">
                        No listings yet for {business.name}.
                      </li>,
                    ],
              )}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
