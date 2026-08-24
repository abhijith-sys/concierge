import { describe, expect, it } from "vitest";
import type { CategoryField } from "@prisma/client";
import {
  fieldsForCategoryKind,
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

  it("keeps shop wholesale fields off service-professional forms", () => {
    const rows = [
      field({ id: "1", key: "order_modes" }),
      field({ id: "2", key: "emergency_service" }),
      field({ id: "3", key: "business_type" }),
    ];
    expect(fieldsForCategoryKind(rows, "supplier").map((row) => row.key)).toEqual(["order_modes", "business_type"]);
    expect(fieldsForCategoryKind(rows, "service").map((row) => row.key)).toEqual(["emergency_service", "business_type"]);
  });

  it("drops trade and wholesale fields on stay category forms", () => {
    const rows = [
      field({ id: "1", key: "order_modes" }),
      field({ id: "2", key: "emergency_service" }),
      field({ id: "3", key: "business_type" }),
      field({ id: "4", key: "amenities_highlighted" }),
      field({ id: "5", key: "whatsapp" }),
    ];
    expect(fieldsForCategoryKind(rows, "service", "hotels-resorts-stays").map((row) => row.key)).toEqual([
      "business_type",
      "amenities_highlighted",
      "whatsapp",
    ]);
  });

  it("drops wholesale fields on rental category forms but keeps contact", () => {
    const rows = [
      field({ id: "1", key: "order_modes" }),
      field({ id: "2", key: "emergency_service" }),
      field({ id: "3", key: "business_type" }),
      field({ id: "4", key: "pickup_hours" }),
      field({ id: "5", key: "whatsapp" }),
      field({ id: "6", key: "service_area" }),
    ];
    expect(fieldsForCategoryKind(rows, "supplier", "rental-hire").map((row) => row.key)).toEqual([
      "business_type",
      "pickup_hours",
      "whatsapp",
      "service_area",
    ]);
  });

  it("drops trade and wholesale fields on travel category forms", () => {
    const rows = [
      field({ id: "1", key: "order_modes" }),
      field({ id: "2", key: "emergency_service" }),
      field({ id: "3", key: "business_type" }),
      field({ id: "4", key: "service_hours" }),
      field({ id: "5", key: "whatsapp" }),
    ];
    expect(fieldsForCategoryKind(rows, "service", "travel-taxi-transport").map((row) => row.key)).toEqual([
      "business_type",
      "service_hours",
      "whatsapp",
    ]);
  });

  it("keeps event crew fields on service forms and strips them from event shops", () => {
    const rows = [
      field({ id: "1", key: "order_modes" }),
      field({ id: "2", key: "emergency_service" }),
      field({ id: "3", key: "business_type" }),
      field({ id: "4", key: "event_types" }),
      field({ id: "5", key: "whatsapp" }),
    ];
    expect(fieldsForCategoryKind(rows, "service", "events-lifestyle").map((row) => row.key)).toEqual([
      "business_type",
      "event_types",
      "whatsapp",
    ]);
    expect(fieldsForCategoryKind(rows, "supplier", "events-lifestyle").map((row) => row.key)).toEqual([
      "order_modes",
      "business_type",
      "whatsapp",
    ]);
  });

  it("keeps logistics crew fields on service forms and strips them from logistics shops", () => {
    const rows = [
      field({ id: "1", key: "order_modes" }),
      field({ id: "2", key: "emergency_service" }),
      field({ id: "3", key: "business_type" }),
      field({ id: "4", key: "coverage_area" }),
      field({ id: "5", key: "whatsapp" }),
    ];
    expect(fieldsForCategoryKind(rows, "service", "logistics-other").map((row) => row.key)).toEqual([
      "business_type",
      "coverage_area",
      "whatsapp",
    ]);
    expect(fieldsForCategoryKind(rows, "supplier", "logistics-other").map((row) => row.key)).toEqual([
      "order_modes",
      "business_type",
      "whatsapp",
    ]);
  });

  it("keeps education fields on service forms and strips them from education shops", () => {
    const rows = [
      field({ id: "1", key: "order_modes" }),
      field({ id: "2", key: "emergency_service" }),
      field({ id: "3", key: "business_type" }),
      field({ id: "4", key: "subjects" }),
      field({ id: "5", key: "whatsapp" }),
    ];
    expect(fieldsForCategoryKind(rows, "service", "education-training").map((row) => row.key)).toEqual([
      "business_type",
      "subjects",
      "whatsapp",
    ]);
    expect(fieldsForCategoryKind(rows, "supplier", "education-training").map((row) => row.key)).toEqual([
      "order_modes",
      "business_type",
      "whatsapp",
    ]);
  });

  it("keeps health fields on service forms and strips them from health shops", () => {
    const rows = [
      field({ id: "1", key: "order_modes" }),
      field({ id: "2", key: "emergency_service" }),
      field({ id: "3", key: "business_type" }),
      field({ id: "4", key: "specialties" }),
      field({ id: "5", key: "whatsapp" }),
    ];
    expect(fieldsForCategoryKind(rows, "service", "health-wellness").map((row) => row.key)).toEqual([
      "business_type",
      "specialties",
      "whatsapp",
    ]);
    expect(fieldsForCategoryKind(rows, "supplier", "health-wellness").map((row) => row.key)).toEqual([
      "order_modes",
      "business_type",
      "whatsapp",
    ]);
  });

  it("keeps professional fields on service forms and strips them from professional shops", () => {
    const rows = [
      field({ id: "1", key: "order_modes" }),
      field({ id: "2", key: "emergency_service" }),
      field({ id: "3", key: "business_type" }),
      field({ id: "4", key: "practice_areas" }),
      field({ id: "5", key: "whatsapp" }),
    ];
    expect(fieldsForCategoryKind(rows, "service", "professional-business").map((row) => row.key)).toEqual([
      "business_type",
      "practice_areas",
      "whatsapp",
    ]);
    expect(fieldsForCategoryKind(rows, "supplier", "professional-business").map((row) => row.key)).toEqual([
      "order_modes",
      "business_type",
      "whatsapp",
    ]);
  });

  it("keeps home trade fields on service forms and strips them from home shops", () => {
    const rows = [
      field({ id: "1", key: "order_modes" }),
      field({ id: "2", key: "emergency_service" }),
      field({ id: "3", key: "business_type" }),
      field({ id: "4", key: "job_types" }),
      field({ id: "5", key: "whatsapp" }),
    ];
    expect(fieldsForCategoryKind(rows, "service", "home-property").map((row) => row.key)).toEqual([
      "emergency_service",
      "business_type",
      "job_types",
      "whatsapp",
    ]);
    expect(fieldsForCategoryKind(rows, "supplier", "home-property").map((row) => row.key)).toEqual([
      "order_modes",
      "business_type",
      "whatsapp",
    ]);
  });

  it("keeps automotive fields on service forms and strips them from automotive shops", () => {
    const rows = [
      field({ id: "1", key: "order_modes" }),
      field({ id: "2", key: "emergency_service" }),
      field({ id: "3", key: "business_type" }),
      field({ id: "4", key: "vehicle_types" }),
      field({ id: "5", key: "whatsapp" }),
    ];
    expect(fieldsForCategoryKind(rows, "service", "automotive").map((row) => row.key)).toEqual([
      "emergency_service",
      "business_type",
      "vehicle_types",
      "whatsapp",
    ]);
    expect(fieldsForCategoryKind(rows, "supplier", "automotive").map((row) => row.key)).toEqual([
      "order_modes",
      "business_type",
      "whatsapp",
    ]);
  });

  it("keeps electronics fields on service forms and strips them from electronics shops", () => {
    const rows = [
      field({ id: "1", key: "order_modes" }),
      field({ id: "2", key: "emergency_service" }),
      field({ id: "3", key: "business_type" }),
      field({ id: "4", key: "device_types" }),
      field({ id: "5", key: "whatsapp" }),
    ];
    expect(fieldsForCategoryKind(rows, "service", "electronics-technology").map((row) => row.key)).toEqual([
      "emergency_service",
      "business_type",
      "device_types",
      "whatsapp",
    ]);
    expect(fieldsForCategoryKind(rows, "supplier", "electronics-technology").map((row) => row.key)).toEqual([
      "order_modes",
      "business_type",
      "whatsapp",
    ]);
  });
});
