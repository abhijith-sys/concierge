import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../shared/auth/index.js";
import {
  createElectronicsEnquirySchema,
  electronicsEnquiryListSchema,
  updateElectronicsEnquirySchema,
} from "./electronics-enquiries.schemas.js";
import { electronicsEnquiriesService } from "./electronics-enquiries.service.js";

export const electronicsEnquiriesRouter = Router();

electronicsEnquiriesRouter.post("/", async (req, res) => {
  const data = createElectronicsEnquirySchema.parse(req.body);
  const enquiry = await electronicsEnquiriesService.create(data, req.user, {
    ip: req.ip,
    requestId: req.requestId,
  });
  res.status(201).json({ enquiry });
});

electronicsEnquiriesRouter.get("/", requireAuth, async (req, res) => {
  const query = electronicsEnquiryListSchema.parse(req.query);
  const result = await electronicsEnquiriesService.listForActor(query, req.user!);
  res.json(result);
});

electronicsEnquiriesRouter.patch("/:id", requireAuth, async (req, res) => {
  const id = z.string().uuid().parse(req.params.id);
  const data = updateElectronicsEnquirySchema.parse(req.body);
  const enquiry = await electronicsEnquiriesService.update(id, data, req.user!);
  res.json({ enquiry });
});
