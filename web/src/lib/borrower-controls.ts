import { randomUUID } from "node:crypto";

export function generateCustomerId(now = new Date(), random = randomUUID()) {
  return `CUS-${now.getTime().toString(36).toUpperCase()}-${random.replaceAll("-", "").slice(0, 8).toUpperCase()}`;
}

export class RestrictedBorrowerError extends Error {
  readonly code = "BORROWER_RESTRICTED";

  constructor() {
    super("Restricted borrowers cannot start new loan applications.");
    this.name = "RestrictedBorrowerError";
  }
}

export function assertBorrowerMayApply(status: "ACTIVE" | "RESTRICTED") {
  if (status === "RESTRICTED") throw new RestrictedBorrowerError();
}
