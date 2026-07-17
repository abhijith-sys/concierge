import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import express from "express";
import { errorHandler, notFoundHandler } from "./lib/errors.js";
import { prisma } from "./lib/prisma.js";
import { optionalAuth } from "./middleware/auth.js";
import { apiRouter } from "./routes/index.js";

dotenv.config();

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
    if (!origin || configuredOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error("Origin not allowed by CORS"));
  },
}));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(optionalAuth);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "concierge-api" });
});

app.use("/api", apiRouter);
app.use(notFoundHandler);
app.use(errorHandler);

const server = app.listen(port, () => {
  console.log(`[api] listening on http://localhost:${port}`);
});

async function shutdown(signal: string) {
  console.log(`[api] ${signal} received, shutting down`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
