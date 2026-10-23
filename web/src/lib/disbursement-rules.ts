export type DisbursementEvidence = {
  loanStatus: string;
  principalPesewas: number;
  reservationStatus: string;
  reservationPesewas: number;
  fundingVerified: boolean;
  fundingEligible: boolean;
  beneficiaryMatchesBorrower: boolean;
  identityConfirmed: boolean;
  signedContract: boolean;
  signedVoucher: boolean;
  managerAuthorized: boolean;
};

export function validateDisbursementEvidence(input: DisbursementEvidence) {
  if (input.loanStatus !== "AWAITING_DISBURSEMENT")
    throw new Error("Loan must be approved and awaiting disbursement");
  if (
    input.reservationStatus !== "RESERVED" ||
    input.reservationPesewas !== input.principalPesewas
  )
    throw new Error("A matching active funding reservation is required");
  if (!input.fundingVerified || !input.fundingEligible)
    throw new Error(
      "Funding reservation must come from a verified eligible lot",
    );
  if (!input.beneficiaryMatchesBorrower || !input.identityConfirmed)
    throw new Error("Borrower identity and beneficiary must be confirmed");
  if (!input.signedContract) throw new Error("A signed contract is required");
  if (!input.signedVoucher)
    throw new Error("A signed cash voucher is required");
  if (!input.managerAuthorized)
    throw new Error("Independent Manager authorization is required");
  return true;
}
