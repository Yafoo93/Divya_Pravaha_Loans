export function assertOrdinaryPostingAllowed(periodStatus: string) {
  if (periodStatus !== "OPEN")
    throw new Error("Ordinary posting to a closed period is not allowed.");
}

export function assertIndependentPeriodChecker(
  requesterId: string,
  checkerId: string,
) {
  if (requesterId === checkerId)
    throw new Error("The requester cannot approve their own period reopening.");
}
