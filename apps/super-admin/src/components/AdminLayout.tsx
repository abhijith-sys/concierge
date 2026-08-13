import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/auth";
import { hasPermission } from "../lib/api";

export function AdminLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="shell">
      <aside className="sidebar">
        <h1>Concierge Admin</h1>
        <NavLink to="/" end>
          Dashboard
        </NavLink>
        {hasPermission(user, "businesses.read") ? <NavLink to="/businesses">Businesses</NavLink> : null}
        {hasPermission(user, "verification.review") ? <NavLink to="/verification">KYC</NavLink> : null}
        {hasPermission(user, "categories.write") || hasPermission(user, "category_fields.write") ? (
          <NavLink to="/categories">Categories</NavLink>
        ) : null}
        {hasPermission(user, "users.read") ? <NavLink to="/users">Users</NavLink> : null}
        {hasPermission(user, "roles.manage") ? <NavLink to="/roles">Roles</NavLink> : null}
        {hasPermission(user, "assets.read_private") || hasPermission(user, "businesses.read") ? (
          <NavLink to="/assets">Assets</NavLink>
        ) : null}
        {hasPermission(user, "audit.read") ? <NavLink to="/audit">Audit</NavLink> : null}
        <div style={{ flex: 1 }} />
        <p className="muted" style={{ color: "#9aa3b2", fontSize: "0.8rem", margin: "0.5rem 0" }}>
          {user?.email}
        </p>
        <button className="btn" type="button" onClick={() => void logout()}>
          Sign out
        </button>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
