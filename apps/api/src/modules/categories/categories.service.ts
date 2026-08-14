import { CategoryFieldScope } from "@prisma/client";
import { z } from "zod";
import { ApiError } from "../../shared/errors/index.js";
import { writeAuditLog } from "../../shared/logging/audit.js";
import { FORM_KINDS, formSchemaVersion, type FormKind } from "../../shared/domain/composed-forms.js";
import {
  categoriesRepository,
  categoryFieldUpsertSchema,
  categoryUpsertSchema,
  fieldReorderSchema,
} from "./categories.repository.js";

function parseFormKind(value: string): FormKind {
  const kind = z.enum(FORM_KINDS).safeParse(value);
  if (!kind.success) throw new ApiError(400, "INVALID_FORM_KIND", "Form kind must be provider or listing");
  return kind.data;
}

export const categoriesService = {
  async listTree(activeOnly = true, includeInternal = false) {
    if (includeInternal) await categoriesRepository.ensurePlatformCategory();
    return categoriesRepository.findRootTree(activeOnly, { includeInternal });
  },

  async getPublic(idOrSlug: string) {
    const category = await categoriesRepository.findPublicByIdOrSlug(idOrSlug);
    if (!category) throw new ApiError(404, "CATEGORY_NOT_FOUND", "Category not found");
    return category;
  },

  async listFields(categoryIdOrSlug: string, options?: { activeOnly?: boolean; scope?: string; compose?: boolean }) {
    const category = await categoriesRepository.findByIdOrSlug(categoryIdOrSlug);
    if (!category) throw new ApiError(404, "CATEGORY_NOT_FOUND", "Category not found");
    const activeOnly = options?.activeOnly ?? true;
    if (activeOnly && !category.isActive) {
      throw new ApiError(404, "CATEGORY_NOT_FOUND", "Category not found");
    }
    const scope = options?.scope
      ? z.nativeEnum(CategoryFieldScope).parse(options.scope)
      : undefined;

    if (options?.compose === false) {
      const fields = await categoriesRepository.listFields(category.id, { activeOnly, scope });
      return { category: { id: category.id, name: category.name, slug: category.slug }, fields };
    }

    const kind: FormKind =
      scope === CategoryFieldScope.service ? "listing" : "provider";
    let fields = await categoriesRepository.listComposedFields(category.id, { kind, activeOnly });
    if (scope === CategoryFieldScope.listing || scope === CategoryFieldScope.business) {
      fields = fields.filter((field) => field.scope === scope);
    }
    if (!scope) {
      const listingFields = await categoriesRepository.listComposedFields(category.id, {
        kind: "listing",
        activeOnly,
      });
      fields = [...fields, ...listingFields];
    }
    return {
      category: { id: category.id, name: category.name, slug: category.slug, parentId: category.parentId },
      fields,
      formSchemaVersion: formSchemaVersion(fields),
    };
  },

  async getPublicForm(idOrSlug: string, kindValue: string) {
    const kind = parseFormKind(kindValue);
    const category = await categoriesRepository.findByIdOrSlug(idOrSlug);
    if (!category || !category.isActive || category.slug.startsWith("_")) {
      throw new ApiError(404, "CATEGORY_NOT_FOUND", "Category not found");
    }
    const fields = await categoriesRepository.listComposedFields(category.id, { kind, activeOnly: true });
    return {
      kind,
      category: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        parentId: category.parentId,
      },
      fields,
      formSchemaVersion: formSchemaVersion(fields),
    };
  },

  async getAdminForm(categoryId: string, kindValue: string) {
    return categoriesRepository.listFormLayers(categoryId, parseFormKind(kindValue));
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

  async removeCategory(
    id: string,
    hard: boolean,
    ctx: { actorId: string; ip?: string; requestId?: string },
  ) {
    const existing = await categoriesRepository.findById(id);
    if (!existing) throw new ApiError(404, "CATEGORY_NOT_FOUND", "Category not found");
    if (existing.slug.startsWith("_") && hard) {
      throw new ApiError(400, "PLATFORM_CATEGORY", "The platform category cannot be deleted");
    }
    const category = hard
      ? await categoriesRepository.hardDeleteCategory(id)
      : await categoriesRepository.deactivateCategory(id);
    await writeAuditLog({
      actorId: ctx.actorId,
      action: hard ? "admin.category.hard_delete" : "admin.category.deactivate",
      entityType: "category",
      entityId: id,
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

  async reorderFields(
    input: z.infer<typeof fieldReorderSchema>,
    ctx: { actorId: string; ip?: string; requestId?: string },
  ) {
    const fields = await categoriesRepository.reorderFields(input.ids);
    await writeAuditLog({
      actorId: ctx.actorId,
      action: "admin.category_field.reorder",
      entityType: "category_field",
      meta: { ids: input.ids },
      ip: ctx.ip,
      requestId: ctx.requestId,
    });
    return fields;
  },
};
