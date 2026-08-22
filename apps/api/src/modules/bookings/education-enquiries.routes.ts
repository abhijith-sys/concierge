import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../shared/auth/index.js";
import {
  createEducationEnquirySchema,
  educationEnquiryListSchema,
  updateEducationEnquirySchema,
} from "./education-enquiries.schemas.js";
import { educationEnquiriesService } from "./education-enquiries.service.js";

export const educationEnquiriesRouter = Router();

educationEnquiriesRouter.post("/", async (req, res) => {
  const data = createEducationEnquirySchema.parse(req.body);
  const enquiry = await educationEnquiriesService.create(data, req.user, {
    ip: req.ip,
    requestId: req.requestId,
  });
  res.status(201).json({ enquiry });
});

educationEnquiriesRouter.get("/", requireAuth, async (req, res) => {
  const query = educationEnquiryListSchema.parse(req.query);
  const result = await educationEnquiriesService.listForActor(query, req.user!);
  res.json(result);
});

educationEnquiriesRouter.patch("/:id", requireAuth, async (req, res) => {
  const id = z.string().uuid().parse(req.params.id);
  const data = updateEducationEnquirySchema.parse(req.body);
  const enquiry = await educationEnquiriesService.update(id, data, req.user!);
  res.json({ enquiry });
});
