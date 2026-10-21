CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');
CREATE TYPE "ConsentStatus" AS ENUM ('RECORDED', 'WITHDRAWN');
CREATE TYPE "BusinessAssessmentStatus" AS ENUM ('PENDING', 'COMPLETED', 'NEEDS_REVIEW');
CREATE TYPE "DocumentStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');
CREATE TYPE "ReactivationDecisionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE "verifications" (
  "id" TEXT NOT NULL,
  "verificationNumber" VARCHAR(40) NOT NULL,
  "type" VARCHAR(50) NOT NULL,
  "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
  "evidenceReference" VARCHAR(120) NOT NULL,
  "verifiedAt" TIMESTAMP(3),
  "notes" VARCHAR(500),
  "isSampleData" BOOLEAN NOT NULL DEFAULT false,
  "borrowerId" TEXT NOT NULL,
  "verifiedByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "verifications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "consent_records" (
  "id" TEXT NOT NULL,
  "consentNumber" VARCHAR(80) NOT NULL,
  "consentType" VARCHAR(50) NOT NULL,
  "version" VARCHAR(30) NOT NULL,
  "status" "ConsentStatus" NOT NULL DEFAULT 'RECORDED',
  "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "isSampleData" BOOLEAN NOT NULL DEFAULT false,
  "borrowerId" TEXT NOT NULL,
  "recordedByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "consent_records_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "business_assessments" (
  "id" TEXT NOT NULL,
  "assessmentNumber" VARCHAR(40) NOT NULL,
  "summary" VARCHAR(1000) NOT NULL,
  "status" "BusinessAssessmentStatus" NOT NULL DEFAULT 'PENDING',
  "assessedAt" TIMESTAMP(3),
  "isSampleData" BOOLEAN NOT NULL DEFAULT false,
  "borrowerId" TEXT NOT NULL,
  "assessedByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "business_assessments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "documents" (
  "id" TEXT NOT NULL,
  "documentNumber" VARCHAR(80) NOT NULL,
  "type" VARCHAR(50) NOT NULL,
  "fileName" VARCHAR(255),
  "storageReference" VARCHAR(255) NOT NULL,
  "status" "DocumentStatus" NOT NULL DEFAULT 'PENDING',
  "isPrivate" BOOLEAN NOT NULL DEFAULT true,
  "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "isSampleData" BOOLEAN NOT NULL DEFAULT false,
  "borrowerId" TEXT NOT NULL,
  "uploadedByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "reactivation_decisions" (
  "id" TEXT NOT NULL,
  "decisionNumber" VARCHAR(50) NOT NULL,
  "requestReason" VARCHAR(500) NOT NULL,
  "status" "ReactivationDecisionStatus" NOT NULL DEFAULT 'PENDING',
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "decisionReason" VARCHAR(500),
  "decidedAt" TIMESTAMP(3),
  "isSampleData" BOOLEAN NOT NULL DEFAULT false,
  "restrictionId" TEXT NOT NULL,
  "requestedByUserId" TEXT NOT NULL,
  "decidedByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "reactivation_decisions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "verifications_verificationNumber_key" ON "verifications"("verificationNumber");
CREATE INDEX "verifications_borrowerId_createdAt_idx" ON "verifications"("borrowerId", "createdAt");
CREATE INDEX "verifications_status_idx" ON "verifications"("status");
CREATE UNIQUE INDEX "consent_records_consentNumber_key" ON "consent_records"("consentNumber");
CREATE INDEX "consent_records_borrowerId_recordedAt_idx" ON "consent_records"("borrowerId", "recordedAt");
CREATE UNIQUE INDEX "business_assessments_assessmentNumber_key" ON "business_assessments"("assessmentNumber");
CREATE INDEX "business_assessments_borrowerId_createdAt_idx" ON "business_assessments"("borrowerId", "createdAt");
CREATE INDEX "business_assessments_status_idx" ON "business_assessments"("status");
CREATE UNIQUE INDEX "documents_documentNumber_key" ON "documents"("documentNumber");
CREATE INDEX "documents_borrowerId_uploadedAt_idx" ON "documents"("borrowerId", "uploadedAt");
CREATE INDEX "documents_status_idx" ON "documents"("status");
CREATE UNIQUE INDEX "reactivation_decisions_decisionNumber_key" ON "reactivation_decisions"("decisionNumber");
CREATE INDEX "reactivation_decisions_restrictionId_createdAt_idx" ON "reactivation_decisions"("restrictionId", "createdAt");
CREATE INDEX "reactivation_decisions_status_requestedAt_idx" ON "reactivation_decisions"("status", "requestedAt");

ALTER TABLE "verifications" ADD CONSTRAINT "verifications_borrowerId_fkey" FOREIGN KEY ("borrowerId") REFERENCES "borrowers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "verifications" ADD CONSTRAINT "verifications_verifiedByUserId_fkey" FOREIGN KEY ("verifiedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_borrowerId_fkey" FOREIGN KEY ("borrowerId") REFERENCES "borrowers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_recordedByUserId_fkey" FOREIGN KEY ("recordedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "business_assessments" ADD CONSTRAINT "business_assessments_borrowerId_fkey" FOREIGN KEY ("borrowerId") REFERENCES "borrowers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "business_assessments" ADD CONSTRAINT "business_assessments_assessedByUserId_fkey" FOREIGN KEY ("assessedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "documents" ADD CONSTRAINT "documents_borrowerId_fkey" FOREIGN KEY ("borrowerId") REFERENCES "borrowers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "reactivation_decisions" ADD CONSTRAINT "reactivation_decisions_restrictionId_fkey" FOREIGN KEY ("restrictionId") REFERENCES "borrower_restrictions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "reactivation_decisions" ADD CONSTRAINT "reactivation_decisions_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "reactivation_decisions" ADD CONSTRAINT "reactivation_decisions_decidedByUserId_fkey" FOREIGN KEY ("decidedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "verifications" ("id", "verificationNumber", "type", "status", "evidenceReference", "verifiedAt", "isSampleData", "borrowerId", "createdAt", "updatedAt")
SELECT md5(random()::text || "id"), 'VER-' || "customerId", 'GHANA_CARD',
  CASE WHEN "ghanaCardVerified" THEN 'VERIFIED'::"VerificationStatus" ELSE 'PENDING'::"VerificationStatus" END,
  'KYC-' || "customerId", CASE WHEN "ghanaCardVerified" THEN "updatedAt" ELSE NULL END,
  "isSampleData", "id", "createdAt", "updatedAt" FROM "borrowers";

INSERT INTO "consent_records" ("id", "consentNumber", "consentType", "version", "status", "recordedAt", "isSampleData", "borrowerId", "createdAt", "updatedAt")
SELECT md5(random()::text || "id"), "consentReference", 'BORROWER_DATA_AND_CREDIT', 'v1', 'RECORDED',
  "createdAt", "isSampleData", "id", "createdAt", "updatedAt" FROM "borrowers";

INSERT INTO "business_assessments" ("id", "assessmentNumber", "summary", "status", "assessedAt", "isSampleData", "borrowerId", "createdAt", "updatedAt")
SELECT md5(random()::text || "id"), 'BUS-' || "customerId", "businessDetails", 'COMPLETED',
  "createdAt", "isSampleData", "id", "createdAt", "updatedAt" FROM "borrowers";

INSERT INTO "documents" ("id", "documentNumber", "type", "storageReference", "status", "isPrivate", "uploadedAt", "isSampleData", "borrowerId", "createdAt", "updatedAt")
SELECT md5(random()::text || "id"), 'DOC-KYC-' || "customerId", 'GHANA_CARD', 'private://borrowers/' || "id" || '/ghana-card',
  CASE WHEN "ghanaCardVerified" THEN 'VERIFIED'::"DocumentStatus" ELSE 'PENDING'::"DocumentStatus" END,
  true, "createdAt", "isSampleData", "id", "createdAt", "updatedAt" FROM "borrowers";

INSERT INTO "documents" ("id", "documentNumber", "type", "storageReference", "status", "isPrivate", "uploadedAt", "isSampleData", "borrowerId", "createdAt", "updatedAt")
SELECT md5(random()::text || "id"), 'DOC-CONS-' || "customerId", 'BORROWER_CONSENT', 'private://borrowers/' || "id" || '/consent',
  'VERIFIED', true, "createdAt", "isSampleData", "id", "createdAt", "updatedAt" FROM "borrowers";

INSERT INTO "reactivation_decisions" ("id", "decisionNumber", "requestReason", "status", "requestedAt", "decisionReason", "decidedAt", "isSampleData", "restrictionId", "requestedByUserId", "decidedByUserId", "createdAt", "updatedAt")
SELECT md5(random()::text || "id"), "restrictionNumber" || '-D1', "reactivationReason",
  CASE WHEN "status" = 'REACTIVATION_PENDING' THEN 'PENDING'::"ReactivationDecisionStatus"
       WHEN "status" = 'REACTIVATED' THEN 'APPROVED'::"ReactivationDecisionStatus"
       ELSE 'REJECTED'::"ReactivationDecisionStatus" END,
  "requestedAt", "decisionReason", "decidedAt", "isSampleData", "id", "requestedByUserId", "decidedByUserId", "requestedAt", "updatedAt"
FROM "borrower_restrictions" WHERE "requestedAt" IS NOT NULL AND "requestedByUserId" IS NOT NULL;

DROP INDEX "borrower_restrictions_status_requestedAt_idx";
ALTER TABLE "borrower_restrictions" DROP CONSTRAINT "borrower_restrictions_requestedByUserId_fkey";
ALTER TABLE "borrower_restrictions" DROP CONSTRAINT "borrower_restrictions_decidedByUserId_fkey";
ALTER TABLE "borrower_restrictions"
  DROP COLUMN "reactivationReason",
  DROP COLUMN "requestedAt",
  DROP COLUMN "decisionReason",
  DROP COLUMN "decidedAt",
  DROP COLUMN "requestedByUserId",
  DROP COLUMN "decidedByUserId";
