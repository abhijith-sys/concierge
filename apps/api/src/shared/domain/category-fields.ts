import { Prisma, type CategoryField, type CategoryFieldType } from "@prisma/client";
import { ApiError } from "../errors/index.js";

export type FieldValueInput = {
  fieldId?: string;
  key?: string;
  value: unknown;
};

export type NormalizedFieldValue = {
  fieldId: string;
  valueText: string | null;
  valueNumber: number | null;
  valueBool: boolean | null;
  valueJson: Prisma.InputJsonValue | typeof Prisma.DbNull | null;
};

type ValidationRules = {
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
};

function asRules(raw: unknown): ValidationRules {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  return raw as ValidationRules;
}

function asOptions(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(String);
}

function emptyNormalized(fieldId: string): NormalizedFieldValue {
  return {
    fieldId,
    valueText: null,
    valueNumber: null,
    valueBool: null,
    valueJson: null,
  };
}

function isBlank(value: unknown) {
  return value === null || value === undefined || value === "";
}

export function normalizeAndValidateFieldValues(
  fields: CategoryField[],
  inputs: FieldValueInput[],
  options?: { requireRequired?: boolean },
): NormalizedFieldValue[] {
  const requireRequired = options?.requireRequired ?? true;
  const byId = new Map(fields.map((f) => [f.id, f]));
  const byKey = new Map(fields.map((f) => [f.key, f]));

  const provided = new Map<string, unknown>();
  for (const input of inputs) {
    const field = (input.fieldId && byId.get(input.fieldId)) || (input.key && byKey.get(input.key));
    if (!field) {
      throw new ApiError(400, "UNKNOWN_FIELD", `Unknown field: ${input.fieldId ?? input.key ?? "?"}`);
    }
    if (!field.isActive) {
      throw new ApiError(400, "INACTIVE_FIELD", `Field "${field.key}" is not active`);
    }
    provided.set(field.id, input.value);
  }

  if (requireRequired) {
    for (const field of fields) {
      if (!field.isActive || !field.required) continue;
      if (!provided.has(field.id) || isBlank(provided.get(field.id))) {
        throw new ApiError(400, "FIELD_REQUIRED", `Field "${field.label}" is required`);
      }
    }
  }

  const normalized: NormalizedFieldValue[] = [];
  for (const [fieldId, value] of provided) {
    const field = byId.get(fieldId)!;
    if (isBlank(value) && !field.required) {
      normalized.push(emptyNormalized(fieldId));
      continue;
    }
    normalized.push(coerceFieldValue(field, value));
  }
  return normalized;
}

export function coerceFieldValue(field: CategoryField, value: unknown): NormalizedFieldValue {
  const rules = asRules(field.validation);
  const options = asOptions(field.options);
  const base = emptyNormalized(field.id);

  switch (field.fieldType as CategoryFieldType) {
    case "boolean": {
      if (typeof value !== "boolean") {
        throw new ApiError(400, "INVALID_FIELD", `"${field.key}" must be a boolean`);
      }
      return { ...base, valueBool: value };
    }
    case "number": {
      const num = typeof value === "number" ? value : Number(value);
      if (!Number.isFinite(num)) {
        throw new ApiError(400, "INVALID_FIELD", `"${field.key}" must be a number`);
      }
      if (rules.min !== undefined && num < rules.min) {
        throw new ApiError(400, "INVALID_FIELD", `"${field.key}" must be >= ${rules.min}`);
      }
      if (rules.max !== undefined && num > rules.max) {
        throw new ApiError(400, "INVALID_FIELD", `"${field.key}" must be <= ${rules.max}`);
      }
      return { ...base, valueNumber: num };
    }
    case "multiselect": {
      if (!Array.isArray(value) || value.some((v) => typeof v !== "string")) {
        throw new ApiError(400, "INVALID_FIELD", `"${field.key}" must be a string array`);
      }
      if (options.length && value.some((v) => !options.includes(v))) {
        throw new ApiError(400, "INVALID_FIELD", `"${field.key}" has an invalid option`);
      }
      return { ...base, valueJson: value };
    }
    case "json":
    case "asset_gallery": {
      return { ...base, valueJson: value as Prisma.InputJsonValue };
    }
    case "select":
    case "text":
    case "textarea":
    case "date":
    case "url":
    case "phone":
    case "email":
    case "asset_ref": {
      if (typeof value !== "string") {
        throw new ApiError(400, "INVALID_FIELD", `"${field.key}" must be a string`);
      }
      if (field.fieldType === "select" && options.length && !options.includes(value)) {
        throw new ApiError(400, "INVALID_FIELD", `"${field.key}" has an invalid option`);
      }
      if (field.fieldType === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        throw new ApiError(400, "INVALID_FIELD", `"${field.key}" must be a valid email`);
      }
      if (field.fieldType === "url") {
        try {
          const protocol = new URL(value).protocol;
          if (protocol !== "http:" && protocol !== "https:") throw new Error("bad");
        } catch {
          throw new ApiError(400, "INVALID_FIELD", `"${field.key}" must be a valid URL`);
        }
      }
      if (rules.minLength !== undefined && value.length < rules.minLength) {
        throw new ApiError(400, "INVALID_FIELD", `"${field.key}" is too short`);
      }
      if (rules.maxLength !== undefined && value.length > rules.maxLength) {
        throw new ApiError(400, "INVALID_FIELD", `"${field.key}" is too long`);
      }
      if (rules.pattern) {
        const re = new RegExp(rules.pattern);
        if (!re.test(value)) {
          throw new ApiError(400, "INVALID_FIELD", `"${field.key}" has an invalid format`);
        }
      }
      return { ...base, valueText: value };
    }
    default:
      throw new ApiError(400, "INVALID_FIELD", `Unsupported field type for "${field.key}"`);
  }
}

export function serializeFieldValue(row: {
  field: CategoryField;
  valueText: string | null;
  valueNumber: { toNumber?: () => number } | number | null;
  valueBool: boolean | null;
  valueJson: unknown;
}) {
  const value =
    row.field.fieldType === "boolean"
      ? row.valueBool
      : row.field.fieldType === "number"
        ? row.valueNumber == null
          ? null
          : typeof row.valueNumber === "number"
            ? row.valueNumber
            : (row.valueNumber.toNumber?.() ?? Number(row.valueNumber))
        : row.field.fieldType === "multiselect" ||
            row.field.fieldType === "json" ||
            row.field.fieldType === "asset_gallery"
          ? row.valueJson
          : row.valueText;

  return {
    fieldId: row.field.id,
    key: row.field.key,
    label: row.field.label,
    section: row.field.section,
    fieldType: row.field.fieldType,
    scope: row.field.scope,
    value,
  };
}
