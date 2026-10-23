-- CreateEnum
CREATE TYPE "HandoverStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'VERIFIED', 'POSTED', 'RETURNED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ReconciliationStatus" AS ENUM ('BALANCED', 'EXCEPTION', 'RESOLVED');

-- CreateEnum
CREATE TYPE "CashExceptionType" AS ENUM ('SHORTAGE', 'EXCESS', 'UNIDENTIFIED_CASH');

-- CreateEnum
CREATE TYPE "CashExceptionStatus" AS ENUM ('OPEN', 'RESOLVED');

-- CreateTable
CREATE TABLE "handovers" (
    "id" TEXT NOT NULL,
    "handoverNumber" VARCHAR(60) NOT NULL,
    "status" "HandoverStatus" NOT NULL DEFAULT 'DRAFT',
    "expectedPesewas" INTEGER NOT NULL,
    "countedPesewas" INTEGER,
    "variancePesewas" INTEGER,
    "submittedAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "postedAt" TIMESTAMP(3),
    "isSampleData" BOOLEAN NOT NULL DEFAULT false,
    "branchId" TEXT NOT NULL,
    "collectorUserId" TEXT NOT NULL,
    "checkerUserId" TEXT,
    "journalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "handovers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "handover_receipts" (
    "id" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "handoverId" TEXT NOT NULL,
    "receiptId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "handover_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "denomination_counts" (
    "id" TEXT NOT NULL,
    "denominationPesewas" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "countedPesewas" INTEGER NOT NULL,
    "handoverId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "denomination_counts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reconciliations" (
    "id" TEXT NOT NULL,
    "reconciliationNumber" VARCHAR(60) NOT NULL,
    "status" "ReconciliationStatus" NOT NULL,
    "expectedPesewas" INTEGER NOT NULL,
    "countedPesewas" INTEGER NOT NULL,
    "variancePesewas" INTEGER NOT NULL,
    "note" VARCHAR(500) NOT NULL,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "handoverId" TEXT NOT NULL,
    "checkerUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reconciliations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_exceptions" (
    "id" TEXT NOT NULL,
    "exceptionNumber" VARCHAR(60) NOT NULL,
    "type" "CashExceptionType" NOT NULL,
    "status" "CashExceptionStatus" NOT NULL DEFAULT 'OPEN',
    "amountPesewas" INTEGER NOT NULL,
    "notes" VARCHAR(500) NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "handoverId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cash_exceptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "handovers_handoverNumber_key" ON "handovers"("handoverNumber");

-- CreateIndex
CREATE UNIQUE INDEX "handovers_journalId_key" ON "handovers"("journalId");

-- CreateIndex
CREATE INDEX "handovers_branchId_status_idx" ON "handovers"("branchId", "status");

-- CreateIndex
CREATE INDEX "handovers_collectorUserId_submittedAt_idx" ON "handovers"("collectorUserId", "submittedAt");

-- CreateIndex
CREATE INDEX "handover_receipts_receiptId_active_idx" ON "handover_receipts"("receiptId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "handover_receipts_handoverId_receiptId_key" ON "handover_receipts"("handoverId", "receiptId");

-- CreateIndex
CREATE UNIQUE INDEX "denomination_counts_handoverId_denominationPesewas_key" ON "denomination_counts"("handoverId", "denominationPesewas");

-- CreateIndex
CREATE UNIQUE INDEX "reconciliations_reconciliationNumber_key" ON "reconciliations"("reconciliationNumber");

-- CreateIndex
CREATE UNIQUE INDEX "reconciliations_handoverId_key" ON "reconciliations"("handoverId");

-- CreateIndex
CREATE INDEX "reconciliations_checkerUserId_checkedAt_idx" ON "reconciliations"("checkerUserId", "checkedAt");

-- CreateIndex
CREATE UNIQUE INDEX "cash_exceptions_exceptionNumber_key" ON "cash_exceptions"("exceptionNumber");

-- CreateIndex
CREATE INDEX "cash_exceptions_handoverId_status_idx" ON "cash_exceptions"("handoverId", "status");

-- CreateIndex
CREATE INDEX "cash_exceptions_type_status_idx" ON "cash_exceptions"("type", "status");

-- AddForeignKey
ALTER TABLE "handovers" ADD CONSTRAINT "handovers_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "handovers" ADD CONSTRAINT "handovers_collectorUserId_fkey" FOREIGN KEY ("collectorUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "handovers" ADD CONSTRAINT "handovers_checkerUserId_fkey" FOREIGN KEY ("checkerUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "handovers" ADD CONSTRAINT "handovers_journalId_fkey" FOREIGN KEY ("journalId") REFERENCES "journal_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "handover_receipts" ADD CONSTRAINT "handover_receipts_handoverId_fkey" FOREIGN KEY ("handoverId") REFERENCES "handovers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "handover_receipts" ADD CONSTRAINT "handover_receipts_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "receipts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "denomination_counts" ADD CONSTRAINT "denomination_counts_handoverId_fkey" FOREIGN KEY ("handoverId") REFERENCES "handovers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reconciliations" ADD CONSTRAINT "reconciliations_handoverId_fkey" FOREIGN KEY ("handoverId") REFERENCES "handovers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reconciliations" ADD CONSTRAINT "reconciliations_checkerUserId_fkey" FOREIGN KEY ("checkerUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_exceptions" ADD CONSTRAINT "cash_exceptions_handoverId_fkey" FOREIGN KEY ("handoverId") REFERENCES "handovers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
