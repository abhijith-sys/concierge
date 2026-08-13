import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { Button, Input, PageState, Select } from "../components/ui";
import { useAuth } from "../context/useAuth";
import { api } from "../lib/api";

export function Admin() {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const params = new URLSearchParams();
  if (q.trim()) params.set("q", q.trim());
  if (status) params.set("status", status);

  const list = useQuery({
    queryKey: ["admin", "businesses", params.toString()],
    queryFn: () => api.adminBusinesses(params),
    enabled: user?.role === "admin",
  });
  const queue = useQuery({
    queryKey: ["admin", "verification-queue"],
    queryFn: api.verificationQueue,
    enabled: user?.role === "admin",
  });

  const activate = useMutation({
    mutationFn: (id: string) => api.adminActivate(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
  });
  const suspend = useMutation({
    mutationFn: (id: string) => api.adminSuspend(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) => api.adminDelete(id, false),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
  });
  const review = useMutation({
    mutationFn: (input: { id: string; decision: "approved" | "rejected" }) =>
      api.reviewVerification(input.id, { decision: input.decision, activateBusiness: true }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
  });

  if (isLoading) return <PageState title="Loading" loading />;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (user.role !== "admin") return <PageState title="Admin only" description="This console is restricted to administrators." />;

  return (
    <section className="page-shell py-14 md:py-20">
      <p className="label-caps text-gold-dark">Operations</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">Admin console</h1>

      <div className="mt-8 flex flex-wrap gap-3">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search businesses" className="max-w-xs" />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="max-w-[180px]">
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="deleted">Deleted</option>
        </Select>
      </div>

      <div className="mt-8 overflow-x-auto rounded-3xl border border-line">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-surface-low text-xs uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3">Business</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Verified</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.data?.items.map((business) => (
              <tr key={business.id} className="border-t border-line">
                <td className="px-4 py-3">
                  <Link className="font-semibold underline" to={`/business/${business.slug}`}>
                    {business.name}
                  </Link>
                  <p className="text-xs text-ink-soft">{business.listing?.city}</p>
                </td>
                <td className="px-4 py-3 capitalize">{business.status}</td>
                <td className="px-4 py-3">{business.verified ? "Yes" : "No"}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={() => activate.mutate(business.id)}>Activate</Button>
                    <Button variant="outline" onClick={() => suspend.mutate(business.id)}>Suspend</Button>
                    <Button variant="ghost" onClick={() => remove.mutate(business.id)}>Soft delete</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-semibold">Verification queue</h2>
        <ul className="mt-5 grid gap-3">
          {queue.data?.length ? (
            queue.data.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line px-4 py-3">
                <div>
                  <p className="font-semibold">{item.business?.name ?? item.businessId}</p>
                  <p className="text-xs text-ink-soft">Submitted KYC package</p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => review.mutate({ id: item.id, decision: "approved" })}>Approve</Button>
                  <Button variant="outline" onClick={() => review.mutate({ id: item.id, decision: "rejected" })}>Reject</Button>
                </div>
              </li>
            ))
          ) : (
            <p className="text-sm text-ink-soft">No submissions waiting.</p>
          )}
        </ul>
      </div>
    </section>
  );
}
