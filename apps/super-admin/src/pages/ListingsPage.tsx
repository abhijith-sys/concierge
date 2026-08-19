import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { RejectPanel } from "../components/RejectPanel";
import { EmptyList } from "../components/EmptyList";
import { useAuth } from "../context/auth";
import { api, hasPermission } from "../lib/api";
import { flattenCategories } from "../lib/taxonomy";

export function ListingsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState(searchParams.get("status") ?? (searchParams.get("businessId") ? "" : "pending"));
  const [categoryId, setCategoryId] = useState(searchParams.get("categoryId") ?? "");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const businessId = searchParams.get("businessId") ?? "";

  const params = new URLSearchParams({ pageSize: "50" });
  if (q.trim()) params.set("q", q.trim());
  if (status) params.set("status", status);
  if (categoryId) params.set("categoryId", categoryId);
  if (businessId) params.set("businessId", businessId);

  const list = useQuery({
    queryKey: ["admin", "listings", params.toString()],
    queryFn: () => api.listings(params),
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
    await queryClient.invalidateQueries({ queryKey: ["admin", "listings"] });
    await queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    setRejectingId(null);
  };

  const approve = useMutation({ mutationFn: api.approveListing, onSuccess: invalidate });
  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => api.rejectListing(id, reason),
    onSuccess: invalidate,
  });
  const remove = useMutation({ mutationFn: api.deleteListing, onSuccess: invalidate });
  const rejecting = list.data?.items.find((listing) => listing.id === rejectingId);

  if (!hasPermission(user, "businesses.read")) {
    return <p className="error">Missing businesses.read permission</p>;
  }

  return (
    <div className="stack">
      <div>
        <h2 style={{ margin: 0 }}>Catalog items</h2>
        <p className="muted">Moderate shop catalog items and service offerings before they appear on public profiles</p>
        {businessId ? (
          <p className="muted" style={{ margin: "0.5rem 0 0" }}>
            Showing items for one seller.{" "}
            <Link to="/listings">View all catalog items</Link>
          </p>
        ) : null}
      </div>
      <div className="row">
        <input className="input" placeholder="Search listing or provider" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="draft">Draft</option>
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
              <th>Listing</th>
              <th>Provider</th>
              <th>Category</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.data?.items.map((listing) => (
              <tr key={listing.id}>
                <td>
                  <strong>{listing.name}</strong>
                  <div className="muted">
                    {listing.currency} {listing.price}
                  </div>
                  {listing.approvalStatus === "rejected" && listing.rejectionReason ? (
                    <div className="error">{listing.rejectionReason}</div>
                  ) : null}
                </td>
                <td>
                  {listing.business ? (
                    <Link to={`/businesses?q=${encodeURIComponent(listing.business.name)}`}>
                      {listing.business.name}
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
                <td>{listing.category?.name ?? "—"}</td>
                <td>{listing.approvalStatus}</td>
                <td>
                  {hasPermission(user, "businesses.moderate") ? (
                    <div className="row">
                      {listing.approvalStatus !== "approved" ? (
                        <button className="btn" type="button" onClick={() => approve.mutate(listing.id)}>
                          Approve
                        </button>
                      ) : null}
                      {listing.approvalStatus === "pending" || listing.approvalStatus === "draft" ? (
                        <button className="btn danger" type="button" onClick={() => setRejectingId(listing.id)}>
                          Reject
                        </button>
                      ) : null}
                      {listing.approvalStatus === "approved" && hasPermission(user, "businesses.delete") ? (
                        <button
                          className="btn danger"
                          type="button"
                          onClick={() => {
                            if (!window.confirm(`Delete “${listing.name}”? This cannot be undone.`)) return;
                            remove.mutate(listing.id);
                          }}
                        >
                          Delete
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.isLoading ? <p className="muted">Loading…</p> : null}
        {list.isError ? <p className="error">Failed to load listings</p> : null}
        {list.data && !list.data.items.length ? (
          <EmptyList compact title="No listings match these filters." />
        ) : null}
      </div>
    </div>
  );
}
