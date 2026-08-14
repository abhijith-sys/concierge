import { describe, expect, it } from "vitest";
import type { CategoryField } from "@prisma/client";
import {
  formSchemaVersion,
  isFieldVisible,
  mergeFieldLayers,
} from "../../src/shared/domain/composed-forms";

function field(partial: Partial<CategoryField> & Pick<CategoryField, "id" | "key">): CategoryField {
  return {
    categoryId: "cat",
    label: partial.key,
    helpText: null,
    placeholder: null,
    fieldType: "text",
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

describe("composed forms", () => {
  it("lets subcategory fields override common keys", () => {
    const merged = mergeFieldLayers([
      {
        source: "platform",
        fields: [field({ id: "p", key: "license_number", required: false, sortOrder: 1, label: "License" })],
      },
      {
        source: "sub",
        fields: [field({ id: "s", key: "license_number", required: true, sortOrder: 1, label: "Trade license" })],
      },
    ]);
    expect(merged).toHaveLength(1);
    expect(merged[0].id).toBe("s");
    expect(merged[0].required).toBe(true);
    expect(merged[0].source).toBe("sub");
  });

  it("orders common then main then sub", () => {
    const merged = mergeFieldLayers([
      { source: "sub", fields: [field({ id: "s", key: "wiring", sortOrder: 0 })] },
      { source: "platform", fields: [field({ id: "p", key: "business_name", sortOrder: 0 })] },
      { source: "main", fields: [field({ id: "m", key: "years", sortOrder: 0 })] },
    ]);
    expect(merged.map((row) => row.key)).toEqual(["business_name", "years", "wiring"]);
  });

  it("computes form schema version from the highest field version", () => {
    expect(formSchemaVersion([])).toBe(1);
    expect(formSchemaVersion([{ schemaVersion: 1 }, { schemaVersion: 3 }])).toBe(3);
  });

  it("hides conditional fields until the parent matches", () => {
    const child = field({
      id: "c",
      key: "radius",
      conditionalRules: { fieldKey: "home_visit", equals: true },
    });
    expect(isFieldVisible(child, new Map([["home_visit", false]]))).toBe(false);
    expect(isFieldVisible(child, new Map([["home_visit", true]]))).toBe(true);
  });
});
