CREATE TYPE "ArrearContributionStatus" AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'COLLECTED');
CREATE TYPE "ArrearDisputeStatus" AS ENUM ('OPEN', 'RESOLVED');
CREATE TYPE "ArrearDecisionStatus" AS ENUM ('APPROVED', 'REJECTED');

ALTER TABLE "arrears"
ADD COLUMN "assessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "createdByUserId" TEXT,
ADD COLUMN "guaranteeSnapshotId" TEXT,
ADD COLUMN "instalmentId" TEXT;

CREATE TABLE "arrear_notices" (
  "id" TEXT NOT NULL, "noticeNumber" VARCHAR(60) NOT NULL,
  "noticeType" VARCHAR(40) NOT NULL, "documentReference" VARCHAR(255) NOT NULL,
  "servedAt" TIMESTAMP(3) NOT NULL, "acknowledgedAt" TIMESTAMP(3),
  "arrearId" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "arrear_notices_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "arrear_contributions" (
  "id" TEXT NOT NULL, "contributionNumber" VARCHAR(70) NOT NULL,
  "sequence" INTEGER NOT NULL, "assessedPesewas" INTEGER NOT NULL,
  "collectedPesewas" INTEGER NOT NULL DEFAULT 0,
  "status" "ArrearContributionStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
  "collectedAt" TIMESTAMP(3), "arrearId" TEXT NOT NULL,
  "guarantorBorrowerId" TEXT NOT NULL, "collectedByUserId" TEXT,
  "journalId" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "arrear_contributions_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "arrear_disputes" (
  "id" TEXT NOT NULL, "disputeNumber" VARCHAR(60) NOT NULL,
  "complaint" VARCHAR(1000) NOT NULL, "status" "ArrearDisputeStatus" NOT NULL DEFAULT 'OPEN',
  "resolution" VARCHAR(1000), "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt" TIMESTAMP(3), "arrearId" TEXT NOT NULL,
  "recordedByUserId" TEXT NOT NULL, "resolvedByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "arrear_disputes_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "arrear_decisions" (
  "id" TEXT NOT NULL, "decisionNumber" VARCHAR(60) NOT NULL,
  "status" "ArrearDecisionStatus" NOT NULL, "reason" VARCHAR(500) NOT NULL,
  "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "arrearId" TEXT NOT NULL, "decidedByUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "arrear_decisions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "arrear_notices_noticeNumber_key" ON "arrear_notices"("noticeNumber");
CREATE INDEX "arrear_notices_arrearId_servedAt_idx" ON "arrear_notices"("arrearId", "servedAt");
CREATE UNIQUE INDEX "arrear_contributions_contributionNumber_key" ON "arrear_contributions"("contributionNumber");
CREATE UNIQUE INDEX "arrear_contributions_journalId_key" ON "arrear_contributions"("journalId");
CREATE INDEX "arrear_contributions_guarantorBorrowerId_status_idx" ON "arrear_contributions"("guarantorBorrowerId", "status");
CREATE UNIQUE INDEX "arrear_contributions_arrearId_guarantorBorrowerId_key" ON "arrear_contributions"("arrearId", "guarantorBorrowerId");
CREATE UNIQUE INDEX "arrear_disputes_disputeNumber_key" ON "arrear_disputes"("disputeNumber");
CREATE INDEX "arrear_disputes_arrearId_status_idx" ON "arrear_disputes"("arrearId", "status");
CREATE UNIQUE INDEX "arrear_decisions_decisionNumber_key" ON "arrear_decisions"("decisionNumber");
CREATE INDEX "arrear_decisions_arrearId_decidedAt_idx" ON "arrear_decisions"("arrearId", "decidedAt");
CREATE UNIQUE INDEX "arrears_instalmentId_key" ON "arrears"("instalmentId");

ALTER TABLE "arrears" ADD CONSTRAINT "arrears_instalmentId_fkey" FOREIGN KEY ("instalmentId") REFERENCES "repayment_instalments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "arrears" ADD CONSTRAINT "arrears_guaranteeSnapshotId_fkey" FOREIGN KEY ("guaranteeSnapshotId") REFERENCES "loan_guarantee_snapshots"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "arrears" ADD CONSTRAINT "arrears_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "arrear_notices" ADD CONSTRAINT "arrear_notices_arrearId_fkey" FOREIGN KEY ("arrearId") REFERENCES "arrears"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "arrear_contributions" ADD CONSTRAINT "arrear_contributions_arrearId_fkey" FOREIGN KEY ("arrearId") REFERENCES "arrears"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "arrear_contributions" ADD CONSTRAINT "arrear_contributions_guarantorBorrowerId_fkey" FOREIGN KEY ("guarantorBorrowerId") REFERENCES "borrowers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "arrear_contributions" ADD CONSTRAINT "arrear_contributions_collectedByUserId_fkey" FOREIGN KEY ("collectedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "arrear_contributions" ADD CONSTRAINT "arrear_contributions_journalId_fkey" FOREIGN KEY ("journalId") REFERENCES "journal_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "arrear_disputes" ADD CONSTRAINT "arrear_disputes_arrearId_fkey" FOREIGN KEY ("arrearId") REFERENCES "arrears"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "arrear_disputes" ADD CONSTRAINT "arrear_disputes_recordedByUserId_fkey" FOREIGN KEY ("recordedByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "arrear_disputes" ADD CONSTRAINT "arrear_disputes_resolvedByUserId_fkey" FOREIGN KEY ("resolvedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "arrear_decisions" ADD CONSTRAINT "arrear_decisions_arrearId_fkey" FOREIGN KEY ("arrearId") REFERENCES "arrears"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "arrear_decisions" ADD CONSTRAINT "arrear_decisions_decidedByUserId_fkey" FOREIGN KEY ("decidedByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
