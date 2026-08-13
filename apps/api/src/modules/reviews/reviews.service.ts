import { BusinessStatus, Role } from "@prisma/client";
import { assertCanViewBusiness, type AuthUser } from "../../shared/domain/business.js";
import { ApiError } from "../../shared/errors/index.js";
import { paginate } from "../../shared/utils/index.js";
import { reviewsRepository } from "./reviews.repository.js";
import type { CreateReviewInput, ListReviewsQuery } from "./reviews.schemas.js";

export const reviewsService = {
  async list(query: ListReviewsQuery, user?: AuthUser) {
    const business = await reviewsRepository.findBusinessForList(query.businessId);
    assertCanViewBusiness(business, user);
    const [reviews, total] = await reviewsRepository.list(
      query.businessId,
      query.page,
      query.pageSize,
    );
    return {
      reviews,
      pagination: paginate(total, query.page, query.pageSize),
    };
  },

  async create(input: CreateReviewInput, user: AuthUser) {
    const business = await reviewsRepository.findBusinessForCreate(input.businessId);
    if (
      !business?.listing ||
      (business.status !== BusinessStatus.active && user.role !== Role.admin)
    ) {
      throw new ApiError(404, "BUSINESS_NOT_FOUND", "Business not found");
    }
    if (business.ownerId === user.id) {
      throw new ApiError(403, "OWN_BUSINESS_REVIEW", "Owners cannot review their own business");
    }
    const existing = await reviewsRepository.findExistingReview(user.id, input.businessId);
    if (existing) {
      throw new ApiError(409, "REVIEW_EXISTS", "You have already reviewed this business");
    }
    return reviewsRepository.createWithAggregate({ ...input, userId: user.id });
  },

  async remove(id: string, user: AuthUser) {
    const review = await reviewsRepository.findById(id);
    if (!review) {
      throw new ApiError(404, "REVIEW_NOT_FOUND", "Review not found");
    }
    if (review.userId !== user.id && user.role !== Role.admin) {
      throw new ApiError(
        403,
        "FORBIDDEN",
        "Only the review author or an administrator can delete this review",
      );
    }
    await reviewsRepository.deleteWithAggregate(id, review.businessId);
  },
};
