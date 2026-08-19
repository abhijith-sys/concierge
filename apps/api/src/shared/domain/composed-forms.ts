import { CategoryFieldScope, type CategoryField, type CategoryKind } from "@prisma/client";
import { STAY_HIDDEN_PLATFORM_KEYS, isStayRootSlug } from "./stays.js";

export const FORM_KINDS = ["provider", "listing"] as const;
export type FormKind = (typeof FORM_KINDS)[number];
export type FieldLayer = "platform" | "main" | "sub";

export type ComposedField = CategoryField & { source: FieldLayer };

const KIND_SCOPES: Record<FormKind, CategoryFieldScope[]> = {
  provider: [CategoryFieldScope.listing, CategoryFieldScope.business],
  listing: [CategoryFieldScope.service],
};

export function scopesForFormKind(kind: FormKind): CategoryFieldScope[] {
  return KIND_SCOPES[kind];
}

const LAYER_RANK: Record<FieldLayer, number> = {
  platform: 0,
  main: 1,
  sub: 2,
};

/** Later layers win on the same key. Result is ordered Common → Main → Sub, then sortOrder. */
export function mergeFieldLayers(
  layers: Array<{ source: FieldLayer; fields: CategoryField[] }>,
): ComposedField[] {
  const byKey = new Map<string, ComposedField>();
  for (const layer of layers) {
    for (const field of layer.fields) {
      byKey.set(field.key, { ...field, source: layer.source });
    }
  }
  return [...byKey.values()].sort((a, b) => {
    const layerDelta = LAYER_RANK[a.source] - LAYER_RANK[b.source];
    if (layerDelta !== 0) return layerDelta;
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.label.localeCompare(b.label);
  });
}

export function formSchemaVersion(fields: Array<{ schemaVersion: number }>): number {
  if (!fields.length) return 1;
  return Math.max(1, ...fields.map((field) => field.schemaVersion));
}

/** Platform fields that only belong on service-professional categories. */
export const SERVICE_ONLY_FIELD_KEYS = new Set([
  "emergency_service",
  "emergency_timing",
  "home_visit",
  "service_radius_km",
  "availability",
]);

/** Platform fields that only belong on supplier / shop categories. */
export const SUPPLIER_ONLY_FIELD_KEYS = new Set([
  "order_modes",
  "min_order_qty",
  "sells_single_piece",
  "wholesale_available",
  "sample_available",
  "service_area",
  "whatsapp",
  "unit",
  "moq",
  "price_bulk",
  "price_piece",
  "lead_time_days",
  "custom_order",
]);

export function fieldsForCategoryKind<T extends { key: string }>(
  fields: T[],
  kind: CategoryKind | null | undefined,
  rootSlug?: string | null,
): T[] {
  if (isStayRootSlug(rootSlug)) {
    return fields.filter((field) => !STAY_HIDDEN_PLATFORM_KEYS.has(field.key));
  }
  if (!kind) return fields;
  return fields.filter((field) => {
    if (kind === "supplier" && SERVICE_ONLY_FIELD_KEYS.has(field.key)) return false;
    if (kind === "service" && SUPPLIER_ONLY_FIELD_KEYS.has(field.key)) return false;
    return true;
  });
}

export type ConditionalRule = {
  fieldKey?: string;
  equals?: unknown;
};

export function parseConditionalRules(raw: unknown): ConditionalRule | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const rule = raw as ConditionalRule;
  if (!rule.fieldKey || typeof rule.fieldKey !== "string") return null;
  return rule;
}

function valuesEqual(left: unknown, right: unknown) {
  if (Object.is(left, right)) return true;
  if (typeof left === "number" && typeof right === "string" && Number(right) === left) return true;
  if (typeof right === "number" && typeof left === "string" && Number(left) === right) return true;
  return false;
}

export function isFieldVisible(
  field: Pick<CategoryField, "conditionalRules">,
  valueByKey: Map<string, unknown>,
): boolean {
  const rule = parseConditionalRules(field.conditionalRules);
  if (!rule?.fieldKey) return true;
  const parentValue = valueByKey.get(rule.fieldKey);
  if (rule.equals === undefined) return !isBlank(parentValue);
  return valuesEqual(parentValue, rule.equals);
}

function isBlank(value: unknown) {
  return value === null || value === undefined || value === "";
}
