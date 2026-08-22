-- Home trades, automotive workshops, and electronics repair enquiries.

CREATE TYPE "HomeTradeEnquiryStatus" AS ENUM ('new', 'viewed', 'responded', 'closed');

CREATE TABLE "HomeTradeEnquiry" (
    "id" UUID NOT NULL,
    "businessId" UUID NOT NULL,
    "listingId" UUID NOT NULL,
    "userId" UUID,
    "guestName" TEXT NOT NULL,
    "guestEmail" TEXT NOT NULL,
    "guestPhone" TEXT,
    "preferredDate" DATE NOT NULL,
    "preferredTime" TEXT,
    "jobLocation" TEXT NOT NULL,
    "notes" TEXT,
    "serviceSelections" JSONB NOT NULL,
    "status" "HomeTradeEnquiryStatus" NOT NULL DEFAULT 'new',
    "ownerNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "HomeTradeEnquiry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "HomeTradeEnquiry_businessId_createdAt_idx" ON "HomeTradeEnquiry"("businessId", "createdAt");
CREATE INDEX "HomeTradeEnquiry_listingId_createdAt_idx" ON "HomeTradeEnquiry"("listingId", "createdAt");
CREATE INDEX "HomeTradeEnquiry_userId_idx" ON "HomeTradeEnquiry"("userId");
CREATE INDEX "HomeTradeEnquiry_status_createdAt_idx" ON "HomeTradeEnquiry"("status", "createdAt");

ALTER TABLE "HomeTradeEnquiry" ADD CONSTRAINT "HomeTradeEnquiry_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HomeTradeEnquiry" ADD CONSTRAINT "HomeTradeEnquiry_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HomeTradeEnquiry" ADD CONSTRAINT "HomeTradeEnquiry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TYPE "AutomotiveEnquiryStatus" AS ENUM ('new', 'viewed', 'responded', 'closed');

CREATE TABLE "AutomotiveEnquiry" (
    "id" UUID NOT NULL,
    "businessId" UUID NOT NULL,
    "listingId" UUID NOT NULL,
    "userId" UUID,
    "guestName" TEXT NOT NULL,
    "guestEmail" TEXT NOT NULL,
    "guestPhone" TEXT,
    "preferredDate" DATE NOT NULL,
    "preferredTime" TEXT,
    "vehicleInfo" TEXT,
    "notes" TEXT,
    "serviceSelections" JSONB NOT NULL,
    "status" "AutomotiveEnquiryStatus" NOT NULL DEFAULT 'new',
    "ownerNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AutomotiveEnquiry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AutomotiveEnquiry_businessId_createdAt_idx" ON "AutomotiveEnquiry"("businessId", "createdAt");
CREATE INDEX "AutomotiveEnquiry_listingId_createdAt_idx" ON "AutomotiveEnquiry"("listingId", "createdAt");
CREATE INDEX "AutomotiveEnquiry_userId_idx" ON "AutomotiveEnquiry"("userId");
CREATE INDEX "AutomotiveEnquiry_status_createdAt_idx" ON "AutomotiveEnquiry"("status", "createdAt");

ALTER TABLE "AutomotiveEnquiry" ADD CONSTRAINT "AutomotiveEnquiry_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AutomotiveEnquiry" ADD CONSTRAINT "AutomotiveEnquiry_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AutomotiveEnquiry" ADD CONSTRAINT "AutomotiveEnquiry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TYPE "ElectronicsEnquiryStatus" AS ENUM ('new', 'viewed', 'responded', 'closed');

CREATE TABLE "ElectronicsEnquiry" (
    "id" UUID NOT NULL,
    "businessId" UUID NOT NULL,
    "listingId" UUID NOT NULL,
    "userId" UUID,
    "guestName" TEXT NOT NULL,
    "guestEmail" TEXT NOT NULL,
    "guestPhone" TEXT,
    "preferredDate" DATE NOT NULL,
    "preferredTime" TEXT,
    "deviceInfo" TEXT,
    "notes" TEXT,
    "serviceSelections" JSONB NOT NULL,
    "status" "ElectronicsEnquiryStatus" NOT NULL DEFAULT 'new',
    "ownerNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ElectronicsEnquiry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ElectronicsEnquiry_businessId_createdAt_idx" ON "ElectronicsEnquiry"("businessId", "createdAt");
CREATE INDEX "ElectronicsEnquiry_listingId_createdAt_idx" ON "ElectronicsEnquiry"("listingId", "createdAt");
CREATE INDEX "ElectronicsEnquiry_userId_idx" ON "ElectronicsEnquiry"("userId");
CREATE INDEX "ElectronicsEnquiry_status_createdAt_idx" ON "ElectronicsEnquiry"("status", "createdAt");

ALTER TABLE "ElectronicsEnquiry" ADD CONSTRAINT "ElectronicsEnquiry_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ElectronicsEnquiry" ADD CONSTRAINT "ElectronicsEnquiry_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ElectronicsEnquiry" ADD CONSTRAINT "ElectronicsEnquiry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
