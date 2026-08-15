import { useState } from "react";
import { ApiError, api } from "../lib/api";

export function ImageUploadField({
  label,
  hint,
  value,
  required,
  onChange,
}: {
  label: string;
  hint: string;
  value: string;
  required?: boolean;
  onChange: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function onFile(file?: File) {
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const stored = await api.upload(file);
      onChange(stored.url);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <label className="image-field">
      <span className="field-label">
        {label}
        {required ? " *" : ""}
      </span>
      <span className="muted" style={{ fontSize: "0.8rem" }}>
        {hint}
      </span>
      {value ? <img className="image-preview" src={value} alt="" /> : <div className="image-preview empty">No image yet</div>}
      <div className="row">
        <label className="btn">
          {uploading ? "Uploading…" : value ? "Replace image" : "Choose image"}
          <input
            className="sr-only"
            type="file"
            accept="image/*"
            disabled={uploading}
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              void onFile(file);
            }}
          />
        </label>
        {value ? (
          <button className="btn" type="button" onClick={() => onChange("")}>
            Remove
          </button>
        ) : null}
      </div>
      {error ? <span className="error">{error}</span> : null}
    </label>
  );
}
