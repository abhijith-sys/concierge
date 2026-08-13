import { CategoryFieldScope, CategoryFieldType, Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../../shared/db/prisma.js";
import { slugify } from "../../shared/utils/index.js";
import { ApiError } from "../../shared/errors/index.js";
import type { NormalizedFieldValue } from "../../shared/domain/category-fields.js";

export const categoryUpsertSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(160)
    .optional(),
  parentId: z.string().uuid().nullable().optional(),
  icon: z.string().trim().max(80).nullable().optional(),
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
  fieldType: z.nativeEnum(CategoryFieldType),
  required: z.boolean().optional(),
  options: z.array(z.string().min(1).max(120)).max(100).nullable().optional(),
  validation: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
      minLength: z.number().int().optional(),
      maxLength: z.number().int().optional(),
      pattern: z.string().max(200).optional(),
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

export const categoriesRepository = {
  findRootTree(activeOnly = true) {
    return prisma.category.findMany({
      where: {
        parentId: null,
        ...(activeOnly ? { isActive: true } : {}),
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        children: {
          where: activeOnly ? { isActive: true } : undefined,
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        },
      },
    });
  },

  findByIdOrSlug(value: string) {
    const isId = z.string().uuid().safeParse(value).success;
    return prisma.category.findFirst({
      where: isId ? { id: value } : { slug: value },
    });
  },

  findById(id: string) {
    return prisma.category.findUnique({ where: { id } });
  },

  async createCategory(input: z.infer<typeof categoryUpsertSchema>) {
    const slug = input.slug ?? slugify(input.name);
    try {
      return await prisma.category.create({
        data: {
          name: input.name,
          slug,
          parentId: input.parentId ?? null,
          icon: input.icon ?? null,
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
          icon: input.icon,
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
          fieldType: input.fieldType,
          required: input.required ?? false,
          options: input.options ?? undefined,
          validation: input.validation ?? undefined,
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
          fieldType: input.fieldType,
          required: input.required,
          options: input.options === null ? Prisma.DbNull : input.options,
          validation: input.validation === null ? Prisma.DbNull : input.validation,
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
};
