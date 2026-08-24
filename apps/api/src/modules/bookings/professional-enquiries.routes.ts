import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../shared/auth/index.js";
import {
  createProfessionalEnquirySchema,
  professionalEnquiryListSchema,
  updateProfessionalEnquirySchema,
} from "./professional-enquiries.schemas.js";
import { professionalEnquiriesService } from "./professional-enquiries.service.js";

export const professionalEnquiriesRouter = Router();

professionalEnquiriesRouter.post("/", async (req, res) => {
  const data = createProfessionalEnquirySchema.parse(req.body);
  const enquiry = await professionalEnquiriesService.create(data, req.user, {
    ip: req.ip,
    requestId: req.requestId,
  });
  res.status(201).json({ enquiry });
});

professionalEnquiriesRouter.get("/", requireAuth, async (req, res) => {
  const query = professionalEnquiryListSchema.parse(req.query);
  const result = await professionalEnquiriesService.listForActor(query, req.user!);
  res.json(result);
});

professionalEnquiriesRouter.patch("/:id", requireAuth, async (req, res) => {
  const id = z.string().uuid().parse(req.params.id);
  const data = updateProfessionalEnquirySchema.parse(req.body);
  const enquiry = await professionalEnquiriesService.update(id, data, req.user!);
  res.json({ enquiry });
});
