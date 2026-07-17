import type { RequestHandler, Response } from "express";
import type { Role } from "@prisma/client";
import jwt from "jsonwebtoken";
import { ApiError } from "../lib/errors.js";

const COOKIE_NAME = "concierge_session";
const JWT_TTL_SECONDS = 60 * 60 * 24 * 7;

function jwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is required");
  }
  return secret;
}

export function setAuthCookie(res: Response, user: { id: string; role: Role }) {
  const token = jwt.sign(user, jwtSecret(), { expiresIn: JWT_TTL_SECONDS });
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.COOKIE_SECURE === "true",
    maxAge: JWT_TTL_SECONDS * 1000,
    path: "/",
  });
}

export function clearAuthCookie(res: Response) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.COOKIE_SECURE === "true",
    path: "/",
  });
}

export const optionalAuth: RequestHandler = (req, _res, next) => {
  const token = req.cookies?.[COOKIE_NAME] as string | undefined;
  if (!token) {
    next();
    return;
  }
  try {
    const payload = jwt.verify(token, jwtSecret()) as { id: string; role: Role };
    req.user = { id: payload.id, role: payload.role };
  } catch {
    // An expired or invalid cookie is equivalent to an anonymous request.
  }
  next();
};

export const requireAuth: RequestHandler = (req, _res, next) => {
  if (!req.user) {
    next(new ApiError(401, "UNAUTHENTICATED", "Authentication required"));
    return;
  }
  next();
};

export function requireRole(...roles: Role[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) {
      next(new ApiError(401, "UNAUTHENTICATED", "Authentication required"));
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(new ApiError(403, "FORBIDDEN", "You do not have permission to perform this action"));
      return;
    }
    next();
  };
}
