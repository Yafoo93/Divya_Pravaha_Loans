CREATE TABLE "audit_events" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT,
    "eventType" VARCHAR(80) NOT NULL,
    "outcome" VARCHAR(16) NOT NULL,
    "permission" VARCHAR(500),
    "resource" VARCHAR(180),
    "reason" VARCHAR(120),
    "branchId" TEXT,
    "ipAddress" VARCHAR(64),
    "userAgent" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "audit_events_actorUserId_createdAt_idx"
ON "audit_events"("actorUserId", "createdAt");

CREATE INDEX "audit_events_eventType_createdAt_idx"
ON "audit_events"("eventType", "createdAt");

CREATE INDEX "audit_events_resource_createdAt_idx"
ON "audit_events"("resource", "createdAt");

CREATE FUNCTION prevent_audit_event_mutation() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    RAISE EXCEPTION 'audit_events is append-only';
END;
$$;

CREATE TRIGGER "audit_events_append_only"
BEFORE UPDATE OR DELETE OR TRUNCATE ON "audit_events"
FOR EACH STATEMENT EXECUTE FUNCTION prevent_audit_event_mutation();
