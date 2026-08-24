import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../shared/auth/index.js";
import {
  createHomeTradeEnquirySchema,
  homeTradeEnquiryListSchema,
  updateHomeTradeEnquirySchema,
} from "./home-trade-enquiries.schemas.js";
import { homeTradeEnquiriesService } from "./home-trade-enquiries.service.js";

export const homeTradeEnquiriesRouter = Router();

homeTradeEnquiriesRouter.post("/", async (req, res) => {
  const data = createHomeTradeEnquirySchema.parse(req.body);
  const enquiry = await homeTradeEnquiriesService.create(data, req.user, {
    ip: req.ip,
    requestId: req.requestId,
  });
  res.status(201).json({ enquiry });
});

homeTradeEnquiriesRouter.get("/", requireAuth, async (req, res) => {
  const query = homeTradeEnquiryListSchema.parse(req.query);
  const result = await homeTradeEnquiriesService.listForActor(query, req.user!);
  res.json(result);
});

homeTradeEnquiriesRouter.patch("/:id", requireAuth, async (req, res) => {
  const id = z.string().uuid().parse(req.params.id);
  const data = updateHomeTradeEnquirySchema.parse(req.body);
  const enquiry = await homeTradeEnquiriesService.update(id, data, req.user!);
  res.json({ enquiry });
});
