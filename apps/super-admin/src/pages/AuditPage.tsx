import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api, hasPermission } from "../lib/api";
import { useAuth } from "../context/auth";

export function AuditPage() {
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const params = new URLSearchParams({ pageSize: "50" });
  if (q.trim()) params.set("q", q.trim());

  const list = useQuery({
    queryKey: ["admin", "audit", params.toString()],
    queryFn: () => api.audit(params),
    enabled: hasPermission(user, "audit.read"),
  });

  if (!hasPermission(user, "audit.read")) {
    return <p className="error">Missing audit.read permission</p>;
  }

  return (
    <div className="stack">
      <div>
        <h2 style={{ margin: 0 }}>Audit log</h2>
        <p className="muted">Privileged mutations across the platform</p>
      </div>
      <div className="row">
        <input className="input" placeholder="Filter action/entity" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="panel" style={{ overflowX: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>When</th>
              <th>Actor</th>
              <th>Action</th>
              <th>Entity</th>
            </tr>
          </thead>
          <tbody>
            {(list.data?.items ?? []).map((item) => (
              <tr key={item.id}>
                <td>{new Date(item.createdAt).toLocaleString()}</td>
                <td>{item.actor?.email ?? item.actorId ?? "system"}</td>
                <td>
                  <code>{item.action}</code>
                </td>
                <td>
                  {item.entityType}
                  {item.entityId ? ` · ${item.entityId.slice(0, 8)}…` : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.isLoading ? <p className="muted">Loading…</p> : null}
      </div>
    </div>
  );
}
