import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ApiError, api, hasPermission, type Category, type CategoryField } from "../lib/api";
import { findCategory, isPlatform, keyFromLabel } from "../lib/taxonomy";
import { useAuth } from "../context/auth";

const FIELD_TYPES = [
  "text",
  "textarea",
  "number",
  "boolean",
  "select",
  "multiselect",
  "date",
  "url",
  "phone",
  "email",
  "asset_ref",
  "asset_gallery",
  "json",
] as const;

type FormKind = "provider" | "listing";
type FieldDraft = {
  key: string;
  label: string;
  helpText: string;
  placeholder: string;
  fieldType: (typeof FIELD_TYPES)[number];
  required: boolean;
  isActive: boolean;
  section: string;
  optionsText: string;
  defaultValue: string;
  min: string;
  max: string;
  minLength: string;
  maxLength: string;
  conditionalFieldKey: string;
  conditionalEquals: string;
  scope: "listing" | "service" | "business";
};

const emptyDraft = (kind: FormKind): FieldDraft => ({
  key: "",
  label: "",
  helpText: "",
  placeholder: "",
  fieldType: "text",
  required: false,
  isActive: true,
  section: "",
  optionsText: "",
  defaultValue: "",
  min: "",
  max: "",
  minLength: "",
  maxLength: "",
  conditionalFieldKey: "",
  conditionalEquals: "",
  scope: kind === "listing" ? "service" : "listing",
});

function draftFromField(field: CategoryField, kind: FormKind): FieldDraft {
  const options = Array.isArray(field.options) ? field.options.map(String).join(", ") : "";
  const validation = field.validation ?? {};
  const rule = field.conditionalRules ?? {};
  return {
    key: field.key,
    label: field.label,
    helpText: field.helpText ?? "",
    placeholder: field.placeholder ?? "",
    fieldType: (FIELD_TYPES as readonly string[]).includes(field.fieldType)
      ? (field.fieldType as FieldDraft["fieldType"])
      : "text",
    required: field.required,
    isActive: field.isActive,
    section: field.section ?? "",
    optionsText: options,
    defaultValue: field.defaultValue == null ? "" : String(field.defaultValue),
    min: validation.min == null ? "" : String(validation.min),
    max: validation.max == null ? "" : String(validation.max),
    minLength: validation.minLength == null ? "" : String(validation.minLength),
    maxLength: validation.maxLength == null ? "" : String(validation.maxLength),
    conditionalFieldKey: rule.fieldKey ?? "",
    conditionalEquals: rule.equals == null ? "" : String(rule.equals),
    scope: (field.scope as FieldDraft["scope"]) || (kind === "listing" ? "service" : "listing"),
  };
}

function payloadFromDraft(draft: FieldDraft) {
  const options = draft.optionsText
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const validation: Record<string, number> = {};
  if (draft.min !== "") validation.min = Number(draft.min);
  if (draft.max !== "") validation.max = Number(draft.max);
  if (draft.minLength !== "") validation.minLength = Number(draft.minLength);
  if (draft.maxLength !== "") validation.maxLength = Number(draft.maxLength);
  let defaultValue: unknown = draft.defaultValue;
  if (draft.defaultValue === "") defaultValue = null;
  else if (draft.fieldType === "number") defaultValue = Number(draft.defaultValue);
  else if (draft.fieldType === "boolean") defaultValue = draft.defaultValue === "true";
  let conditionalEquals: unknown = draft.conditionalEquals;
  if (draft.conditionalEquals === "true") conditionalEquals = true;
  if (draft.conditionalEquals === "false") conditionalEquals = false;
  return {
    key: draft.key,
    label: draft.label,
    helpText: draft.helpText.trim() || null,
    placeholder: draft.placeholder.trim() || null,
    fieldType: draft.fieldType,
    required: draft.required,
    isActive: draft.isActive,
    section: draft.section.trim() || null,
    scope: draft.scope,
    options: options.length ? options : null,
    defaultValue,
    validation: Object.keys(validation).length ? validation : null,
    conditionalRules: draft.conditionalFieldKey
      ? { fieldKey: draft.conditionalFieldKey, equals: conditionalEquals === "" ? undefined : conditionalEquals }
      : null,
  };
}

