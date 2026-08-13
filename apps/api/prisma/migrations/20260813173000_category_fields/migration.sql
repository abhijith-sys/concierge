-- Category field schemas + values

CREATE TYPE "CategoryFieldType" AS ENUM (
  'text', 'textarea', 'number', 'boolean', 'select', 'multiselect',
  'date', 'url', 'phone', 'email', 'json', 'asset_ref', 'asset_gallery'
);
CREATE TYPE "CategoryFieldScope" AS ENUM ('listing', 'service', 'business');

ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;
CREATE INDEX IF NOT EXISTS "Category_isActive_idx" ON "Category"("isActive");

CREATE TABLE "CategoryField" (
    "id" UUID NOT NULL,
    "categoryId" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "helpText" TEXT,
    "fieldType" "CategoryFieldType" NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "options" JSONB,
    "validation" JSONB,
    "scope" "CategoryFieldScope" NOT NULL DEFAULT 'listing',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "section" TEXT,
    "isFilterable" BOOLEAN NOT NULL DEFAULT false,
    "isSearchable" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "schemaVersion" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CategoryField_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CategoryField_categoryId_key_key" ON "CategoryField"("categoryId", "key");
CREATE INDEX "CategoryField_categoryId_scope_sortOrder_idx" ON "CategoryField"("categoryId", "scope", "sortOrder");
CREATE INDEX "CategoryField_isActive_idx" ON "CategoryField"("isActive");

CREATE TABLE "ListingFieldValue" (
    "id" UUID NOT NULL,
    "listingId" UUID NOT NULL,
    "fieldId" UUID NOT NULL,
    "valueText" TEXT,
    "valueNumber" DECIMAL(18,4),
    "valueBool" BOOLEAN,
    "valueJson" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ListingFieldValue_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ListingFieldValue_listingId_fieldId_key" ON "ListingFieldValue"("listingId", "fieldId");
CREATE INDEX "ListingFieldValue_fieldId_idx" ON "ListingFieldValue"("fieldId");

CREATE TABLE "ServiceFieldValue" (
    "id" UUID NOT NULL,
    "serviceId" UUID NOT NULL,
    "fieldId" UUID NOT NULL,
    "valueText" TEXT,
    "valueNumber" DECIMAL(18,4),
    "valueBool" BOOLEAN,
    "valueJson" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ServiceFieldValue_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ServiceFieldValue_serviceId_fieldId_key" ON "ServiceFieldValue"("serviceId", "fieldId");
CREATE INDEX "ServiceFieldValue_fieldId_idx" ON "ServiceFieldValue"("fieldId");

ALTER TABLE "CategoryField" ADD CONSTRAINT "CategoryField_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ListingFieldValue" ADD CONSTRAINT "ListingFieldValue_listingId_fkey"
  FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ListingFieldValue" ADD CONSTRAINT "ListingFieldValue_fieldId_fkey"
  FOREIGN KEY ("fieldId") REFERENCES "CategoryField"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ServiceFieldValue" ADD CONSTRAINT "ServiceFieldValue_serviceId_fkey"
  FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ServiceFieldValue" ADD CONSTRAINT "ServiceFieldValue_fieldId_fkey"
  FOREIGN KEY ("fieldId") REFERENCES "CategoryField"("id") ON DELETE CASCADE ON UPDATE CASCADE;
