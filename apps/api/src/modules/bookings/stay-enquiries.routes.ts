import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../shared/auth/index.js";
import {
  createStayEnquirySchema,
  stayEnquiryListSchema,
  updateStayEnquirySchema,
} from "./stay-enquiries.schemas.js";
import { stayEnquiriesService } from "./stay-enquiries.service.js";

export const stayEnquiriesRouter = Router();

stayEnquiriesRouter.post("/", async (req, res) => {
  const data = createStayEnquirySchema.parse(req.body);
  const enquiry = await stayEnquiriesService.create(data, req.user, {
    ip: req.ip,
    requestId: req.requestId,
  });
  res.status(201).json({ enquiry });
});

stayEnquiriesRouter.get("/", requireAuth, async (req, res) => {
  const query = stayEnquiryListSchema.parse(req.query);
  const result = await stayEnquiriesService.listForActor(query, req.user!);
  res.json(result);
});

stayEnquiriesRouter.patch("/:id", requireAuth, async (req, res) => {
  const id = z.string().uuid().parse(req.params.id);
  const data = updateStayEnquirySchema.parse(req.body);
  const enquiry = await stayEnquiriesService.update(id, data, req.user!);
  res.json({ enquiry });
});
