import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { EmptyList } from "../components/EmptyList";
import { Button, Input, PageState } from "../components/ui";
import { api, type GuestEnquiryLookupItem } from "../lib/api";
import { theme } from "../lib/theme";

function statusLabel(status: string) {
  return status.replaceAll("_", " ");
}

export function EnquiryStatus() {
  const [email, setEmail] = useState("");
  const [ref, setRef] = useState("");
  const [submitted, setSubmitted] = useState<{ email: string; ref?: string } | null>(null);

  const lookup = useQuery({
    queryKey: ["enquiry-lookup", submitted?.email, submitted?.ref],
    queryFn: () => {
      const params = new URLSearchParams({ email: submitted!.email });
      if (submitted?.ref) params.set("ref", submitted.ref);
      return api.lookupGuestEnquiries(params);
    },
    enabled: Boolean(submitted?.email),
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitted({ email: email.trim(), ref: ref.trim() || undefined });
  }

  return (
    <div className="page-shell py-12 lg:py-16">
      <div className="mx-auto max-w-xl">
        <p className="label-caps text-gold-dark">Guest lookup</p>
        <h1 className="mt-2 text-3xl font-semibold">Check enquiry status</h1>
        <p className="mt-2 text-sm leading-6 text-ink-soft">
          Enter the email you used when submitting an enquiry. Optionally add the reference ID from your
          confirmation email.
        </p>

        <form onSubmit={submit} className="mt-8 grid gap-4 rounded-2xl border border-line bg-surface-low p-6">
          <label className="grid gap-2 text-sm font-semibold">
            Email address
            <Input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="bg-white"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Reference ID <span className="font-normal text-ink-soft">(optional)</span>
            <Input
              value={ref}
              onChange={(event) => setRef(event.target.value)}
              placeholder="UUID from confirmation email"
              className="bg-white"
            />
          </label>
          <Button type="submit" className="inline-flex items-center justify-center gap-2">
            <Search className="size-4" />
            Look up
          </Button>
        </form>

        {submitted && lookup.isLoading ? (
          <div className="mt-8 h-24 animate-pulse rounded-xl bg-surface-high" />
        ) : null}
        {submitted && lookup.isError ? (
          <PageState
            className="mt-8"
            title="Lookup failed"
            description="Check your email and try again."
            action={<Button onClick={() => void lookup.refetch()}>Retry</Button>}
          />
        ) : null}
        {submitted && lookup.isSuccess && lookup.data.items.length === 0 ? (
          <EmptyList
            className="mt-8"
            title="No enquiries found"
            description="We could not find enquiries for that email. Double-check the address or reference ID."
          />
        ) : null}
        {submitted && lookup.data?.items.length ? (
          <ul className="mt-8 grid gap-4">
            {lookup.data.items.map((item: GuestEnquiryLookupItem) => (
              <li key={item.id} className="rounded-xl border border-line bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-gold-dark">{item.vertical}</p>
                    <Link
                      to={`/business/${item.business.slug}`}
                      className="mt-1 block text-lg font-semibold text-navy hover:underline"
                    >
                      {item.business.name}
                    </Link>
                    <p className="mt-1 text-sm text-ink-soft">{item.summary}</p>
                  </div>
                  <span className="rounded-full bg-surface-low px-3 py-1 text-xs font-bold capitalize text-navy">
                    {statusLabel(item.status)}
                  </span>
                </div>
                <p className="mt-3 text-xs text-ink-soft">
                  Submitted {new Date(item.createdAt).toLocaleString()} · Ref {item.id}
                </p>
              </li>
            ))}
          </ul>
        ) : null}

        <p className="mt-8 text-center text-sm text-ink-soft">
          Have an account?{" "}
          <Link to="/account/enquiries" className="font-semibold text-navy underline-offset-4 hover:underline">
            View all enquiries in {theme.name}
          </Link>
        </p>
      </div>
    </div>
  );
}
