import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../shared/auth/index.js";
import {
  createRentalEnquirySchema,
  rentalEnquiryListSchema,
  updateRentalEnquirySchema,
} from "./rental-enquiries.schemas.js";
import { rentalEnquiriesService } from "./rental-enquiries.service.js";

export const rentalEnquiriesRouter = Router();

rentalEnquiriesRouter.post("/", async (req, res) => {
  const data = createRentalEnquirySchema.parse(req.body);
  const enquiry = await rentalEnquiriesService.create(data, req.user, {
    ip: req.ip,
    requestId: req.requestId,
  });
  res.status(201).json({ enquiry });
});

rentalEnquiriesRouter.get("/", requireAuth, async (req, res) => {
  const query = rentalEnquiryListSchema.parse(req.query);
  const result = await rentalEnquiriesService.listForActor(query, req.user!);
  res.json(result);
});

rentalEnquiriesRouter.patch("/:id", requireAuth, async (req, res) => {
  const id = z.string().uuid().parse(req.params.id);
  const data = updateRentalEnquirySchema.parse(req.body);
  const enquiry = await rentalEnquiriesService.update(id, data, req.user!);
  res.json({ enquiry });
});
