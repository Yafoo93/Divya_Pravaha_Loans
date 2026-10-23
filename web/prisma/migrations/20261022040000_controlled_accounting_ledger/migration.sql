CREATE TABLE "accounting_periods" (
  "id" TEXT NOT NULL, "periodKey" VARCHAR(30) NOT NULL, "name" VARCHAR(80) NOT NULL,
  "startsAt" TIMESTAMP(3) NOT NULL, "endsAt" TIMESTAMP(3) NOT NULL, "status" VARCHAR(20) NOT NULL,
  "closedAt" TIMESTAMP(3), "isSampleData" BOOLEAN NOT NULL DEFAULT false, "branchId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "accounting_periods_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "reversals" (
  "id" TEXT NOT NULL, "reversalNumber" VARCHAR(50) NOT NULL, "reason" VARCHAR(500) NOT NULL,
  "reversedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "isSampleData" BOOLEAN NOT NULL DEFAULT false,
  "originalJournalId" TEXT NOT NULL, "reversingJournalId" TEXT NOT NULL, "replacementJournalId" TEXT,
  "authorizedByUserId" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "reversals_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "accounting_periods_periodKey_key" ON "accounting_periods"("periodKey");
CREATE UNIQUE INDEX "accounting_periods_branchId_startsAt_key" ON "accounting_periods"("branchId", "startsAt");
CREATE INDEX "accounting_periods_branchId_status_idx" ON "accounting_periods"("branchId", "status");
CREATE UNIQUE INDEX "reversals_reversalNumber_key" ON "reversals"("reversalNumber");
CREATE UNIQUE INDEX "reversals_originalJournalId_key" ON "reversals"("originalJournalId");
CREATE UNIQUE INDEX "reversals_reversingJournalId_key" ON "reversals"("reversingJournalId");
CREATE UNIQUE INDEX "reversals_replacementJournalId_key" ON "reversals"("replacementJournalId");
CREATE INDEX "reversals_authorizedByUserId_reversedAt_idx" ON "reversals"("authorizedByUserId", "reversedAt");
INSERT INTO "accounting_periods" ("id", "periodKey", "name", "startsAt", "endsAt", "status", "isSampleData", "branchId", "updatedAt")
SELECT 'period-2026-10-' || "id", '2026-10-' || "code", 'October 2026', TIMESTAMP '2026-10-01 00:00:00', TIMESTAMP '2026-10-31 23:59:59.999', 'OPEN', true, "id", CURRENT_TIMESTAMP FROM "branches";
ALTER TABLE "journal_entries" ADD COLUMN "periodId" TEXT;
ALTER TABLE "journal_entries" ADD COLUMN "actorUserId" TEXT;
UPDATE "journal_entries" j SET "periodId" = p."id" FROM "accounting_periods" p WHERE p."branchId" = j."branchId";
UPDATE "journal_entries" SET "actorUserId" = (SELECT "id" FROM "users" ORDER BY CASE WHEN "staffNumber" = 'STF-0006' THEN 0 ELSE 1 END LIMIT 1);
ALTER TABLE "journal_entries" ALTER COLUMN "periodId" SET NOT NULL;
ALTER TABLE "journal_entries" ALTER COLUMN "actorUserId" SET NOT NULL;
CREATE INDEX "journal_entries_periodId_entryDate_idx" ON "journal_entries"("periodId", "entryDate");
CREATE INDEX "journal_entries_actorUserId_entryDate_idx" ON "journal_entries"("actorUserId", "entryDate");
ALTER TABLE "accounting_periods" ADD CONSTRAINT "accounting_periods_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "accounting_periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "reversals" ADD CONSTRAINT "reversals_originalJournalId_fkey" FOREIGN KEY ("originalJournalId") REFERENCES "journal_entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "reversals" ADD CONSTRAINT "reversals_reversingJournalId_fkey" FOREIGN KEY ("reversingJournalId") REFERENCES "journal_entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "reversals" ADD CONSTRAINT "reversals_replacementJournalId_fkey" FOREIGN KEY ("replacementJournalId") REFERENCES "journal_entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "reversals" ADD CONSTRAINT "reversals_authorizedByUserId_fkey" FOREIGN KEY ("authorizedByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE OR REPLACE FUNCTION enforce_balanced_posted_journal() RETURNS TRIGGER AS $$
DECLARE target_id TEXT; debit_total BIGINT; credit_total BIGINT; target_status "JournalStatus";
BEGIN
  target_id := COALESCE(NEW."journalId", OLD."journalId");
  SELECT "status" INTO target_status FROM "journal_entries" WHERE "id" = target_id;
  IF target_status = 'POSTED' THEN
    SELECT COALESCE(SUM("debitPesewas"),0), COALESCE(SUM("creditPesewas"),0) INTO debit_total, credit_total FROM "journal_lines" WHERE "journalId" = target_id;
    IF debit_total = 0 OR debit_total <> credit_total THEN RAISE EXCEPTION 'Posted journal must balance and contain a positive amount'; END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END; $$ LANGUAGE plpgsql;
CREATE CONSTRAINT TRIGGER journal_balance_guard AFTER INSERT OR UPDATE OR DELETE ON "journal_lines" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION enforce_balanced_posted_journal();

CREATE OR REPLACE FUNCTION prevent_posted_journal_mutation() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' AND OLD."status" IN ('POSTED','REVERSED') THEN RAISE EXCEPTION 'Posted journals cannot be deleted'; END IF;
  IF TG_OP = 'UPDATE' AND OLD."status" IN ('POSTED','REVERSED') AND NOT (OLD."status" = 'POSTED' AND NEW."status" = 'REVERSED' AND (to_jsonb(OLD) - 'status') = (to_jsonb(NEW) - 'status')) THEN RAISE EXCEPTION 'Posted journals are immutable'; END IF;
  RETURN COALESCE(NEW, OLD);
END; $$ LANGUAGE plpgsql;
CREATE TRIGGER posted_journal_immutability BEFORE UPDATE OR DELETE ON "journal_entries" FOR EACH ROW EXECUTE FUNCTION prevent_posted_journal_mutation();

CREATE OR REPLACE FUNCTION prevent_posted_line_mutation() RETURNS TRIGGER AS $$
DECLARE parent_status "JournalStatus";
BEGIN
  SELECT "status" INTO parent_status FROM "journal_entries" WHERE "id" = COALESCE(OLD."journalId", NEW."journalId");
  IF parent_status IN ('POSTED','REVERSED') THEN RAISE EXCEPTION 'Posted journal lines are immutable'; END IF;
  RETURN COALESCE(NEW, OLD);
END; $$ LANGUAGE plpgsql;
CREATE TRIGGER posted_line_immutability BEFORE UPDATE OR DELETE ON "journal_lines" FOR EACH ROW EXECUTE FUNCTION prevent_posted_line_mutation();
