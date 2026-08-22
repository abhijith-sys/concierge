import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../shared/auth/index.js";
import {
  createHealthEnquirySchema,
  healthEnquiryListSchema,
  updateHealthEnquirySchema,
} from "./health-enquiries.schemas.js";
import { healthEnquiriesService } from "./health-enquiries.service.js";

export const healthEnquiriesRouter = Router();

healthEnquiriesRouter.post("/", async (req, res) => {
  const data = createHealthEnquirySchema.parse(req.body);
  const enquiry = await healthEnquiriesService.create(data, req.user, {
    ip: req.ip,
    requestId: req.requestId,
  });
  res.status(201).json({ enquiry });
});

healthEnquiriesRouter.get("/", requireAuth, async (req, res) => {
  const query = healthEnquiryListSchema.parse(req.query);
  const result = await healthEnquiriesService.listForActor(query, req.user!);
  res.json(result);
});

healthEnquiriesRouter.patch("/:id", requireAuth, async (req, res) => {
  const id = z.string().uuid().parse(req.params.id);
  const data = updateHealthEnquirySchema.parse(req.body);
  const enquiry = await healthEnquiriesService.update(id, data, req.user!);
  res.json({ enquiry });
});
