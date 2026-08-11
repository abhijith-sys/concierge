import { Router } from "express";
import { clearAuthCookie, requireAuth, setAuthCookie } from "../../shared/auth/index.js";
import { loginSchema, registerSchema } from "./auth.schemas.js";
import { authService } from "./auth.service.js";

export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  const data = registerSchema.parse(req.body);
  const user = await authService.register(data);
  setAuthCookie(res, user);
  res.status(201).json({ user });
});

authRouter.post("/login", async (req, res) => {
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
