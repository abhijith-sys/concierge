import { createHash } from "node:crypto";
import type {
  AttachmentEntityType,
  AttachmentPurpose,
  AssetVisibility,
  Prisma,
} from "@prisma/client";
import { prisma } from "../../shared/db/prisma.js";
import type { StoredObject } from "../../shared/integrations/storage.js";

export function urlForStorageKey(storageKey: string, visibility: "public" | "private" | AssetVisibility) {
  if (visibility === "private") {
    const base = storageKey.includes("/") ? storageKey.split("/").pop()! : storageKey;
    return `/api/uploads/private/${base}`;
  }
  if (storageKey.startsWith("public/")) {
    return `/uploads/public/${storageKey.slice("public/".length)}`;
  }
  if (storageKey.startsWith("/")) return storageKey;
  return `/uploads/public/${storageKey}`;
}

export function storageKeyFromUrl(url: string): string | null {
  if (url.startsWith("/uploads/public/")) {
    return `public/${url.slice("/uploads/public/".length)}`;
  }
  if (url.startsWith("/api/uploads/private/")) {
    return `private/${url.slice("/api/uploads/private/".length)}`;
  }
  if (url.startsWith("/uploads/private/")) {
    return `private/${url.slice("/uploads/private/".length)}`;
  }
  // External or design-static paths — store as-is for dual-write tracking
  if (url.startsWith("/") || url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  return null;
}

export function checksumOf(buffer: Buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

export const assetsRepository = {
  createFromStored(input: {
    stored: StoredObject;
    uploadedById?: string;
    checksum?: string;
    status?: "pending" | "ready";
  }) {
    return prisma.asset.create({
      data: {
        storageKey: input.stored.key,
        mimeType: input.stored.mime,
        byteSize: input.stored.bytes,
        checksum: input.checksum,
        visibility: input.stored.visibility,
        status: input.status ?? "ready",
        uploadedById: input.uploadedById,
      },
    });
  },

  findById(id: string) {
    return prisma.asset.findUnique({ where: { id } });
  },

  findByStorageKey(storageKey: string) {
    return prisma.asset.findUnique({ where: { storageKey } });
  },

  findByPrivateFileName(fileName: string) {
    return prisma.asset.findFirst({
      where: {
        visibility: "private",
        status: { not: "deleted" },
        OR: [{ storageKey: `private/${fileName}` }, { storageKey: { endsWith: `/${fileName}` } }],
      },
      include: { attachments: true },
    });
  },

  async ensureFromUrl(input: {
    url: string;
    uploadedById?: string;
    mimeType?: string;
    visibility?: AssetVisibility;
  }) {
    const key = storageKeyFromUrl(input.url);
    if (!key) return null;
    const existing = await prisma.asset.findUnique({ where: { storageKey: key } });
    if (existing) return existing;
    const visibility =
      input.visibility ??
      (key.startsWith("private/") || input.url.includes("/private/") ? "private" : "public");
    return prisma.asset.create({
      data: {
        storageKey: key,
        mimeType: input.mimeType ?? "application/octet-stream",
        byteSize: 0,
        visibility,
        status: "ready",
        uploadedById: input.uploadedById,
      },
    });
  },

  listAttachments(entityType: AttachmentEntityType, entityId: string, purpose?: AttachmentPurpose) {
    return prisma.attachment.findMany({
      where: { entityType, entityId, ...(purpose ? { purpose } : {}) },
      include: { asset: true },
      orderBy: [{ purpose: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
    });
  },

  async attach(input: {
    assetId: string;
    entityType: AttachmentEntityType;
    entityId: string;
    purpose: AttachmentPurpose;
    sortOrder?: number;
    replaceSingleton?: boolean;
  }) {
    const singletonPurposes: AttachmentPurpose[] = [
      "avatar",
      "logo",
      "cover",
      "kyc_owner",
      "kyc_location",
      "kyc_storefront",
      "kyc_document",
      "kyc_selfie",
      "kyc_video",
    ];
    const replace = input.replaceSingleton ?? singletonPurposes.includes(input.purpose);

    return prisma.$transaction(async (tx) => {
      if (replace) {
        await tx.attachment.deleteMany({
          where: {
            entityType: input.entityType,
            entityId: input.entityId,
            purpose: input.purpose,
            NOT: { assetId: input.assetId },
          },
        });
      }
      return tx.attachment.upsert({
        where: {
          entityType_entityId_purpose_assetId: {
            entityType: input.entityType,
            entityId: input.entityId,
            purpose: input.purpose,
            assetId: input.assetId,
          },
        },
        update: { sortOrder: input.sortOrder ?? 0 },
        create: {
          assetId: input.assetId,
          entityType: input.entityType,
          entityId: input.entityId,
          purpose: input.purpose,
          sortOrder: input.sortOrder ?? 0,
        },
        include: { asset: true },
      });
    });
  },

  softDeleteAsset(id: string) {
    return prisma.asset.update({
      where: { id },
      data: { status: "deleted" },
    });
  },
};

export type AttachmentWithAsset = Prisma.AttachmentGetPayload<{ include: { asset: true } }>;

export function attachmentUrls(rows: AttachmentWithAsset[]) {
  return rows
    .filter((row) => row.asset.status === "ready")
    .map((row) => urlForStorageKey(row.asset.storageKey, row.asset.visibility));
}
