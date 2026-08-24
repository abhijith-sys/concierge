import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { OtpInput } from "../components/OtpInput";
import { Button, Field, Input } from "../components/ui";
import { ApiError, api } from "../lib/api";
import { firstFormError, isFieldRequired, validateForm, type FieldKey } from "../lib/validation";

type Step = "email" | "otp" | "password";
type Method = "account" | "recovery";

export function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("email");
  const [method, setMethod] = useState<Method>("account");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<FieldKey | "root", string>>>({});
  const [submitting, setSubmitting] = useState(false);

  const usingRecovery = method === "recovery";

  return (
    <section className="page-shell grid min-h-[70vh] items-center py-14">
      <div className="mx-auto w-full max-w-md">
        <p className="label-caps text-gold-dark">Account recovery</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">
          {step === "email" ? "Forgot password" : step === "otp" ? "Enter verification code" : "Set a new password"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-ink-soft">
          {step === "email"
            ? usingRecovery
              ? "Enter your verified recovery email. We will send a 6-digit code."
              : "Enter your account email. We will send a 6-digit code."
            : step === "otp"
              ? `We sent a code to ${email || (usingRecovery ? "your recovery email" : "your account email")}.`
              : "Choose a strong password you have not used elsewhere."}
        </p>

        {step === "email" ? (
          <form
            className="mt-8 grid gap-5"
            onSubmit={async (event) => {
              event.preventDefault();
              const nextErrors = validateForm("forgotPassword", { email });
              setErrors(nextErrors);
              if (Object.keys(nextErrors).length) {
                toast.error(firstFormError(nextErrors));
                return;
              }
              try {
                setSubmitting(true);
                await api.forgotPassword({ email: email.trim().toLowerCase(), method });
                setStep("otp");
                setCode("");
                toast.success("Check your email for the verification code.");
              } catch (error) {
                const message = error instanceof ApiError ? error.message : "Could not send the code.";
                toast.error(message);
                setErrors({ email: message });
              } finally {
                setSubmitting(false);
              }
            }}
          >
            <Field
              label={usingRecovery ? "Recovery email" : "Email address"}
              error={errors.email}
              required={isFieldRequired("email")}
            >
              <Input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setErrors({});
                }}
                aria-invalid={Boolean(errors.email)}
              />
            </Field>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Sending code…" : "Send verification code"}
            </Button>
            <button
              type="button"
              className="text-sm text-ink-soft underline"
              onClick={() => {
                setMethod((current) => (current === "account" ? "recovery" : "account"));
                setErrors({});
              }}
            >
              {usingRecovery ? "Try another way: use account email" : "Try another way: use recovery email"}
            </button>
            <Link to="/login" className="inline-flex items-center justify-center gap-1 text-sm font-semibold">
              <ArrowLeft className="size-4" /> Back to sign in
            </Link>
          </form>
        ) : null}

        {step === "otp" ? (
          <form
            className="mt-8 grid gap-6"
            onSubmit={async (event) => {
              event.preventDefault();
              if (code.length !== 6) {
                toast.error("Enter the 6-digit code.");
                return;
              }
              try {
                setSubmitting(true);
                const result = await api.verifyResetOtp({
                  email: email.trim().toLowerCase(),
                  method,
                  code,
                });
                setResetToken(result.resetToken);
                setStep("password");
                toast.success("Code verified. Choose a new password.");
              } catch (error) {
                toast.error(error instanceof ApiError ? error.message : "Invalid or expired code.");
              } finally {
                setSubmitting(false);
              }
            }}
          >
            <OtpInput value={code} onChange={setCode} disabled={submitting} />
            <Button type="submit" disabled={submitting || code.length !== 6}>
              {submitting ? "Verifying…" : "Verify and continue"}
            </Button>
            <button
              type="button"
              className="text-sm font-semibold text-navy underline"
              onClick={async () => {
                try {
                  await api.forgotPassword({ email: email.trim().toLowerCase(), method });
                  setCode("");
                  toast.success("A new code was sent.");
                } catch (error) {
                  toast.error(error instanceof ApiError ? error.message : "Could not resend the code.");
                }
              }}
            >
              Resend code
            </button>
            <button type="button" className="text-sm text-ink-soft underline" onClick={() => setStep("email")}>
              Use a different email
            </button>
          </form>
        ) : null}

        {step === "password" ? (
          <form
            className="mt-8 grid gap-5"
            onSubmit={async (event) => {
              event.preventDefault();
              const nextErrors = validateForm("resetPassword", { newPassword, confirmNewPassword });
              setErrors(nextErrors);
              if (Object.keys(nextErrors).length) {
                toast.error(firstFormError(nextErrors));
                return;
              }
              try {
                setSubmitting(true);
                await api.resetPassword({
                  email: email.trim().toLowerCase(),
                  method,
                  newPassword,
                  resetToken,
                });
                toast.success("Password updated. Sign in with your new password.");
                navigate("/login", { replace: true });
              } catch (error) {
                toast.error(error instanceof ApiError ? error.message : "Could not update password.");
              } finally {
                setSubmitting(false);
              }
            }}
          >
            <Field label="New password" error={errors.newPassword} required>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  aria-invalid={Boolean(errors.newPassword)}
                  className="pr-12"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft"
                  onClick={() => setShowPassword((current) => !current)}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </Field>
            <Field label="Confirm password" error={errors.confirmNewPassword} required>
              <Input
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={confirmNewPassword}
                onChange={(event) => setConfirmNewPassword(event.target.value)}
                aria-invalid={Boolean(errors.confirmNewPassword)}
              />
            </Field>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Updating…" : "Set new password"}
            </Button>
            <Link to="/login" className="inline-flex items-center justify-center gap-1 text-sm font-semibold">
              <ArrowLeft className="size-4" /> Back to sign in
            </Link>
          </form>
        ) : null}
      </div>
    </section>
  );
}
