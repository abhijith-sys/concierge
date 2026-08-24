import { ArrowRight, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { FlagPhoneInput } from "../components/FlagPhoneInput";
import { Button, Field, Input } from "../components/ui";
import { useAuth } from "../context/useAuth";
import { ApiError } from "../lib/api";
import { theme } from "../lib/theme";
import {
  firstFormError,
  isFieldRequired,
  passwordChecks,
  validateForm,
  type FieldKey,
} from "../lib/validation";

function AuthShell({
  eyebrow,
  title,
  copy,
  children,
}: {
  eyebrow: string;
  title: string;
  copy: string;
  children: React.ReactNode;
}) {
  return (
    <section className="page-shell grid min-h-[75vh] items-center gap-12 py-14 lg:grid-cols-2">
      <div className="relative hidden min-h-[580px] flex-col justify-end overflow-hidden rounded-[2rem] bg-navy p-12 text-white lg:flex">
        <img src={theme.assets.banner} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" />
        <div className="auth-glow" />
        <div className="relative z-10">
          <p className="label-caps text-gold-light">{theme.name} membership</p>
          <h2 className="mt-5 max-w-lg text-5xl font-bold leading-tight tracking-[-.04em]">A trusted network for exceptional decisions.</h2>
          <p className="mt-5 max-w-md leading-7 text-white/65">Save discoveries, share considered reviews, or introduce your business to discerning clients.</p>
        </div>
      </div>
      <div className="mx-auto w-full max-w-md">
        <p className="label-caps text-gold-dark">{eyebrow}</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-ink-soft">{copy}</p>
        <div className="mt-8">{children}</div>
      </div>
    </section>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  error,
  required,
  autoComplete,
  showChecks,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  autoComplete?: string;
  showChecks?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <Field label={label} error={error} required={required}>
      <div className="relative">
        <Input
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={Boolean(error)}
          className="pr-12"
        />
        <button
          type="button"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {showChecks ? (
        <div className="mt-2 grid gap-1.5">
          {passwordChecks.map((check) => (
            <p key={check.label} className="flex items-center gap-2 text-xs font-normal">
              <CheckCircle2 className={`size-3.5 ${check.test(value) ? "text-emerald-600" : "text-slate-300"}`} />
              <span className={check.test(value) ? "text-ink" : "text-ink-soft"}>{check.label}</span>
            </p>
          ))}
        </div>
      ) : null}
    </Field>
  );
}

export function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const destination = (location.state as { from?: string } | null)?.from ?? "/account";
  if (user) {
    if (!user.emailVerifiedAt) return <Navigate to="/verify-email" replace />;
    return <Navigate to={destination} replace />;
  }

  return (
    <AuthShell eyebrow="Welcome back" title={`Sign in to ${theme.name}`} copy="Continue to your account and trusted recommendations.">
      <form
        className="grid gap-5"
        onSubmit={async (event) => {
          event.preventDefault();
          const nextErrors = validateForm("login", { email, loginPassword });
          setErrors(nextErrors);
          if (Object.keys(nextErrors).length) {
            toast.error(firstFormError(nextErrors) ?? "Please fix the highlighted fields.");
            return;
          }
          try {
            setSubmitting(true);
            const next = await login({ email, password: loginPassword });
            toast.success("Welcome back.");
            navigate(next.emailVerifiedAt ? destination : "/verify-email", { replace: true });
          } catch (error) {
            const message = error instanceof ApiError ? error.message : "Unable to sign in.";
            toast.error(message);
            setErrors({ email: message });
          } finally {
            setSubmitting(false);
          }
        }}
      >
        <Field label="Email address" error={errors.email} required={isFieldRequired("email")}>
          <Input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setErrors((current) => ({ ...current, email: undefined }));
            }}
            aria-invalid={Boolean(errors.email)}
          />
        </Field>
        <Field label="Password" error={errors.loginPassword} required={isFieldRequired("loginPassword")}>
          <div className="relative">
            <Input
              type={showLoginPassword ? "text" : "password"}
              autoComplete="current-password"
              value={loginPassword}
              onChange={(event) => {
                setLoginPassword(event.target.value);
                setErrors((current) => ({ ...current, loginPassword: undefined }));
              }}
              aria-invalid={Boolean(errors.loginPassword)}
              className="pr-12"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft"
              onClick={() => setShowLoginPassword((current) => !current)}
              aria-label={showLoginPassword ? "Hide password" : "Show password"}
            >
              {showLoginPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </Field>
        <div className="-mt-2 text-right">
          <Link to="/forgot-password" className="text-xs font-semibold text-gold-dark underline">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" className="mt-1 w-full" disabled={submitting}>
          {submitting ? "Signing in…" : <>Sign in <ArrowRight className="size-4" /></>}
        </Button>
      </form>
      <p className="mt-7 text-center text-sm text-ink-soft">
        New to {theme.name}?{" "}
        <Link to="/register" className="font-bold text-black underline">
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}

