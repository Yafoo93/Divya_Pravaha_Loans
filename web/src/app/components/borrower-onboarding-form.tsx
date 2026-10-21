"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import {
  validateBorrowerOnboarding,
  type BorrowerOnboardingErrors,
  type BorrowerOnboardingValues,
} from "@/lib/borrower-onboarding";
import { Alert, Button } from "./ui/actions";
import { Card } from "./ui/data-display";
import {
  CheckboxField,
  InputField,
  SelectField,
  TextareaField,
} from "./ui/forms";

type BranchOption = { id: string; code: string; name: string };
type GroupOption = {
  id: string;
  groupNumber: string;
  name: string;
  branchId: string;
};

function initialValues(branchId: string): BorrowerOnboardingValues {
  return {
    legalName: "",
    phone: "",
    residentialAddress: "",
    businessDetails: "",
    ghanaCardNumber: "",
    ghanaCardVerified: false,
    branchId,
    groupId: "",
    consentReference: "",
    consentConfirmed: false,
  };
}

export function BorrowerOnboardingForm({
  branches,
  groups,
}: {
  branches: readonly BranchOption[];
  groups: readonly GroupOption[];
}) {
  const [values, setValues] = useState(() =>
    initialValues(branches[0]?.id ?? ""),
  );
  const [errors, setErrors] = useState<BorrowerOnboardingErrors>({});
  const [serverError, setServerError] = useState("");
  const [createdCustomerId, setCreatedCustomerId] = useState("");
  const [loading, setLoading] = useState(false);
  const availableGroups = useMemo(
    () => groups.filter((group) => group.branchId === values.branchId),
    [groups, values.branchId],
  );

  function update<K extends keyof BorrowerOnboardingValues>(
    field: K,
    value: BorrowerOnboardingValues[K],
  ) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
    setServerError("");
    setCreatedCustomerId("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationErrors = validateBorrowerOnboarding(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;
    setLoading(true);
    setServerError("");
    try {
      const response = await fetch("/api/borrowers", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values),
      });
      const result = (await response.json()) as {
        customerId?: string;
        error?: string;
        errors?: BorrowerOnboardingErrors;
      };
      if (!response.ok) {
        if (result.errors) setErrors(result.errors);
        throw new Error(result.error ?? "The borrower could not be created.");
      }
      setCreatedCustomerId(result.customerId ?? "Created");
      setValues(initialValues(branches[0]?.id ?? ""));
    } catch (error) {
      setServerError(
        error instanceof Error
          ? error.message
          : "The borrower could not be created.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="p-5 sm:p-7">
      <form noValidate onSubmit={submit}>
        <div>
          <h2 className="text-lg font-bold">Identity and contact</h2>
          <p className="text-muted mt-1 text-sm">
            Record the borrower exactly as identified. The customer ID is
            generated after saving.
          </p>
        </div>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <InputField
            id="borrower-name"
            label="Legal name"
            required
            autoComplete="name"
            value={values.legalName}
            onChange={(event) => update("legalName", event.target.value)}
            error={errors.legalName}
            help="Enter the name exactly as shown on the Ghana Card."
          />
          <InputField
            id="borrower-phone"
            label="Phone number"
            required
            type="tel"
            autoComplete="tel"
            placeholder="+233245550136"
            value={values.phone}
            onChange={(event) => update("phone", event.target.value)}
            error={errors.phone}
            help="Use international Ghana format: +233XXXXXXXXX."
          />
          <div className="md:col-span-2">
            <TextareaField
              id="borrower-address"
              label="Residential address"
              required
              autoComplete="street-address"
              value={values.residentialAddress}
              onChange={(event) =>
                update("residentialAddress", event.target.value)
              }
              error={errors.residentialAddress}
            />
          </div>
        </div>

        <div className="border-border mt-7 border-t pt-6">
          <h2 className="text-lg font-bold">
            Business and portfolio placement
          </h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <TextareaField
                id="borrower-business"
                label="Business details"
                required
                value={values.businessDetails}
                onChange={(event) =>
                  update("businessDetails", event.target.value)
                }
                error={errors.businessDetails}
                help="Describe the business, market or operating location, and main activity."
              />
            </div>
            <SelectField
              id="borrower-branch"
              label="Branch"
              required
              value={values.branchId}
              onChange={(event) => {
                update("branchId", event.target.value);
                update("groupId", "");
              }}
              error={errors.branchId}
              help="Only branches assigned to your account are available."
            >
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name} · {branch.code}
                </option>
              ))}
            </SelectField>
            <SelectField
              id="borrower-group"
              label="Proposed group"
              value={values.groupId}
              onChange={(event) => update("groupId", event.target.value)}
              help="Optional. Only draft or active groups in the selected branch are shown."
            >
              <option value="">No group yet</option>
              {availableGroups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name} · {group.groupNumber}
                </option>
              ))}
            </SelectField>
          </div>
        </div>

        <div className="border-border mt-7 border-t pt-6">
          <h2 className="text-lg font-bold">Ghana Card and consent</h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <InputField
              id="ghana-card"
              label="Ghana Card number"
              required
              placeholder="GHA-123456789-1"
              value={values.ghanaCardNumber}
              onChange={(event) =>
                update("ghanaCardNumber", event.target.value)
              }
              error={errors.ghanaCardNumber}
              help="Duplicate Ghana Card numbers are rejected."
            />
            <InputField
              id="consent-reference"
              label="Signed consent reference"
              required
              placeholder="CONS-0136.pdf"
              value={values.consentReference}
              onChange={(event) =>
                update("consentReference", event.target.value)
              }
              error={errors.consentReference}
              help="Enter the reference of the signed private consent evidence."
            />
            <CheckboxField
              id="ghana-card-verified"
              label="Original Ghana Card has been verified"
              checked={values.ghanaCardVerified}
              onChange={(event) =>
                update("ghanaCardVerified", event.target.checked)
              }
              help="Leave unchecked if verification is still pending."
            />
            <CheckboxField
              id="borrower-consent"
              label="Borrower consent has been obtained and recorded"
              required
              checked={values.consentConfirmed}
              onChange={(event) =>
                update("consentConfirmed", event.target.checked)
              }
              error={errors.consentConfirmed}
              help="Creation is blocked until consent is confirmed."
            />
          </div>
        </div>

        {Object.keys(errors).length > 0 && (
          <div className="mt-6">
            <Alert title="Check the highlighted fields" variant="danger">
              Correct every validation error before creating the borrower.
            </Alert>
          </div>
        )}
        {serverError && (
          <div className="mt-6">
            <Alert title="Borrower not created" variant="danger">
              {serverError}
            </Alert>
          </div>
        )}
        {createdCustomerId && (
          <div className="mt-6">
            <Alert title="Borrower created" variant="success">
              Customer ID <strong>{createdCustomerId}</strong> was created
              successfully.{" "}
              <Link href="/workspace/borrowers" className="underline">
                Open the borrower directory
              </Link>
              .
            </Alert>
          </div>
        )}

        <div className="border-border mt-7 flex flex-wrap justify-end gap-3 border-t pt-5">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setValues(initialValues(branches[0]?.id ?? ""));
              setErrors({});
              setServerError("");
              setCreatedCustomerId("");
            }}
          >
            Clear form
          </Button>
          <Button type="submit" loading={loading}>
            Create borrower
          </Button>
        </div>
      </form>
    </Card>
  );
}
