import dotenv from "dotenv";
import { createApp } from "./app.js";
import { loadEnv } from "./config/env.js";
import { prisma } from "./shared/db/prisma.js";
import { logger } from "./shared/logging/logger.js";

dotenv.config();
const env = loadEnv();
const app = createApp();

const server = app.listen(env.API_PORT, () => {
  logger.info("listening", { port: env.API_PORT });
});

async function shutdown(signal: string) {
  logger.info("shutdown", { signal });
  const forceExit = setTimeout(() => {
    logger.error("graceful shutdown timed out, forcing exit");
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
