"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { validateLogin, type LoginValues } from "@/lib/login-validation";
import { Alert, Button } from "./ui/actions";
import { InputField } from "./ui/forms";

export function LoginForm() {
  const [values, setValues] = useState<LoginValues>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<ReturnType<typeof validateLogin>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function update(field: keyof LoginValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
    setServerError("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateLogin(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    setLoading(true);
    setServerError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!response.ok) {
        const result = (await response.json()) as { error?: string };
        setServerError(result.error ?? "Sign-in failed. Try again.");
        return;
      }
      router.replace("/workspace");
      router.refresh();
    } catch {
      setServerError("The server could not be reached. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <form noValidate onSubmit={submit} className="space-y-5">
        <InputField
          id="staff-email"
          label="Staff email address"
          type="email"
          required
          autoComplete="username"
          value={values.email}
          onChange={(event) => update("email", event.target.value)}
          error={errors.email}
          placeholder="name@company.com"
          className="min-h-12"
        />
        <div>
          <InputField
            id="staff-password"
            label="Password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            value={values.password}
            onChange={(event) => update("password", event.target.value)}
            error={errors.password}
            className="min-h-12 pr-20"
          />
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="text-primary mt-2 min-h-10 text-sm font-bold"
            aria-controls="staff-password"
            aria-pressed={showPassword}
          >
            {showPassword ? "Hide password" : "Show password"}
          </button>
        </div>

        {Object.keys(errors).length > 0 && (
          <Alert title="Sign-in details required" variant="danger">
            Correct the highlighted fields and try again.
          </Alert>
        )}
        {serverError && (
          <Alert title="Unable to sign in" variant="danger">
            {serverError}
          </Alert>
        )}
        <Button
          loading={loading}
          type="submit"
          className="min-h-12 w-full text-base"
        >
          Continue securely
        </Button>
      </form>
    </div>
  );
}
