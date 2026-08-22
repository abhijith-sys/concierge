-- Event crew package enquiries from guests to organizers, photographers, caterers.

CREATE TYPE "EventEnquiryStatus" AS ENUM ('new', 'viewed', 'responded', 'closed');

CREATE TABLE "EventEnquiry" (
    "id" UUID NOT NULL,
    "businessId" UUID NOT NULL,
    "listingId" UUID NOT NULL,
    "userId" UUID,
    "guestName" TEXT NOT NULL,
    "guestEmail" TEXT NOT NULL,
    "guestPhone" TEXT,
    "eventDate" DATE NOT NULL,
    "eventTime" TEXT,
    "venue" TEXT NOT NULL,
    "guests" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "packageSelections" JSONB NOT NULL,
    "status" "EventEnquiryStatus" NOT NULL DEFAULT 'new',
    "ownerNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventEnquiry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "EventEnquiry_businessId_createdAt_idx" ON "EventEnquiry"("businessId", "createdAt");
CREATE INDEX "EventEnquiry_listingId_createdAt_idx" ON "EventEnquiry"("listingId", "createdAt");
CREATE INDEX "EventEnquiry_userId_idx" ON "EventEnquiry"("userId");
CREATE INDEX "EventEnquiry_status_createdAt_idx" ON "EventEnquiry"("status", "createdAt");

ALTER TABLE "EventEnquiry" ADD CONSTRAINT "EventEnquiry_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EventEnquiry" ADD CONSTRAINT "EventEnquiry_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EventEnquiry" ADD CONSTRAINT "EventEnquiry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Logistics / movers / courier enquiries.

CREATE TYPE "LogisticsEnquiryStatus" AS ENUM ('new', 'viewed', 'responded', 'closed');

CREATE TABLE "LogisticsEnquiry" (
    "id" UUID NOT NULL,
    "businessId" UUID NOT NULL,
    "listingId" UUID NOT NULL,
    "userId" UUID,
    "guestName" TEXT NOT NULL,
    "guestEmail" TEXT NOT NULL,
    "guestPhone" TEXT,
    "pickupDate" DATE NOT NULL,
    "pickupTime" TEXT,
    "pickupLocation" TEXT NOT NULL,
    "dropoffLocation" TEXT NOT NULL,
    "packingRequired" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "serviceSelections" JSONB NOT NULL,
    "status" "LogisticsEnquiryStatus" NOT NULL DEFAULT 'new',
    "ownerNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LogisticsEnquiry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "LogisticsEnquiry_businessId_createdAt_idx" ON "LogisticsEnquiry"("businessId", "createdAt");
CREATE INDEX "LogisticsEnquiry_listingId_createdAt_idx" ON "LogisticsEnquiry"("listingId", "createdAt");
CREATE INDEX "LogisticsEnquiry_userId_idx" ON "LogisticsEnquiry"("userId");
CREATE INDEX "LogisticsEnquiry_status_createdAt_idx" ON "LogisticsEnquiry"("status", "createdAt");

ALTER TABLE "LogisticsEnquiry" ADD CONSTRAINT "LogisticsEnquiry_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LogisticsEnquiry" ADD CONSTRAINT "LogisticsEnquiry_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LogisticsEnquiry" ADD CONSTRAINT "LogisticsEnquiry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
