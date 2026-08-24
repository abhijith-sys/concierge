import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Mail, ShieldCheck, UserRound } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { EmptyList } from "../components/EmptyList";
import { FlagPhoneInput } from "../components/FlagPhoneInput";
import { OtpInput } from "../components/OtpInput";
import { Button, Field, Input, PageState } from "../components/ui";
import { useAuth } from "../context/useAuth";
import { ApiError, api } from "../lib/api";
import { isProvider } from "../lib/provider";
import { businessStatus, StatusBadge } from "../lib/status";
import { theme } from "../lib/theme";
import { firstFormError, isFieldRequired, validateForm, type FieldKey } from "../lib/validation";

export function Account() {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});

  const mine = useQuery({
    queryKey: ["businesses", "mine"],
    queryFn: api.myBusinesses,
    enabled: Boolean(user),
  });

  const updateMe = useMutation({
    mutationFn: api.updateMe,
    onSuccess: (next) => {
      queryClient.setQueryData(["auth", "me"], next);
      toast.success("Profile saved.");
    },
    onError: (error) => toast.error(error instanceof ApiError ? error.message : "Unable to save profile."),
  });
  const uploadAvatar = useMutation({
    mutationFn: async (file: File) => {
      const stored = await api.upload(file, "public");
      return api.updateMe({ avatarUrl: stored.url });
    },
    onSuccess: (next) => queryClient.setQueryData(["auth", "me"], next),
  });

  useEffect(() => {
    if (!user) return;
    setName((current) => current || user.name);
    setPhone((current) => current || user.phone || "");
    setRecoveryEmail((current) => current || user.recoveryEmail || "");
  }, [user]);

  if (isLoading) return <PageState title="Loading your account" loading />;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;

  function saveProfile(event: FormEvent) {
    event.preventDefault();
    const nextName = name.trim();
    const nextPhone = phone.trim();
    const nextRecovery = recoveryEmail.trim();
    const nextErrors = validateForm("accountProfile", {
      name: nextName,
      phone: nextPhone,
      recoveryEmail: nextRecovery,
      email: user!.email,
    });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      toast.error(firstFormError(nextErrors) ?? "Please fix the highlighted fields.");
      return;
    }
    updateMe.mutate({
      name: nextName,
      phone: nextPhone || null,
      recoveryEmail: nextRecovery || null,
    });
  }

  return (
    <section className="page-shell py-14 md:py-20">
      <p className="label-caps text-gold-dark">Your {theme.name}</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">Account</h1>
      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_2fr]">
        <aside className="rounded-3xl bg-black p-8 text-white">
          <div className="flex size-16 items-center justify-center overflow-hidden rounded-full bg-white/10">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="size-full object-cover" />
            ) : (
              <UserRound className="size-8" />
            )}
          </div>
          <h2 className="mt-6 text-2xl font-semibold">{user.name}</h2>
          <p className="mt-2 flex items-center gap-2 text-sm text-white/65">
            <Mail className="size-4" />
            {user.email}
          </p>
          <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-gold-light px-3 py-1.5 text-xs font-bold capitalize text-gold-dark">
            <ShieldCheck className="size-4" />
            {user.role} account
          </span>
          <p className="mt-4 text-xs text-white/55">
            Email {user.emailVerifiedAt ? "verified" : "not verified"}
            {user.phoneVerifiedAt ? " · Phone verified" : ""}
            {user.recoveryEmailVerifiedAt ? " · Recovery email verified" : ""}
          </p>
          <label className="mt-6 block">
            <span className="text-xs uppercase tracking-wider text-white/50">Profile photo</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="mt-2 block w-full text-xs"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) uploadAvatar.mutate(file);
              }}
            />
          </label>
        </aside>
        <div className="grid gap-6">
          <div className="rounded-3xl border border-line p-8">
            <h2 className="text-2xl font-semibold">Profile</h2>
            <form onSubmit={saveProfile} className="mt-6 grid gap-4 md:grid-cols-2">
              <Field label="Name" error={errors.name} required={isFieldRequired("name")}>
                <Input value={name} onChange={(e) => setName(e.target.value)} aria-invalid={Boolean(errors.name)} />
              </Field>
              <Field label="Phone" error={errors.phone}>
                <FlagPhoneInput
                  value={phone}
                  onChange={setPhone}
                  error={Boolean(errors.phone)}
                />
              </Field>
              <div className="md:col-span-2">
                <Field label="Recovery email" error={errors.recoveryEmail} hint="Optional backup inbox for password recovery.">
                  <Input
                    type="email"
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    aria-invalid={Boolean(errors.recoveryEmail)}
                  />
                </Field>
              </div>
              {updateMe.isError ? <p className="text-sm text-red-700 md:col-span-2">{updateMe.error.message}</p> : null}
              <Button type="submit" className="md:col-span-2" disabled={updateMe.isPending}>
                Save profile
              </Button>
            </form>
          </div>

          {!user.emailVerifiedAt ? (
            <div className="rounded-3xl border border-line p-8">
              <h2 className="text-xl font-semibold">Verify email</h2>
              <p className="mt-2 text-sm text-ink-soft">
                A 6-digit code is sent to {user.email}. In local development it is also logged in the API console.
              </p>
              <Link to="/verify-email" className="mt-5 inline-flex">
                <Button type="button">Open verification</Button>
              </Link>
            </div>
          ) : null}

          {user.recoveryEmail && !user.recoveryEmailVerifiedAt ? (
            <div className="rounded-3xl border border-line p-8">
              <h2 className="text-xl font-semibold">Verify recovery email</h2>
              <p className="mt-2 text-sm text-ink-soft">
                Confirm {user.recoveryEmail} so you can reset your password through this inbox.
              </p>
              <div className="mt-5 grid gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={async () => {
                    try {
                      await api.sendRecoveryEmailOtp();
                      toast.success("Code sent to your recovery email.");
                    } catch (error) {
                      toast.error(error instanceof ApiError ? error.message : "Could not send the code.");
                    }
                  }}
                >
                  Send code
                </Button>
                <OtpInput value={recoveryCode} onChange={setRecoveryCode} />
                <Button
                  type="button"
                  disabled={recoveryCode.length !== 6}
                  onClick={async () => {
                    try {
                      const next = await api.verifyRecoveryEmailOtp(recoveryCode);
                      queryClient.setQueryData(["auth", "me"], next);
                      setRecoveryCode("");
                      toast.success("Recovery email verified.");
                    } catch (error) {
                      toast.error(error instanceof ApiError ? error.message : "Invalid or expired code.");
                    }
                  }}
                >
                  Verify recovery email
                </Button>
              </div>
            </div>
          ) : null}

          <div className="rounded-3xl border border-line p-8">
            <h2 className="text-2xl font-semibold">
              {mine.data?.length || isProvider(user) ? "Your businesses" : "Your activity"}
            </h2>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/listings">
                <Button variant="outline">Explore listings</Button>
              </Link>
              <Link to="/wishlist">
                <Button variant="outline">Wishlist</Button>
              </Link>
              <Link to="/provider">
                <Button>
                  <Building2 className="size-4" /> My Business
                </Button>
              </Link>
              {isProvider(user) ? (
                <Link to="/verification">
                  <Button variant="outline">Identity verification</Button>
                </Link>
              ) : null}
            </div>
            {mine.data?.length ? (
              <ul className="mt-6 grid gap-3">
                {mine.data.map((business) => (
                  <li key={business.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-surface-low px-4 py-3">
                    <div>
                      <p className="font-semibold">{business.name}</p>
                      <p className="mt-1">
                        <StatusBadge {...businessStatus(business)} />
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Link to={`/provider/listings?business=${business.id}`}>
                        <Button>Open</Button>
                      </Link>
                      <Link to={`/business/${business.slug}/edit`}>
                        <Button variant="outline">Edit profile</Button>
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            ) : mine.isFetched && isProvider(user) ? (
              <EmptyList
                compact
                className="mt-2"
                title="No businesses yet"
                description="Create a profile to start listing items."
                action={
                  <Link to="/list-business">
                    <Button>Add new business</Button>
                  </Link>
                }
              />
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
