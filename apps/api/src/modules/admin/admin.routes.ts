import { Router } from "express";
import { z } from "zod";
import { BusinessStatus, ServiceApprovalStatus } from "@prisma/client";
import { PERMISSIONS, requireAnyPermission, requirePermission } from "../../shared/auth/index.js";
import {
  categoryFieldUpsertSchema,
  categoryUpsertSchema,
  fieldReorderSchema,
} from "../categories/categories.repository.js";
import { categoriesService } from "../categories/categories.service.js";
import {
  adminAssetListSchema,
  adminAssignRoleSchema,
  adminAuditListSchema,
  adminListSchema,
  adminListingListSchema,
  adminListingPatchSchema,
  adminRejectSchema,
  adminUpdateSchema,
  adminUserListSchema,
  adminUserPatchSchema,
} from "./admin.schemas.js";
import { adminService } from "./admin.service.js";

export const adminRouter = Router();

adminRouter.get(
  "/businesses",
  requirePermission(PERMISSIONS.BUSINESSES_READ),
  async (req, res) => {
    const query = adminListSchema.parse(req.query);
    const result = await adminService.list(query);
    res.json(result);
  },
);

adminRouter.get(
  "/businesses/:id",
  requirePermission(PERMISSIONS.BUSINESSES_READ),
  async (req, res) => {
    const id = z.string().uuid().parse(req.params.id);
    const business = await adminService.get(id);
    res.json({ business });
  },
);

adminRouter.patch(
  "/businesses/:id",
  requirePermission(PERMISSIONS.BUSINESSES_MODERATE),
  async (req, res) => {
    const id = z.string().uuid().parse(req.params.id);
    const data = adminUpdateSchema.parse(req.body);
    const business = await adminService.update(id, data, {
      actorId: req.user!.id,
      ip: req.ip,
      requestId: req.requestId,
    });
    res.json({ business });
  },
);

adminRouter.post(
  "/businesses/:id/suspend",
  requirePermission(PERMISSIONS.BUSINESSES_MODERATE),
  async (req, res) => {
    const id = z.string().uuid().parse(req.params.id);
    const business = await adminService.setStatus(id, BusinessStatus.suspended, {
      actorId: req.user!.id,
      ip: req.ip,
      requestId: req.requestId,
    });
    res.json({ business });
  },
);

adminRouter.post(
  "/businesses/:id/activate",
  requirePermission(PERMISSIONS.BUSINESSES_MODERATE),
  async (req, res) => {
    const id = z.string().uuid().parse(req.params.id);
    const business = await adminService.setStatus(id, BusinessStatus.active, {
      actorId: req.user!.id,
      ip: req.ip,
      requestId: req.requestId,
    });
    res.json({ business });
  },
);

adminRouter.post(
  "/businesses/:id/reject",
  requirePermission(PERMISSIONS.BUSINESSES_MODERATE),
  async (req, res) => {
    const id = z.string().uuid().parse(req.params.id);
    const data = adminRejectSchema.parse(req.body);
    const business = await adminService.setStatus(id, BusinessStatus.rejected, {
      actorId: req.user!.id,
      ip: req.ip,
      requestId: req.requestId,
    }, data.reason);
    res.json({ business });
  },
);

adminRouter.delete(
  "/businesses/:id",
  requirePermission(PERMISSIONS.BUSINESSES_DELETE),
  async (req, res) => {
    const id = z.string().uuid().parse(req.params.id);
    const hard = req.query.hard === "true";
    await adminService.remove(id, hard, {
      actorId: req.user!.id,
      ip: req.ip,
      requestId: req.requestId,
    });
    res.status(204).send();
  },
);

adminRouter.get(
  "/categories",
  requireAnyPermission(
    PERMISSIONS.CATEGORIES_WRITE,
    PERMISSIONS.CATEGORY_FIELDS_WRITE,
    PERMISSIONS.BUSINESSES_READ,
  ),
  async (_req, res) => {
  const categories = await categoriesService.listTree(false, true);
  res.json({ categories });
});

adminRouter.post("/categories", requirePermission(PERMISSIONS.CATEGORIES_WRITE), async (req, res) => {
  const data = categoryUpsertSchema.parse(req.body);
  const category = await categoriesService.createCategory(data, {
    actorId: req.user!.id,
    ip: req.ip,
    requestId: req.requestId,
  });
  res.status(201).json({ category });
});

