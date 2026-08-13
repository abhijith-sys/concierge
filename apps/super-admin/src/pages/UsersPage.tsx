import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api, hasPermission } from "../lib/api";
import { useAuth } from "../context/auth";

export function UsersPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [selectedId, setSelectedId] = useState<string>("");
  const [assignKey, setAssignKey] = useState("moderator");

  const params = new URLSearchParams({ pageSize: "50" });
  if (q.trim()) params.set("q", q.trim());
  if (role) params.set("role", role);

  const list = useQuery({
    queryKey: ["admin", "users", params.toString()],
    queryFn: () => api.users(params),
    enabled: hasPermission(user, "users.read"),
  });

  const roles = useQuery({
    queryKey: ["admin", "roles"],
    queryFn: api.roles,
    enabled: hasPermission(user, "roles.manage"),
  });

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
  };

  const toggleDisabled = useMutation({
    mutationFn: (input: { id: string; disabled: boolean }) =>
      api.patchUser(input.id, { disabled: input.disabled }),
    onSuccess: invalidate,
  });

  const assignRole = useMutation({
    mutationFn: () => api.assignRole(selectedId, assignKey),
    onSuccess: invalidate,
  });

  const removeRole = useMutation({
    mutationFn: (input: { id: string; roleKey: string }) => api.removeRole(input.id, input.roleKey),
    onSuccess: invalidate,
  });

  if (!hasPermission(user, "users.read")) {
    return <p className="error">Missing users.read permission</p>;
  }

  return (
    <div className="stack">
      <div>
        <h2 style={{ margin: 0 }}>Users</h2>
        <p className="muted">Search accounts, disable access, assign RBAC roles</p>
      </div>
      <div className="row">
        <input className="input" placeholder="Search name/email" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="select" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">All legacy roles</option>
          <option value="user">user</option>
          <option value="business">business</option>
          <option value="admin">admin</option>
        </select>
      </div>

      {hasPermission(user, "roles.manage") ? (
        <div className="panel row">
          <select className="select" value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
            <option value="">Select user…</option>
            {(list.data?.items ?? []).map((item) => (
              <option key={item.id} value={item.id}>
                {item.email}
              </option>
            ))}
          </select>
          <select className="select" value={assignKey} onChange={(e) => setAssignKey(e.target.value)}>
            {(roles.data ?? []).map((r) => (
              <option key={r.key} value={r.key}>
                {r.name} ({r.key})
              </option>
            ))}
          </select>
          <button
            className="btn primary"
            type="button"
            disabled={!selectedId || assignRole.isPending}
            onClick={() => assignRole.mutate()}
          >
            Assign role
          </button>
        </div>
      ) : null}

      <div className="panel" style={{ overflowX: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Legacy</th>
              <th>RBAC roles</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(list.data?.items ?? []).map((item) => (
              <tr key={item.id}>
                <td>
                  <strong>{item.name}</strong>
                  <div className="muted">{item.email}</div>
                </td>
                <td>{item.role}</td>
                <td>
                  <div className="row">
                    {item.roles.map((r) => (
                      <span key={r.key} className="row">
                        <code>{r.key}</code>
                        {hasPermission(user, "roles.manage") ? (
                          <button
                            className="btn danger"
                            type="button"
                            onClick={() => removeRole.mutate({ id: item.id, roleKey: r.key })}
                          >
                            ×
                          </button>
                        ) : null}
                      </span>
                    ))}
                  </div>
                </td>
                <td>{item.disabledAt ? <span className="error">Disabled</span> : <span className="ok">Active</span>}</td>
                <td>
                  {hasPermission(user, "users.write") ? (
                    <button
                      className="btn"
                      type="button"
                      onClick={() =>
                        toggleDisabled.mutate({ id: item.id, disabled: !item.disabledAt })
                      }
                    >
                      {item.disabledAt ? "Enable" : "Disable"}
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
