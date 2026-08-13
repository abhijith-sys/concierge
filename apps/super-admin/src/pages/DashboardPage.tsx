import { useQuery } from "@tanstack/react-query";
import { api, hasPermission } from "../lib/api";
import { useAuth } from "../context/auth";

export function DashboardPage() {
  const { user } = useAuth();
  const stats = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: api.stats,
    enabled: hasPermission(user, "businesses.read") || hasPermission(user, "audit.read"),
  });
  const settings = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: api.settings,
    enabled: Boolean(user),
  });

  const s = stats.data;

  return (
    <div className="stack">
      <div>
        <h2 style={{ margin: 0 }}>Dashboard</h2>
        <p className="muted">Platform operations overview</p>
      </div>
      <div className="stat-grid">
        <div className="stat">
          <span className="muted">Active businesses</span>
          <strong>{s?.businesses.active ?? "—"}</strong>
        </div>
        <div className="stat">
          <span className="muted">Pending</span>
          <strong>{s?.businesses.pending ?? "—"}</strong>
        </div>
        <div className="stat">
          <span className="muted">Suspended</span>
          <strong>{s?.businesses.suspended ?? "—"}</strong>
        </div>
        <div className="stat">
          <span className="muted">KYC queue</span>
          <strong>{s?.kycQueue ?? "—"}</strong>
        </div>
        <div className="stat">
          <span className="muted">Users</span>
          <strong>{s?.users ?? "—"}</strong>
        </div>
        <div className="stat">
          <span className="muted">Assets</span>
          <strong>{s?.assets ?? "—"}</strong>
        </div>
      </div>
      <div className="panel stack">
        <p className="muted" style={{ margin: 0 }}>
          Signed in as {user?.name} ({user?.roles?.join(", ") || user?.role})
        </p>
        {settings.data ? (
          <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>
            env={settings.data.nodeEnv} · rateLimit={String(settings.data.rateLimitEnabled)} ·
            emailVerify={String(settings.data.requireEmailVerification)} · cookieSecure=
            {String(settings.data.cookieSecure)}
          </p>
        ) : null}
      </div>
    </div>
  );
}
