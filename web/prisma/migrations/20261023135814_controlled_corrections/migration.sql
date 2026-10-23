-- CreateEnum
CREATE TYPE "ControlRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'RESOLVED');

-- CreateTable
CREATE TABLE "reversal_requests" (
    "id" TEXT NOT NULL,
    "requestNumber" VARCHAR(60) NOT NULL,
    "reason" VARCHAR(500) NOT NULL,
    "status" "ControlRequestStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),
    "decisionReason" VARCHAR(500),
    "isSampleData" BOOLEAN NOT NULL DEFAULT false,
    "branchId" TEXT NOT NULL,
    "originalJournalId" TEXT NOT NULL,
    "receiptId" TEXT,
    "requestedByUserId" TEXT NOT NULL,
    "decidedByUserId" TEXT,
    "reversalId" TEXT,

    CONSTRAINT "reversal_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suspense_items" (
    "id" TEXT NOT NULL,
    "suspenseNumber" VARCHAR(60) NOT NULL,
    "sourceReference" VARCHAR(80) NOT NULL,
    "amountPesewas" INTEGER NOT NULL,
    "payerName" VARCHAR(150),
    "status" "ControlRequestStatus" NOT NULL DEFAULT 'PENDING',
    "resolutionNote" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "isSampleData" BOOLEAN NOT NULL DEFAULT false,
    "branchId" TEXT NOT NULL,
    "originJournalId" TEXT NOT NULL,
    "resolutionJournalId" TEXT,
    "resolvedByUserId" TEXT,

    CONSTRAINT "suspense_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "overpayment_liabilities" (
    "id" TEXT NOT NULL,
    "liabilityNumber" VARCHAR(60) NOT NULL,
    "payerName" VARCHAR(150) NOT NULL,
    "payerReference" VARCHAR(100) NOT NULL,
    "amountPesewas" INTEGER NOT NULL,
    "refundedPesewas" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isSampleData" BOOLEAN NOT NULL DEFAULT false,
    "branchId" TEXT NOT NULL,
    "receiptId" TEXT,
    "originJournalId" TEXT NOT NULL,

    CONSTRAINT "overpayment_liabilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refund_requests" (
    "id" TEXT NOT NULL,
    "requestNumber" VARCHAR(60) NOT NULL,
    "amountPesewas" INTEGER NOT NULL,
    "payerVerified" BOOLEAN NOT NULL DEFAULT false,
    "reason" VARCHAR(500) NOT NULL,
    "status" "ControlRequestStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),
    "decisionReason" VARCHAR(500),
    "requestedByUserId" TEXT NOT NULL,
    "decidedByUserId" TEXT,
    "liabilityId" TEXT NOT NULL,
    "refundJournalId" TEXT,

    CONSTRAINT "refund_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "reversal_requests_requestNumber_key" ON "reversal_requests"("requestNumber");

-- CreateIndex
CREATE UNIQUE INDEX "reversal_requests_reversalId_key" ON "reversal_requests"("reversalId");

-- CreateIndex
CREATE INDEX "reversal_requests_branchId_status_requestedAt_idx" ON "reversal_requests"("branchId", "status", "requestedAt");

-- CreateIndex
CREATE INDEX "reversal_requests_originalJournalId_status_idx" ON "reversal_requests"("originalJournalId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "suspense_items_suspenseNumber_key" ON "suspense_items"("suspenseNumber");

-- CreateIndex
CREATE UNIQUE INDEX "suspense_items_sourceReference_key" ON "suspense_items"("sourceReference");

-- CreateIndex
CREATE UNIQUE INDEX "suspense_items_originJournalId_key" ON "suspense_items"("originJournalId");

-- CreateIndex
CREATE UNIQUE INDEX "suspense_items_resolutionJournalId_key" ON "suspense_items"("resolutionJournalId");

-- CreateIndex
CREATE INDEX "suspense_items_branchId_status_createdAt_idx" ON "suspense_items"("branchId", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "overpayment_liabilities_liabilityNumber_key" ON "overpayment_liabilities"("liabilityNumber");

-- CreateIndex
CREATE UNIQUE INDEX "overpayment_liabilities_originJournalId_key" ON "overpayment_liabilities"("originJournalId");

-- CreateIndex
CREATE INDEX "overpayment_liabilities_branchId_createdAt_idx" ON "overpayment_liabilities"("branchId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "refund_requests_requestNumber_key" ON "refund_requests"("requestNumber");

-- CreateIndex
CREATE UNIQUE INDEX "refund_requests_refundJournalId_key" ON "refund_requests"("refundJournalId");

-- CreateIndex
CREATE INDEX "refund_requests_liabilityId_status_idx" ON "refund_requests"("liabilityId", "status");

-- AddForeignKey
ALTER TABLE "reversal_requests" ADD CONSTRAINT "reversal_requests_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reversal_requests" ADD CONSTRAINT "reversal_requests_originalJournalId_fkey" FOREIGN KEY ("originalJournalId") REFERENCES "journal_entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reversal_requests" ADD CONSTRAINT "reversal_requests_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "receipts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reversal_requests" ADD CONSTRAINT "reversal_requests_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reversal_requests" ADD CONSTRAINT "reversal_requests_decidedByUserId_fkey" FOREIGN KEY ("decidedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reversal_requests" ADD CONSTRAINT "reversal_requests_reversalId_fkey" FOREIGN KEY ("reversalId") REFERENCES "reversals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suspense_items" ADD CONSTRAINT "suspense_items_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suspense_items" ADD CONSTRAINT "suspense_items_originJournalId_fkey" FOREIGN KEY ("originJournalId") REFERENCES "journal_entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suspense_items" ADD CONSTRAINT "suspense_items_resolutionJournalId_fkey" FOREIGN KEY ("resolutionJournalId") REFERENCES "journal_entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suspense_items" ADD CONSTRAINT "suspense_items_resolvedByUserId_fkey" FOREIGN KEY ("resolvedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "overpayment_liabilities" ADD CONSTRAINT "overpayment_liabilities_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "overpayment_liabilities" ADD CONSTRAINT "overpayment_liabilities_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "receipts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "overpayment_liabilities" ADD CONSTRAINT "overpayment_liabilities_originJournalId_fkey" FOREIGN KEY ("originJournalId") REFERENCES "journal_entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refund_requests" ADD CONSTRAINT "refund_requests_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refund_requests" ADD CONSTRAINT "refund_requests_decidedByUserId_fkey" FOREIGN KEY ("decidedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refund_requests" ADD CONSTRAINT "refund_requests_liabilityId_fkey" FOREIGN KEY ("liabilityId") REFERENCES "overpayment_liabilities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refund_requests" ADD CONSTRAINT "refund_requests_refundJournalId_fkey" FOREIGN KEY ("refundJournalId") REFERENCES "journal_entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
