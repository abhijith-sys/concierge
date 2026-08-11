import { Router } from "express";
import { clearAuthCookie, requireAuth, setAuthCookie } from "../../shared/auth/index.js";
import { strictRateLimit } from "../../shared/middleware/index.js";
import {
  loginSchema,
  otpRequestSchema,
  otpVerifySchema,
  registerSchema,
  updateMeSchema,
} from "./auth.schemas.js";
import { authService } from "./auth.service.js";

export const authRouter = Router();

authRouter.post("/register", strictRateLimit({ name: "auth-register", max: 10 }), async (req, res) => {
  const data = registerSchema.parse(req.body);
  const user = await authService.register(data);
  setAuthCookie(res, user);
  res.status(201).json({ user });
});

authRouter.post("/login", strictRateLimit({ name: "auth-login", max: 20 }), async (req, res) => {
  const data = loginSchema.parse(req.body);
  const user = await authService.login(data);
  setAuthCookie(res, user);
  res.json({ user });
});

authRouter.post("/logout", (_req, res) => {
  clearAuthCookie(res);
  res.status(204).send();
});

authRouter.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await authService.me(req.user!.id);
    res.json({ user });
  } catch (error) {
    clearAuthCookie(res);
    throw error;
  }
});

authRouter.patch("/me", requireAuth, async (req, res) => {
  const data = updateMeSchema.parse(req.body);
  const user = await authService.updateMe(req.user!.id, data);
  res.json({ user });
});

authRouter.post(
  "/otp/request",
  requireAuth,
  strictRateLimit({ name: "otp-request", max: 5 }),
  async (req, res) => {
    const data = otpRequestSchema.parse(req.body);
    const result = await authService.requestOtp(req.user!.id, data);
    res.json(result);
  },
);

authRouter.post(
  "/otp/verify",
  requireAuth,
  strictRateLimit({ name: "otp-verify", max: 15 }),
  async (req, res) => {
    const data = otpVerifySchema.parse(req.body);
    const user = await authService.verifyOtp(req.user!.id, data);
    res.json({ user });
  },
);
