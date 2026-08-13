import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api, hasPermission } from "../lib/api";
import { useAuth } from "../context/auth";

export function AssetsPage() {
  const { user } = useAuth();
  const [visibility, setVisibility] = useState("");
  const params = new URLSearchParams({ pageSize: "50" });
  if (visibility) params.set("visibility", visibility);

  const list = useQuery({
    queryKey: ["admin", "assets", params.toString()],
    queryFn: () => api.assets(params),
    enabled: hasPermission(user, "assets.read_private") || hasPermission(user, "businesses.read"),
  });

  if (!hasPermission(user, "assets.read_private") && !hasPermission(user, "businesses.read")) {
    return <p className="error">Missing asset browse permission</p>;
  }

  return (
    <div className="stack">
      <div>
        <h2 style={{ margin: 0 }}>Assets</h2>
        <p className="muted">Uploaded files and attachment links</p>
      </div>
      <div className="row">
        <select className="select" value={visibility} onChange={(e) => setVisibility(e.target.value)}>
          <option value="">All visibility</option>
          <option value="public">public</option>
          <option value="private">private</option>
        </select>
      </div>
      <div className="panel" style={{ overflowX: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>File</th>
              <th>Visibility</th>
              <th>Status</th>
              <th>Uploader</th>
              <th>Attachments</th>
            </tr>
          </thead>
          <tbody>
            {(list.data?.items ?? []).map((asset) => (
              <tr key={asset.id}>
                <td>
                  <div className="muted" style={{ fontSize: "0.8rem" }}>
                    {asset.mimeType} · {(asset.byteSize / 1024).toFixed(1)} KB
                  </div>
                  {asset.visibility === "public" ? (
                    <a href={asset.url} target="_blank" rel="noreferrer">
                      {asset.storageKey}
                    </a>
                  ) : (
                    <code>{asset.storageKey}</code>
                  )}
                </td>
                <td>{asset.visibility}</td>
                <td>{asset.status}</td>
                <td>{asset.uploadedBy?.email ?? "—"}</td>
                <td>
                  {asset.attachments.map((a) => (
                    <div key={a.id} className="muted" style={{ fontSize: "0.8rem" }}>
                      {a.entityType}/{a.purpose}
                    </div>
                  ))}
                  {!asset.attachments.length ? <span className="muted">orphan</span> : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
