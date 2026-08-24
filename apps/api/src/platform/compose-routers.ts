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
import { wishlistRouter } from "../modules/wishlist/index.js";
import {
  automotiveEnquiriesRouter,
  educationEnquiriesRouter,
  electronicsEnquiriesRouter,
  eventEnquiriesRouter,
  healthEnquiriesRouter,
  homeTradeEnquiriesRouter,
  logisticsEnquiriesRouter,
  professionalEnquiriesRouter,
  rentalEnquiriesRouter,
  stayEnquiriesRouter,
  travelEnquiriesRouter,
} from "../modules/bookings/index.js";

/**
 * Mounts active domain routers under /api.
 * Scaffolded modules (payments, messaging, ads, analytics, notifications)
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
  apiRouter.use("/wishlist", wishlistRouter);
  apiRouter.use("/stay-enquiries", stayEnquiriesRouter);
  apiRouter.use("/rental-enquiries", rentalEnquiriesRouter);
  apiRouter.use("/travel-enquiries", travelEnquiriesRouter);
  apiRouter.use("/event-enquiries", eventEnquiriesRouter);
  apiRouter.use("/logistics-enquiries", logisticsEnquiriesRouter);
  apiRouter.use("/education-enquiries", educationEnquiriesRouter);
  apiRouter.use("/health-enquiries", healthEnquiriesRouter);
  apiRouter.use("/professional-enquiries", professionalEnquiriesRouter);
  apiRouter.use("/home-trade-enquiries", homeTradeEnquiriesRouter);
  apiRouter.use("/automotive-enquiries", automotiveEnquiriesRouter);
  apiRouter.use("/electronics-enquiries", electronicsEnquiriesRouter);
  apiRouter.use("/admin", adminRouter);
  apiRouter.use("/verification", verificationRouter);
  apiRouter.use("/uploads", uploadsRouter);
  apiRouter.use("/assets", assetsRouter);
  return apiRouter;
}
