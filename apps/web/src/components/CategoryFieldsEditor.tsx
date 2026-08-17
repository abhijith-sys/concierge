import { Field, Input, Select, Textarea } from "./ui";
import type { CategoryField } from "../lib/api";

export type FieldValueMap = Record<string, unknown>;

function fieldOptions(field: CategoryField): string[] {
  if (!Array.isArray(field.options)) return [];
  return field.options.map(String);
}

function validationNumber(field: CategoryField, key: "minLength" | "maxLength") {
  const value = field.validation?.[key];
  return typeof value === "number" ? value : undefined;
}

function widgetOf(field: CategoryField): string | undefined {
  const widget = field.validation?.widget;
  return typeof widget === "string" ? widget : undefined;
}

function valuesEqual(left: unknown, right: unknown) {
  if (Object.is(left, right)) return true;
  if (typeof left === "number" && typeof right === "string" && Number(right) === left) return true;
  if (typeof right === "number" && typeof left === "string" && Number(left) === right) return true;
  return false;
}

function isBlank(value: unknown) {
  return value === null || value === undefined || value === "";
}

export function isFieldVisible(field: CategoryField, values: FieldValueMap) {
  const rule = field.conditionalRules;
  if (!rule?.fieldKey) return true;
  const parentValue = values[rule.fieldKey];
  if (rule.equals === undefined) return !isBlank(parentValue);
  return valuesEqual(parentValue, rule.equals);
}

function emptyValue(field: CategoryField): unknown {
  if (field.fieldType === "boolean") return false;
  if (field.fieldType === "multiselect") return [];
  if (field.fieldType === "json" && widgetOf(field) === "location") return { lat: "", lng: "" };
  return "";
}

function defaultForField(field: CategoryField): unknown {
  if (field.defaultValue !== undefined && field.defaultValue !== null && field.defaultValue !== "") {
    return field.defaultValue;
  }
  return emptyValue(field);
}

export function valuesFromFieldValues(
  fields: CategoryField[],
  existing?: Array<{ fieldId?: string; key?: string; value: unknown }> | null,
): FieldValueMap {
  const map: FieldValueMap = {};
  for (const field of fields) {
    const row = existing?.find((item) => item.fieldId === field.id || item.key === field.key);
    if (row) map[field.key] = row.value;
    else map[field.key] = defaultForField(field);
  }
  return map;
}

export function toFieldValuePayload(fields: CategoryField[], values: FieldValueMap) {
  return fields
    .filter((field) => isFieldVisible(field, values))
    .flatMap((field) => {
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
      if (field.fieldType === "json" && widgetOf(field) === "location") {
        const raw = value && typeof value === "object" ? (value as { lat?: unknown; lng?: unknown }) : {};
        const lat = raw.lat === "" || raw.lat == null ? null : Number(raw.lat);
        const lng = raw.lng === "" || raw.lng == null ? null : Number(raw.lng);
        value = { lat: Number.isFinite(lat) ? lat : null, lng: Number.isFinite(lng) ? lng : null };
      }
      if (typeof value === "string") value = value.trim();
      const blank =
        value === "" ||
        value === null ||
        value === undefined ||
        (Array.isArray(value) && value.length === 0);
      if (blank && !field.required) return [];
      return [{ key: field.key, value }];
    });
}

function locationValue(value: unknown): { lat: string; lng: string } {
  if (!value || typeof value !== "object") return { lat: "", lng: "" };
  const raw = value as { lat?: unknown; lng?: unknown };
  return {
    lat: raw.lat == null ? "" : String(raw.lat),
    lng: raw.lng == null ? "" : String(raw.lng),
  };
}

export function DynamicForm({
  fields,
  values,
  onChange,
}: {
  fields: CategoryField[];
  values: FieldValueMap;
  onChange: (next: FieldValueMap) => void;
}) {
  const visible = fields.filter((field) => isFieldVisible(field, values));
  if (!visible.length) return null;

  const sections = new Map<string, CategoryField[]>();
  for (const field of visible) {
    const section = field.section?.trim() || "Details";
    const list = sections.get(section) ?? [];
    list.push(field);
    sections.set(section, list);
  }

  function setValue(key: string, value: unknown) {
    onChange({ ...values, [key]: value });
  }

  return (
    <div className="grid gap-6 md:col-span-2">
      {[...sections.entries()].map(([section, sectionFields]) => (
        <div key={section} className="grid gap-5 md:grid-cols-2">
          <p className="label-caps text-gold-dark md:col-span-2">{section}</p>
          {sectionFields.map((field) => {
            const widget = widgetOf(field);
            const required = Boolean(field.required);
            const minLength = validationNumber(field, "minLength");
            const maxLength = validationNumber(field, "maxLength");
            const label = `${field.label}${required ? "" : " (optional)"}`;
            const help = field.helpText ? (
              <p className="mt-1 text-xs font-normal text-ink-soft">{field.helpText}</p>
            ) : null;
            const placeholder = field.placeholder ?? undefined;

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
                      required={required}
                      minLength={required ? minLength : undefined}
                      maxLength={maxLength}
                      placeholder={placeholder}
                    />
                    {help}
                  </Field>
                </div>
              );
            }

            if (field.fieldType === "select" && widget === "radio") {
              return (
                <Field key={field.id} label={label}>
                  <div className="grid gap-2">
                    {fieldOptions(field).map((option) => (
                      <label key={option} className="flex items-center gap-2 text-sm font-normal">
                        <input
                          type="radio"
                          name={field.key}
                          value={option}
                          checked={String(values[field.key] ?? "") === option}
                          onChange={() => setValue(field.key, option)}
                          required={required}
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                  {help}
                </Field>
              );
            }

            if (field.fieldType === "select") {
              return (
                <Field key={field.id} label={label}>
                  <Select
                    value={String(values[field.key] ?? "")}
                    onChange={(event) => setValue(field.key, event.target.value)}
                    required={required}
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

            if (field.fieldType === "json" && widget === "location") {
              const coords = locationValue(values[field.key]);
              return (
                <div key={field.id} className="grid gap-3 md:col-span-2 md:grid-cols-2">
                  <Field label={`${field.label} latitude${required ? "" : " (optional)"}`}>
                    <Input
                      type="number"
                      step="any"
                      value={coords.lat}
                      onChange={(event) =>
                        setValue(field.key, { ...coords, lat: event.target.value })
                      }
                      placeholder={placeholder ?? "Latitude"}
                      required={required}
                    />
                  </Field>
                  <Field label={`${field.label} longitude${required ? "" : " (optional)"}`}>
                    <Input
                      type="number"
                      step="any"
                      value={coords.lng}
                      onChange={(event) =>
                        setValue(field.key, { ...coords, lng: event.target.value })
                      }
                      placeholder="Longitude"
                      required={required}
                    />
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
                    placeholder={placeholder ?? "Managed after save via media uploads"}
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
                  required={required}
                  minLength={required ? minLength : undefined}
                  maxLength={maxLength}
                  placeholder={placeholder}
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

export const CategoryFieldsEditor = DynamicForm;
