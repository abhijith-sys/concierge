import { z } from "zod";

const DEFAULT_DEV_SECRET = "dev-change-me-in-production";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  DATABASE_URL: z.string().min(1).optional(),
  JWT_SECRET: z.string().min(8),
  CORS_ORIGIN: z.string().default("http://localhost:5173,http://localhost:8080"),
  COOKIE_SECURE: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  RUN_SEED: z
    .enum(["true", "false"])
    .default("true")
    .transform((value) => value === "true"),
  RATE_LIMIT_ENABLED: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  REQUIRE_EMAIL_VERIFICATION: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  UPLOAD_ROOT: z.string().optional(),
});

export type Env = z.infer<typeof envSchema> & {
  corsOrigins: string[];
};

let cached: Env | null = null;

export function resetEnvCache() {
  cached = null;
}

export function loadEnv(raw: NodeJS.ProcessEnv = process.env): Env {
  if (cached) return cached;

  const parsed = envSchema.safeParse(raw);
  if (!parsed.success) {
    console.error("[config] Invalid environment", parsed.error.flatten().fieldErrors);
    if (raw.NODE_ENV === "test") {
      throw new Error("Invalid test environment");
    }
    process.exit(1);
  }

  const data = parsed.data;
  if (data.NODE_ENV === "production" && data.JWT_SECRET === DEFAULT_DEV_SECRET) {
    console.warn(
      "[config] JWT_SECRET is the local development default; replace it before exposing this deployment",
    );
  }
  if (data.NODE_ENV === "production" && !data.COOKIE_SECURE) {
    console.warn("[config] COOKIE_SECURE should be true in production HTTPS deployments");
  }

  cached = {
    ...data,
    corsOrigins: data.CORS_ORIGIN.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
  };
  return cached;
}

export function getEnv(): Env {
  if (!cached) {
    return loadEnv();
  }
  return cached;
}

export { DEFAULT_DEV_SECRET };
