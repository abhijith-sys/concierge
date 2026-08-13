import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api, hasPermission } from "../lib/api";
import { useAuth } from "../context/auth";

export function BusinessesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const params = new URLSearchParams({ pageSize: "50" });
  if (q.trim()) params.set("q", q.trim());
  if (status) params.set("status", status);

  const list = useQuery({
    queryKey: ["admin", "businesses", params.toString()],
    queryFn: () => api.businesses(params),
    enabled: hasPermission(user, "businesses.read"),
  });

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["admin", "businesses"] });
  };

  const activate = useMutation({ mutationFn: api.activate, onSuccess: invalidate });
  const suspend = useMutation({ mutationFn: api.suspend, onSuccess: invalidate });
  const remove = useMutation({ mutationFn: api.softDelete, onSuccess: invalidate });

  if (!hasPermission(user, "businesses.read")) {
    return <p className="error">Missing businesses.read permission</p>;
  }

  return (
    <div className="stack">
      <div>
        <h2 style={{ margin: 0 }}>Businesses</h2>
        <p className="muted">Moderate listings and lifecycle status</p>
      </div>
      <div className="row">
        <input className="input" placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="deleted">Deleted</option>
        </select>
      </div>
      <div className="panel" style={{ overflowX: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>Business</th>
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
                </td>
                <td>{business.status}</td>
                <td>{business.verified ? "Yes" : "No"}</td>
                <td>
                  <div className="row">
                    {hasPermission(user, "businesses.moderate") ? (
                      <>
                        <button className="btn" type="button" onClick={() => activate.mutate(business.id)}>
                          Activate
                        </button>
                        <button className="btn" type="button" onClick={() => suspend.mutate(business.id)}>
                          Suspend
                        </button>
                      </>
                    ) : null}
                    {hasPermission(user, "businesses.delete") ? (
                      <button className="btn danger" type="button" onClick={() => remove.mutate(business.id)}>
                        Soft delete
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
      </div>
    </div>
  );
}
