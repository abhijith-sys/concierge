import { BusinessStatus, Role } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { requireRole } from "../../shared/auth/index.js";
import { adminListSchema, adminUpdateSchema } from "./admin.schemas.js";
import { adminService } from "./admin.service.js";

export const adminRouter = Router();
adminRouter.use(requireRole(Role.admin));

adminRouter.get("/businesses", async (req, res) => {
  const query = adminListSchema.parse(req.query);
  const result = await adminService.list(query);
  res.json(result);
});

adminRouter.get("/businesses/:id", async (req, res) => {
  const id = z.string().uuid().parse(req.params.id);
  const business = await adminService.get(id);
  res.json({ business });
});

adminRouter.patch("/businesses/:id", async (req, res) => {
  const id = z.string().uuid().parse(req.params.id);
  const data = adminUpdateSchema.parse(req.body);
  const business = await adminService.update(id, data, {
    actorId: req.user!.id,
    ip: req.ip,
    requestId: req.requestId,
  });
  res.json({ business });
});

adminRouter.post("/businesses/:id/suspend", async (req, res) => {
  const id = z.string().uuid().parse(req.params.id);
  const business = await adminService.setStatus(id, BusinessStatus.suspended, {
    actorId: req.user!.id,
    ip: req.ip,
    requestId: req.requestId,
  });
  res.json({ business });
});

adminRouter.post("/businesses/:id/activate", async (req, res) => {
  const id = z.string().uuid().parse(req.params.id);
  const business = await adminService.setStatus(id, BusinessStatus.active, {
    actorId: req.user!.id,
    ip: req.ip,
    requestId: req.requestId,
  });
  res.json({ business });
});

adminRouter.delete("/businesses/:id", async (req, res) => {
  const id = z.string().uuid().parse(req.params.id);
  const hard = req.query.hard === "true";
  await adminService.remove(id, hard, {
    actorId: req.user!.id,
    ip: req.ip,
    requestId: req.requestId,
  });
  res.status(204).send();
});