export function Register() {
  const { user, register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState({
    name: "",
    email: "",
    phone: "",
    recoveryEmail: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const isValid = useMemo(() => Object.keys(validateForm("signup", values)).length === 0, [values]);
  if (user) {
    if (!user.emailVerifiedAt) return <Navigate to="/verify-email" replace />;
    return <Navigate to="/" replace />;
  }

  function update(key: keyof typeof values, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  return (
    <AuthShell eyebrow="Join the network" title="Create your account" copy="Browse freely, then save, message, or become a provider when you are ready.">
      <form
        className="grid gap-5"
        onSubmit={async (event) => {
          event.preventDefault();
          const nextErrors = validateForm("signup", values);
          setErrors(nextErrors);
          if (Object.keys(nextErrors).length) {
            toast.error(firstFormError(nextErrors) ?? "Please fix the highlighted fields.");
            return;
          }
          try {
            setSubmitting(true);
            await registerUser({
              name: values.name.trim(),
              email: values.email.trim(),
              phone: values.phone || undefined,
              recoveryEmail: values.recoveryEmail.trim() || undefined,
              password: values.password,
            });
            toast.success("Account created. Check your email for a verification code.");
            navigate("/verify-email", { replace: true, state: { from: "/" } });
          } catch (error) {
            const message = error instanceof ApiError ? error.message : "Unable to register.";
            toast.error(message);
            if (error instanceof ApiError && error.fieldErrors) {
              setErrors(error.fieldErrors as Partial<Record<FieldKey, string>>);
            } else {
              setErrors({ email: message });
            }
          } finally {
            setSubmitting(false);
          }
        }}
      >
        <Field label="Full name" error={errors.name} required={isFieldRequired("name")}>
          <Input autoComplete="name" value={values.name} onChange={(event) => update("name", event.target.value)} aria-invalid={Boolean(errors.name)} />
        </Field>
        <Field label="Email address" error={errors.email} required={isFieldRequired("email")}>
          <Input type="email" autoComplete="email" value={values.email} onChange={(event) => update("email", event.target.value)} aria-invalid={Boolean(errors.email)} />
        </Field>
        <Field label="Phone number" error={errors.phone} hint="Optional. Select your country flag, then type the number.">
          <FlagPhoneInput value={values.phone} onChange={(value) => update("phone", value)} error={Boolean(errors.phone)} />
        </Field>
        <Field label="Recovery email" error={errors.recoveryEmail} hint="Optional backup inbox for password recovery.">
          <Input type="email" autoComplete="off" value={values.recoveryEmail} onChange={(event) => update("recoveryEmail", event.target.value)} aria-invalid={Boolean(errors.recoveryEmail)} />
        </Field>
        <PasswordField
          label="Password"
          required
          value={values.password}
          onChange={(value) => update("password", value)}
          error={errors.password}
          autoComplete="new-password"
          showChecks
        />
        <PasswordField
          label="Confirm password"
          required
          value={values.confirmPassword}
          onChange={(value) => update("confirmPassword", value)}
          error={errors.confirmPassword}
          autoComplete="new-password"
        />
        <Button type="submit" className="mt-1 w-full" disabled={submitting || !isValid}>
          {submitting ? "Creating account…" : <>Create account <ArrowRight className="size-4" /></>}
        </Button>
      </form>
      <p className="mt-7 text-center text-sm text-ink-soft">
        Already a member?{" "}
        <Link to="/login" className="font-bold text-black underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
