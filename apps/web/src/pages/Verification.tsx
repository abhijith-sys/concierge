import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { EmptyList } from "../components/EmptyList";
import { Button, PageState, Select } from "../components/ui";
import { useAuth } from "../context/useAuth";
import { api, type AttachmentPurpose } from "../lib/api";
import { theme } from "../lib/theme";

type PhotoKey =
  | "ownerPhotoUrl"
  | "locationPhotoUrl"
  | "storefrontPhotoUrl"
  | "documentUrl"
  | "selfieUrl";

const fields: Array<{ key: PhotoKey; label: string; purpose: AttachmentPurpose }> = [
  { key: "ownerPhotoUrl", label: "Owner photo", purpose: "kyc_owner" },
  { key: "locationPhotoUrl", label: "Location photo", purpose: "kyc_location" },
  { key: "storefrontPhotoUrl", label: "Storefront photo", purpose: "kyc_storefront" },
  { key: "documentUrl", label: "Identity document", purpose: "kyc_document" },
  { key: "selfieUrl", label: "Selfie", purpose: "kyc_selfie" },
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
  const attachments = useQuery({
    queryKey: ["verification-attachments", draft.data?.id],
    queryFn: () => api.entityAttachments("verification", draft.data!.id),
    enabled: Boolean(draft.data?.id),
  });

  const ensureDraft = useMutation({
    mutationFn: () => api.saveVerificationDraft({ businessId: selectedId }),
    onSuccess: async (submission) => {
      await queryClient.setQueryData(["verification", selectedId], submission);
    },
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
    mutationFn: async ({ key, purpose, file }: { key: PhotoKey; purpose: AttachmentPurpose; file: File }) => {
      let submission = draft.data;
      if (!submission?.id) {
        submission = await ensureDraft.mutateAsync();
      }
      const stored = await api.upload(file, {
        visibility: "private",
        entityType: "verification",
        entityId: submission.id,
        purpose,
      });
      await save.mutateAsync({ [key]: stored.url });
      await queryClient.invalidateQueries({ queryKey: ["verification-attachments", submission.id] });
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

  const attachedPurposes = new Set(attachments.data?.map((row) => row.purpose) ?? []);

  return (
    <section className="page-shell py-14 md:py-20">
      <p className="label-caps text-gold-dark">Trust & safety</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">Identity verification</h1>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-ink-soft">
        Upload owner, location, storefront, document, and selfie photos. Files are stored as private
        assets attached to your verification submission — only you and {theme.name} admins can access them.
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
        <EmptyList
          title="Create a business first"
          description="Verification attaches to a business profile."
          action={<Link to="/list-business"><Button>List business</Button></Link>}
        />
      ) : (
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {fields.map((field) => {
            const hasUrl = Boolean(draft.data?.[field.key]);
            const hasAttachment = attachedPurposes.has(field.purpose);
            const ready = hasUrl || hasAttachment;
            return (
              <label key={field.key} className="rounded-3xl border border-line p-5">
                <span className="text-sm font-semibold">{field.label}</span>
                <p className="mt-1 text-xs text-ink-soft">
                  {ready ? "Uploaded as private asset" : "Required"}
                </p>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  className="mt-3 block w-full text-sm"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) upload.mutate({ key: field.key, purpose: field.purpose, file });
                  }}
                />
              </label>
            );
          })}
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
            {upload.isError ? <p className="text-sm text-red-700">{upload.error.message}</p> : null}
            {submit.isError ? <p className="text-sm text-red-700">{submit.error.message}</p> : null}
          </div>
        </div>
      )}
    </section>
  );
}
