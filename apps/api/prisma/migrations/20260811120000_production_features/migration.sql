-- AlterEnum
ALTER TYPE "BusinessStatus" ADD VALUE IF NOT EXISTS 'suspended';
ALTER TYPE "BusinessStatus" ADD VALUE IF NOT EXISTS 'deleted';

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "OtpChannel" AS ENUM ('email', 'sms');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "OtpPurpose" AS ENUM ('register', 'login', 'change');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "VerificationStatus" AS ENUM ('draft', 'submitted', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- AlterTable User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailVerifiedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phoneVerifiedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT;

-- AlterTable Business
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "coverUrl" TEXT;
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "socialLinks" JSONB;

-- CreateTable VerificationChallenge
CREATE TABLE IF NOT EXISTS "VerificationChallenge" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "channel" "OtpChannel" NOT NULL,
    "purpose" "OtpPurpose" NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VerificationChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable Service
CREATE TABLE IF NOT EXISTS "Service" (
    "id" UUID NOT NULL,
    "businessId" UUID NOT NULL,
    "categoryId" UUID,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "durationMinutes" INTEGER,
    "images" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable VerificationSubmission
CREATE TABLE IF NOT EXISTS "VerificationSubmission" (
    "id" UUID NOT NULL,
    "businessId" UUID NOT NULL,
    "status" "VerificationStatus" NOT NULL DEFAULT 'draft',
    "ownerPhotoUrl" TEXT,
    "locationPhotoUrl" TEXT,
    "storefrontPhotoUrl" TEXT,
    "documentUrl" TEXT,
    "selfieUrl" TEXT,
    "videoUrl" TEXT,
    "reviewerId" UUID,
    "reviewNotes" TEXT,
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "VerificationSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable AuditLog
CREATE TABLE IF NOT EXISTS "AuditLog" (
    "id" UUID NOT NULL,
    "actorId" UUID,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "meta" JSONB,
    "ip" TEXT,
    "requestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "VerificationChallenge_userId_channel_purpose_idx" ON "VerificationChallenge"("userId", "channel", "purpose");
CREATE INDEX IF NOT EXISTS "VerificationChallenge_expiresAt_idx" ON "VerificationChallenge"("expiresAt");
CREATE INDEX IF NOT EXISTS "Service_businessId_isActive_idx" ON "Service"("businessId", "isActive");
CREATE INDEX IF NOT EXISTS "Service_name_idx" ON "Service"("name");
CREATE INDEX IF NOT EXISTS "VerificationSubmission_businessId_status_idx" ON "VerificationSubmission"("businessId", "status");
CREATE INDEX IF NOT EXISTS "VerificationSubmission_status_submittedAt_idx" ON "VerificationSubmission"("status", "submittedAt");
CREATE INDEX IF NOT EXISTS "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");
CREATE INDEX IF NOT EXISTS "AuditLog_actorId_createdAt_idx" ON "AuditLog"("actorId", "createdAt");
CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
CREATE INDEX IF NOT EXISTS "Listing_lat_lng_idx" ON "Listing"("lat", "lng");

DO $$ BEGIN
  ALTER TABLE "VerificationChallenge" ADD CONSTRAINT "VerificationChallenge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "Service" ADD CONSTRAINT "Service_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "Service" ADD CONSTRAINT "Service_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "VerificationSubmission" ADD CONSTRAINT "VerificationSubmission_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
