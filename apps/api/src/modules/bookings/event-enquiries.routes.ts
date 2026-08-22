import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../shared/auth/index.js";
import {
  createEventEnquirySchema,
  eventEnquiryListSchema,
  updateEventEnquirySchema,
} from "./event-enquiries.schemas.js";
import { eventEnquiriesService } from "./event-enquiries.service.js";

export const eventEnquiriesRouter = Router();

eventEnquiriesRouter.post("/", async (req, res) => {
  const data = createEventEnquirySchema.parse(req.body);
  const enquiry = await eventEnquiriesService.create(data, req.user, {
    ip: req.ip,
    requestId: req.requestId,
  });
  res.status(201).json({ enquiry });
});

eventEnquiriesRouter.get("/", requireAuth, async (req, res) => {
  const query = eventEnquiryListSchema.parse(req.query);
  const result = await eventEnquiriesService.listForActor(query, req.user!);
  res.json(result);
});

eventEnquiriesRouter.patch("/:id", requireAuth, async (req, res) => {
  const id = z.string().uuid().parse(req.params.id);
  const data = updateEventEnquirySchema.parse(req.body);
  const enquiry = await eventEnquiriesService.update(id, data, req.user!);
  res.json({ enquiry });
});
