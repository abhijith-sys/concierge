import { CategoryFieldScope } from "@prisma/client";
import { z } from "zod";
import { ApiError } from "../../shared/errors/index.js";
import { writeAuditLog } from "../../shared/logging/audit.js";
import { prisma } from "../../shared/db/prisma.js";
import { FORM_KINDS, formSchemaVersion, type FormKind } from "../../shared/domain/composed-forms.js";
import { assetsService } from "../assets/assets.service.js";
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

async function syncCategoryMedia(
  category: { id: string; imageUrl?: string | null; bannerUrl?: string | null },
  actorId: string,
  patch: { imageUrl?: string | null; bannerUrl?: string | null },
) {
  if (patch.imageUrl !== undefined) {
    if (patch.imageUrl) {
      await assetsService.dualWriteUrl({
        url: patch.imageUrl,
        uploadedById: actorId,
        entityType: "category",
        entityId: category.id,
        purpose: "background",
      });
    } else {
      await assetsService.detach("category", category.id, "background");
    }
  }
  if (patch.bannerUrl !== undefined) {
    if (patch.bannerUrl) {
      await assetsService.dualWriteUrl({
        url: patch.bannerUrl,
        uploadedById: actorId,
        entityType: "category",
        entityId: category.id,
        purpose: "banner",
      });
    } else {
      await assetsService.detach("category", category.id, "banner");
    }
  }
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
    await syncCategoryMedia(category, ctx.actorId, {
      imageUrl: category.imageUrl,
      bannerUrl: category.bannerUrl,
    });
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
    await syncCategoryMedia(category, ctx.actorId, {
      imageUrl: input.imageUrl,
      bannerUrl: input.bannerUrl,
    });
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

  async exportCategories() {
    const tree = await categoriesRepository.findRootTree(false, false);
    type ExportNode = {
      slug: string;
      name: string;
      parentSlug: string | null;
      description: string | null;
      icon: string | null;
      imageUrl: string | null;
      bannerUrl: string | null;
      kind: string;
      sortOrder: number;
      isActive: boolean;
    };
    const flat: ExportNode[] = [];
    function walk(nodes: typeof tree, parentSlug: string | null) {
      for (const node of nodes) {
        flat.push({
          slug: node.slug,
          name: node.name,
          parentSlug,
          description: node.description,
          icon: node.icon,
          imageUrl: node.imageUrl,
          bannerUrl: node.bannerUrl,
          kind: node.kind,
          sortOrder: node.sortOrder,
          isActive: node.isActive,
        });
        if (node.children?.length) walk(node.children, node.slug);
      }
    }
    walk(tree, null);
    return {
      version: 1 as const,
      exportedAt: new Date().toISOString(),
      categories: flat,
    };
  },

  async importCategories(
    input: {
      version: 1;
      categories: Array<{
        slug: string;
        name: string;
        parentSlug?: string | null;
        description?: string | null;
        icon?: string | null;
        imageUrl?: string | null;
        bannerUrl?: string | null;
        kind?: "supplier" | "service";
        sortOrder?: number;
        isActive?: boolean;
      }>;
    },
    ctx: { actorId: string; ip?: string; requestId?: string },
  ) {
    const slugToId = new Map<string, string>();
    const existing = await prisma.category.findMany({ select: { id: true, slug: true } });
    for (const row of existing) slugToId.set(row.slug, row.id);

    let created = 0;
    let updated = 0;
    const pending = [...input.categories];
    let progress = true;
    while (pending.length && progress) {
      progress = false;
      for (let i = pending.length - 1; i >= 0; i -= 1) {
        const row = pending[i]!;
        const parentSlug = row.parentSlug ?? null;
        if (parentSlug && !slugToId.has(parentSlug)) continue;
        const parentId = parentSlug ? slugToId.get(parentSlug) ?? null : null;
        if (parentSlug && !parentId) continue;

        const payload = {
          name: row.name,
          slug: row.slug,
          parentId,
          description: row.description ?? null,
          icon: row.icon ?? null,
          imageUrl: row.imageUrl ?? null,
          bannerUrl: row.bannerUrl ?? null,
          kind: row.kind,
          sortOrder: row.sortOrder,
          isActive: row.isActive,
        };

        const existingId = slugToId.get(row.slug);
        if (existingId) {
          await categoriesRepository.updateCategory(existingId, payload);
          updated += 1;
        } else {
          const createdRow = await categoriesRepository.createCategory({
            ...payload,
            name: row.name,
            slug: row.slug,
          });
          slugToId.set(row.slug, createdRow.id);
          created += 1;
        }
        pending.splice(i, 1);
        progress = true;
      }
    }
    if (pending.length) {
      throw new ApiError(
        400,
        "IMPORT_UNRESOLVED",
        `Could not resolve parent for ${pending.length} categor(ies). Check parentSlug references.`,
      );
    }

    await writeAuditLog({
      actorId: ctx.actorId,
      action: "admin.categories.import",
      entityType: "category",
      meta: { created, updated, total: input.categories.length },
      ip: ctx.ip,
      requestId: ctx.requestId,
    });
    return { created, updated, total: input.categories.length };
  },
};
