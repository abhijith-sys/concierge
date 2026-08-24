import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api, hasPermission } from "../lib/api";
import { useAuth } from "../context/auth";

export function SettingsPage() {
  const { user } = useAuth();
  const canRead =
    hasPermission(user, "settings.write") ||
    hasPermission(user, "audit.read") ||
    hasPermission(user, "businesses.read");

  const settings = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: api.settings,
    enabled: canRead,
  });

  if (!canRead) {
    return <p className="muted">You do not have permission to view platform settings.</p>;
  }

  const s = settings.data;

  return (
    <div className="stack">
      <div>
        <h2 style={{ margin: 0 }}>Platform settings</h2>
        <p className="muted">Read-only runtime configuration (editor coming in a later release)</p>
      </div>

      {settings.isLoading ? <p className="muted">Loading…</p> : null}
      {settings.isError ? <p className="muted">Could not load settings.</p> : null}

      {s ? (
        <div className="stat-grid">
          <div className="stat">
            <span className="muted">Environment</span>
            <strong>{s.nodeEnv}</strong>
          </div>
          <div className="stat">
            <span className="muted">Secure cookies</span>
            <strong>{s.cookieSecure ? "Yes" : "No"}</strong>
          </div>
          <div className="stat">
            <span className="muted">Rate limiting</span>
            <strong>{s.rateLimitEnabled ? "Enabled" : "Disabled"}</strong>
          </div>
          <div className="stat">
            <span className="muted">Require email verification</span>
            <strong>{s.requireEmailVerification ? "Yes" : "No"}</strong>
          </div>
          <div className="stat">
            <span className="muted">Log level</span>
            <strong>{s.logLevel}</strong>
          </div>
          <div className="stat">
            <span className="muted">Run seed on boot</span>
            <strong>{s.runSeed ? "Yes" : "No"}</strong>
          </div>
        </div>
      ) : null}

      {s?.corsOrigins?.length ? (
        <div className="card">
          <strong>CORS origins</strong>
          <ul className="muted" style={{ margin: "0.5rem 0 0", paddingLeft: "1.25rem" }}>
            {s.corsOrigins.map((origin) => (
              <li key={origin}>{origin}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="muted">
        To change feature flags or maintenance mode, use environment variables and redeploy.{" "}
        <Link to="/">Back to dashboard</Link>
      </p>
    </div>
  );
}
