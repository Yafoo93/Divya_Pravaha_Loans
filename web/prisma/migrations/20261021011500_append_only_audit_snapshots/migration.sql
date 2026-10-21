ALTER TABLE "audit_events"
ADD COLUMN IF NOT EXISTS "actorName" VARCHAR(150),
ADD COLUMN IF NOT EXISTS "actorRole" VARCHAR(50);

ALTER TABLE "audit_events" DISABLE TRIGGER "audit_events_append_only";

UPDATE "audit_events" AS audit
SET
  "actorName" = (
    SELECT users."name"
    FROM "users"
    WHERE users."id" = audit."actorUserId"
  ),
  "actorRole" = (
    SELECT roles."code"
    FROM "user_roles"
    INNER JOIN "roles" ON roles."id" = "user_roles"."roleId"
    WHERE "user_roles"."userId" = audit."actorUserId"
      AND "user_roles"."effectiveFrom" <= audit."createdAt"
      AND (
        "user_roles"."effectiveTo" IS NULL
        OR "user_roles"."effectiveTo" > audit."createdAt"
      )
    ORDER BY "user_roles"."effectiveFrom" DESC
    LIMIT 1
  )
WHERE audit."actorUserId" IS NOT NULL;

ALTER TABLE "audit_events" ENABLE TRIGGER "audit_events_append_only";
