import { CategoryFieldScope, CategoryFieldType, Prisma } from "@prisma/client";
import { z } from "zod";
import { PLATFORM_CATEGORY_SLUG } from "../../config/constants.js";
import { prisma } from "../../shared/db/prisma.js";
import { slugify } from "../../shared/utils/index.js";
import { ApiError } from "../../shared/errors/index.js";
import type { NormalizedFieldValue } from "../../shared/domain/category-fields.js";
import {
  formSchemaVersion,
  mergeFieldLayers,
  scopesForFormKind,
  type ComposedField,
  type FieldLayer,
  type FormKind,
} from "../../shared/domain/composed-forms.js";

const categoryMediaUrl = z
  .string()
  .trim()
  .max(500)
  .refine((value) => {
    if (value.startsWith("/uploads/") || value.startsWith("/assets/")) return true;
    try {
      const protocol = new URL(value).protocol;
      return protocol === "http:" || protocol === "https:";
    } catch {
      return false;
    }
  }, "Only HTTP(S), /uploads, or /assets paths are allowed");

const optionalMediaUrl = z
  .union([categoryMediaUrl, z.literal("")])
  .nullable()
  .optional()
  .transform((value) => (value ? value : value === "" ? null : value));

export const categoryUpsertSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(160)
    .optional(),
  parentId: z.string().uuid().nullable().optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  icon: z.string().trim().max(80).nullable().optional(),
  imageUrl: optionalMediaUrl,
  bannerUrl: optionalMediaUrl,
  sortOrder: z.number().int().min(0).max(10_000).optional(),
  isActive: z.boolean().optional(),
});

export const categoryFieldUpsertSchema = z.object({
  key: z
    .string()
    .trim()
    .regex(/^[a-z][a-z0-9_]*$/)
    .max(80),
  label: z.string().trim().min(1).max(160),
  helpText: z.string().trim().max(500).nullable().optional(),
  placeholder: z.string().trim().max(200).nullable().optional(),
  fieldType: z.nativeEnum(CategoryFieldType),
  required: z.boolean().optional(),
  defaultValue: z.unknown().nullable().optional(),
  options: z.array(z.string().min(1).max(120)).max(100).nullable().optional(),
  validation: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
      minLength: z.number().int().optional(),
      maxLength: z.number().int().optional(),
      pattern: z.string().max(200).optional(),
      widget: z.enum(["radio", "checkbox", "toggle", "location", "select"]).optional(),
    })
    .nullable()
    .optional(),
  conditionalRules: z
    .object({
      fieldKey: z
        .string()
        .trim()
        .regex(/^[a-z][a-z0-9_]*$/)
        .max(80),
      equals: z.unknown().optional(),
    })
    .nullable()
    .optional(),
  scope: z.nativeEnum(CategoryFieldScope).optional(),
  sortOrder: z.number().int().min(0).max(10_000).optional(),
  section: z.string().trim().max(80).nullable().optional(),
  isFilterable: z.boolean().optional(),
  isSearchable: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const fieldValueInputSchema = z.object({
  fieldId: z.string().uuid().optional(),
  key: z.string().min(1).max(80).optional(),
  value: z.unknown(),
}).refine((v) => Boolean(v.fieldId || v.key), "fieldId or key is required");

export const fieldReorderSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(200),
});

const categoryCountSelect = {
  children: true,
  listings: true,
  services: true,
  fields: true,
} as const;

function isInternalSlug(slug: string) {
  return slug.startsWith("_");
}

/**
 * Prisma `startsWith: "_"` compiles to SQL `LIKE '_%'`. In LIKE, `_` is a
 * single-character wildcard, so that filter matches every non-empty slug and
 * `NOT startsWith "_"` returns an empty public tree.
 */
export const excludeInternalCategoryWhere: Prisma.CategoryWhereInput = {
  slug: { not: PLATFORM_CATEGORY_SLUG },
};

function categoryListWhere(activeOnly: boolean, includeInternal: boolean): Prisma.CategoryWhereInput {
  return {
    ...(activeOnly ? { isActive: true } : {}),
    ...(includeInternal ? {} : excludeInternalCategoryWhere),
  };
}

function nestedChildrenInclude(activeOnly: boolean, includeInternal: boolean): Prisma.CategoryInclude {
  const where = categoryListWhere(activeOnly, includeInternal);
  const orderBy = [{ sortOrder: "asc" as const }, { name: "asc" as const }];
  return {
    _count: { select: categoryCountSelect },
    children: {
      where,
      orderBy,
      include: {
        _count: { select: categoryCountSelect },
        children: {
          where,
          orderBy,
          include: { _count: { select: categoryCountSelect } },
        },
      },
    },
  };
}

