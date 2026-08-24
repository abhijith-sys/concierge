import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { OtpInput } from "../components/OtpInput";
import { Button, PageState } from "../components/ui";
import { useAuth } from "../context/useAuth";
import { ApiError, api } from "../lib/api";
import { theme } from "../lib/theme";

export function VerifyEmail() {
  const { user, isLoading, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const destination = (location.state as { from?: string } | null)?.from ?? "/";

  if (isLoading) return <PageState title="Loading" loading />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.emailVerifiedAt) return <Navigate to={destination} replace />;

  return (
    <section className="page-shell grid min-h-[70vh] items-center py-14 lg:grid-cols-2">
      <div className="relative hidden min-h-[480px] overflow-hidden rounded-[2rem] bg-navy p-12 text-white lg:flex lg:items-end">
        <img src={theme.assets.banner} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" />
        <div className="relative z-10">
          <p className="label-caps text-gold-light">Check your inbox</p>
          <h2 className="mt-5 max-w-lg text-4xl font-bold leading-tight">Enter the code we sent to verify your email.</h2>
        </div>
      </div>
      <div className="mx-auto w-full max-w-md">
        <p className="label-caps text-gold-dark">Verify email</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">Confirm your address</h1>
        <p className="mt-3 text-sm leading-6 text-ink-soft">
          We sent a 6-digit code to <span className="font-semibold text-ink">{user.email}</span>. Check your inbox and spam folder.
        </p>
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
              const next = await api.verifySignupOtp(code);
              setUser(next);
              toast.success("Email verified.");
              navigate(destination, { replace: true });
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
        </form>
        <p className="mt-6 text-center text-sm text-ink-soft">
          Didn&apos;t get the email?{" "}
          <button
            type="button"
            className="font-semibold text-navy underline disabled:opacity-50"
            disabled={resending}
            onClick={async () => {
              try {
                setResending(true);
                await api.resendSignupOtp();
                toast.success("A new code was sent.");
              } catch (error) {
                toast.error(error instanceof ApiError ? error.message : "Could not resend the code.");
              } finally {
                setResending(false);
              }
            }}
          >
            {resending ? "Sending…" : "Resend code"}
          </button>
        </p>
        <p className="mt-4 text-center text-sm text-ink-soft">
          Wrong account?{" "}
          <button
            type="button"
            className="font-semibold text-navy underline"
            onClick={async () => {
              await logout();
              navigate("/login", { replace: true });
            }}
          >
            Sign out
          </button>
        </p>
        <p className="mt-4 text-center">
          <Link to="/" className="text-sm font-semibold text-ink-soft underline">
            I&apos;ll do this later
          </Link>
        </p>
      </div>
    </section>
  );
}
