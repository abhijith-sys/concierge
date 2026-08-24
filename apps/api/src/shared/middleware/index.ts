import { randomUUID } from "node:crypto";
import type { RequestHandler } from "express";
import { getEnv } from "../../config/env.js";
import { ApiError } from "../errors/index.js";

export const requestIdMiddleware: RequestHandler = (req, res, next) => {
  const incoming = req.header("x-request-id");
  const requestId = incoming && incoming.trim() ? incoming.trim().slice(0, 100) : randomUUID();
  req.requestId = requestId;
  res.setHeader("x-request-id", requestId);
  next();
};

type Bucket = { count: number; resetAt: number };
const hits = new Map<string, Bucket>();

function takeToken(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const current = hits.get(key);
  if (!current || current.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  current.count += 1;
  return current.count <= max;
}

/** Global limiter (optional). Auth/OTP use stricter buckets below. */
export const rateLimitMiddleware: RequestHandler = (req, res, next) => {
  const env = getEnv();
  const enabled = env.RATE_LIMIT_ENABLED || env.NODE_ENV === "production";
  if (!enabled) {
    next();
    return;
  }
  const key = `global:${req.ip ?? "unknown"}`;
  if (!takeToken(key, 180, 60_000)) {
    res.status(429).json({
      error: { code: "RATE_LIMITED", message: "Too many requests" },
      requestId: req.requestId,
    });
    return;
  }
  next();
};

export function strictRateLimit(options: {
  name: string;
  max: number;
  windowMs?: number;
}): RequestHandler {
  const windowMs = options.windowMs ?? 60_000;
  return (req, res, next) => {
    const key = `${options.name}:${req.ip ?? "unknown"}:${req.user?.id ?? "anon"}`;
    if (!takeToken(key, options.max, windowMs)) {
      next(new ApiError(429, "RATE_LIMITED", "Too many requests for this action"));
      return;
    }
    next();
  };
}

const CSRF_COOKIE = "concierge_csrf";

/** Issues a readable CSRF cookie for double-submit on mutating cookie-auth requests. */
export const ensureCsrfCookie: RequestHandler = (req, res, next) => {
  if (!req.cookies?.[CSRF_COOKIE]) {
    const token = randomUUID();
    res.cookie(CSRF_COOKIE, token, {
      httpOnly: false,
      sameSite: "lax",
      secure: getEnv().COOKIE_SECURE,
      path: "/",
      maxAge: 60 * 60 * 24 * 7 * 1000,
    });
    req.csrfToken = token;
  } else {
    req.csrfToken = req.cookies[CSRF_COOKIE] as string;
  }
  next();
};

export const requireCsrf: RequestHandler = (req, _res, next) => {
  if (getEnv().NODE_ENV === "test") {
    next();
    return;
  }
  const method = req.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    next();
    return;
  }
  // Only enforce when authenticated via cookie session.
  // Login/register replace the session and must work even if a leftover
  // public-web cookie is present (localhost cookies are not port-scoped).
  const csrfExempt = new Set([
    "/api/auth/login",
    "/api/auth/register",
    "/api/auth/refresh",
    "/api/auth/forgot-password",
    "/api/auth/verify-reset-otp",
    "/api/auth/reset-password",
    "/api/auth/logout",
  ]);
  if (!req.user || csrfExempt.has(req.path)) {
    next();
    return;
  }
  const cookieToken = req.cookies?.[CSRF_COOKIE] as string | undefined;
  const headerToken = req.header("x-csrf-token") ?? undefined;
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    next(new ApiError(403, "CSRF_REJECTED", "Invalid CSRF token"));
    return;
  }
  next();
};

export { CSRF_COOKIE };
