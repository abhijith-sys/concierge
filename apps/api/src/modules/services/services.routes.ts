import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../shared/auth/index.js";
import { createServiceSchema, updateServiceSchema } from "./services.schemas.js";
import { servicesService } from "./services.service.js";

export const servicesRouter = Router();

servicesRouter.get("/business/:businessId", async (req, res) => {
  const businessId = z.string().uuid().parse(req.params.businessId);
  const services = await servicesService.listForBusiness(businessId, req.user);
  res.json({ services });
});

servicesRouter.post("/", requireAuth, async (req, res) => {
  const data = createServiceSchema.parse(req.body);
  const service = await servicesService.create(data, req.user!);
  res.status(201).json({ service });
});

servicesRouter.patch("/:id", requireAuth, async (req, res) => {
  const id = z.string().uuid().parse(req.params.id);
  const data = updateServiceSchema.parse(req.body);
  const service = await servicesService.update(id, data, req.user!);
  res.json({ service });
});

servicesRouter.delete("/:id", requireAuth, async (req, res) => {
  const id = z.string().uuid().parse(req.params.id);
  await servicesService.remove(id, req.user!);
  res.status(204).send();
});
