-- Education, Health, and Professional service enquiries.

CREATE TYPE "EducationEnquiryStatus" AS ENUM ('new', 'viewed', 'responded', 'closed');

CREATE TABLE "EducationEnquiry" (
    "id" UUID NOT NULL,
    "businessId" UUID NOT NULL,
    "listingId" UUID NOT NULL,
    "userId" UUID,
    "guestName" TEXT NOT NULL,
    "guestEmail" TEXT NOT NULL,
    "guestPhone" TEXT,
    "startDate" DATE NOT NULL,
    "preferredTime" TEXT,
    "learningMode" TEXT,
    "learners" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "courseSelections" JSONB NOT NULL,
    "status" "EducationEnquiryStatus" NOT NULL DEFAULT 'new',
    "ownerNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EducationEnquiry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "EducationEnquiry_businessId_createdAt_idx" ON "EducationEnquiry"("businessId", "createdAt");
CREATE INDEX "EducationEnquiry_listingId_createdAt_idx" ON "EducationEnquiry"("listingId", "createdAt");
CREATE INDEX "EducationEnquiry_userId_idx" ON "EducationEnquiry"("userId");
CREATE INDEX "EducationEnquiry_status_createdAt_idx" ON "EducationEnquiry"("status", "createdAt");

ALTER TABLE "EducationEnquiry" ADD CONSTRAINT "EducationEnquiry_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EducationEnquiry" ADD CONSTRAINT "EducationEnquiry_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EducationEnquiry" ADD CONSTRAINT "EducationEnquiry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TYPE "HealthEnquiryStatus" AS ENUM ('new', 'viewed', 'responded', 'closed');

CREATE TABLE "HealthEnquiry" (
    "id" UUID NOT NULL,
    "businessId" UUID NOT NULL,
    "listingId" UUID NOT NULL,
    "userId" UUID,
    "guestName" TEXT NOT NULL,
    "guestEmail" TEXT NOT NULL,
    "guestPhone" TEXT,
    "appointmentDate" DATE NOT NULL,
    "appointmentTime" TEXT,
    "patients" INTEGER NOT NULL DEFAULT 1,
    "concern" TEXT,
    "notes" TEXT,
    "serviceSelections" JSONB NOT NULL,
    "status" "HealthEnquiryStatus" NOT NULL DEFAULT 'new',
    "ownerNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthEnquiry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "HealthEnquiry_businessId_createdAt_idx" ON "HealthEnquiry"("businessId", "createdAt");
CREATE INDEX "HealthEnquiry_listingId_createdAt_idx" ON "HealthEnquiry"("listingId", "createdAt");
CREATE INDEX "HealthEnquiry_userId_idx" ON "HealthEnquiry"("userId");
CREATE INDEX "HealthEnquiry_status_createdAt_idx" ON "HealthEnquiry"("status", "createdAt");

ALTER TABLE "HealthEnquiry" ADD CONSTRAINT "HealthEnquiry_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HealthEnquiry" ADD CONSTRAINT "HealthEnquiry_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HealthEnquiry" ADD CONSTRAINT "HealthEnquiry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TYPE "ProfessionalEnquiryStatus" AS ENUM ('new', 'viewed', 'responded', 'closed');

CREATE TABLE "ProfessionalEnquiry" (
    "id" UUID NOT NULL,
    "businessId" UUID NOT NULL,
    "listingId" UUID NOT NULL,
    "userId" UUID,
    "guestName" TEXT NOT NULL,
    "guestEmail" TEXT NOT NULL,
    "guestPhone" TEXT,
    "preferredDate" DATE NOT NULL,
    "preferredTime" TEXT,
    "topic" TEXT,
    "notes" TEXT,
    "serviceSelections" JSONB NOT NULL,
    "status" "ProfessionalEnquiryStatus" NOT NULL DEFAULT 'new',
    "ownerNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfessionalEnquiry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ProfessionalEnquiry_businessId_createdAt_idx" ON "ProfessionalEnquiry"("businessId", "createdAt");
CREATE INDEX "ProfessionalEnquiry_listingId_createdAt_idx" ON "ProfessionalEnquiry"("listingId", "createdAt");
CREATE INDEX "ProfessionalEnquiry_userId_idx" ON "ProfessionalEnquiry"("userId");
CREATE INDEX "ProfessionalEnquiry_status_createdAt_idx" ON "ProfessionalEnquiry"("status", "createdAt");

ALTER TABLE "ProfessionalEnquiry" ADD CONSTRAINT "ProfessionalEnquiry_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProfessionalEnquiry" ADD CONSTRAINT "ProfessionalEnquiry_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProfessionalEnquiry" ADD CONSTRAINT "ProfessionalEnquiry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
