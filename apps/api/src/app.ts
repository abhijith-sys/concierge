import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import { getEnv } from "./config/env.js";
import { optionalAuth } from "./shared/auth/index.js";
import { errorHandler, notFoundHandler } from "./shared/errors/index.js";
import { rateLimitMiddleware, requestIdMiddleware } from "./shared/middleware/index.js";
import { composeApiRouter } from "./platform/compose-routers.js";

export function createApp() {
  const env = getEnv();
  const app = express();

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
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use(optionalAuth);

  app.use("/api", composeApiRouter());
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
