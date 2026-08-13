import {
  AttachmentEntityType,
  AttachmentPurpose,
  Role,
  type Asset,
} from "@prisma/client";
import { PERMISSIONS } from "../../shared/auth/permissions.js";
import { getPermissionKeysForUser } from "../../shared/auth/rbac.service.js";
import type { AuthUser } from "../../shared/domain/business.js";
import { prisma } from "../../shared/db/prisma.js";
import { ApiError } from "../../shared/errors/index.js";
import type { StoredObject } from "../../shared/integrations/storage.js";
import {
  assetsRepository,
  attachmentUrls,
  checksumOf,
  urlForStorageKey,
} from "./assets.repository.js";

const KYC_PURPOSE_BY_FIELD: Record<string, AttachmentPurpose> = {
  ownerPhotoUrl: "kyc_owner",
  locationPhotoUrl: "kyc_location",
  storefrontPhotoUrl: "kyc_storefront",
  documentUrl: "kyc_document",
  selfieUrl: "kyc_selfie",
  videoUrl: "kyc_video",
};

export const assetsService = {
  async registerUpload(input: {
    stored: StoredObject;
    buffer: Buffer;
    uploadedById: string;
    attach?: {
      entityType: AttachmentEntityType;
      entityId: string;
      purpose: AttachmentPurpose;
      sortOrder?: number;
    };
  }) {
    const asset = await assetsRepository.createFromStored({
      stored: input.stored,
      uploadedById: input.uploadedById,
      checksum: checksumOf(input.buffer),
      status: "ready",
    });

    let attachment = null;
    if (input.attach) {
      attachment = await assetsRepository.attach({
        assetId: asset.id,
        ...input.attach,
      });
    }

    return {
      asset: serializeAsset(asset),
      attachment,
      file: {
        url: input.stored.url,
        key: input.stored.key,
        mime: input.stored.mime,
        bytes: input.stored.bytes,
        visibility: input.stored.visibility,
        assetId: asset.id,
      },
    };
  },

  /** Dual-write: ensure Asset + Attachment exist for a legacy URL field. */
  async dualWriteUrl(input: {
    url: string | null | undefined;
    uploadedById?: string;
    entityType: AttachmentEntityType;
    entityId: string;
    purpose: AttachmentPurpose;
    sortOrder?: number;
  }) {
    if (!input.url) return null;
    const asset = await assetsRepository.ensureFromUrl({
      url: input.url,
      uploadedById: input.uploadedById,
    });
    if (!asset) return null;
    return assetsRepository.attach({
      assetId: asset.id,
      entityType: input.entityType,
      entityId: input.entityId,
      purpose: input.purpose,
      sortOrder: input.sortOrder,
    });
  },

  async dualWriteUrlList(input: {
    urls: string[];
    uploadedById?: string;
    entityType: AttachmentEntityType;
    entityId: string;
    purpose: AttachmentPurpose;
  }) {
    // Replace gallery-style sets so removed URLs drop their attachments.
    await prisma.attachment.deleteMany({
      where: {
        entityType: input.entityType,
        entityId: input.entityId,
        purpose: input.purpose,
      },
    });
    const results = [];
    for (const [index, url] of input.urls.entries()) {
      results.push(
        await this.dualWriteUrl({
          url,
          uploadedById: input.uploadedById,
          entityType: input.entityType,
          entityId: input.entityId,
          purpose: input.purpose,
          sortOrder: index,
        }),
      );
    }
    return results.filter(Boolean);
  },

  async dualWriteKycFields(
    verificationId: string,
    fields: Partial<Record<keyof typeof KYC_PURPOSE_BY_FIELD, string | null | undefined>>,
    uploadedById?: string,
  ) {
    for (const [field, purpose] of Object.entries(KYC_PURPOSE_BY_FIELD) as [
      keyof typeof KYC_PURPOSE_BY_FIELD,
      AttachmentPurpose,
    ][]) {
      const url = fields[field];
      if (url === undefined) continue;
      if (url === null) continue;
      await this.dualWriteUrl({
        url,
        uploadedById,
        entityType: "verification",
        entityId: verificationId,
        purpose,
      });
    }
  },

  async urlsFor(entityType: AttachmentEntityType, entityId: string, purpose?: AttachmentPurpose) {
    const rows = await assetsRepository.listAttachments(entityType, entityId, purpose);
    return attachmentUrls(rows);
  },

  async assertCanReadPrivate(fileName: string, user: AuthUser) {
    const asset = await assetsRepository.findByPrivateFileName(fileName);
    if (!asset || asset.status === "deleted") {
      throw new ApiError(404, "FILE_NOT_FOUND", "Private file not found");
    }

    if (asset.uploadedById === user.id || user.role === Role.admin) {
      return asset;
    }

    const permissions = await getPermissionKeysForUser(user.id, user.role);
    if (permissions.includes(PERMISSIONS.ASSETS_READ_PRIVATE)) {
      return asset;
    }

    for (const attachment of asset.attachments) {
      if (attachment.entityType === "user" && attachment.entityId === user.id) {
        return asset;
      }
      if (attachment.entityType === "business") {
        const business = await prisma.business.findUnique({
          where: { id: attachment.entityId },
          select: { ownerId: true },
        });
        if (business?.ownerId === user.id) return asset;
      }
      if (attachment.entityType === "verification") {
        const submission = await prisma.verificationSubmission.findUnique({
          where: { id: attachment.entityId },
          select: { business: { select: { ownerId: true } } },
        });
        if (submission?.business.ownerId === user.id) return asset;
      }
      if (attachment.entityType === "listing") {
        const listing = await prisma.listing.findUnique({
          where: { id: attachment.entityId },
          select: { business: { select: { ownerId: true } } },
        });
        if (listing?.business.ownerId === user.id) return asset;
      }
    }

    throw new ApiError(403, "FORBIDDEN", "You do not have access to this file");
  },
};

function serializeAsset(asset: Asset) {
  return {
    id: asset.id,
    storageKey: asset.storageKey,
    mimeType: asset.mimeType,
    byteSize: asset.byteSize,
    visibility: asset.visibility,
    status: asset.status,
    url: urlForStorageKey(asset.storageKey, asset.visibility),
    createdAt: asset.createdAt,
  };
}
