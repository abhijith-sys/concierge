import { Router } from "express";
import { authRouter } from "../modules/auth/index.js";
import { businessesRouter } from "../modules/businesses/index.js";
import { categoriesRouter } from "../modules/categories/index.js";
import { healthRouter } from "../modules/health/index.js";
import { reviewsRouter } from "../modules/reviews/index.js";
import { searchRouter } from "../modules/search/index.js";

/**
 * Mounts active domain routers under /api.
 * Scaffolded modules (bookings, payments, messaging, ads, analytics, notifications)
 * stay unmounted until implemented — import and wire them here when ready.
 */
export function composeApiRouter() {
  const apiRouter = Router();
  apiRouter.use("/health", healthRouter);
  apiRouter.use("/auth", authRouter);
  apiRouter.use("/categories", categoriesRouter);
  apiRouter.use("/search", searchRouter);
  apiRouter.use("/businesses", businessesRouter);
  apiRouter.use("/reviews", reviewsRouter);
  return apiRouter;
}
