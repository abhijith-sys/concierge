import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../shared/auth/index.js";
import {
  automotiveEnquiryListSchema,
  createAutomotiveEnquirySchema,
  updateAutomotiveEnquirySchema,
} from "./automotive-enquiries.schemas.js";
import { automotiveEnquiriesService } from "./automotive-enquiries.service.js";

export const automotiveEnquiriesRouter = Router();

automotiveEnquiriesRouter.post("/", async (req, res) => {
  const data = createAutomotiveEnquirySchema.parse(req.body);
  const enquiry = await automotiveEnquiriesService.create(data, req.user, {
    ip: req.ip,
    requestId: req.requestId,
  });
  res.status(201).json({ enquiry });
});

automotiveEnquiriesRouter.get("/", requireAuth, async (req, res) => {
  const query = automotiveEnquiryListSchema.parse(req.query);
  const result = await automotiveEnquiriesService.listForActor(query, req.user!);
  res.json(result);
});

automotiveEnquiriesRouter.patch("/:id", requireAuth, async (req, res) => {
  const id = z.string().uuid().parse(req.params.id);
  const data = updateAutomotiveEnquirySchema.parse(req.body);
  const enquiry = await automotiveEnquiriesService.update(id, data, req.user!);
  res.json({ enquiry });
});
