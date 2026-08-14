import { describe, expect, it } from "vitest";
import type { CategoryField } from "@prisma/client";
import {
  coerceFieldValue,
  normalizeAndValidateFieldValues,
} from "../../src/shared/domain/category-fields";
import { ApiError } from "../../src/shared/errors";

function field(partial: Partial<CategoryField> & Pick<CategoryField, "id" | "key" | "fieldType">): CategoryField {
  return {
    categoryId: "cat",
    label: partial.key,
    helpText: null,
    placeholder: null,
    required: false,
    defaultValue: null,
    options: null,
    validation: null,
    conditionalRules: null,
    scope: "listing",
    sortOrder: 0,
    section: null,
    isFilterable: false,
    isSearchable: false,
    isActive: true,
    schemaVersion: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...partial,
  };
}

describe("category field validation", () => {
  it("coerces number and boolean values", () => {
    expect(coerceFieldValue(field({ id: "1", key: "n", fieldType: "number" }), 12).valueNumber).toBe(12);
    expect(coerceFieldValue(field({ id: "2", key: "b", fieldType: "boolean" }), true).valueBool).toBe(true);
  });

  it("rejects invalid select options", () => {
    expect(() =>
      coerceFieldValue(
        field({ id: "1", key: "s", fieldType: "select", options: ["a", "b"] }),
        "c",
      ),
    ).toThrow(ApiError);
  });

  it("enforces required fields", () => {
    expect(() =>
      normalizeAndValidateFieldValues(
        [field({ id: "1", key: "license_number", fieldType: "text", required: true, label: "License" })],
        [],
      ),
    ).toThrow(/required/i);
  });

  it("accepts multiselect arrays", () => {
    const values = normalizeAndValidateFieldValues(
      [
        field({
          id: "1",
          key: "specialties",
          fieldType: "multiselect",
          options: ["Masonry", "Roofing"],
        }),
      ],
      [{ key: "specialties", value: ["Masonry"] }],
    );
    expect(values[0].valueJson).toEqual(["Masonry"]);
  });

  it("skips required fields hidden by conditionalRules", () => {
    const fields = [
      field({ id: "1", key: "emergency_service", fieldType: "boolean", required: true }),
      field({
        id: "2",
        key: "emergency_timing",
        fieldType: "text",
        required: true,
        label: "Emergency timing",
        conditionalRules: { fieldKey: "emergency_service", equals: true },
      }),
    ];
    expect(() =>
      normalizeAndValidateFieldValues(fields, [{ key: "emergency_service", value: false }]),
    ).not.toThrow();
    expect(() =>
      normalizeAndValidateFieldValues(fields, [{ key: "emergency_service", value: true }]),
    ).toThrow(/required/i);
  });
});
