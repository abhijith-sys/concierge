import { Role } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { requireRole } from "../../shared/auth/index.js";
import { createBusinessSchema, updateBusinessSchema } from "./businesses.schemas.js";
import { businessesService } from "./businesses.service.js";

export const businessesRouter = Router();

businessesRouter.get("/:slugOrId", async (req, res) => {
  const business = await businessesService.getBySlugOrId(req.params.slugOrId!, req.user);
  res.json({ business });
});

businessesRouter.post("/", requireRole(Role.business, Role.admin), async (req, res) => {
  const data = createBusinessSchema.parse(req.body);
  const business = await businessesService.create(data, req.user!);
  res.status(201).json({ business });
});

businessesRouter.patch("/:id", requireRole(Role.business, Role.admin), async (req, res) => {
  const id = z.string().uuid().parse(req.params.id);
  const data = updateBusinessSchema.parse(req.body);
  const business = await businessesService.update(id, data, req.user!);
  res.json({ business });
});
