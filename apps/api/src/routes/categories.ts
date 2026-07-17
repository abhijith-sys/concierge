import { Router } from "express";
import { prisma } from "../lib/prisma.js";

export const categoriesRouter = Router();

categoriesRouter.get("/", async (_req, res) => {
  const categories = await prisma.category.findMany({
    where: { parentId: null },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      children: {
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      },
    },
  });
  res.json({ categories });
});
