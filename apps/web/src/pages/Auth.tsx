import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { Button, Field, Input, Select } from "../components/ui";
import { useAuth } from "../context/useAuth";

const loginSchema = z.object({
  email: z.email("Enter a valid email."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});
const registerSchema = z.object({
  name: z.string().min(2, "Enter your full name."),
  email: z.email("Enter a valid email."),
  phone: z.string().optional(),
  password: z.string().min(8, "Use at least 8 characters."),
  role: z.enum(["user", "business"]),
});
type LoginInput = z.infer<typeof loginSchema>;
type RegisterInput = z.infer<typeof registerSchema>;

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
      <div className="hidden min-h-[580px] flex-col justify-end overflow-hidden rounded-[2rem] bg-navy p-12 text-white lg:flex">
        <div className="auth-glow" />
        <div className="relative z-10">
          <ShieldCheck className="mb-6 size-10 text-gold-light" />
          <p className="label-caps text-gold-light">Concierge membership</p>
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

export function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const form = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });
  const destination = (location.state as { from?: string } | null)?.from ?? "/account";
  if (user) return <Navigate to={destination} replace />;

  return (
    <AuthShell eyebrow="Welcome back" title="Sign in to Concierge" copy="Continue to your account and trusted recommendations.">
      <form
        className="grid gap-5"
        onSubmit={form.handleSubmit(async (values) => {
          try {
            await login(values);
            navigate(destination, { replace: true });
          } catch (error) {
            form.setError("root", { message: error instanceof Error ? error.message : "Unable to sign in." });
          }
        })}
      >
        <Field label="Email address" error={form.formState.errors.email?.message}><Input type="email" autoComplete="email" {...form.register("email")} /></Field>
        <Field label="Password" error={form.formState.errors.password?.message}><Input type="password" autoComplete="current-password" {...form.register("password")} /></Field>
        {form.formState.errors.root ? <p className="text-sm text-red-700">{form.formState.errors.root.message}</p> : null}
        <Button type="submit" className="mt-1 w-full" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? "Signing in…" : <>Sign in <ArrowRight className="size-4" /></>}</Button>
      </form>
      <p className="mt-7 text-center text-sm text-ink-soft">New to Concierge? <Link to="/register" className="font-bold text-black underline">Create an account</Link></p>
    </AuthShell>
  );
}

export function Register() {
  const { user, register: registerUser } = useAuth();
  const navigate = useNavigate();
  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: "user" },
  });
  if (user) return <Navigate to="/account" replace />;

  return (
    <AuthShell eyebrow="Join the network" title="Create your account" copy="Become a member, or join as a business ready to be discovered.">
      <form
        className="grid gap-5"
        onSubmit={form.handleSubmit(async (values) => {
          try {
            const created = await registerUser(values);
            navigate(created.role === "business" ? "/list-business" : "/account", { replace: true });
          } catch (error) {
            form.setError("root", { message: error instanceof Error ? error.message : "Unable to register." });
          }
        })}
      >
        <Field label="Full name" error={form.formState.errors.name?.message}><Input autoComplete="name" {...form.register("name")} /></Field>
        <Field label="Email address" error={form.formState.errors.email?.message}><Input type="email" autoComplete="email" {...form.register("email")} /></Field>
        <Field label="Phone (optional)" error={form.formState.errors.phone?.message}><Input type="tel" autoComplete="tel" {...form.register("phone", { setValueAs: (value: string) => value || undefined })} /></Field>
        <Field label="Account type" error={form.formState.errors.role?.message}><Select {...form.register("role")}><option value="user">Concierge member</option><option value="business">Business owner</option></Select></Field>
        <Field label="Password" error={form.formState.errors.password?.message}><Input type="password" autoComplete="new-password" {...form.register("password")} /></Field>
        {form.formState.errors.root ? <p className="text-sm text-red-700">{form.formState.errors.root.message}</p> : null}
        <Button type="submit" className="mt-1 w-full" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? "Creating account…" : <>Create account <ArrowRight className="size-4" /></>}</Button>
      </form>
      <p className="mt-7 text-center text-sm text-ink-soft">Already a member? <Link to="/login" className="font-bold text-black underline">Sign in</Link></p>
    </AuthShell>
  );
}
