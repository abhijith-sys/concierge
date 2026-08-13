import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { api, hasPermission, type Category } from "../lib/api";
import { useAuth } from "../context/auth";

function flatten(categories: Category[], depth = 0): Array<Category & { depth: number }> {
  return categories.flatMap((category) => [
    { ...category, depth },
    ...flatten(category.children ?? [], depth + 1),
  ]);
}

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
] as const;

export function CategoriesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string>("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [fieldKey, setFieldKey] = useState("");
  const [fieldLabel, setFieldLabel] = useState("");
  const [fieldType, setFieldType] = useState<(typeof FIELD_TYPES)[number]>("text");

  const categories = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: api.categories,
    enabled: hasPermission(user, "categories.write") || hasPermission(user, "category_fields.write"),
  });

  const flat = useMemo(() => flatten(categories.data ?? []), [categories.data]);
  const selected = selectedId || flat[0]?.id || "";

  const fields = useQuery({
    queryKey: ["admin", "fields", selected],
    queryFn: () => api.categoryFields(selected),
    enabled: Boolean(selected) && hasPermission(user, "category_fields.write"),
  });

  const createCategory = useMutation({
    mutationFn: () => api.createCategory({ name: newCategoryName }),
    onSuccess: async () => {
      setNewCategoryName("");
      await queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
    },
  });

  const createField = useMutation({
    mutationFn: () =>
      api.createField(selected, {
        key: fieldKey,
        label: fieldLabel,
        fieldType,
        required: false,
        scope: "listing",
      }),
    onSuccess: async () => {
      setFieldKey("");
      setFieldLabel("");
      await queryClient.invalidateQueries({ queryKey: ["admin", "fields", selected] });
    },
  });

  const toggleField = useMutation({
    mutationFn: (input: { id: string; isActive: boolean }) =>
      api.updateField(input.id, { isActive: input.isActive }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "fields", selected] });
    },
  });

  const deleteField = useMutation({
    mutationFn: api.deleteField,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "fields", selected] });
    },
  });

  return (
    <div className="stack">
      <div>
        <h2 style={{ margin: 0 }}>Categories & fields</h2>
        <p className="muted">Manage taxonomy and per-category listing schemas</p>
      </div>

      {hasPermission(user, "categories.write") ? (
        <div className="panel row">
          <input
            className="input"
            placeholder="New category name"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
          />
          <button
            className="btn primary"
            type="button"
            disabled={!newCategoryName.trim() || createCategory.isPending}
            onClick={() => createCategory.mutate()}
          >
            Add category
          </button>
        </div>
      ) : null}

      <div className="panel row">
        <label className="row">
          <span className="muted">Category</span>
          <select className="select" value={selected} onChange={(e) => setSelectedId(e.target.value)}>
            {flat.map((category) => (
              <option key={category.id} value={category.id}>
                {"—".repeat(category.depth)} {category.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {hasPermission(user, "category_fields.write") ? (
        <>
          <div className="panel stack">
            <strong>Add field</strong>
            <div className="row">
              <input
                className="input"
                placeholder="key (e.g. license_number)"
                value={fieldKey}
                onChange={(e) => setFieldKey(e.target.value)}
              />
              <input
                className="input"
                placeholder="Label"
                value={fieldLabel}
                onChange={(e) => setFieldLabel(e.target.value)}
              />
              <select
                className="select"
                value={fieldType}
                onChange={(e) => setFieldType(e.target.value as (typeof FIELD_TYPES)[number])}
              >
                {FIELD_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <button
                className="btn primary"
                type="button"
                disabled={!fieldKey || !fieldLabel || !selected || createField.isPending}
                onClick={() => createField.mutate()}
              >
                Create field
              </button>
            </div>
          </div>

          <div className="panel">
            <table>
              <thead>
                <tr>
                  <th>Key</th>
                  <th>Label</th>
                  <th>Type</th>
                  <th>Active</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(fields.data ?? []).map((field) => (
                  <tr key={field.id}>
                    <td>
                      <code>{field.key}</code>
                    </td>
                    <td>{field.label}</td>
                    <td>{field.fieldType}</td>
                    <td>{field.isActive ? "Yes" : "No"}</td>
                    <td>
                      <div className="row">
                        <button
                          className="btn"
                          type="button"
                          onClick={() => toggleField.mutate({ id: field.id, isActive: !field.isActive })}
                        >
                          {field.isActive ? "Disable" : "Enable"}
                        </button>
                        <button className="btn danger" type="button" onClick={() => deleteField.mutate(field.id)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <p className="muted">You can view categories but lack category_fields.write</p>
      )}
    </div>
  );
}
