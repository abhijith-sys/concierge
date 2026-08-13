import { Role } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { PERMISSIONS, requireAuth, requirePermission, requireRole } from "../../shared/auth/index.js";
import { verificationDraftSchema, verificationReviewSchema } from "./verification.schemas.js";
import { verificationService } from "./verification.service.js";

export const verificationRouter = Router();

verificationRouter.get("/business/:businessId", requireAuth, async (req, res) => {
  const businessId = z.string().uuid().parse(req.params.businessId);
  const submission = await verificationService.mine(businessId, req.user!);
  res.json({ submission });
});

verificationRouter.put("/draft", requireAuth, requireRole(Role.business, Role.admin), async (req, res) => {
  const data = verificationDraftSchema.parse(req.body);
  const submission = await verificationService.upsertDraft(data, req.user!);
  res.json({ submission });
});

verificationRouter.post("/business/:businessId/submit", requireAuth, requireRole(Role.business, Role.admin), async (req, res) => {
  const businessId = z.string().uuid().parse(req.params.businessId);
  const submission = await verificationService.submit(businessId, req.user!);
  res.json({ submission });
});

verificationRouter.get(
  "/queue",
  requireAuth,
  requirePermission(PERMISSIONS.VERIFICATION_REVIEW),
  async (req, res) => {
    const page = z.coerce.number().int().min(1).default(1).parse(req.query.page ?? 1);
    const pageSize = z.coerce.number().int().min(1).max(50).default(20).parse(req.query.pageSize ?? 20);
    const result = await verificationService.queue(page, pageSize);
    res.json(result);
  },
);

verificationRouter.post(
  "/:id/review",
  requireAuth,
  requirePermission(PERMISSIONS.VERIFICATION_REVIEW),
  async (req, res) => {
    const id = z.string().uuid().parse(req.params.id);
    const data = verificationReviewSchema.parse(req.body);
    const submission = await verificationService.review(id, data, {
      actorId: req.user!.id,
      ip: req.ip,
      requestId: req.requestId,
    });
    res.json({ submission });
  },
);
