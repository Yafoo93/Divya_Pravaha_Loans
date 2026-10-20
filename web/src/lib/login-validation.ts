export type LoginValues = { email: string; password: string };

export function validateLogin(values: LoginValues) {
  const errors: Partial<Record<keyof LoginValues, string>> = {};
  if (!values.email.trim()) errors.email = "Enter your staff email address.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()))
    errors.email = "Enter a valid email address.";
  if (!values.password) errors.password = "Enter your password.";
  else if (values.password.length < 8)
    errors.password = "Password must contain at least 8 characters.";
  else if (values.password.length > 128)
    errors.password = "Password must not exceed 128 characters.";
  return errors;
}
