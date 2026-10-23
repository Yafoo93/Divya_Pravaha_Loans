INSERT INTO "accounting_periods" ("id", "periodKey", "name", "startsAt", "endsAt", "status", "closedAt", "isSampleData", "branchId", "updatedAt")
SELECT 'period-2026-04-' || "id", '2026-04-' || "code", 'April 2026', TIMESTAMP '2026-04-01 00:00:00', TIMESTAMP '2026-04-30 23:59:59.999', 'CLOSED', TIMESTAMP '2026-04-30 23:59:59.999', true, "id", CURRENT_TIMESTAMP FROM "branches"
ON CONFLICT ("periodKey") DO NOTHING;
INSERT INTO "accounting_periods" ("id", "periodKey", "name", "startsAt", "endsAt", "status", "closedAt", "isSampleData", "branchId", "updatedAt")
SELECT 'period-2026-09-' || "id", '2026-09-' || "code", 'September 2026', TIMESTAMP '2026-09-01 00:00:00', TIMESTAMP '2026-09-30 23:59:59.999', 'CLOSED', TIMESTAMP '2026-09-30 23:59:59.999', true, "id", CURRENT_TIMESTAMP FROM "branches"
ON CONFLICT ("periodKey") DO NOTHING;
ALTER TABLE "journal_entries" DISABLE TRIGGER posted_journal_immutability;
UPDATE "journal_entries" j SET "periodId" = p."id" FROM "accounting_periods" p WHERE p."branchId" = j."branchId" AND j."entryDate" >= p."startsAt" AND j."entryDate" <= p."endsAt";
ALTER TABLE "journal_entries" ENABLE TRIGGER posted_journal_immutability;
