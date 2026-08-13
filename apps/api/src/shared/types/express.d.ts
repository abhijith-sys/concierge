import type { Role } from "@prisma/client";
import type { PermissionKey } from "../auth/permissions.js";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: Role;
        permissions?: PermissionKey[];
      };
      requestId?: string;
      csrfToken?: string;
    }
  }
}

export {};
