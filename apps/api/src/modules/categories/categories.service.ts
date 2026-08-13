import { CategoryFieldScope } from "@prisma/client";
import { z } from "zod";
import { ApiError } from "../../shared/errors/index.js";
import { writeAuditLog } from "../../shared/logging/audit.js";
import {
  categoriesRepository,
  categoryFieldUpsertSchema,
  categoryUpsertSchema,
} from "./categories.repository.js";

export const categoriesService = {
  async listTree(activeOnly = true) {
    return categoriesRepository.findRootTree(activeOnly);
  },

  async listFields(categoryIdOrSlug: string, options?: { activeOnly?: boolean; scope?: string }) {
    const category = await categoriesRepository.findByIdOrSlug(categoryIdOrSlug);
    if (!category) throw new ApiError(404, "CATEGORY_NOT_FOUND", "Category not found");
    const activeOnly = options?.activeOnly ?? true;
    if (activeOnly && !category.isActive) {
      throw new ApiError(404, "CATEGORY_NOT_FOUND", "Category not found");
    }
    const scope = options?.scope
      ? z.nativeEnum(CategoryFieldScope).parse(options.scope)
      : undefined;
    const fields = await categoriesRepository.listFields(category.id, {
      activeOnly,
      scope,
    });
    return { category: { id: category.id, name: category.name, slug: category.slug }, fields };
  },

  async createCategory(
    input: z.infer<typeof categoryUpsertSchema>,
    ctx: { actorId: string; ip?: string; requestId?: string },
  ) {
    if (input.parentId) {
      const parent = await categoriesRepository.findById(input.parentId);
      if (!parent) throw new ApiError(400, "INVALID_PARENT", "Parent category not found");
    }
    const category = await categoriesRepository.createCategory(input);
    await writeAuditLog({
      actorId: ctx.actorId,
      action: "admin.category.create",
      entityType: "category",
      entityId: category.id,
      meta: input,
      ip: ctx.ip,
      requestId: ctx.requestId,
    });
    return category;
  },

  async updateCategory(
    id: string,
    input: Partial<z.infer<typeof categoryUpsertSchema>>,
    ctx: { actorId: string; ip?: string; requestId?: string },
  ) {
    const category = await categoriesRepository.updateCategory(id, input);
    await writeAuditLog({
      actorId: ctx.actorId,
      action: "admin.category.update",
      entityType: "category",
      entityId: id,
      meta: input,
      ip: ctx.ip,
      requestId: ctx.requestId,
    });
    return category;
  },

  async createField(
    categoryId: string,
    input: z.infer<typeof categoryFieldUpsertSchema>,
    ctx: { actorId: string; ip?: string; requestId?: string },
  ) {
    const category = await categoriesRepository.findById(categoryId);
    if (!category) throw new ApiError(404, "CATEGORY_NOT_FOUND", "Category not found");
    const field = await categoriesRepository.createField(categoryId, input);
    await writeAuditLog({
      actorId: ctx.actorId,
      action: "admin.category_field.create",
      entityType: "category_field",
      entityId: field.id,
      meta: { categoryId, ...input },
      ip: ctx.ip,
      requestId: ctx.requestId,
    });
    return field;
  },

  async updateField(
    fieldId: string,
    input: Partial<z.infer<typeof categoryFieldUpsertSchema>>,
    ctx: { actorId: string; ip?: string; requestId?: string },
  ) {
    const existing = await categoriesRepository.findField(fieldId);
    if (!existing) throw new ApiError(404, "FIELD_NOT_FOUND", "Category field not found");
    const field = await categoriesRepository.updateField(fieldId, input);
    await writeAuditLog({
      actorId: ctx.actorId,
      action: "admin.category_field.update",
      entityType: "category_field",
      entityId: fieldId,
      meta: input,
      ip: ctx.ip,
      requestId: ctx.requestId,
    });
    return field;
  },

  async deleteField(fieldId: string, ctx: { actorId: string; ip?: string; requestId?: string }) {
    await categoriesRepository.deleteField(fieldId);
    await writeAuditLog({
      actorId: ctx.actorId,
      action: "admin.category_field.delete",
      entityType: "category_field",
      entityId: fieldId,
      ip: ctx.ip,
      requestId: ctx.requestId,
    });
  },
};
