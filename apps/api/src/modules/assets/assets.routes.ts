import { Router } from "express";
import { z } from "zod";
import { AttachmentEntityType, AttachmentPurpose } from "@prisma/client";
import { requireAuth } from "../../shared/auth/index.js";
import { assetsRepository, urlForStorageKey } from "./assets.repository.js";

export const assetsRouter = Router();

assetsRouter.get("/entity/:entityType/:entityId", requireAuth, async (req, res) => {
  const entityType = z.nativeEnum(AttachmentEntityType).parse(req.params.entityType);
  const entityId = z.string().uuid().parse(req.params.entityId);
  const purpose = req.query.purpose
    ? z.nativeEnum(AttachmentPurpose).parse(req.query.purpose)
    : undefined;
  const rows = await assetsRepository.listAttachments(entityType, entityId, purpose);
  res.json({
    attachments: rows.map((row) => ({
      id: row.id,
      purpose: row.purpose,
      sortOrder: row.sortOrder,
      asset: {
        id: row.asset.id,
        url: urlForStorageKey(row.asset.storageKey, row.asset.visibility),
        mimeType: row.asset.mimeType,
        visibility: row.asset.visibility,
        status: row.asset.status,
      },
    })),
  });
});
