import { Router } from "express";
import { searchQuerySchema } from "./search.schemas.js";
import { searchService } from "./search.service.js";

export const searchRouter = Router();

searchRouter.get("/", async (req, res) => {
  const query = searchQuerySchema.parse(req.query);
  const result = await searchService.search(query);
  res.json(result);
});
