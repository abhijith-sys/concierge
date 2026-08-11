import { randomUUID } from "node:crypto";
import type { RequestHandler } from "express";
import { getEnv } from "../../config/env.js";

export const requestIdMiddleware: RequestHandler = (req, res, next) => {
  const incoming = req.header("x-request-id");
  const requestId = incoming && incoming.trim() ? incoming.trim().slice(0, 100) : randomUUID();
  req.requestId = requestId;
  res.setHeader("x-request-id", requestId);
  next();
};

/**
 * Lightweight in-memory limiter behind RATE_LIMIT_ENABLED.
 * Swap the store for Redis later without changing call sites.
 */
const hits = new Map<string, { count: number; resetAt: number }>();

export const rateLimitMiddleware: RequestHandler = (req, res, next) => {
  if (!getEnv().RATE_LIMIT_ENABLED) {
    next();
    return;
  }

  const key = req.ip ?? "unknown";
  const now = Date.now();
  const windowMs = 60_000;
  const max = 120;
  const current = hits.get(key);

  if (!current || current.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    next();
    return;
  }

  current.count += 1;
  if (current.count > max) {
    res.status(429).json({
      error: { code: "RATE_LIMITED", message: "Too many requests" },
      requestId: req.requestId,
    });
    return;
  }
  next();
};
