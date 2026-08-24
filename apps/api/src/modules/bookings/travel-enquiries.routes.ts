import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../shared/auth/index.js";
import {
  createTravelEnquirySchema,
  travelEnquiryListSchema,
  updateTravelEnquirySchema,
} from "./travel-enquiries.schemas.js";
import { travelEnquiriesService } from "./travel-enquiries.service.js";

export const travelEnquiriesRouter = Router();

travelEnquiriesRouter.post("/", async (req, res) => {
  const data = createTravelEnquirySchema.parse(req.body);
  const enquiry = await travelEnquiriesService.create(data, req.user, {
    ip: req.ip,
    requestId: req.requestId,
  });
  res.status(201).json({ enquiry });
});

travelEnquiriesRouter.get("/", requireAuth, async (req, res) => {
  const query = travelEnquiryListSchema.parse(req.query);
  const result = await travelEnquiriesService.listForActor(query, req.user!);
  res.json(result);
});

travelEnquiriesRouter.patch("/:id", requireAuth, async (req, res) => {
  const id = z.string().uuid().parse(req.params.id);
  const data = updateTravelEnquirySchema.parse(req.body);
  const enquiry = await travelEnquiriesService.update(id, data, req.user!);
  res.json({ enquiry });
});
