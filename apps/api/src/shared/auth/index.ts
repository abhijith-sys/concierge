import type { RequestHandler, Response } from "express";
import type { Role } from "@prisma/client";
import jwt from "jsonwebtoken";
import { AUTH_COOKIE_NAME, JWT_TTL_SECONDS } from "../../config/constants.js";
import { getEnv } from "../../config/env.js";
import { ApiError } from "../errors/index.js";

function jwtSecret() {
  return getEnv().JWT_SECRET;
}

export function setAuthCookie(res: Response, user: { id: string; role: Role }) {
  const token = jwt.sign(user, jwtSecret(), { expiresIn: JWT_TTL_SECONDS });
  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: getEnv().COOKIE_SECURE,
    maxAge: JWT_TTL_SECONDS * 1000,
    path: "/",
  });
}

export function clearAuthCookie(res: Response) {
  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    sameSite: "lax",
    secure: getEnv().COOKIE_SECURE,
    path: "/",
  });
}

export const optionalAuth: RequestHandler = (req, _res, next) => {
  const token = req.cookies?.[AUTH_COOKIE_NAME] as string | undefined;
  if (!token) {
    next();
    return;
  }
  try {
    const payload = jwt.verify(token, jwtSecret()) as { id: string; role: Role };
    req.user = { id: payload.id, role: payload.role };
  } catch {
    // Expired or invalid cookie is treated as anonymous.
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
