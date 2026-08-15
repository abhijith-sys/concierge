-- Category banner + Asset attachments for catalog media.

ALTER TYPE "AttachmentEntityType" ADD VALUE IF NOT EXISTS 'category';
ALTER TYPE "AttachmentPurpose" ADD VALUE IF NOT EXISTS 'background';
ALTER TYPE "AttachmentPurpose" ADD VALUE IF NOT EXISTS 'banner';

ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "bannerUrl" TEXT;