adminRouter.patch(
  "/categories/:id",
  requirePermission(PERMISSIONS.CATEGORIES_WRITE),
  async (req, res) => {
    const id = z.string().uuid().parse(req.params.id);
    const data = categoryUpsertSchema.partial().parse(req.body);
    const category = await categoriesService.updateCategory(id, data, {
      actorId: req.user!.id,
      ip: req.ip,
      requestId: req.requestId,
    });
    res.json({ category });
  },
);

adminRouter.delete(
  "/categories/:id",
  requirePermission(PERMISSIONS.CATEGORIES_WRITE),
  async (req, res) => {
    const id = z.string().uuid().parse(req.params.id);
    const hard = req.query.hard === "true";
    const category = await categoriesService.removeCategory(id, hard, {
      actorId: req.user!.id,
      ip: req.ip,
      requestId: req.requestId,
    });
    res.json({ category });
  },
);

adminRouter.get(
  "/forms/:categoryId",
  requirePermission(PERMISSIONS.CATEGORY_FIELDS_WRITE),
  async (req, res) => {
    const categoryId = z.string().uuid().parse(req.params.categoryId);
    const kind = typeof req.query.kind === "string" ? req.query.kind : "provider";
    const result = await categoriesService.getAdminForm(categoryId, kind);
    res.json(result);
  },
);

adminRouter.get(
  "/categories/:id/fields",
  requirePermission(PERMISSIONS.CATEGORY_FIELDS_WRITE),
  async (req, res) => {
    const id = z.string().uuid().parse(req.params.id);
    const result = await categoriesService.listFields(id, { activeOnly: false, compose: false });
    res.json(result);
  },
);

adminRouter.post(
  "/categories/:id/fields",
  requirePermission(PERMISSIONS.CATEGORY_FIELDS_WRITE),
  async (req, res) => {
    const id = z.string().uuid().parse(req.params.id);
    const data = categoryFieldUpsertSchema.parse(req.body);
    const field = await categoriesService.createField(id, data, {
      actorId: req.user!.id,
      ip: req.ip,
      requestId: req.requestId,
    });
    res.status(201).json({ field });
  },
);

adminRouter.patch(
  "/category-fields/:fieldId",
  requirePermission(PERMISSIONS.CATEGORY_FIELDS_WRITE),
  async (req, res) => {
    const fieldId = z.string().uuid().parse(req.params.fieldId);
    const data = categoryFieldUpsertSchema.partial().parse(req.body);
    const field = await categoriesService.updateField(fieldId, data, {
      actorId: req.user!.id,
      ip: req.ip,
      requestId: req.requestId,
    });
    res.json({ field });
  },
);

adminRouter.delete(
  "/category-fields/:fieldId",
  requirePermission(PERMISSIONS.CATEGORY_FIELDS_WRITE),
  async (req, res) => {
    const fieldId = z.string().uuid().parse(req.params.fieldId);
    await categoriesService.deleteField(fieldId, {
      actorId: req.user!.id,
      ip: req.ip,
      requestId: req.requestId,
    });
    res.status(204).send();
  },
);

adminRouter.put(
  "/category-fields/reorder",
  requirePermission(PERMISSIONS.CATEGORY_FIELDS_WRITE),
  async (req, res) => {
    const data = fieldReorderSchema.parse(req.body);
    const fields = await categoriesService.reorderFields(data, {
      actorId: req.user!.id,
      ip: req.ip,
      requestId: req.requestId,
    });
    res.json({ fields });
  },
);

adminRouter.get(
  "/listings",
  requirePermission(PERMISSIONS.BUSINESSES_READ),
  async (req, res) => {
    const query = adminListingListSchema.parse(req.query);
    const result = await adminService.listListings(query);
    res.json(result);
  },
);

adminRouter.get(
  "/listings/:id",
  requirePermission(PERMISSIONS.BUSINESSES_READ),
  async (req, res) => {
    const id = z.string().uuid().parse(req.params.id);
    const listing = await adminService.getListing(id);
    res.json({ listing });
  },
);

adminRouter.patch(
  "/listings/:id",
  requirePermission(PERMISSIONS.BUSINESSES_MODERATE),
  async (req, res) => {
    const id = z.string().uuid().parse(req.params.id);
    const data = adminListingPatchSchema.parse(req.body);
    const listing = await adminService.patchListing(id, data, {
      actorId: req.user!.id,
      ip: req.ip,
      requestId: req.requestId,
    });
    res.json({ listing });
  },
);

