import { Children, type ReactNode } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/auth";
import { hasPermission } from "../lib/api";

function NavGroup({ label, children }: { label: string; children: ReactNode }) {
  const items = Children.toArray(children).filter(Boolean);
  if (items.length === 0) return null;
  return (
    <div className="nav-group">
      <p className="nav-group-label">{label}</p>
      {items}
    </div>
  );
}

export function AdminLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="shell">
      <aside className="sidebar">
        <h1>Concierge Admin</h1>
        <NavLink to="/" end>
          Dashboard
        </NavLink>
        <NavGroup label="Marketplace">
          {hasPermission(user, "businesses.read") ? <NavLink to="/businesses">Businesses</NavLink> : null}
          {hasPermission(user, "businesses.read") ? <NavLink to="/listings">Catalog items</NavLink> : null}
          {hasPermission(user, "verification.review") ? <NavLink to="/verification">KYC</NavLink> : null}
        </NavGroup>
        <NavGroup label="Catalog">
          {hasPermission(user, "categories.write") || hasPermission(user, "category_fields.write") ? (
            <NavLink to="/categories">Categories</NavLink>
          ) : null}
        </NavGroup>
        <NavGroup label="Access">
          {hasPermission(user, "users.read") ? <NavLink to="/users">Users</NavLink> : null}
          {hasPermission(user, "roles.manage") ? <NavLink to="/roles">Roles</NavLink> : null}
        </NavGroup>
        <NavGroup label="System">
          {hasPermission(user, "assets.read_private") || hasPermission(user, "businesses.read") ? (
            <NavLink to="/assets">Assets</NavLink>
          ) : null}
          {hasPermission(user, "audit.read") ? <NavLink to="/audit">Audit</NavLink> : null}
        </NavGroup>
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
