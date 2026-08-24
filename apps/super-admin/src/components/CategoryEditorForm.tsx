import type { FormEvent } from "react";
import { ImageUploadField } from "./ImageUploadField";

export type CategoryDraft = {
  name: string;
  slug: string;
  description: string;
  icon: string;
  sortOrder: string;
  imageUrl: string;
  bannerUrl: string;
  kind: "supplier" | "service";
};

export function emptyCategoryDraft(sortOrder = "1", kind: "supplier" | "service" = "supplier"): CategoryDraft {
  return {
    name: "",
    slug: "",
    description: "",
    icon: "",
    sortOrder,
    imageUrl: "",
    bannerUrl: "",
    kind,
  };
}

export function draftFromCategory(category: {
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  sortOrder?: number;
  imageUrl?: string | null;
  bannerUrl?: string | null;
  kind?: "supplier" | "service" | null;
}): CategoryDraft {
  return {
    name: category.name,
    slug: category.slug,
    description: category.description ?? "",
    icon: category.icon ?? "",
    sortOrder: String(category.sortOrder ?? 0),
    imageUrl: category.imageUrl ?? "",
    bannerUrl: category.bannerUrl ?? "",
    kind: category.kind === "service" ? "service" : "supplier",
  };
}

export function CategoryEditorForm({
  title,
  submitLabel,
  draft,
  isSubcategory,
  pending,
  error,
  success,
  onChange,
  onSlugFromName,
  onSubmit,
  onCancel,
}: {
  title: string;
  submitLabel: string;
  draft: CategoryDraft;
  isSubcategory?: boolean;
  pending?: boolean;
  error?: string;
  success?: string;
  onChange: (next: CategoryDraft) => void;
  onSlugFromName?: (name: string) => void;
  onSubmit: () => void;
  onCancel?: () => void;
}) {
  const mediaMissing = !draft.imageUrl.trim() || !draft.bannerUrl.trim();
  const blocked = !draft.name.trim() || !draft.description.trim() || mediaMissing || pending;

  function submit(event: FormEvent) {
    event.preventDefault();
    if (blocked) return;
    onSubmit();
  }

  return (
    <form className="panel stack" onSubmit={submit}>
      <strong>{title}</strong>
      <p className="muted" style={{ margin: 0 }}>
        {isSubcategory
          ? "Subcategories need a description, a card image, and a listings banner. These show on the public site."
          : "Main categories appear on the home screen. Background is the card image; banner is the listings page hero."}
      </p>
      <div className="row">
        <label className="stack" style={{ flex: 1, minWidth: "12rem" }}>
          <span className="field-label">Name *</span>
          <input
            className="input"
            value={draft.name}
            onChange={(event) => {
              const name = event.target.value;
              if (onSlugFromName) onSlugFromName(name);
              else onChange({ ...draft, name });
            }}
            required
          />
        </label>
        <label className="stack" style={{ flex: 1, minWidth: "12rem" }}>
          <span className="field-label">Slug</span>
          <input
            className="input"
            value={draft.slug}
            onChange={(event) => onChange({ ...draft, slug: event.target.value })}
          />
        </label>
        <label className="stack" style={{ minWidth: "8rem" }}>
          <span className="field-label">Icon</span>
          <input
            className="input"
            placeholder="home_repair_service"
            value={draft.icon}
            onChange={(event) => onChange({ ...draft, icon: event.target.value })}
          />
        </label>
        <label className="stack" style={{ minWidth: "7rem" }}>
          <span className="field-label">Order</span>
          <input
            className="input"
            type="number"
            min={0}
            value={draft.sortOrder}
            onChange={(event) => onChange({ ...draft, sortOrder: event.target.value })}
          />
        </label>
        <label className="stack" style={{ minWidth: "11rem" }}>
          <span className="field-label">Kind</span>
          <select
            className="select"
            value={draft.kind}
            onChange={(event) =>
              onChange({ ...draft, kind: event.target.value === "service" ? "service" : "supplier" })
            }
          >
            <option value="supplier">Supplier / shop</option>
            <option value="service">Service professional</option>
          </select>
        </label>
      </div>
      <label className="stack">
        <span className="field-label">Description *</span>
        <textarea
          className="textarea"
          value={draft.description}
          onChange={(event) => onChange({ ...draft, description: event.target.value })}
          required
          placeholder={
            isSubcategory
              ? "Shown on the subcategory listings page"
              : "Shown on home cards and the category listings page"
          }
        />
      </label>
      <div className="grid-2">
        <ImageUploadField
          label={isSubcategory ? "Card image" : "Background image"}
          hint={
            isSubcategory
              ? "Used on subcategory chips and cards."
              : "Used on the home industry cards and hero tiles."
          }
          value={draft.imageUrl}
          required
          onChange={(imageUrl) => onChange({ ...draft, imageUrl })}
        />
        <ImageUploadField
          label="Banner image"
          hint="Used as the hero at the top of the listings page."
          value={draft.bannerUrl}
          required
          onChange={(bannerUrl) => onChange({ ...draft, bannerUrl })}
        />
      </div>
      <div className="row">
        <button className="btn primary" type="submit" disabled={blocked}>
          {submitLabel}
        </button>
        {onCancel ? (
          <button className="btn" type="button" onClick={onCancel}>
            Cancel
          </button>
        ) : null}
        {error ? <span className="error">{error}</span> : null}
        {success ? <span className="ok">{success}</span> : null}
      </div>
    </form>
  );
}

export function payloadFromDraft(draft: CategoryDraft, extra?: Record<string, unknown>) {
  return {
    name: draft.name.trim(),
    slug: draft.slug.trim() || undefined,
    description: draft.description.trim(),
    icon: draft.icon.trim() || null,
    imageUrl: draft.imageUrl.trim(),
    bannerUrl: draft.bannerUrl.trim(),
    sortOrder: Number(draft.sortOrder) || 0,
    kind: draft.kind,
    ...extra,
  };
}
