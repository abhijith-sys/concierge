import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../shared/auth/index.js";
import { createReviewSchema, listReviewsSchema } from "./reviews.schemas.js";
import { reviewsService } from "./reviews.service.js";

export const reviewsRouter = Router();

reviewsRouter.get("/", async (req, res) => {
  const query = listReviewsSchema.parse(req.query);
  const result = await reviewsService.list(query, req.user);
  res.json(result);
});

reviewsRouter.post("/", requireAuth, async (req, res) => {
  const data = createReviewSchema.parse(req.body);
  const review = await reviewsService.create(data, req.user!);
  res.status(201).json({ review });
});

reviewsRouter.delete("/:id", requireAuth, async (req, res) => {
  const id = z.string().uuid().parse(req.params.id);
  await reviewsService.remove(id, req.user!);
  res.status(204).send();
});
