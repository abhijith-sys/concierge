import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { Button, PageState, Select } from "../components/ui";
import { useAuth } from "../context/useAuth";
import { api } from "../lib/api";

type PhotoKey =
  | "ownerPhotoUrl"
  | "locationPhotoUrl"
  | "storefrontPhotoUrl"
  | "documentUrl"
  | "selfieUrl";

const fields: Array<{ key: PhotoKey; label: string }> = [
  { key: "ownerPhotoUrl", label: "Owner photo" },
  { key: "locationPhotoUrl", label: "Location photo" },
  { key: "storefrontPhotoUrl", label: "Storefront photo" },
  { key: "documentUrl", label: "Identity document" },
  { key: "selfieUrl", label: "Selfie" },
];

export function Verification() {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const queryClient = useQueryClient();
  const mine = useQuery({
    queryKey: ["businesses", "mine"],
    queryFn: api.myBusinesses,
    enabled: Boolean(user && (user.role === "business" || user.role === "admin")),
  });
  const [businessId, setBusinessId] = useState("");
  const selectedId = businessId || mine.data?.[0]?.id || "";
  const draft = useQuery({
    queryKey: ["verification", selectedId],
    queryFn: () => api.verification(selectedId),
    enabled: Boolean(selectedId),
  });

  const save = useMutation({
    mutationFn: (patch: Record<string, string>) =>
      api.saveVerificationDraft({ businessId: selectedId, ...draft.data, ...patch }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["verification", selectedId] });
    },
  });
  const submit = useMutation({
    mutationFn: () => api.submitVerification(selectedId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["verification", selectedId] });
    },
  });
  const upload = useMutation({
    mutationFn: async ({ key, file }: { key: PhotoKey; file: File }) => {
      const stored = await api.upload(file, "private");
      return save.mutateAsync({ [key]: stored.url });
    },
  });

  if (isLoading) return <PageState title="Loading" loading />;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (user.role === "user") {
    return (
      <PageState
        title="Business account required"
        description="Identity verification is available for business owners."
        action={<Link to="/account"><Button>Back to account</Button></Link>}
      />
    );
  }

  return (
    <section className="page-shell py-14 md:py-20">
      <p className="label-caps text-gold-dark">Trust & safety</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">Identity verification</h1>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-ink-soft">
        Upload owner, location, storefront, document, and selfie photos. Video KYC is coming soon.
        Documents stay private — only you and Concierge admins can access them.
      </p>

      <div className="mt-8 max-w-md">
        <Select value={selectedId} onChange={(e) => setBusinessId(e.target.value)}>
          <option value="">Select business</option>
          {mine.data?.map((business) => (
            <option key={business.id} value={business.id}>
              {business.name}
            </option>
          ))}
        </Select>
      </div>

      {!selectedId ? (
        <PageState
          title="Create a business first"
          description="Verification attaches to a business profile."
          action={<Link to="/list-business"><Button>List business</Button></Link>}
        />
      ) : (
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {fields.map((field) => (
            <label key={field.key} className="rounded-3xl border border-line p-5">
              <span className="text-sm font-semibold">{field.label}</span>
              <p className="mt-1 text-xs text-ink-soft">
                {draft.data?.[field.key] ? "Uploaded" : "Required"}
              </p>
              <input
                type="file"
                accept="image/*,application/pdf"
                className="mt-3 block w-full text-sm"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) upload.mutate({ key: field.key, file });
                }}
              />
            </label>
          ))}
          <div className="rounded-3xl border border-dashed border-line p-5 md:col-span-2">
            <p className="font-semibold">Video verification</p>
            <p className="mt-2 text-sm text-ink-soft">Coming soon — schema is ready for a future release.</p>
          </div>
          <div className="md:col-span-2 flex flex-wrap gap-3">
            <Button onClick={() => submit.mutate()} disabled={submit.isPending || draft.data?.status === "submitted"}>
              {submit.isPending ? "Submitting…" : "Submit for review"}
            </Button>
            {draft.data?.status ? (
              <p className="self-center text-sm capitalize text-ink-soft">Status: {draft.data.status}</p>
            ) : null}
            {submit.isError ? <p className="text-sm text-red-700">{submit.error.message}</p> : null}
          </div>
        </div>
      )}
    </section>
  );
}
