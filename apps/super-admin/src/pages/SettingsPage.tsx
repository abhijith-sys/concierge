import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useState } from "react";
import { api, hasPermission } from "../lib/api";
import { useAuth } from "../context/auth";

export function SettingsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const canRead =
    hasPermission(user, "settings.write") ||
    hasPermission(user, "audit.read") ||
    hasPermission(user, "businesses.read");
  const canWrite = hasPermission(user, "settings.write");

  const settings = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: api.settings,
    enabled: canRead,
  });

  const [maintenanceMode, setMaintenanceMode] = useState<boolean | null>(null);
  const [maintenanceMessage, setMaintenanceMessage] = useState<string | null>(null);
  const [supportEmail, setSupportEmail] = useState<string | null>(null);

  const s = settings.data;
  const effectiveMaintenance = maintenanceMode ?? s?.maintenanceMode ?? false;
  const effectiveMessage = maintenanceMessage ?? s?.maintenanceMessage ?? "";
  const effectiveSupport = supportEmail ?? s?.supportEmail ?? "";

  const save = useMutation({
    mutationFn: () =>
      api.patchSettings({
        maintenanceMode: effectiveMaintenance,
        maintenanceMessage: effectiveMessage.trim() || null,
        supportEmail: effectiveSupport.trim() || null,
      }),
    onSuccess: async () => {
      setMaintenanceMode(null);
      setMaintenanceMessage(null);
      setSupportEmail(null);
      await queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
    },
  });

  if (!canRead) {
    return <p className="muted">You do not have permission to view platform settings.</p>;
  }

  return (
    <div className="stack">
      <div>
        <h2 style={{ margin: 0 }}>Platform settings</h2>
        <p className="muted">Runtime flags editable without redeploy; infrastructure values are read-only.</p>
      </div>

      {settings.isLoading ? <p className="muted">Loading…</p> : null}
      {settings.isError ? <p className="muted">Could not load settings.</p> : null}

      {s ? (
        <>
          {canWrite ? (
            <form
              className="panel stack"
              onSubmit={(event) => {
                event.preventDefault();
                save.mutate();
              }}
            >
              <strong>Editable settings</strong>
              <label className="row">
                <input
                  type="checkbox"
                  checked={effectiveMaintenance}
                  onChange={(event) => setMaintenanceMode(event.target.checked)}
                />
                Maintenance mode
              </label>
              <textarea
                className="textarea"
                placeholder="Maintenance message shown to visitors"
                value={effectiveMessage}
                onChange={(event) => setMaintenanceMessage(event.target.value)}
              />
              <input
                className="input"
                type="email"
                placeholder="Support email"
                value={effectiveSupport}
                onChange={(event) => setSupportEmail(event.target.value)}
              />
              <div className="row">
                <button className="btn primary" type="submit" disabled={save.isPending}>
                  {save.isPending ? "Saving…" : "Save settings"}
                </button>
                {save.isSuccess ? <span className="ok">Saved</span> : null}
                {save.isError ? <span className="error">Save failed</span> : null}
              </div>
            </form>
          ) : null}

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

          {s.corsOrigins?.length ? (
            <div className="card">
              <strong>CORS origins</strong>
              <ul className="muted" style={{ margin: "0.5rem 0 0", paddingLeft: "1.25rem" }}>
                {s.corsOrigins.map((origin) => (
                  <li key={origin}>{origin}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      ) : null}

      <p className="muted">
        <Link to="/">Back to dashboard</Link>
      </p>
    </div>
  );
}
