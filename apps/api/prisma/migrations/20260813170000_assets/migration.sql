-- Asset / Attachment media pipeline

CREATE TYPE "AssetVisibility" AS ENUM ('public', 'private');
CREATE TYPE "AssetStatus" AS ENUM ('pending', 'ready', 'rejected', 'deleted');
CREATE TYPE "AttachmentEntityType" AS ENUM ('user', 'business', 'listing', 'service', 'verification', 'review', 'message', 'field_value');
CREATE TYPE "AttachmentPurpose" AS ENUM (
  'avatar',
  'logo',
  'cover',
  'gallery',
  'kyc_owner',
  'kyc_location',
  'kyc_storefront',
  'kyc_document',
  'kyc_selfie',
  'kyc_video',
  'review_photo',
  'message_file',
  'field'
);

CREATE TABLE "Asset" (
    "id" UUID NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "byteSize" INTEGER NOT NULL,
    "checksum" TEXT,
    "visibility" "AssetVisibility" NOT NULL DEFAULT 'public',
    "status" "AssetStatus" NOT NULL DEFAULT 'ready',
    "uploadedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Asset_storageKey_key" ON "Asset"("storageKey");
CREATE INDEX "Asset_uploadedById_createdAt_idx" ON "Asset"("uploadedById", "createdAt");
CREATE INDEX "Asset_visibility_status_idx" ON "Asset"("visibility", "status");

CREATE TABLE "AssetVariant" (
    "id" UUID NOT NULL,
    "assetId" UUID NOT NULL,
    "kind" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    CONSTRAINT "AssetVariant_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AssetVariant_storageKey_key" ON "AssetVariant"("storageKey");
CREATE INDEX "AssetVariant_assetId_kind_idx" ON "AssetVariant"("assetId", "kind");

CREATE TABLE "Attachment" (
    "id" UUID NOT NULL,
    "assetId" UUID NOT NULL,
    "entityType" "AttachmentEntityType" NOT NULL,
    "entityId" UUID NOT NULL,
    "purpose" "AttachmentPurpose" NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Attachment_entityType_entityId_purpose_assetId_key"
  ON "Attachment"("entityType", "entityId", "purpose", "assetId");
CREATE INDEX "Attachment_entityType_entityId_purpose_idx"
  ON "Attachment"("entityType", "entityId", "purpose");
CREATE INDEX "Attachment_assetId_idx" ON "Attachment"("assetId");

ALTER TABLE "Asset" ADD CONSTRAINT "Asset_uploadedById_fkey"
  FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AssetVariant" ADD CONSTRAINT "AssetVariant_assetId_fkey"
  FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_assetId_fkey"
  FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
