-- CreateEnum
CREATE TYPE "BorrowerStatus" AS ENUM ('ACTIVE', 'RESTRICTED');

-- CreateEnum
CREATE TYPE "GroupStatus" AS ENUM ('DRAFT', 'ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('ACTIVE', 'EXITED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "LoanStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'AWAITING_DISBURSEMENT', 'ACTIVE', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RepaymentFrequency" AS ENUM ('WEEKLY', 'FORTNIGHTLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "ReceiptStatus" AS ENUM ('CAPTURED', 'HANDED_OVER', 'VERIFIED', 'POSTED', 'REVERSED');

-- CreateEnum
CREATE TYPE "ArrearStatus" AS ENUM ('PENDING_ASSESSMENT', 'APPROVED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('ASSET', 'CONTRA_ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE');

-- CreateEnum
CREATE TYPE "JournalStatus" AS ENUM ('POSTED', 'REVERSED');

-- AlterTable
ALTER TABLE "branches" ADD COLUMN     "isSampleData" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(300) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSampleData" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "borrowers" (
    "id" TEXT NOT NULL,
    "customerId" VARCHAR(30) NOT NULL,
    "legalName" VARCHAR(150) NOT NULL,
    "phone" VARCHAR(30) NOT NULL,
    "residentialAddress" VARCHAR(250) NOT NULL,
    "businessDetails" VARCHAR(500) NOT NULL,
    "ghanaCardNumber" VARCHAR(30) NOT NULL,
    "ghanaCardVerified" BOOLEAN NOT NULL DEFAULT false,
    "consentReference" VARCHAR(80) NOT NULL,
    "status" "BorrowerStatus" NOT NULL DEFAULT 'ACTIVE',
    "isSampleData" BOOLEAN NOT NULL DEFAULT false,
    "branchId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "borrowers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "borrower_groups" (
    "id" TEXT NOT NULL,
    "groupNumber" VARCHAR(30) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "status" "GroupStatus" NOT NULL DEFAULT 'DRAFT',
    "jointLiabilityReference" VARCHAR(80) NOT NULL,
    "activatedAt" TIMESTAMP(3),
    "isSampleData" BOOLEAN NOT NULL DEFAULT false,
    "branchId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "borrower_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_memberships" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "borrowerId" TEXT NOT NULL,
    "status" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "joinedAt" TIMESTAMP(3) NOT NULL,
    "exitedAt" TIMESTAMP(3),
    "hasConsented" BOOLEAN NOT NULL DEFAULT true,
    "isSampleData" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "group_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loans" (
    "id" TEXT NOT NULL,
    "loanNumber" VARCHAR(30) NOT NULL,
    "status" "LoanStatus" NOT NULL,
    "principalPesewas" INTEGER NOT NULL,
    "contractualInterest" INTEGER NOT NULL,
    "totalRepayablePesewas" INTEGER NOT NULL,
    "termMonths" INTEGER NOT NULL,
    "repaymentFrequency" "RepaymentFrequency" NOT NULL,
    "disbursedAt" TIMESTAMP(3),
    "isSampleData" BOOLEAN NOT NULL DEFAULT false,
    "branchId" TEXT NOT NULL,
    "borrowerId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receipts" (
    "id" TEXT NOT NULL,
    "receiptNumber" VARCHAR(40) NOT NULL,
    "amountPesewas" INTEGER NOT NULL,
    "principalAllocatedPesewas" INTEGER NOT NULL,
    "interestAllocatedPesewas" INTEGER NOT NULL,
    "status" "ReceiptStatus" NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "isSampleData" BOOLEAN NOT NULL DEFAULT false,
    "branchId" TEXT NOT NULL,
    "borrowerId" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "arrears" (
    "id" TEXT NOT NULL,
    "assessmentNumber" VARCHAR(40) NOT NULL,
    "effectiveDueDate" TIMESTAMP(3) NOT NULL,
    "daysPastDue" INTEGER NOT NULL,
    "unpaidAmountPesewas" INTEGER NOT NULL,
    "contributionPesewas" INTEGER NOT NULL,
    "status" "ArrearStatus" NOT NULL,
    "isSampleData" BOOLEAN NOT NULL DEFAULT false,
    "loanId" TEXT NOT NULL,
    "borrowerId" TEXT NOT NULL,
    "guarantorBorrowerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "arrears_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ledger_accounts" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(10) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "type" "AccountType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSampleData" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ledger_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_entries" (
    "id" TEXT NOT NULL,
    "journalNumber" VARCHAR(40) NOT NULL,
    "description" VARCHAR(300) NOT NULL,
    "sourceEventType" VARCHAR(80) NOT NULL,
    "sourceReference" VARCHAR(80) NOT NULL,
    "entryDate" TIMESTAMP(3) NOT NULL,
    "status" "JournalStatus" NOT NULL DEFAULT 'POSTED',
    "isSampleData" BOOLEAN NOT NULL DEFAULT false,
    "branchId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "journal_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_lines" (
    "id" TEXT NOT NULL,
    "debitPesewas" INTEGER NOT NULL DEFAULT 0,
    "creditPesewas" INTEGER NOT NULL DEFAULT 0,
    "isSampleData" BOOLEAN NOT NULL DEFAULT false,
    "journalId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "journal_lines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_code_key" ON "roles"("code");

-- CreateIndex
CREATE UNIQUE INDEX "borrowers_customerId_key" ON "borrowers"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "borrowers_ghanaCardNumber_key" ON "borrowers"("ghanaCardNumber");

-- CreateIndex
CREATE INDEX "borrowers_branchId_idx" ON "borrowers"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "borrower_groups_groupNumber_key" ON "borrower_groups"("groupNumber");

-- CreateIndex
CREATE INDEX "borrower_groups_branchId_idx" ON "borrower_groups"("branchId");

-- CreateIndex
CREATE INDEX "group_memberships_borrowerId_idx" ON "group_memberships"("borrowerId");

-- CreateIndex
CREATE UNIQUE INDEX "group_memberships_groupId_borrowerId_key" ON "group_memberships"("groupId", "borrowerId");

-- CreateIndex
CREATE UNIQUE INDEX "loans_loanNumber_key" ON "loans"("loanNumber");

-- CreateIndex
CREATE INDEX "loans_branchId_idx" ON "loans"("branchId");

-- CreateIndex
CREATE INDEX "loans_borrowerId_idx" ON "loans"("borrowerId");

-- CreateIndex
CREATE INDEX "loans_groupId_idx" ON "loans"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "receipts_receiptNumber_key" ON "receipts"("receiptNumber");

-- CreateIndex
CREATE INDEX "receipts_branchId_idx" ON "receipts"("branchId");

-- CreateIndex
CREATE INDEX "receipts_borrowerId_idx" ON "receipts"("borrowerId");

-- CreateIndex
CREATE INDEX "receipts_loanId_idx" ON "receipts"("loanId");

-- CreateIndex
CREATE UNIQUE INDEX "arrears_assessmentNumber_key" ON "arrears"("assessmentNumber");

-- CreateIndex
CREATE INDEX "arrears_loanId_idx" ON "arrears"("loanId");

-- CreateIndex
CREATE INDEX "arrears_borrowerId_idx" ON "arrears"("borrowerId");

-- CreateIndex
CREATE INDEX "arrears_guarantorBorrowerId_idx" ON "arrears"("guarantorBorrowerId");

-- CreateIndex
CREATE UNIQUE INDEX "ledger_accounts_code_key" ON "ledger_accounts"("code");

-- CreateIndex
CREATE UNIQUE INDEX "journal_entries_journalNumber_key" ON "journal_entries"("journalNumber");

-- CreateIndex
CREATE UNIQUE INDEX "journal_entries_sourceReference_key" ON "journal_entries"("sourceReference");

-- CreateIndex
CREATE INDEX "journal_entries_branchId_idx" ON "journal_entries"("branchId");

-- CreateIndex
CREATE INDEX "journal_lines_journalId_idx" ON "journal_lines"("journalId");

-- CreateIndex
CREATE INDEX "journal_lines_accountId_idx" ON "journal_lines"("accountId");

-- AddForeignKey
ALTER TABLE "borrowers" ADD CONSTRAINT "borrowers_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "borrower_groups" ADD CONSTRAINT "borrower_groups_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_memberships" ADD CONSTRAINT "group_memberships_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "borrower_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_memberships" ADD CONSTRAINT "group_memberships_borrowerId_fkey" FOREIGN KEY ("borrowerId") REFERENCES "borrowers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_borrowerId_fkey" FOREIGN KEY ("borrowerId") REFERENCES "borrowers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "borrower_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_borrowerId_fkey" FOREIGN KEY ("borrowerId") REFERENCES "borrowers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "loans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arrears" ADD CONSTRAINT "arrears_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "loans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arrears" ADD CONSTRAINT "arrears_borrowerId_fkey" FOREIGN KEY ("borrowerId") REFERENCES "borrowers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arrears" ADD CONSTRAINT "arrears_guarantorBorrowerId_fkey" FOREIGN KEY ("guarantorBorrowerId") REFERENCES "borrowers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_lines" ADD CONSTRAINT "journal_lines_journalId_fkey" FOREIGN KEY ("journalId") REFERENCES "journal_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_lines" ADD CONSTRAINT "journal_lines_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "ledger_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
