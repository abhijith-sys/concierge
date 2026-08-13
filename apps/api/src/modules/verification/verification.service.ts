import { BusinessStatus, Role, VerificationStatus } from "@prisma/client";
import { ApiError } from "../../shared/errors/index.js";
import { writeAuditLog } from "../../shared/logging/audit.js";
import { paginate } from "../../shared/utils/index.js";
import type { AuthUser } from "../../shared/domain/business.js";
import { prisma } from "../../shared/db/prisma.js";
import { assetsRepository, urlForStorageKey } from "../assets/assets.repository.js";
import { assetsService } from "../assets/assets.service.js";
import { verificationRepository } from "./verification.repository.js";
import type { z } from "zod";
import type { verificationDraftSchema, verificationReviewSchema } from "./verification.schemas.js";
type DraftInput = z.infer<typeof verificationDraftSchema>;
type ReviewInput = z.infer<typeof verificationReviewSchema>;

function assertOwner(ownerId: string, user: AuthUser) {
  if (user.role !== Role.admin && user.id !== ownerId) {
    throw new ApiError(403, "NOT_OWNER", "Only the business owner can manage verification");
  }
}

export const verificationService = {
  async upsertDraft(input: DraftInput, user: AuthUser) {
    const business = await verificationRepository.findBusiness(input.businessId);
    if (!business) throw new ApiError(404, "BUSINESS_NOT_FOUND", "Business not found");
    assertOwner(business.ownerId, user);
    const existing = await verificationRepository.findDraft(input.businessId);
    const payload = {
      ownerPhotoUrl: input.ownerPhotoUrl,
      locationPhotoUrl: input.locationPhotoUrl,
      storefrontPhotoUrl: input.storefrontPhotoUrl,
      documentUrl: input.documentUrl,
      selfieUrl: input.selfieUrl,
      videoUrl: input.videoUrl ?? null,
      status: VerificationStatus.draft,
    };
    const submission = existing
      ? await verificationRepository.update(existing.id, payload)
      : await verificationRepository.create({ businessId: input.businessId, ...payload });

    await assetsService.dualWriteKycFields(submission.id, payload, user.id);
    return submission;
  },

  async submit(businessId: string, user: AuthUser) {
    const business = await verificationRepository.findBusiness(businessId);
    if (!business) throw new ApiError(404, "BUSINESS_NOT_FOUND", "Business not found");
    assertOwner(business.ownerId, user);
    const draft = await verificationRepository.findDraft(businessId);
    if (!draft) throw new ApiError(400, "NO_DRAFT", "Create a verification draft first");

    const attachments = await assetsRepository.listAttachments("verification", draft.id);
    const byPurpose = new Map(
      attachments
        .filter((row) => row.asset.status === "ready")
        .map((row) => [row.purpose, urlForStorageKey(row.asset.storageKey, row.asset.visibility)]),
    );

    const ownerPhotoUrl = draft.ownerPhotoUrl ?? byPurpose.get("kyc_owner") ?? null;
    const locationPhotoUrl = draft.locationPhotoUrl ?? byPurpose.get("kyc_location") ?? null;
    const storefrontPhotoUrl = draft.storefrontPhotoUrl ?? byPurpose.get("kyc_storefront") ?? null;
    const documentUrl = draft.documentUrl ?? byPurpose.get("kyc_document") ?? null;
    const selfieUrl = draft.selfieUrl ?? byPurpose.get("kyc_selfie") ?? null;

    if (![ownerPhotoUrl, locationPhotoUrl, storefrontPhotoUrl, documentUrl, selfieUrl].every(Boolean)) {
      throw new ApiError(400, "INCOMPLETE", "All required verification photos/documents must be provided");
    }

    return verificationRepository.update(draft.id, {
      ownerPhotoUrl,
      locationPhotoUrl,
      storefrontPhotoUrl,
      documentUrl,
      selfieUrl,
      status: VerificationStatus.submitted,
      submittedAt: new Date(),
    });
  },

  async queue(page = 1, pageSize = 20) {
    const [items, total] = await verificationRepository.listQueue(page, pageSize);
    return { items, pagination: paginate(total, page, pageSize) };
  },

  async review(
    id: string,
    input: ReviewInput,
    ctx: { actorId: string; ip?: string; requestId?: string },
  ) {
    const submission = await verificationRepository.findById(id);
    if (!submission || submission.status !== VerificationStatus.submitted) {
      throw new ApiError(404, "SUBMISSION_NOT_FOUND", "Submitted verification not found");
    }
    const updated = await prisma.$transaction(async (tx) => {
      const row = await tx.verificationSubmission.update({
        where: { id },
        data: {
          status: input.decision === "approved" ? VerificationStatus.approved : VerificationStatus.rejected,
          reviewNotes: input.reviewNotes,
          reviewerId: ctx.actorId,
          reviewedAt: new Date(),
        },
      });
      if (input.decision === "approved") {
        await tx.business.update({
          where: { id: submission.businessId },
          data: {
            verified: true,
            ...(input.activateBusiness ? { status: BusinessStatus.active } : {}),
          },
        });
      }
      return row;
    });
    await writeAuditLog({
      actorId: ctx.actorId,
      action: `admin.verification.${input.decision}`,
      entityType: "verification",
      entityId: id,
      meta: { businessId: submission.businessId },
      ip: ctx.ip,
      requestId: ctx.requestId,
    });
    return updated;
  },

  async mine(businessId: string, user: AuthUser) {
    const business = await verificationRepository.findBusiness(businessId);
    if (!business) throw new ApiError(404, "BUSINESS_NOT_FOUND", "Business not found");
    assertOwner(business.ownerId, user);
    return verificationRepository.findLatest(businessId);
  },
};
