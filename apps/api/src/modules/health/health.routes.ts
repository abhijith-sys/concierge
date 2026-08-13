import { Router } from "express";
import { SERVICE_NAME } from "../../config/constants.js";
import { prisma } from "../../shared/db/prisma.js";

export const healthRouter = Router();

const startedAt = Date.now();

healthRouter.get("/", async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({
    status: "ok",
    service: SERVICE_NAME,
    database: "connected",
    uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
  });
});
