import "dotenv/config";
import pg from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not configured");

const client = new pg.Client({ connectionString });

async function main() {
  await client.connect();
  const trigger = await client.query<{ tgname: string; tgenabled: string }>(`
    SELECT tgname, tgenabled
    FROM pg_trigger
    WHERE tgrelid = 'audit_events'::regclass
      AND tgname = 'audit_events_append_only'
      AND NOT tgisinternal
  `);
  if (trigger.rows[0]?.tgenabled !== "O") {
    throw new Error("The append-only audit trigger is missing or disabled");
  }

  const requiredEventTypes = [
    "BUSINESS_APPROVAL",
    "BUSINESS_REJECTION",
    "FINANCIAL_REVERSAL",
    "PRIVATE_DOCUMENT_ACCESS",
    "SECURITY_CONFIGURATION_CHANGE",
  ];
  const coveredEvents = await client.query<{ eventType: string }>(
    `SELECT DISTINCT "eventType" FROM audit_events WHERE "eventType" = ANY($1)`,
    [requiredEventTypes],
  );
  const coveredTypes = new Set(coveredEvents.rows.map((row) => row.eventType));
  const missingTypes = requiredEventTypes.filter(
    (eventType) => !coveredTypes.has(eventType),
  );
  if (missingTypes.length > 0) {
    throw new Error(`Missing required audit event coverage: ${missingTypes.join(", ")}`);
  }

  const event = await client.query<{ id: string }>(`
    SELECT id FROM audit_events ORDER BY "createdAt" DESC LIMIT 1
  `);
  if (event.rowCount === 0) {
    console.log("Audit trigger enabled. Create one audit event to test mutation rejection.");
    return;
  }

  try {
    await client.query(
      `UPDATE audit_events SET "actorName" = "actorName" WHERE id = $1`,
      [event.rows[0].id],
    );
    throw new Error("Audit update unexpectedly succeeded");
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes("append-only")) {
      throw error;
    }
  }

  console.log(
    "Audit verification passed: sensitive event coverage exists, the append-only trigger is enabled, and updates are rejected.",
  );
}

main()
  .finally(() => client.end())
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