adminRouter.post(
  "/listings/:id/approve",
  requirePermission(PERMISSIONS.BUSINESSES_MODERATE),
  async (req, res) => {
    const id = z.string().uuid().parse(req.params.id);
    const listing = await adminService.setListingApproval(id, ServiceApprovalStatus.approved, {
      actorId: req.user!.id,
      ip: req.ip,
      requestId: req.requestId,
    });
    res.json({ listing });
  },
);

adminRouter.post(
  "/listings/:id/reject",
  requirePermission(PERMISSIONS.BUSINESSES_MODERATE),
  async (req, res) => {
    const id = z.string().uuid().parse(req.params.id);
    const data = adminRejectSchema.parse(req.body);
    const listing = await adminService.setListingApproval(
      id,
      ServiceApprovalStatus.rejected,
      {
        actorId: req.user!.id,
        ip: req.ip,
        requestId: req.requestId,
      },
      data.reason,
    );
    res.json({ listing });
  },
);

adminRouter.delete(
  "/listings/:id",
  requirePermission(PERMISSIONS.BUSINESSES_DELETE),
  async (req, res) => {
    const id = z.string().uuid().parse(req.params.id);
    await adminService.removeListing(id, {
      actorId: req.user!.id,
      ip: req.ip,
      requestId: req.requestId,
    });
    res.status(204).send();
  },
);

adminRouter.get("/stats", requireAnyPermission(PERMISSIONS.BUSINESSES_READ, PERMISSIONS.AUDIT_READ), async (_req, res) => {
  const stats = await adminService.stats();
  res.json({ stats });
});

adminRouter.get(
  "/settings",
  requireAnyPermission(PERMISSIONS.SETTINGS_WRITE, PERMISSIONS.AUDIT_READ, PERMISSIONS.BUSINESSES_READ),
  async (_req, res) => {
    res.json({ settings: adminService.settings() });
  },
);
adminRouter.get("/users", requirePermission(PERMISSIONS.USERS_READ), async (req, res) => {
  const query = adminUserListSchema.parse(req.query);
  const result = await adminService.listUsers(query);
  res.json(result);
});

adminRouter.patch("/users/:id", requirePermission(PERMISSIONS.USERS_WRITE), async (req, res) => {
  const id = z.string().uuid().parse(req.params.id);
  const data = adminUserPatchSchema.parse(req.body);
  const user = await adminService.patchUser(id, data, {
    actorId: req.user!.id,
    ip: req.ip,
    requestId: req.requestId,
  });
  res.json({ user });
});

adminRouter.get("/roles", requirePermission(PERMISSIONS.ROLES_MANAGE), async (_req, res) => {
  const result = await adminService.listRoles();
  res.json(result);
});

adminRouter.post("/users/:id/roles", requirePermission(PERMISSIONS.ROLES_MANAGE), async (req, res) => {
  const id = z.string().uuid().parse(req.params.id);
  const data = adminAssignRoleSchema.parse(req.body);
  const user = await adminService.assignRole(id, data, {
    actorId: req.user!.id,
    ip: req.ip,
    requestId: req.requestId,
  });
  res.json({ user });
});

adminRouter.delete(
  "/users/:id/roles/:roleKey",
  requirePermission(PERMISSIONS.ROLES_MANAGE),
  async (req, res) => {
    const id = z.string().uuid().parse(req.params.id);
    const roleKey = z.string().trim().min(2).max(80).parse(req.params.roleKey);
    const user = await adminService.removeRole(id, roleKey, {
      actorId: req.user!.id,
      ip: req.ip,
      requestId: req.requestId,
    });
    res.json({ user });
  },
);

adminRouter.get("/audit", requirePermission(PERMISSIONS.AUDIT_READ), async (req, res) => {
  const query = adminAuditListSchema.parse(req.query);
  const result = await adminService.listAudit(query);
  res.json(result);
});

adminRouter.get(
  "/assets",
  requireAnyPermission(PERMISSIONS.ASSETS_READ_PRIVATE, PERMISSIONS.BUSINESSES_READ),
  async (req, res) => {
    const query = adminAssetListSchema.parse(req.query);
    const result = await adminService.listAssets(query);
    res.json(result);
  },
);
