-- Older sample loans pre-date persisted repayment schedules. Backfill them so
-- collection allocation always has contractual components to reduce.
INSERT INTO "repayment_instalments" (
  "id", "instalmentNumber", "principalPesewas", "interestPesewas",
  "totalPesewas", "contractualDueDate", "effectiveCollectionDate",
  "status", "loanId"
)
SELECT
  'rpi_' || md5(l."id" || series.n::text),
  series.n,
  CASE
    WHEN series.n = l."termMonths"
      THEN l."principalPesewas" - ((l."principalPesewas" / l."termMonths") * (l."termMonths" - 1))
    ELSE l."principalPesewas" / l."termMonths"
  END,
  CASE
    WHEN series.n = l."termMonths"
      THEN l."contractualInterest" - ((l."contractualInterest" / l."termMonths") * (l."termMonths" - 1))
    ELSE l."contractualInterest" / l."termMonths"
  END,
  CASE
    WHEN series.n = l."termMonths"
      THEN (l."principalPesewas" - ((l."principalPesewas" / l."termMonths") * (l."termMonths" - 1)))
         + (l."contractualInterest" - ((l."contractualInterest" / l."termMonths") * (l."termMonths" - 1)))
    ELSE (l."principalPesewas" / l."termMonths") + (l."contractualInterest" / l."termMonths")
  END,
  (COALESCE(l."disbursedAt", l."createdAt") + (series.n || ' month')::interval),
  CASE
    WHEN EXTRACT(ISODOW FROM (COALESCE(l."disbursedAt", l."createdAt") + (series.n || ' month')::interval)) = 6
      THEN (COALESCE(l."disbursedAt", l."createdAt") + (series.n || ' month')::interval) + interval '2 day'
    WHEN EXTRACT(ISODOW FROM (COALESCE(l."disbursedAt", l."createdAt") + (series.n || ' month')::interval)) = 7
      THEN (COALESCE(l."disbursedAt", l."createdAt") + (series.n || ' month')::interval) + interval '1 day'
    ELSE (COALESCE(l."disbursedAt", l."createdAt") + (series.n || ' month')::interval)
  END,
  'AWAITING',
  l."id"
FROM "loans" l
CROSS JOIN LATERAL generate_series(1, l."termMonths") AS series(n)
WHERE l."status" = 'ACTIVE'
  AND NOT EXISTS (
    SELECT 1 FROM "repayment_instalments" ri WHERE ri."loanId" = l."id"
  )
ON CONFLICT ("loanId", "instalmentNumber") DO NOTHING;
