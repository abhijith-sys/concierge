import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import path from "node:path";
import { getEnv } from "./config/env.js";
import { optionalAuth } from "./shared/auth/index.js";
import { errorHandler, notFoundHandler } from "./shared/errors/index.js";
import {
  ensureCsrfCookie,
  rateLimitMiddleware,
  requestIdMiddleware,
  requireCsrf,
} from "./shared/middleware/index.js";
import { composeApiRouter } from "./platform/compose-routers.js";

export function createApp() {
  const env = getEnv();
  const app = express();
  const uploadRoot = env.UPLOAD_ROOT ?? path.resolve("uploads");

  app.set("trust proxy", 1);
  app.use(requestIdMiddleware);
  app.use(rateLimitMiddleware);
  app.use(
    cors({
      credentials: true,
      origin(origin, callback) {
        callback(null, !origin || env.corsOrigins.includes(origin));
      },
    }),
  );
  app.use(express.json({ limit: "6mb" }));
  app.use(cookieParser());
  app.use(optionalAuth);
  app.use(ensureCsrfCookie);
  app.use(requireCsrf);

  app.use(
    "/uploads/public",
    express.static(path.join(uploadRoot, "public"), {
      fallthrough: false,
      maxAge: env.NODE_ENV === "production" ? "1d" : 0,
    }),
  );

  app.get("/api/ready", async (_req, res) => {
    try {
      const { prisma } = await import("./shared/db/prisma.js");
      await prisma.$queryRaw`SELECT 1`;
      res.json({ ready: true });
    } catch {
      res.status(503).json({ ready: false });
    }
  });

  app.use("/api", composeApiRouter());
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
