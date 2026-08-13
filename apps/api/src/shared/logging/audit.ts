import type { Prisma } from "@prisma/client";
import { prisma } from "../db/prisma.js";
import { logger } from "../logging/logger.js";

export async function writeAuditLog(input: {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  meta?: Record<string, unknown>;
  ip?: string | null;
  requestId?: string | null;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: input.actorId ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        meta: (input.meta as Prisma.InputJsonValue | undefined) ?? undefined,
        ip: input.ip ?? null,
        requestId: input.requestId ?? null,
      },
    });
  } catch (error) {
    logger.error("audit.write_failed", { err: error, action: input.action });
  }
}
