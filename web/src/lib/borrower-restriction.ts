export const restrictionActions = [
  "RESTRICT",
  "REQUEST_REACTIVATION",
  "APPROVE_REACTIVATION",
  "REJECT_REACTIVATION",
] as const;

export type RestrictionAction = (typeof restrictionActions)[number];

export function isRestrictionAction(
  value: unknown,
): value is RestrictionAction {
  return (
    typeof value === "string" &&
    restrictionActions.includes(value as RestrictionAction)
  );
}

export function validateRestrictionReason(value: unknown) {
  if (typeof value !== "string" || value.trim().length < 10) {
    return "Provide a reason of at least 10 characters.";
  }
  if (value.trim().length > 500) {
    return "The reason cannot exceed 500 characters.";
  }
  return null;
}

export function canRequestReactivation(status: string) {
  return status === "ACTIVE" || status === "REACTIVATION_REJECTED";
}
