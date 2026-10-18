"use client";

import { useState, type FormEvent } from "react";
import {
  validatePrototypeApplication,
  type PrototypeApplicationErrors,
  type PrototypeApplicationValues,
} from "@/lib/prototype-form-validation";
import { Alert, Button } from "./ui/actions";
import { Card } from "./ui/data-display";
import {
  CheckboxField,
  InputField,
  SelectField,
  TextareaField,
} from "./ui/forms";

const initialValues: PrototypeApplicationValues = {
  legalName: "",
  phone: "",
  amount: "",
  frequency: "",
  purpose: "",
  consent: false,
};

export function SampleForm() {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<PrototypeApplicationErrors>({});
  const [submitted, setSubmitted] = useState(false);

  function update<K extends keyof PrototypeApplicationValues>(
    field: K,
    value: PrototypeApplicationValues[K],
  ) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
    setSubmitted(false);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validatePrototypeApplication(values);
    setErrors(nextErrors);
    setSubmitted(Object.keys(nextErrors).length === 0);
  }

  return (
    <Card className="p-5 sm:p-6">
      <form noValidate onSubmit={submit}>
        <div className="grid gap-5 md:grid-cols-2">
          <InputField
            id="legal-name"
            label="Borrower legal name"
            required
            value={values.legalName}
            onChange={(event) => update("legalName", event.target.value)}
            error={errors.legalName}
            help="Enter the name exactly as shown on the Ghana Card."
            placeholder="e.g. Ama Mensah"
            autoComplete="name"
          />
          <InputField
            id="phone"
            label="Phone number"
            required
            type="tel"
            value={values.phone}
            onChange={(event) => update("phone", event.target.value)}
            error={errors.phone}
            help="Use international Ghana format: +233XXXXXXXXX."
            placeholder="+233244555123"
            autoComplete="tel"
          />
          <InputField
            id="amount"
            label="Requested principal (GHS)"
            required
            type="number"
            min="0.01"
            step="0.01"
            value={values.amount}
            onChange={(event) => update("amount", event.target.value)}
            error={errors.amount}
            help="The approved product rules will validate the final amount."
            placeholder="10000.00"
          />
          <SelectField
            id="frequency"
            label="Repayment frequency"
            required
            value={values.frequency}
            onChange={(event) => update("frequency", event.target.value)}
            error={errors.frequency}
            help="Weekly, fortnightly, and monthly are supported."
          >
            <option value="">Select frequency</option>
            <option value="WEEKLY">Weekly</option>
            <option value="FORTNIGHTLY">Fortnightly</option>
            <option value="MONTHLY">Monthly</option>
          </SelectField>
          <InputField
            id="branch"
            label="Branch"
            value="Kasoa Market"
            disabled
            help="The signed-in staff member's branch controls this value."
          />
          <InputField
            id="product"
            label="Loan product"
            value="GROUP_FLAT_20"
            disabled
            help="Product selection is locked for this prototype workflow."
          />
          <div className="md:col-span-2">
            <TextareaField
              id="purpose"
              label="Business purpose"
              required
              value={values.purpose}
              onChange={(event) => update("purpose", event.target.value)}
              error={errors.purpose}
              help="Describe how the borrower will use the funds."
              placeholder="Purchase additional grocery stock..."
            />
          </div>
          <div className="md:col-span-2">
            <CheckboxField
              id="consent"
              label="Borrower consent has been recorded"
              required
              checked={values.consent}
              onChange={(event) => update("consent", event.target.checked)}
              error={errors.consent}
              help="Consent evidence must be attached before submission."
            />
          </div>
        </div>

        {Object.keys(errors).length > 0 && (
          <div className="mt-5">
            <Alert variant="danger" title="Check the highlighted fields">
              Correct every validation error before continuing.
            </Alert>
          </div>
        )}
        {submitted && (
          <div className="mt-5">
            <Alert variant="success" title="Sample form is valid">
              The demonstration passed client-side validation. No record was
              saved.
            </Alert>
          </div>
        )}

        <div className="border-border mt-6 flex flex-wrap justify-end gap-3 border-t pt-5">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setValues(initialValues);
              setErrors({});
              setSubmitted(false);
            }}
          >
            Reset
          </Button>
          <Button type="submit">Validate sample form</Button>
        </div>
      </form>
    </Card>
  );
}