export function FormBuilderPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const canWrite = hasPermission(user, "category_fields.write");
  const [kind, setKind] = useState<FormKind>("provider");
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [draft, setDraft] = useState<FieldDraft>(emptyDraft("provider"));

  const categories = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: api.categories,
    enabled: Boolean(id),
  });
  const category = useMemo(() => findCategory(categories.data ?? [], id), [categories.data, id]);
  const form = useQuery({
    queryKey: ["admin", "form", id, kind],
    queryFn: () => api.adminForm(id!, kind),
    enabled: Boolean(id) && canWrite,
  });

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["admin", "form", id] });
    await queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
  };

  const createField = useMutation({
    mutationFn: () => api.createField(id!, payloadFromDraft(draft)),
    onSuccess: async () => {
      setEditingId(null);
      setDraft(emptyDraft(kind));
      await invalidate();
    },
  });
  const updateField = useMutation({
    mutationFn: () => api.updateField(editingId as string, payloadFromDraft(draft)),
    onSuccess: async () => {
      setEditingId(null);
      await invalidate();
    },
  });
  const toggleField = useMutation({
    mutationFn: (input: { id: string; isActive: boolean }) => api.updateField(input.id, { isActive: input.isActive }),
    onSuccess: invalidate,
  });
  const deleteField = useMutation({
    mutationFn: api.deleteField,
    onSuccess: invalidate,
  });
  const reorder = useMutation({
    mutationFn: api.reorderFields,
    onSuccess: invalidate,
  });

  if (!id) return <Navigate to="/categories" replace />;
  if (!canWrite) return <p className="error">Missing category_fields.write permission</p>;
  if (categories.isLoading) return <p className="muted">Loading…</p>;
  if (!category) return <p className="error">Category not found</p>;

  const ownFields = ownLayer(form.data, category);
  const mutationError =
    createField.error instanceof ApiError
      ? createField.error.message
      : updateField.error instanceof ApiError
        ? updateField.error.message
        : null;

  function move(index: number, direction: -1 | 1) {
    const next = index + direction;
    if (next < 0 || next >= ownFields.length) return;
    const ids = ownFields.map((field) => field.id);
    const swap = ids[index];
    ids[index] = ids[next]!;
    ids[next] = swap!;
    reorder.mutate(ids);
  }

  return (
    <div className="stack">
      <div>
        <p className="muted" style={{ margin: 0 }}>
          <Link to="/categories">Categories</Link>
          {" / "}
          <Link to={`/categories/${category.id}`}>{category.name}</Link>
        </p>
        <h2 style={{ margin: "0.35rem 0 0" }}>Form builder</h2>
        <p className="muted">
          {isPlatform(category)
            ? "Common fields applied to every category"
            : category.parentId
              ? "Subcategory form = common + main category + these fields"
              : "Main category form = common + these fields"}
          {form.data ? ` · version ${form.data.formSchemaVersion}` : ""}
        </p>
      </div>

      <div className="row">
        <button
          className={`btn ${kind === "provider" ? "primary" : ""}`}
          type="button"
          onClick={() => {
            setKind("provider");
            setEditingId(null);
            setDraft(emptyDraft("provider"));
          }}
        >
          Provider registration
        </button>
        <button
          className={`btn ${kind === "listing" ? "primary" : ""}`}
          type="button"
          onClick={() => {
            setKind("listing");
            setEditingId(null);
            setDraft(emptyDraft("listing"));
          }}
        >
          Listing form
        </button>
      </div>

      {!isPlatform(category) ? (
        <LayerTable
          title="Platform common"
          fields={form.data?.layers.platform ?? []}
          inherited
        />
      ) : null}
      {category.parentId ? (
        <LayerTable title="Main category" fields={form.data?.layers.main ?? []} inherited />
      ) : null}
      <LayerTable
        title={isPlatform(category) ? "Common fields" : category.parentId ? "This subcategory" : "This category"}
        fields={ownFields}
        inherited={false}
        onEdit={(field) => {
          setEditingId(field.id);
          setDraft(draftFromField(field, kind));
        }}
        onMove={move}
        onToggle={(field) => toggleField.mutate({ id: field.id, isActive: !field.isActive })}
        onDelete={(field) => deleteField.mutate(field.id)}
      />

      <div className="panel stack">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <strong>{editingId && editingId !== "new" ? "Edit field" : "Add field"}</strong>
          {editingId !== "new" ? (
            <button
              className="btn primary"
              type="button"
              onClick={() => {
                setEditingId("new");
                setDraft(emptyDraft(kind));
              }}
            >
              + Add field
            </button>
          ) : null}
        </div>
        {editingId ? (
          <FieldEditor
            draft={draft}
            kind={kind}
            onChange={setDraft}
            onCancel={() => setEditingId(null)}
            pending={createField.isPending || updateField.isPending}
            error={mutationError}
            onSave={() => {
              if (editingId === "new") createField.mutate();
              else updateField.mutate();
            }}
          />
        ) : (
          <p className="muted" style={{ margin: 0 }}>
            Select a field to edit, or add a field to this category. Inherited fields are configured on their own
            category.
          </p>
        )}
      </div>

      <div className="panel stack">
        <strong>Web preview (composed)</strong>
        <p className="muted" style={{ margin: 0 }}>
          This is the payload the public app renders. Inactive fields are still listed here for admins.
        </p>
        <ol className="composed-preview">
          {(form.data?.fields ?? []).map((field) => (
            <li key={field.id}>
              <span>
                {field.label} <code>{field.key}</code>
              </span>
              <span className="muted">
                {field.fieldType}
                {field.required ? " · required" : ""}
                {field.source ? ` · ${field.source}` : ""}
                {field.isActive ? "" : " · inactive"}
              </span>
            </li>
          ))}
        </ol>
        {form.isLoading ? <p className="muted">Loading form…</p> : null}
        {form.isError ? <p className="error">Failed to load form configuration</p> : null}
      </div>
    </div>
  );
}

