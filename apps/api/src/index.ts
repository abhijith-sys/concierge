import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import express from "express";
import { errorHandler, notFoundHandler } from "./lib/errors.js";
import { prisma } from "./lib/prisma.js";
import { optionalAuth } from "./middleware/auth.js";
import { apiRouter } from "./routes/index.js";

dotenv.config();

const DEFAULT_DEV_SECRET = "dev-change-me-in-production";
if (!process.env.JWT_SECRET) {
  console.error("[api] JWT_SECRET is required; refusing to start");
  process.exit(1);
}
if (process.env.NODE_ENV === "production" && process.env.JWT_SECRET === DEFAULT_DEV_SECRET) {
  console.warn("[api] JWT_SECRET is the local development default; replace it before exposing this deployment");
}

const app = express();
const port = Number(process.env.API_PORT ?? 3001);
const configuredOrigins = (process.env.CORS_ORIGIN ?? "http://localhost:5173,http://localhost:8080")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.set("trust proxy", 1);
app.use(cors({
  credentials: true,
  origin(origin, callback) {
    // Disallowed origins get no CORS headers (browser blocks the response)
    // instead of surfacing a 500 from the error handler.
    callback(null, !origin || configuredOrigins.includes(origin));
  },
}));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(optionalAuth);

app.get("/api/health", async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ status: "ok", service: "concierge-api", database: "connected" });
});

app.use("/api", apiRouter);
app.use(notFoundHandler);
app.use(errorHandler);

const server = app.listen(port, () => {
  console.log(`[api] listening on http://localhost:${port}`);
});

async function shutdown(signal: string) {
  console.log(`[api] ${signal} received, shutting down`);
  const forceExit = setTimeout(() => {
    console.error("[api] graceful shutdown timed out, forcing exit");
    process.exit(1);
  }, 10_000);
  forceExit.unref();
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
