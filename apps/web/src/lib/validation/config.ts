export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PASSWORD_PATTERN = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
export const E164_PATTERN = /^\+[1-9]\d{6,14}$/;
export const URL_PATTERN = /^https?:\/\/.+/i;
export const OTP_PATTERN = /^\d{6}$/;

export type FieldKind = "text" | "email" | "password" | "phone" | "url" | "number" | "select" | "otp";

export interface FieldRule {
  label: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  kind?: FieldKind;
  matchField?: string;
  pattern?: RegExp;
  message?: string;
}

export const fieldRules = {
  name: { label: "Full name", required: true, minLength: 2, maxLength: 100 },
  email: { label: "Email address", required: true, kind: "email", maxLength: 254 },
  loginPassword: { label: "Password", required: true, minLength: 1, maxLength: 128 },
  password: {
    label: "Password",
    required: true,
    kind: "password",
    minLength: 8,
    maxLength: 128,
    pattern: PASSWORD_PATTERN,
    message: "Use at least 8 characters, one uppercase letter, and one number.",
  },
  confirmPassword: {
    label: "Confirm password",
    required: true,
    kind: "password",
    matchField: "password",
    message: "Passwords do not match.",
  },
  newPassword: {
    label: "New password",
    required: true,
    kind: "password",
    minLength: 8,
    maxLength: 128,
    pattern: PASSWORD_PATTERN,
    message: "Use at least 8 characters, one uppercase letter, and one number.",
  },
  confirmNewPassword: {
    label: "Confirm password",
    required: true,
    kind: "password",
    matchField: "newPassword",
    message: "Passwords do not match.",
  },
  currentPassword: { label: "Current password", required: true, minLength: 1, maxLength: 128 },
  phone: { label: "Phone number", required: false, kind: "phone", maxLength: 20 },
  recoveryEmail: { label: "Recovery email", required: false, kind: "email", maxLength: 254 },
  otp: { label: "Verification code", required: true, kind: "otp", minLength: 6, maxLength: 6 },
  businessName: { label: "Business name", required: true, minLength: 2, maxLength: 160 },
  businessTitle: { label: "Profile title", required: true, minLength: 2, maxLength: 160 },
  businessEmail: { label: "Business email", required: true, kind: "email", maxLength: 254 },
  businessPhone: { label: "Phone", required: false, kind: "phone", maxLength: 20 },
  intent: { label: "I am", required: true, kind: "select" },
  categoryId: { label: "Category", required: true, kind: "select" },
  subcategoryId: { label: "Subcategory", required: true, kind: "select" },
  description: { label: "Description", required: true, minLength: 20, maxLength: 10_000 },
  listingDescription: { label: "Description", required: true, minLength: 10, maxLength: 5000 },
  address: { label: "Street address", required: true, minLength: 3, maxLength: 300 },
  city: { label: "City", required: true, minLength: 2, maxLength: 100 },
  website: { label: "Website", required: false, kind: "url", maxLength: 500 },
  instagram: { label: "Instagram", required: false, kind: "url", maxLength: 500 },
  facebook: { label: "Facebook", required: false, kind: "url", maxLength: 500 },
  openTime: { label: "Opens", required: true },
  closeTime: { label: "Closes", required: true },
  lat: { label: "Latitude", required: false, kind: "number", min: -90, max: 90 },
  lng: { label: "Longitude", required: false, kind: "number", min: -180, max: 180 },
  listingName: { label: "Listing name", required: true, minLength: 2, maxLength: 160 },
  price: { label: "Starting price", required: true, kind: "number", min: 0, max: 1_000_000 },
  pricingType: { label: "Pricing type", required: true, kind: "select" },
} as const satisfies Record<string, FieldRule>;

export type FieldKey = keyof typeof fieldRules;

