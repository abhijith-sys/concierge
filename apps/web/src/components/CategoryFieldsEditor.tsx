import { Field, Input, Select, Textarea } from "./ui";
import type { CategoryField } from "../lib/api";

export type FieldValueMap = Record<string, unknown>;

function fieldOptions(field: CategoryField): string[] {
  if (!Array.isArray(field.options)) return [];
  return field.options.map(String);
}

export function valuesFromFieldValues(
  fields: CategoryField[],
  existing?: Array<{ fieldId?: string; key?: string; value: unknown }> | null,
): FieldValueMap {
  const map: FieldValueMap = {};
  for (const field of fields) {
    const row = existing?.find((item) => item.fieldId === field.id || item.key === field.key);
    if (row) map[field.key] = row.value;
    else if (field.fieldType === "boolean") map[field.key] = false;
    else if (field.fieldType === "multiselect") map[field.key] = [];
    else map[field.key] = "";
  }
  return map;
}

export function toFieldValuePayload(fields: CategoryField[], values: FieldValueMap) {
  return fields.map((field) => {
    let value = values[field.key];
    if (field.fieldType === "number" && value !== "" && value != null) {
      value = Number(value);
    }
    if (field.fieldType === "multiselect" && !Array.isArray(value)) {
      value = [];
    }
    if (field.fieldType === "boolean") {
      value = Boolean(value);
    }
    return { key: field.key, value };
  });
}

export function CategoryFieldsEditor({
  fields,
  values,
  onChange,
}: {
  fields: CategoryField[];
  values: FieldValueMap;
  onChange: (next: FieldValueMap) => void;
}) {
  if (!fields.length) return null;

  const sections = new Map<string, CategoryField[]>();
  for (const field of fields) {
    const section = field.section?.trim() || "Details";
    const list = sections.get(section) ?? [];
    list.push(field);
    sections.set(section, list);
  }

  function setValue(key: string, value: unknown) {
    onChange({ ...values, [key]: value });
  }

  return (
    <div className="grid gap-5 md:col-span-2 md:grid-cols-2">
      {[...sections.entries()].map(([section, sectionFields]) => (
        <div key={section} className="contents">
          <p className="label-caps text-gold-dark md:col-span-2">{section}</p>
          {sectionFields.map((field) => {
            const label = `${field.label}${field.required ? "" : " (optional)"}`;
            const help = field.helpText ? (
              <p className="mt-1 text-xs font-normal text-ink-soft">{field.helpText}</p>
            ) : null;

            if (field.fieldType === "boolean") {
              return (
                <label key={field.id} className="flex items-center gap-3 text-sm font-semibold">
                  <input
                    type="checkbox"
                    checked={Boolean(values[field.key])}
                    onChange={(event) => setValue(field.key, event.target.checked)}
                    className="size-4"
                  />
                  <span>
                    {label}
                    {help}
                  </span>
                </label>
              );
            }

            if (field.fieldType === "textarea") {
              return (
                <div key={field.id} className="md:col-span-2">
                  <Field label={label}>
                    <Textarea
                      value={String(values[field.key] ?? "")}
                      onChange={(event) => setValue(field.key, event.target.value)}
                      rows={4}
                      required={field.required}
                    />
                    {help}
                  </Field>
                </div>
              );
            }

            if (field.fieldType === "select") {
              return (
                <Field key={field.id} label={label}>
                  <Select
                    value={String(values[field.key] ?? "")}
                    onChange={(event) => setValue(field.key, event.target.value)}
                    required={field.required}
                  >
                    <option value="">Select…</option>
                    {fieldOptions(field).map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </Select>
                  {help}
                </Field>
              );
            }

            if (field.fieldType === "multiselect") {
              const selected = Array.isArray(values[field.key])
                ? (values[field.key] as string[])
                : [];
              return (
                <div key={field.id} className="md:col-span-2">
                  <Field label={label}>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {fieldOptions(field).map((option) => {
                        const checked = selected.includes(option);
                        return (
                          <label key={option} className="flex items-center gap-2 text-sm font-normal">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                const next = checked
                                  ? selected.filter((item) => item !== option)
                                  : [...selected, option];
                                setValue(field.key, next);
                              }}
                            />
                            {option}
                          </label>
                        );
                      })}
                    </div>
                    {help}
                  </Field>
                </div>
              );
            }

            if (field.fieldType === "asset_ref" || field.fieldType === "asset_gallery" || field.fieldType === "json") {
              return (
                <Field key={field.id} label={label}>
                  <Input
                    value={typeof values[field.key] === "string" ? String(values[field.key]) : ""}
                    onChange={(event) => setValue(field.key, event.target.value)}
                    placeholder="Managed after save via media uploads"
                    disabled
                  />
                  {help}
                </Field>
              );
            }

            const inputType =
              field.fieldType === "number"
                ? "number"
                : field.fieldType === "date"
                  ? "date"
                  : field.fieldType === "url"
                    ? "url"
                    : field.fieldType === "email"
                      ? "email"
                      : field.fieldType === "phone"
                        ? "tel"
                        : "text";

            return (
              <Field key={field.id} label={label}>
                <Input
                  type={inputType}
                  value={values[field.key] == null ? "" : String(values[field.key])}
                  onChange={(event) => setValue(field.key, event.target.value)}
                  required={field.required}
                />
                {help}
              </Field>
            );
          })}
        </div>
      ))}
    </div>
  );
}
