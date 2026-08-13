import { Router } from "express";
import { categoriesService } from "./categories.service.js";

export const categoriesRouter = Router();

categoriesRouter.get("/", async (_req, res) => {
  const categories = await categoriesService.listTree();
  res.json({ categories });
});
