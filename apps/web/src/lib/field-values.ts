import type { FieldValue } from "./api";

export function displayValue(value: unknown) {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.join(", ");
  if (value == null || value === "") return "";
  return String(value);
}

export function visibleFields(fields?: FieldValue[]) {
  return (fields ?? []).filter((item) => {
    const text = displayValue(item.value);
    return text.length > 0 && !(Array.isArray(item.value) && !item.value.length);
  });
}

export function fieldByKey(fields: FieldValue[] | undefined, key: string) {
  return fields?.find((item) => item.key === key);
}
