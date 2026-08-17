import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Mail, ShieldCheck, UserRound } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { Button, Field, Input, PageState } from "../components/ui";
import { useAuth } from "../context/useAuth";
import { api } from "../lib/api";
import { isProvider } from "../lib/provider";
import { businessStatus, StatusBadge } from "../lib/status";

export function Account() {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [otpCode, setOtpCode] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const mine = useQuery({
    queryKey: ["businesses", "mine"],
    queryFn: api.myBusinesses,
    enabled: Boolean(user),
  });

  const updateMe = useMutation({
    mutationFn: api.updateMe,
    onSuccess: (next) => queryClient.setQueryData(["auth", "me"], next),
  });
  const requestOtp = useMutation({ mutationFn: () => api.requestOtp({ channel: "email", purpose: "register" }) });
  const verifyOtp = useMutation({
    mutationFn: () => api.verifyOtp({ channel: "email", purpose: "register", code: otpCode }),
    onSuccess: (next) => {
      queryClient.setQueryData(["auth", "me"], next);
      setOtpCode("");
    },
  });
  const uploadAvatar = useMutation({
    mutationFn: async (file: File) => {
      const stored = await api.upload(file, "public");
      return api.updateMe({ avatarUrl: stored.url });
    },
    onSuccess: (next) => queryClient.setQueryData(["auth", "me"], next),
  });

  if (isLoading) return <PageState title="Loading your account" loading />;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;

  function saveProfile(event: FormEvent) {
    event.preventDefault();
    updateMe.mutate({
      name: name || user!.name,
      phone: phone || user!.phone || null,
    });
  }

  return (
    <section className="page-shell py-14 md:py-20">
      <p className="label-caps text-gold-dark">Your Concierge</p>
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
              <Field label="Name">
                <Input defaultValue={user.name} onChange={(e) => setName(e.target.value)} />
              </Field>
              <Field label="Phone">
                <Input defaultValue={user.phone ?? ""} onChange={(e) => setPhone(e.target.value)} />
              </Field>
              {updateMe.isError ? <p className="text-sm text-red-700 md:col-span-2">{updateMe.error.message}</p> : null}
              <Button type="submit" className="md:col-span-2" disabled={updateMe.isPending}>
                Save profile
              </Button>
            </form>
          </div>

          {!user.emailVerifiedAt ? (
            <div className="rounded-3xl border border-line p-8">
              <h2 className="text-xl font-semibold">Verify email</h2>
              <p className="mt-2 text-sm text-ink-soft">We send a 6-digit code (logged to the API console in local development).</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button type="button" variant="outline" onClick={() => requestOtp.mutate()} disabled={requestOtp.isPending}>
                  {requestOtp.isPending ? "Sending…" : "Send code"}
                </Button>
                <Input
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="6-digit code"
                  className="max-w-[140px]"
                />
                <Button type="button" onClick={() => verifyOtp.mutate()} disabled={verifyOtp.isPending || otpCode.length !== 6}>
                  Verify
                </Button>
              </div>
              {requestOtp.isSuccess ? <p className="mt-3 text-sm text-emerald-700">Code sent.</p> : null}
              {verifyOtp.isError ? <p className="mt-3 text-sm text-red-700">{verifyOtp.error.message}</p> : null}
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
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
