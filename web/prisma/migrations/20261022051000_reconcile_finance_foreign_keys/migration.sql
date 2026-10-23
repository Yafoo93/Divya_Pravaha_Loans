ALTER TABLE "journal_lines" DROP CONSTRAINT "journal_lines_journalId_fkey";
ALTER TABLE "reversals" DROP CONSTRAINT "reversals_replacementJournalId_fkey";

ALTER TABLE "reversals"
ADD CONSTRAINT "reversals_replacementJournalId_fkey"
FOREIGN KEY ("replacementJournalId") REFERENCES "journal_entries"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "journal_lines"
ADD CONSTRAINT "journal_lines_journalId_fkey"
FOREIGN KEY ("journalId") REFERENCES "journal_entries"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
