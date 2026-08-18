import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { RejectPanel } from "../components/RejectPanel";
import { EmptyList } from "../components/EmptyList";
import { useAuth } from "../context/auth";
import { api, hasPermission } from "../lib/api";
import { flattenCategories } from "../lib/taxonomy";

export function BusinessesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState(searchParams.get("status") ?? "");
  const [categoryId, setCategoryId] = useState(searchParams.get("categoryId") ?? "");
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const params = new URLSearchParams({ pageSize: "50" });
  if (q.trim()) params.set("q", q.trim());
  if (status) params.set("status", status);
  if (categoryId) params.set("categoryId", categoryId);

  const list = useQuery({
    queryKey: ["admin", "businesses", params.toString()],
    queryFn: () => api.businesses(params),
    enabled: hasPermission(user, "businesses.read"),
  });
  const categories = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: api.categories,
    enabled: hasPermission(user, "businesses.read"),
  });
  const categoryOptions = useMemo(
    () => flattenCategories(categories.data ?? []),
    [categories.data],
  );

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["admin", "businesses"] });
    await queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    setRejectingId(null);
  };

  const activate = useMutation({ mutationFn: api.activate, onSuccess: invalidate });
  const suspend = useMutation({ mutationFn: api.suspend, onSuccess: invalidate });
  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => api.rejectBusiness(id, reason),
    onSuccess: invalidate,
  });
  const remove = useMutation({ mutationFn: api.softDelete, onSuccess: invalidate });
  const rejecting = list.data?.items.find((business) => business.id === rejectingId);

  if (!hasPermission(user, "businesses.read")) {
    return <p className="error">Missing businesses.read permission</p>;
  }

  return (
    <div className="stack">
      <div>
        <h2 style={{ margin: 0 }}>Businesses</h2>
        <p className="muted">Approve, reject, or suspend provider profiles</p>
      </div>
      <div className="row">
        <input className="input" placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="active">Active</option>
          <option value="rejected">Rejected</option>
          <option value="suspended">Suspended</option>
          <option value="deleted">Deleted</option>
        </select>
        <select className="select" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">All categories</option>
          {categoryOptions.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>
      {rejecting && hasPermission(user, "businesses.moderate") ? (
        <RejectPanel
          title={`Reject ${rejecting.name}`}
          pending={reject.isPending}
          error={reject.isError ? reject.error.message : undefined}
          onCancel={() => setRejectingId(null)}
          onSubmit={(reason) => reject.mutate({ id: rejecting.id, reason })}
        />
      ) : null}
      <div className="panel" style={{ overflowX: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>Business</th>
              <th>Category</th>
              <th>Status</th>
              <th>Verified</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.data?.items.map((business) => (
              <tr key={business.id}>
                <td>
                  <strong>{business.name}</strong>
                  <div className="muted">{business.listing?.city}</div>
                  {business.status === "rejected" && business.rejectionReason ? (
                    <div className="error">{business.rejectionReason}</div>
                  ) : null}
                </td>
                <td>{business.listing?.category?.name ?? "—"}</td>
                <td>{business.status}</td>
                <td>{business.verified ? "Yes" : "No"}</td>
                <td>
                  <div className="row">
                    {hasPermission(user, "businesses.moderate") ? (
                      <>
                        {business.status !== "active" && business.status !== "deleted" ? (
                          <button className="btn" type="button" onClick={() => activate.mutate(business.id)}>
                            Activate
                          </button>
                        ) : null}
                        {business.status === "active" ? (
                          <button className="btn" type="button" onClick={() => suspend.mutate(business.id)}>
                            Disable
                          </button>
                        ) : null}
                        {business.status === "pending" ? (
                          <button className="btn danger" type="button" onClick={() => setRejectingId(business.id)}>
                            Reject
                          </button>
                        ) : null}
                      </>
                    ) : null}
                    {hasPermission(user, "businesses.delete") && business.status !== "pending" && business.status !== "deleted" ? (
                      <button
                        className="btn danger"
                        type="button"
                        onClick={() => {
                          if (!window.confirm(`Delete “${business.name}”? This hides the shop from the directory.`)) return;
                          remove.mutate(business.id);
                        }}
                      >
                        Delete
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.isLoading ? <p className="muted">Loading…</p> : null}
        {list.isError ? <p className="error">Failed to load businesses</p> : null}
        {list.data && !list.data.items.length ? (
          <EmptyList compact title="No businesses match these filters." />
        ) : null}
      </div>
    </div>
  );
}