function ownLayer(form: { layers: { platform: CategoryField[]; main: CategoryField[]; sub: CategoryField[] } } | undefined, category: Category) {
  if (!form) return [];
  if (isPlatform(category)) return form.layers.platform;
  if (category.parentId) return form.layers.sub;
  return form.layers.main;
}

function LayerTable({
  title,
  fields,
  inherited,
  onEdit,
  onMove,
  onToggle,
  onDelete,
}: {
  title: string;
  fields: CategoryField[];
  inherited: boolean;
  onEdit?: (field: CategoryField) => void;
  onMove?: (index: number, direction: -1 | 1) => void;
  onToggle?: (field: CategoryField) => void;
  onDelete?: (field: CategoryField) => void;
}) {
  return (
    <div className="panel" style={{ overflowX: "auto" }}>
      <div className="row" style={{ justifyContent: "space-between", marginBottom: "0.5rem" }}>
        <strong>{title}</strong>
        <span className="muted">{inherited ? "Inherited" : `${fields.length} field(s)`}</span>
      </div>
      <table>
        <thead>
          <tr>
            <th>Order</th>
            <th>Label</th>
            <th>Type</th>
            <th>Required</th>
            <th>Active</th>
            {inherited ? null : <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {fields.map((field, index) => (
            <tr key={field.id}>
              <td>{index + 1}</td>
              <td>
                {field.label}
                <div className="muted">
                  <code>{field.key}</code>
                  {field.scope === "business" ? " · business extras" : ""}
                </div>
              </td>
              <td>{field.fieldType}</td>
              <td>{field.required ? "Yes" : "No"}</td>
              <td>{field.isActive ? "Yes" : "No"}</td>
              {inherited ? null : (
                <td>
                  <div className="row">
                    <button className="btn" type="button" disabled={index === 0} onClick={() => onMove?.(index, -1)}>
                      Up
                    </button>
                    <button
                      className="btn"
                      type="button"
                      disabled={index === fields.length - 1}
                      onClick={() => onMove?.(index, 1)}
                    >
                      Down
                    </button>
                    <button className="btn" type="button" onClick={() => onEdit?.(field)}>
                      Edit
                    </button>
                    <button className="btn" type="button" onClick={() => onToggle?.(field)}>
                      {field.isActive ? "Disable" : "Enable"}
                    </button>
                    <button className="btn danger" type="button" onClick={() => onDelete?.(field)}>
                      Delete
                    </button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {fields.length === 0 ? <p className="muted">No fields in this layer.</p> : null}
    </div>
  );
}

function FieldEditor({
  draft,
  kind,
  onChange,
  onSave,
  onCancel,
  pending,
  error,
}: {
  draft: FieldDraft;
  kind: FormKind;
  onChange: (draft: FieldDraft) => void;
  onSave: () => void;
  onCancel: () => void;
  pending: boolean;
  error: string | null;
}) {
  function set<K extends keyof FieldDraft>(key: K, value: FieldDraft[K]) {
    onChange({ ...draft, [key]: value });
  }

  return (
    <form
      className="stack"
      onSubmit={(event) => {
        event.preventDefault();
        onSave();
      }}
    >
      <div className="row">
        <input
          className="input"
          placeholder="Label"
          value={draft.label}
          onChange={(e) => {
            const label = e.target.value;
            const next = { ...draft, label };
            if (!draft.key || draft.key === keyFromLabel(draft.label)) next.key = keyFromLabel(label);
            onChange(next);
          }}
          required
        />
        <input className="input" placeholder="key" value={draft.key} onChange={(e) => set("key", e.target.value)} required />
        <select
          className="select"
          value={draft.fieldType}
          onChange={(e) => set("fieldType", e.target.value as FieldDraft["fieldType"])}
        >
          {FIELD_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        {kind === "provider" ? (
          <select className="select" value={draft.scope} onChange={(e) => set("scope", e.target.value as FieldDraft["scope"])}>
            <option value="listing">Provider profile</option>
            <option value="business">Business extras</option>
          </select>
        ) : null}
      </div>
      <div className="row">
        <input
          className="input"
          placeholder="Placeholder"
          value={draft.placeholder}
          onChange={(e) => set("placeholder", e.target.value)}
        />
        <input className="input" placeholder="Section" value={draft.section} onChange={(e) => set("section", e.target.value)} />
        <input
          className="input"
          placeholder="Default value"
          value={draft.defaultValue}
          onChange={(e) => set("defaultValue", e.target.value)}
        />
      </div>
      <textarea
        className="textarea"
        placeholder="Help text / description"
        value={draft.helpText}
        onChange={(e) => set("helpText", e.target.value)}
      />
      {draft.fieldType === "select" || draft.fieldType === "multiselect" ? (
        <input
          className="input"
          placeholder="Options, comma-separated"
          value={draft.optionsText}
          onChange={(e) => set("optionsText", e.target.value)}
          style={{ minWidth: "100%" }}
        />
      ) : null}
      <div className="row">
        <input className="input" placeholder="Min" value={draft.min} onChange={(e) => set("min", e.target.value)} />
        <input className="input" placeholder="Max" value={draft.max} onChange={(e) => set("max", e.target.value)} />
        <input
          className="input"
          placeholder="Min length"
          value={draft.minLength}
          onChange={(e) => set("minLength", e.target.value)}
        />
        <input
          className="input"
          placeholder="Max length"
          value={draft.maxLength}
          onChange={(e) => set("maxLength", e.target.value)}
        />
      </div>
      <div className="row">
        <input
          className="input"
          placeholder="Show if field key"
          value={draft.conditionalFieldKey}
          onChange={(e) => set("conditionalFieldKey", e.target.value)}
        />
        <input
          className="input"
          placeholder="equals (true / value)"
          value={draft.conditionalEquals}
          onChange={(e) => set("conditionalEquals", e.target.value)}
        />
        <label className="row">
          <input type="checkbox" checked={draft.required} onChange={(e) => set("required", e.target.checked)} />
          Required
        </label>
        <label className="row">
          <input type="checkbox" checked={draft.isActive} onChange={(e) => set("isActive", e.target.checked)} />
          Active
        </label>
      </div>
      <div className="row">
        <button className="btn primary" type="submit" disabled={!draft.key || !draft.label || pending}>
          Save field
        </button>
        <button className="btn" type="button" onClick={onCancel}>
          Cancel
        </button>
        {error ? <span className="error">{error}</span> : null}
      </div>
    </form>
  );
}

