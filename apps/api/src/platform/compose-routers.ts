import { Router } from "express";
import { authRouter } from "../modules/auth/index.js";
import { businessesRouter } from "../modules/businesses/index.js";
import { categoriesRouter } from "../modules/categories/index.js";
import { healthRouter } from "../modules/health/index.js";
import { reviewsRouter } from "../modules/reviews/index.js";
import { searchRouter } from "../modules/search/index.js";
import { servicesRouter } from "../modules/services/index.js";
import { adminRouter } from "../modules/admin/index.js";
import { verificationRouter } from "../modules/verification/index.js";
import { uploadsRouter } from "../modules/uploads/index.js";
import { assetsRouter } from "../modules/assets/index.js";

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
  apiRouter.use("/services", servicesRouter);
  apiRouter.use("/admin", adminRouter);
  apiRouter.use("/verification", verificationRouter);
  apiRouter.use("/uploads", uploadsRouter);
  apiRouter.use("/assets", assetsRouter);
  return apiRouter;
}
