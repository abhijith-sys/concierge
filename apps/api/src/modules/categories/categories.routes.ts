import { Router } from "express";
import { z } from "zod";
import { categoriesService } from "./categories.service.js";

export const categoriesRouter = Router();

categoriesRouter.get("/", async (_req, res) => {
  const categories = await categoriesService.listTree(true, false);
  res.json({ categories });
});

categoriesRouter.get("/:idOrSlug/fields", async (req, res) => {
  const idOrSlug = z.string().min(1).max(200).parse(req.params.idOrSlug);
  const scope = typeof req.query.scope === "string" ? req.query.scope : undefined;
  const result = await categoriesService.listFields(idOrSlug, { activeOnly: true, scope });
  res.json(result);
});

categoriesRouter.get("/:idOrSlug/forms/:kind", async (req, res) => {
  const idOrSlug = z.string().min(1).max(200).parse(req.params.idOrSlug);
  const kind = z.string().min(1).max(40).parse(req.params.kind);
  const result = await categoriesService.getPublicForm(idOrSlug, kind);
  res.json(result);
});

categoriesRouter.get("/:idOrSlug", async (req, res) => {
  const idOrSlug = z.string().min(1).max(200).parse(req.params.idOrSlug);
  const category = await categoriesService.getPublic(idOrSlug);
  res.json({ category });
});