export const formFields = {
  login: ["email", "loginPassword"],
  signup: ["name", "email", "phone", "recoveryEmail", "password", "confirmPassword"],
  forgotPassword: ["email"],
  resetPassword: ["newPassword", "confirmNewPassword"],
  verifyOtp: ["otp"],
  accountProfile: ["name", "phone", "recoveryEmail"],
  changePassword: ["currentPassword", "newPassword", "confirmNewPassword"],
  business: [
    "businessName",
    "businessTitle",
    "businessEmail",
    "businessPhone",
    "intent",
    "categoryId",
    "description",
    "address",
    "city",
    "website",
    "instagram",
    "facebook",
    "openTime",
    "closeTime",
    "lat",
    "lng",
  ],
  listing: ["categoryId", "listingName", "price", "pricingType", "listingDescription"],
} as const satisfies Record<string, readonly FieldKey[]>;

export type FormKey = keyof typeof formFields;

export const passwordChecks = [
  { label: "At least 8 characters", test: (value: string) => value.length >= 8 },
  { label: "Contains uppercase", test: (value: string) => /[A-Z]/.test(value) },
  { label: "Contains a number", test: (value: string) => /\d/.test(value) },
];

function isBlank(value: unknown) {
  return value == null || String(value).trim() === "";
}

export function isFieldRequired(key: FieldKey) {
  return Boolean(fieldRules[key].required);
}

export function validateField(key: FieldKey, values: Record<string, unknown>): string | undefined {
  const rule: FieldRule = fieldRules[key];
  const raw = values[key];
  const text = raw == null ? "" : String(raw).trim();

  if (isBlank(raw)) {
    return rule.required ? `${rule.label} is required.` : undefined;
  }

  if (rule.minLength && text.length < rule.minLength) {
    return `${rule.label} must be at least ${rule.minLength} characters.`;
  }
  if (rule.maxLength && text.length > rule.maxLength) {
    return `${rule.label} must be at most ${rule.maxLength} characters.`;
  }

  if (rule.kind === "email" && !EMAIL_PATTERN.test(text)) {
    return `Enter a valid ${rule.label.toLowerCase()}.`;
  }
  if (rule.kind === "phone" && !E164_PATTERN.test(text.replace(/\s/g, ""))) {
    return "Select a country and enter a valid phone number.";
  }
  if (rule.kind === "url" && !URL_PATTERN.test(text) && !text.startsWith("/uploads/")) {
    return `Enter a valid URL for ${rule.label.toLowerCase()}.`;
  }
  if (rule.kind === "otp" && !OTP_PATTERN.test(text)) {
    return "Enter the 6-digit code.";
  }
  if (rule.kind === "password" && rule.pattern && !rule.pattern.test(text)) {
    return rule.message ?? "Enter a stronger password.";
  }
  if (rule.kind === "number") {
    const num = Number(text);
    if (!Number.isFinite(num)) return `${rule.label} must be a number.`;
    if (rule.min != null && num < rule.min) return `${rule.label} must be at least ${rule.min}.`;
    if (rule.max != null && num > rule.max) return `${rule.label} must be at most ${rule.max}.`;
  }
  if (rule.matchField) {
    const other = values[rule.matchField];
    if (String(other ?? "") !== String(raw ?? "")) {
      return rule.message ?? "Values do not match.";
    }
  }
  if (key === "recoveryEmail") {
    const loginEmail = String(values.email ?? "").trim().toLowerCase();
    if (loginEmail && text.toLowerCase() === loginEmail) {
      return "Recovery email must be different from your login email.";
    }
  }
  return undefined;
}

export function validateForm(form: FormKey, values: Record<string, unknown>, extraKeys: FieldKey[] = []) {
  const keys = [...formFields[form], ...extraKeys];
  const errors: Partial<Record<FieldKey, string>> = {};
  for (const key of keys) {
    const message = validateField(key, values);
    if (message) errors[key] = message;
  }
  return errors;
}

export function firstFormError(errors: Partial<Record<string, string>>) {
  return Object.values(errors).find(Boolean);
}
