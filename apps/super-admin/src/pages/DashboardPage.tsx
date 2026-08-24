import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
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
  const pendingProviders = s?.pendingProviders ?? s?.businesses.pending ?? 0;
  const pendingListings = s?.pendingListings ?? s?.listings?.pending ?? 0;
  const openReports = s?.openReviewReports ?? 0;
  const flaggedImages = s?.flaggedCategoryImages ?? 0;
  const kycQueue = s?.kycQueue ?? 0;

  const alerts = [
    pendingProviders > 0
      ? { tone: "warn" as const, label: "Pending businesses", count: pendingProviders, href: "/businesses?status=pending" }
      : null,
    pendingListings > 0
      ? { tone: "warn" as const, label: "Pending catalog items", count: pendingListings, href: "/listings?status=pending" }
      : null,
    openReports > 0
      ? { tone: "danger" as const, label: "Reported reviews", count: openReports, href: "/reviews" }
      : null,
    kycQueue > 0
      ? { tone: "warn" as const, label: "KYC submissions", count: kycQueue, href: "/verification" }
      : null,
    flaggedImages > 0
      ? { tone: "danger" as const, label: "Flagged category images", count: flaggedImages, href: "/categories" }
      : null,
    s && s.healthOk === false
      ? { tone: "danger" as const, label: "Database health check failed", count: 1, href: "/" }
      : null,
    settings.data?.maintenanceMode
      ? { tone: "warn" as const, label: "Maintenance mode ON", count: 1, href: "/settings" }
      : null,
  ].filter(Boolean) as Array<{ tone: "warn" | "danger"; label: string; count: number; href: string }>;

  return (
    <div className="stack">
      <div>
        <h2 style={{ margin: 0 }}>Dashboard</h2>
        <p className="muted">Platform operations overview</p>
      </div>

      {alerts.length ? (
        <div className="stack">
          <strong>Needs attention</strong>
          <div className="stat-grid">
            {alerts.map((alert) => (
              <Link
                key={alert.label}
                to={alert.href}
                className={`stat ${alert.tone === "danger" ? "alert-danger" : "alert-warn"}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <span className="muted">{alert.label}</span>
                <strong>{alert.count}</strong>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="panel">
          <p className="muted" style={{ margin: 0 }}>
            No pending alerts — queues look clear.
          </p>
        </div>
      )}

      <div className="stat-grid">
        <div className="stat">
          <span className="muted">Users</span>
          <strong>{s?.users ?? "—"}</strong>
        </div>
        <div className="stat">
          <span className="muted">Providers</span>
          <strong>{s?.providers ?? s?.businesses.active ?? "—"}</strong>
        </div>
        <div className="stat">
          <span className="muted">Catalog items</span>
          <strong>{s?.listings?.total ?? "—"}</strong>
        </div>
        <Link to="/businesses?status=pending" className="stat">
          <span className="muted">Pending providers</span>
          <strong>{pendingProviders || "—"}</strong>
        </Link>
        <Link to="/listings?status=pending" className="stat">
          <span className="muted">Pending catalog items</span>
          <strong>{pendingListings || "—"}</strong>
        </Link>
        <Link to="/categories" className="stat">
          <span className="muted">Categories</span>
          <strong>{s?.categories ?? "—"}</strong>
        </Link>
        <div className="stat">
          <span className="muted">KYC queue</span>
          <strong>{kycQueue || "—"}</strong>
        </div>
        <Link to="/reviews" className="stat">
          <span className="muted">Open review reports</span>
          <strong>{openReports || "—"}</strong>
        </Link>
      </div>
      <div className="panel stack">
        <p className="muted" style={{ margin: 0 }}>
          Signed in as {user?.name} ({user?.roles?.join(", ") || user?.role})
        </p>
        {settings.data ? (
          <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>
            env={settings.data.nodeEnv} · rateLimit={String(settings.data.rateLimitEnabled)} ·
            emailVerify={String(settings.data.requireEmailVerification)} · maintenance=
            {String(settings.data.maintenanceMode)} · health={String(s?.healthOk ?? true)}
          </p>
        ) : null}
      </div>
    </div>
  );
}
