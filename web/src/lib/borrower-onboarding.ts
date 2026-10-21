export type BorrowerOnboardingValues = {
  legalName: string;
  phone: string;
  residentialAddress: string;
  businessDetails: string;
  ghanaCardNumber: string;
  ghanaCardVerified: boolean;
  branchId: string;
  groupId: string;
  consentReference: string;
  consentConfirmed: boolean;
};

export type BorrowerOnboardingErrors = Partial<
  Record<keyof BorrowerOnboardingValues, string>
>;

export function normalizeGhanaCard(value: string) {
  return value.trim().toUpperCase().replaceAll(" ", "");
}

export function validateBorrowerOnboarding(values: BorrowerOnboardingValues) {
  const errors: BorrowerOnboardingErrors = {};
  const legalName = values.legalName.trim();
  if (legalName.length < 2 || legalName.length > 150) {
    errors.legalName = "Enter the legal name shown on the Ghana Card.";
  }
  if (!/^\+233\d{9}$/.test(values.phone.trim())) {
    errors.phone = "Use a Ghana number in the format +233XXXXXXXXX.";
  }
  const address = values.residentialAddress.trim();
  if (address.length < 5 || address.length > 250) {
    errors.residentialAddress = "Enter the borrower’s residential address.";
  }
  const business = values.businessDetails.trim();
  if (business.length < 5 || business.length > 500) {
    errors.businessDetails = "Describe the borrower’s business.";
  }
  if (!/^GHA-\d{9}-\d$/.test(normalizeGhanaCard(values.ghanaCardNumber))) {
    errors.ghanaCardNumber = "Use the format GHA-123456789-1.";
  }
  if (!values.branchId) errors.branchId = "Select an assigned branch.";
  const consentReference = values.consentReference.trim();
  if (consentReference.length < 3 || consentReference.length > 80) {
    errors.consentReference = "Enter the signed consent record reference.";
  }
  if (!values.consentConfirmed) {
    errors.consentConfirmed = "Confirm that borrower consent was obtained.";
  }
  return errors;
}
