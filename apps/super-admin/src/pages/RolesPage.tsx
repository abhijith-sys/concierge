import { useQuery } from "@tanstack/react-query";
import { EmptyList } from "../components/EmptyList";
import { api, hasPermission } from "../lib/api";
import { useAuth } from "../context/auth";

export function RolesPage() {
  const { user } = useAuth();
  const roles = useQuery({
    queryKey: ["admin", "roles"],
    queryFn: api.roles,
    enabled: hasPermission(user, "roles.manage"),
  });

  if (!hasPermission(user, "roles.manage")) {
    return <p className="error">Missing roles.manage permission</p>;
  }

  return (
    <div className="stack">
      <div>
        <h2 style={{ margin: 0 }}>Roles</h2>
        <p className="muted">System role definitions and permission sets (read-only catalog)</p>
      </div>
      <div className="panel">
        <table>
          <thead>
            <tr>
              <th>Role</th>
              <th>Users</th>
              <th>Permissions</th>
            </tr>
          </thead>
          <tbody>
            {(roles.data ?? []).map((role) => (
              <tr key={role.key}>
                <td>
                  <strong>{role.name}</strong>
                  <div className="muted">
                    <code>{role.key}</code>
                  </div>
                  {role.description ? <div className="muted">{role.description}</div> : null}
                </td>
                <td>{role.userCount}</td>
                <td>
                  <div className="muted" style={{ fontSize: "0.8rem" }}>
                    {role.permissions.length ? role.permissions.join(", ") : "—"}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!roles.isLoading && !(roles.data?.length ?? 0) ? (
          <EmptyList compact title="No roles yet." />
        ) : null}
      </div>
    </div>
  );
}
