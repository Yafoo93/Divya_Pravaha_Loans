CREATE TABLE "loan_terms_snapshots" (
  "id" TEXT NOT NULL, "snapshotNumber" VARCHAR(80) NOT NULL, "version" INTEGER NOT NULL,
  "principalPesewas" INTEGER NOT NULL, "contractualInterest" INTEGER NOT NULL,
  "totalRepayablePesewas" INTEGER NOT NULL, "termMonths" INTEGER NOT NULL,
  "repaymentFrequency" "RepaymentFrequency" NOT NULL, "businessPurpose" VARCHAR(500) NOT NULL,
  "productCode" VARCHAR(50) NOT NULL, "productVersion" INTEGER NOT NULL,
  "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "isSampleData" BOOLEAN NOT NULL DEFAULT false,
  "loanId" TEXT NOT NULL, "createdByUserId" TEXT NOT NULL,
  CONSTRAINT "loan_terms_snapshots_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "loan_guarantee_snapshots" (
  "id" TEXT NOT NULL, "snapshotNumber" VARCHAR(80) NOT NULL, "version" INTEGER NOT NULL,
  "guarantorBorrowerIds" TEXT[], "agreementNumber" VARCHAR(80) NOT NULL, "agreementVersion" INTEGER NOT NULL,
  "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "isSampleData" BOOLEAN NOT NULL DEFAULT false,
  "loanId" TEXT NOT NULL, "termsSnapshotId" TEXT NOT NULL,
  CONSTRAINT "loan_guarantee_snapshots_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "loan_decisions" (
  "id" TEXT NOT NULL, "decisionNumber" VARCHAR(80) NOT NULL, "status" VARCHAR(20) NOT NULL,
  "reason" VARCHAR(500) NOT NULL, "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "isSampleData" BOOLEAN NOT NULL DEFAULT false, "loanId" TEXT NOT NULL,
  "termsSnapshotId" TEXT NOT NULL, "decidedByUserId" TEXT NOT NULL,
  CONSTRAINT "loan_decisions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "loan_terms_snapshots_snapshotNumber_key" ON "loan_terms_snapshots"("snapshotNumber");
CREATE UNIQUE INDEX "loan_terms_snapshots_loanId_version_key" ON "loan_terms_snapshots"("loanId", "version");
CREATE INDEX "loan_terms_snapshots_loanId_submittedAt_idx" ON "loan_terms_snapshots"("loanId", "submittedAt");
CREATE UNIQUE INDEX "loan_guarantee_snapshots_snapshotNumber_key" ON "loan_guarantee_snapshots"("snapshotNumber");
CREATE UNIQUE INDEX "loan_guarantee_snapshots_termsSnapshotId_key" ON "loan_guarantee_snapshots"("termsSnapshotId");
CREATE UNIQUE INDEX "loan_guarantee_snapshots_loanId_version_key" ON "loan_guarantee_snapshots"("loanId", "version");
CREATE INDEX "loan_guarantee_snapshots_loanId_capturedAt_idx" ON "loan_guarantee_snapshots"("loanId", "capturedAt");
CREATE UNIQUE INDEX "loan_decisions_decisionNumber_key" ON "loan_decisions"("decisionNumber");
CREATE UNIQUE INDEX "loan_decisions_termsSnapshotId_key" ON "loan_decisions"("termsSnapshotId");
CREATE INDEX "loan_decisions_loanId_decidedAt_idx" ON "loan_decisions"("loanId", "decidedAt");
ALTER TABLE "loan_terms_snapshots" ADD CONSTRAINT "loan_terms_snapshots_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "loans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "loan_terms_snapshots" ADD CONSTRAINT "loan_terms_snapshots_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "loan_guarantee_snapshots" ADD CONSTRAINT "loan_guarantee_snapshots_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "loans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "loan_guarantee_snapshots" ADD CONSTRAINT "loan_guarantee_snapshots_termsSnapshotId_fkey" FOREIGN KEY ("termsSnapshotId") REFERENCES "loan_terms_snapshots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "loan_decisions" ADD CONSTRAINT "loan_decisions_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "loans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "loan_decisions" ADD CONSTRAINT "loan_decisions_termsSnapshotId_fkey" FOREIGN KEY ("termsSnapshotId") REFERENCES "loan_terms_snapshots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "loan_decisions" ADD CONSTRAINT "loan_decisions_decidedByUserId_fkey" FOREIGN KEY ("decidedByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
