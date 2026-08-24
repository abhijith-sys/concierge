import { Router } from "express";
import { searchQuerySchema, suggestQuerySchema } from "./search.schemas.js";
import { searchService } from "./search.service.js";

export const searchRouter = Router();

searchRouter.get("/suggest", async (req, res) => {
  const query = suggestQuerySchema.parse(req.query);
  const result = await searchService.suggest(query);
  res.json(result);
});

searchRouter.get("/", async (req, res) => {
  const query = searchQuerySchema.parse(req.query);
  const result = await searchService.search(query);
  res.json(result);
});
