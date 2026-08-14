-- Composed forms foundation: category metadata, field extras, listing approval.

ALTER TYPE "BusinessStatus" ADD VALUE IF NOT EXISTS 'rejected';

CREATE TYPE "ServiceApprovalStatus" AS ENUM ('draft', 'pending', 'approved', 'rejected');

ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "CategoryField" ADD COLUMN IF NOT EXISTS "placeholder" TEXT;
ALTER TABLE "CategoryField" ADD COLUMN IF NOT EXISTS "defaultValue" JSONB;
ALTER TABLE "CategoryField" ADD COLUMN IF NOT EXISTS "conditionalRules" JSONB;

ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT;
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "formSchemaVersion" INTEGER NOT NULL DEFAULT 1;

ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "pricingType" TEXT;
ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "approvalStatus" "ServiceApprovalStatus" NOT NULL DEFAULT 'approved';
ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT;
ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "formSchemaVersion" INTEGER NOT NULL DEFAULT 1;

CREATE INDEX IF NOT EXISTS "Service_businessId_approvalStatus_idx" ON "Service"("businessId", "approvalStatus");
CREATE INDEX IF NOT EXISTS "Service_approvalStatus_idx" ON "Service"("approvalStatus");
