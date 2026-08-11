import bcrypt from "bcryptjs";
import { ApiError } from "../../shared/errors/index.js";
import { EmailService } from "../../shared/integrations/email.js";
import { authRepository } from "./auth.repository.js";
import type { LoginInput, RegisterInput } from "./auth.schemas.js";

export const authService = {
  async register(input: RegisterInput) {
    const email = input.email.toLowerCase();
    const existing = await authRepository.findPublicByEmail(email);
    if (existing) {
      throw new ApiError(409, "EMAIL_IN_USE", "An account with this email already exists");
    }
    const user = await authRepository.createUser({
      name: input.name,
      email,
      phone: input.phone,
      passwordHash: await bcrypt.hash(input.password, 12),
      role: input.role,
    });
    void EmailService.send({
      to: user.email,
      subject: "Welcome to Concierge",
      body: `Welcome, ${user.name}.`,
    });
    return user;
  },

  async login(input: LoginInput) {
    const record = await authRepository.findByEmail(input.email.toLowerCase());
    if (!record || !(await bcrypt.compare(input.password, record.passwordHash))) {
      throw new ApiError(401, "INVALID_CREDENTIALS", "Email or password is incorrect");
    }
    const { passwordHash: _passwordHash, updatedAt: _updatedAt, ...user } = record;
    return user;
  },

  async me(userId: string) {
    const user = await authRepository.findPublicById(userId);
    if (!user) {
      throw new ApiError(401, "UNAUTHENTICATED", "Session user no longer exists");
    }
    return user;
  },
};
