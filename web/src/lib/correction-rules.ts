export function availableRefundPesewas(
  liabilityPesewas: number,
  refundedPesewas: number,
  pendingPesewas = 0,
) {
  if (
    ![liabilityPesewas, refundedPesewas, pendingPesewas].every(Number.isInteger)
  )
    throw new Error("Liability values must be integer pesewas.");
  return Math.max(0, liabilityPesewas - refundedPesewas - pendingPesewas);
}

export function assertRefundWithinLiability(
  requestedPesewas: number,
  availablePesewas: number,
) {
  if (!Number.isInteger(requestedPesewas) || requestedPesewas <= 0)
    throw new Error("Refund must be a positive integer number of pesewas.");
  if (requestedPesewas > availablePesewas)
    throw new Error("Refund exceeds the available recorded liability.");
}

export function assertIndependentRequestChecker(
  makerId: string,
  checkerId: string,
) {
  if (makerId === checkerId)
    throw new Error("The requester cannot approve their own request.");
}