async function ancestorChain(categoryId: string) {
  const chain: Array<{ id: string; parentId: string | null; slug: string; isActive: boolean }> = [];
  const seen = new Set<string>();
  let id: string | null = categoryId;
  while (id && !seen.has(id)) {
    seen.add(id);
    const node: { id: string; parentId: string | null; slug: string; isActive: boolean } | null =
      await prisma.category.findUnique({
        where: { id },
        select: { id: true, parentId: true, slug: true, isActive: true },
      });
    if (!node) break;
    chain.push(node);
    id = node.parentId;
  }
  return chain.reverse();
}

export const categoriesRepository = {
  findRootTree(activeOnly = true, options?: { includeInternal?: boolean }) {
    const includeInternal = options?.includeInternal ?? false;
    return prisma.category.findMany({
      where: {
        parentId: null,
        ...categoryListWhere(activeOnly, includeInternal),
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: nestedChildrenInclude(activeOnly, includeInternal),
    });
  },

  findByIdOrSlug(value: string) {
    const isId = z.string().uuid().safeParse(value).success;
    return prisma.category.findFirst({
      where: isId ? { id: value } : { slug: value },
    });
  },

  findById(id: string) {
    return prisma.category.findUnique({
      where: { id },
      include: { parent: { select: { id: true, name: true, slug: true, isActive: true } } },
    });
  },

  async findPublicByIdOrSlug(value: string) {
    const category = await this.findByIdOrSlug(value);
    if (!category || !category.isActive || isInternalSlug(category.slug)) return null;
    return prisma.category.findUnique({
      where: { id: category.id },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
            isActive: true,
            imageUrl: true,
            bannerUrl: true,
            description: true,
          },
        },
        ...nestedChildrenInclude(true, false),
      },
    });
  },

  async categoryIsAssignable(id: string) {
    const chain = await ancestorChain(id);
    if (!chain.length || chain[chain.length - 1]?.id !== id) return false;
    return chain.every((node) => node.isActive && !isInternalSlug(node.slug));
  },

  async ensurePlatformCategory() {
    return prisma.category.upsert({
      where: { slug: PLATFORM_CATEGORY_SLUG },
      update: {},
      create: {
        name: "Platform common fields",
        slug: PLATFORM_CATEGORY_SLUG,
        sortOrder: 0,
        isActive: true,
      },
    });
  },

  async createCategory(input: z.infer<typeof categoryUpsertSchema>) {
    const slug = input.slug ?? slugify(input.name);
    try {
      return await prisma.category.create({
        data: {
          name: input.name,
          slug,
          parentId: input.parentId ?? null,
          description: input.description ?? null,
          icon: input.icon ?? null,
          imageUrl: input.imageUrl ?? null,
          bannerUrl: input.bannerUrl ?? null,
          sortOrder: input.sortOrder ?? 0,
          isActive: input.isActive ?? true,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ApiError(409, "SLUG_IN_USE", "Category slug already exists");
      }
      throw error;
    }
  },

  async updateCategory(id: string, input: Partial<z.infer<typeof categoryUpsertSchema>>) {
    try {
      return await prisma.category.update({
        where: { id },
        data: {
          name: input.name,
          slug: input.slug,
          parentId: input.parentId,
          description: input.description,
          icon: input.icon,
          imageUrl: input.imageUrl,
          bannerUrl: input.bannerUrl,
          sortOrder: input.sortOrder,
          isActive: input.isActive,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new ApiError(404, "CATEGORY_NOT_FOUND", "Category not found");
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ApiError(409, "SLUG_IN_USE", "Category slug already exists");
      }
      throw error;
    }
  },

  listFields(categoryId: string, options?: { activeOnly?: boolean; scope?: CategoryFieldScope }) {
    return prisma.categoryField.findMany({
      where: {
        categoryId,
        ...(options?.activeOnly ? { isActive: true } : {}),
        ...(options?.scope ? { scope: options.scope } : {}),
      },
      orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
    });
  },

  async listComposedFields(
    categoryId: string,
    options: { kind: FormKind; activeOnly?: boolean },
  ): Promise<ComposedField[]> {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true, parentId: true, slug: true },
    });
    if (!category) throw new ApiError(404, "CATEGORY_NOT_FOUND", "Category not found");

    const platform = await this.ensurePlatformCategory();
    const scopes = scopesForFormKind(options.kind);
    const activeOnly = options.activeOnly ?? true;

    if (category.id === platform.id) {
      const fields = await prisma.categoryField.findMany({
        where: {
          categoryId: platform.id,
          scope: { in: scopes },
          ...(activeOnly ? { isActive: true } : {}),
        },
        orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
      });
      return mergeFieldLayers([{ source: "platform", fields }]);
    }

    const ancestors = await ancestorChain(category.id);
    const root = ancestors[0];
    const layerIds = [platform.id, ...ancestors.map((node) => node.id)];
    const rows = await prisma.categoryField.findMany({
      where: {
        categoryId: { in: layerIds },
        scope: { in: scopes },
        ...(activeOnly ? { isActive: true } : {}),
      },
    });

    const byCategory = new Map<string, typeof rows>();
    for (const row of rows) {
      const list = byCategory.get(row.categoryId) ?? [];
      list.push(row);
      byCategory.set(row.categoryId, list);
    }

    const composed: ComposedField[] = [];
    for (const scope of scopes) {
      const inScope = (id: string) => (byCategory.get(id) ?? []).filter((field) => field.scope === scope);
      composed.push(
        ...mergeFieldLayers([
          { source: "platform", fields: inScope(platform.id) },
          ...(root ? [{ source: "main" as const, fields: inScope(root.id) }] : []),
          ...ancestors.slice(1).map((node) => ({ source: "sub" as const, fields: inScope(node.id) })),
        ]),
      );
    }
    return composed;
  },

  async listFormLayers(categoryId: string, kind: FormKind) {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: { parent: { select: { id: true, name: true, slug: true } } },
    });
    if (!category) throw new ApiError(404, "CATEGORY_NOT_FOUND", "Category not found");
    const platform = await this.ensurePlatformCategory();
    const scopes = scopesForFormKind(kind);
    const ids = [platform.id, category.parentId, category.id].filter((id): id is string => Boolean(id));
    const rows = await prisma.categoryField.findMany({
      where: { categoryId: { in: ids }, scope: { in: scopes } },
      orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
    });
    const inLayer = (id: string) => rows.filter((field) => field.categoryId === id);
    const fields = await this.listComposedFields(categoryId, { kind, activeOnly: false });
    return {
      category: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        parent: category.parent,
      },
      kind,
      layers: {
        platform: inLayer(platform.id),
        main: category.parentId ? inLayer(category.parentId) : inLayer(category.id),
        sub: category.parentId ? inLayer(category.id) : [],
      },
      fields,
      formSchemaVersion: formSchemaVersion(fields),
    };
  },

  findField(id: string) {
    return prisma.categoryField.findUnique({ where: { id } });
  },

  async createField(categoryId: string, input: z.infer<typeof categoryFieldUpsertSchema>) {
    try {
      return await prisma.categoryField.create({
        data: {
          categoryId,
          key: input.key,
          label: input.label,
          helpText: input.helpText ?? null,
          placeholder: input.placeholder ?? null,
          fieldType: input.fieldType,
          required: input.required ?? false,
          defaultValue:
            input.defaultValue === undefined
              ? undefined
              : input.defaultValue === null
                ? Prisma.DbNull
                : (input.defaultValue as Prisma.InputJsonValue),
          options: input.options ?? undefined,
          validation: input.validation ?? undefined,
          conditionalRules:
            input.conditionalRules === undefined
              ? undefined
              : input.conditionalRules === null
                ? Prisma.DbNull
                : (input.conditionalRules as Prisma.InputJsonValue),
          scope: input.scope ?? CategoryFieldScope.listing,
          sortOrder: input.sortOrder ?? 0,
          section: input.section ?? null,
          isFilterable: input.isFilterable ?? false,
          isSearchable: input.isSearchable ?? false,
          isActive: input.isActive ?? true,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ApiError(409, "FIELD_KEY_IN_USE", "Field key already exists in this category");
      }
      throw error;
    }
  },

  async updateField(id: string, input: Partial<z.infer<typeof categoryFieldUpsertSchema>>) {
    try {
      return await prisma.categoryField.update({
        where: { id },
        data: {
          key: input.key,
          label: input.label,
          helpText: input.helpText,
          placeholder: input.placeholder,
          fieldType: input.fieldType,
          required: input.required,
          defaultValue:
            input.defaultValue === undefined
              ? undefined
              : input.defaultValue === null
                ? Prisma.DbNull
                : (input.defaultValue as Prisma.InputJsonValue),
          options: input.options === null ? Prisma.DbNull : input.options,
          validation: input.validation === null ? Prisma.DbNull : input.validation,
          conditionalRules:
            input.conditionalRules === undefined
              ? undefined
              : input.conditionalRules === null
                ? Prisma.DbNull
                : (input.conditionalRules as Prisma.InputJsonValue),
          scope: input.scope,
          sortOrder: input.sortOrder,
          section: input.section,
          isFilterable: input.isFilterable,
          isSearchable: input.isSearchable,
          isActive: input.isActive,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new ApiError(404, "FIELD_NOT_FOUND", "Category field not found");
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ApiError(409, "FIELD_KEY_IN_USE", "Field key already exists in this category");
      }
      throw error;
    }
  },

  async deleteField(id: string) {
    try {
      await prisma.categoryField.delete({ where: { id } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new ApiError(404, "FIELD_NOT_FOUND", "Category field not found");
      }
      throw error;
    }
  },

  async reorderFields(ids: string[]) {
    const unique = [...new Set(ids)];
    if (unique.length !== ids.length) {
      throw new ApiError(400, "DUPLICATE_FIELD_ID", "Reorder list contains duplicate field ids");
    }
    const fields = await prisma.categoryField.findMany({ where: { id: { in: ids } } });
    if (fields.length !== ids.length) {
      throw new ApiError(400, "FIELD_NOT_FOUND", "One or more fields were not found");
    }
    await prisma.$transaction(
      ids.map((id, index) =>
        prisma.categoryField.update({ where: { id }, data: { sortOrder: index } }),
      ),
    );
    return prisma.categoryField.findMany({
      where: { id: { in: ids } },
      orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
    });
  },

  async referenceCounts(id: string) {
    const [listings, services, children] = await Promise.all([
      prisma.listing.count({ where: { categoryId: id } }),
      prisma.service.count({ where: { categoryId: id } }),
      prisma.category.count({ where: { parentId: id } }),
    ]);
    return { listings, services, children };
  },

  async deactivateCategory(id: string) {
    try {
      return await prisma.category.update({
        where: { id },
        data: { isActive: false },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new ApiError(404, "CATEGORY_NOT_FOUND", "Category not found");
      }
      throw error;
    }
  },

  async hardDeleteCategory(id: string) {
    const refs = await this.referenceCounts(id);
    if (refs.listings || refs.services || refs.children) {
      throw new ApiError(
        409,
        "CATEGORY_IN_USE",
        "Category is referenced by listings, services, or subcategories; deactivate it instead",
      );
    }
    try {
      return await prisma.category.delete({ where: { id } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new ApiError(404, "CATEGORY_NOT_FOUND", "Category not found");
      }
      throw error;
    }
  },

  async upsertListingValues(listingId: string, values: NormalizedFieldValue[]) {
    for (const value of values) {
      await prisma.listingFieldValue.upsert({
        where: { listingId_fieldId: { listingId, fieldId: value.fieldId } },
        update: {
          valueText: value.valueText,
          valueNumber: value.valueNumber,
          valueBool: value.valueBool,
          valueJson: value.valueJson === null ? Prisma.DbNull : value.valueJson,
        },
        create: {
          listingId,
          fieldId: value.fieldId,
          valueText: value.valueText,
          valueNumber: value.valueNumber,
          valueBool: value.valueBool,
          valueJson: value.valueJson === null ? Prisma.DbNull : value.valueJson,
        },
      });
    }
  },

  listListingValues(listingId: string) {
    return prisma.listingFieldValue.findMany({
      where: { listingId, field: { isActive: true } },
      include: { field: true },
      orderBy: [{ field: { sortOrder: "asc" } }],
    });
  },

  async upsertServiceValues(serviceId: string, values: NormalizedFieldValue[]) {
    for (const value of values) {
      await prisma.serviceFieldValue.upsert({
        where: { serviceId_fieldId: { serviceId, fieldId: value.fieldId } },
        update: {
          valueText: value.valueText,
          valueNumber: value.valueNumber,
          valueBool: value.valueBool,
          valueJson: value.valueJson === null ? Prisma.DbNull : value.valueJson,
        },
        create: {
          serviceId,
          fieldId: value.fieldId,
          valueText: value.valueText,
          valueNumber: value.valueNumber,
          valueBool: value.valueBool,
          valueJson: value.valueJson === null ? Prisma.DbNull : value.valueJson,
        },
      });
    }
  },

  listServiceValues(serviceId: string) {
    return prisma.serviceFieldValue.findMany({
      where: { serviceId, field: { isActive: true } },
      include: { field: true },
      orderBy: [{ field: { sortOrder: "asc" } }],
    });
  },
};
