export type PrototypeApplicationValues = {
  legalName: string;
  phone: string;
  amount: string;
  frequency: string;
  purpose: string;
  consent: boolean;
};

export type PrototypeApplicationErrors = Partial<
  Record<keyof PrototypeApplicationValues, string>
>;

export function validatePrototypeApplication(
  values: PrototypeApplicationValues,
) {
  const errors: PrototypeApplicationErrors = {};
  if (!values.legalName.trim())
    errors.legalName = "Enter the borrower's legal name.";
  if (!/^\+233\d{9}$/.test(values.phone.trim()))
    errors.phone = "Use a Ghana number in the format +233XXXXXXXXX.";
  const amount = Number(values.amount);
  if (!values.amount || !Number.isFinite(amount) || amount <= 0)
    errors.amount = "Enter an amount greater than GHS 0.";
  if (!values.frequency) errors.frequency = "Select a repayment frequency.";
  if (!values.purpose.trim()) errors.purpose = "Describe the business purpose.";
  if (!values.consent) errors.consent = "Borrower consent is required.";
  return errors;
}
