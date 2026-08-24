import { Router } from "express";
import {
  clearSession,
  issueSession,
  requireAuth,
  rotateRefreshSession,
} from "../../shared/auth/index.js";
import { REFRESH_COOKIE_NAME } from "../../config/constants.js";
import { strictRateLimit } from "../../shared/middleware/index.js";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  otpRequestSchema,
  otpVerifySchema,
  registerSchema,
  resetPasswordSchema,
  updateMeSchema,
  verifyRecoveryOtpSchema,
  verifyResetOtpSchema,
  verifySignupOtpSchema,
} from "./auth.schemas.js";
import { authService } from "./auth.service.js";

export const authRouter = Router();

authRouter.post("/register", strictRateLimit({ name: "auth-register", max: 10 }), async (req, res) => {
  const data = registerSchema.parse(req.body);
  const user = await authService.register(data);
  await issueSession(res, user);
  res.status(201).json({ user });
});

authRouter.post("/login", strictRateLimit({ name: "auth-login", max: 20 }), async (req, res) => {
  const data = loginSchema.parse(req.body);
  const user = await authService.login(data);
  await issueSession(res, user);
  res.json({ user });
});

authRouter.post("/refresh", strictRateLimit({ name: "auth-refresh", max: 60 }), async (req, res) => {
  const raw = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
  if (!raw) {
    res.status(401).json({ error: { code: "UNAUTHENTICATED", message: "Session expired. Please sign in again." } });
    return;
  }
  const user = await rotateRefreshSession(res, raw);
  const full = await authService.me(user.id);
  res.json({ user: full });
});

authRouter.post("/logout", async (req, res) => {
  const raw = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
  await clearSession(res, raw);
  res.status(204).send();
});

authRouter.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await authService.me(req.user!.id);
    res.json({ user });
  } catch (error) {
    await clearSession(res, req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined);
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

authRouter.post(
  "/verify-signup-otp",
  requireAuth,
  strictRateLimit({ name: "verify-signup-otp", max: 15 }),
  async (req, res) => {
    const data = verifySignupOtpSchema.parse(req.body);
    const user = await authService.verifySignupOtp(req.user!.id, data.code);
    res.json({ user });
  },
);

authRouter.post(
  "/resend-signup-otp",
  requireAuth,
  strictRateLimit({ name: "resend-signup-otp", max: 5 }),
  async (req, res) => {
    const result = await authService.resendSignupOtp(req.user!.id);
    res.json(result);
  },
);

authRouter.post(
  "/forgot-password",
  strictRateLimit({ name: "forgot-password", max: 8 }),
  async (req, res) => {
    const data = forgotPasswordSchema.parse(req.body);
    const result = await authService.forgotPassword(data);
    res.json(result);
  },
);

authRouter.post(
  "/verify-reset-otp",
  strictRateLimit({ name: "verify-reset-otp", max: 15 }),
  async (req, res) => {
    const data = verifyResetOtpSchema.parse(req.body);
    const result = await authService.verifyResetOtp(data);
    res.json(result);
  },
);

authRouter.post(
  "/reset-password",
  strictRateLimit({ name: "reset-password", max: 10 }),
  async (req, res) => {
    const data = resetPasswordSchema.parse(req.body);
    const result = await authService.resetPassword(data);
    res.json(result);
  },
);

authRouter.post(
  "/send-recovery-email-otp",
  requireAuth,
  strictRateLimit({ name: "recovery-otp", max: 5 }),
  async (req, res) => {
    const result = await authService.sendRecoveryEmailOtp(req.user!.id);
    res.json(result);
  },
);

authRouter.post(
  "/verify-recovery-email-otp",
  requireAuth,
  strictRateLimit({ name: "verify-recovery-otp", max: 15 }),
  async (req, res) => {
    const data = verifyRecoveryOtpSchema.parse(req.body);
    const user = await authService.verifyRecoveryEmailOtp(req.user!.id, data.code);
    res.json({ user });
  },
);

authRouter.post(
  "/change-password",
  requireAuth,
  strictRateLimit({ name: "change-password", max: 8 }),
  async (req, res) => {
    const data = changePasswordSchema.parse(req.body);
    const user = await authService.changePassword(req.user!.id, data);
    res.json({ user });
  },
);
