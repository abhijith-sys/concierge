import { Router } from "express";
import { authRouter } from "./auth.js";
import { businessesRouter } from "./businesses.js";
import { categoriesRouter } from "./categories.js";
import { reviewsRouter } from "./reviews.js";
import { searchRouter } from "./search.js";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/categories", categoriesRouter);
apiRouter.use("/search", searchRouter);
apiRouter.use("/businesses", businessesRouter);
apiRouter.use("/reviews", reviewsRouter);
