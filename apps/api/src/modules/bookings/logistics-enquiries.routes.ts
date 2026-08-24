import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../shared/auth/index.js";
import {
  createLogisticsEnquirySchema,
  logisticsEnquiryListSchema,
  updateLogisticsEnquirySchema,
} from "./logistics-enquiries.schemas.js";
import { logisticsEnquiriesService } from "./logistics-enquiries.service.js";

export const logisticsEnquiriesRouter = Router();

logisticsEnquiriesRouter.post("/", async (req, res) => {
  const data = createLogisticsEnquirySchema.parse(req.body);
  const enquiry = await logisticsEnquiriesService.create(data, req.user, {
    ip: req.ip,
    requestId: req.requestId,
  });
  res.status(201).json({ enquiry });
});

logisticsEnquiriesRouter.get("/", requireAuth, async (req, res) => {
  const query = logisticsEnquiryListSchema.parse(req.query);
  const result = await logisticsEnquiriesService.listForActor(query, req.user!);
  res.json(result);
});

logisticsEnquiriesRouter.patch("/:id", requireAuth, async (req, res) => {
  const id = z.string().uuid().parse(req.params.id);
  const data = updateLogisticsEnquirySchema.parse(req.body);
  const enquiry = await logisticsEnquiriesService.update(id, data, req.user!);
  res.json({ enquiry });
});
