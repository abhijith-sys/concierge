import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../shared/auth/index.js";
import { addWishlistSchema } from "./wishlist.schemas.js";
import { wishlistService } from "./wishlist.service.js";

export const wishlistRouter = Router();

wishlistRouter.get("/", requireAuth, async (req, res) => {
  const items = await wishlistService.list(req.user!.id);
  res.json({ items });
});

wishlistRouter.post("/", requireAuth, async (req, res) => {
  const data = addWishlistSchema.parse(req.body);
  const item = await wishlistService.add(req.user!.id, data.listingId);
  res.status(201).json({ item });
});

wishlistRouter.delete("/:listingId", requireAuth, async (req, res) => {
  const listingId = z.string().uuid().parse(req.params.listingId);
  await wishlistService.remove(req.user!.id, listingId);
  res.status(204).send();
});
