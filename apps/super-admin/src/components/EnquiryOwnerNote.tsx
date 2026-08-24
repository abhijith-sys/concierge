import { useEffect, useState } from "react";

export function EnquiryOwnerNote({
  value,
  canEdit,
  onSave,
}: {
  value?: string | null;
  canEdit: boolean;
  onSave: (note: string) => Promise<void>;
}) {
  const [note, setNote] = useState(value ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setNote(value ?? "");
  }, [value]);

  if (!canEdit) {
    return value ? <div className="muted">{value}</div> : <span className="muted">—</span>;
  }

  return (
    <div className="stack" style={{ minWidth: "12rem", gap: "0.35rem" }}>
      <textarea
        className="input"
        rows={2}
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Support / internal note"
        disabled={saving}
      />
      <button
        type="button"
        className="button secondary"
        style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}
        disabled={saving}
        onClick={async () => {
          setSaving(true);
          try {
            await onSave(note.trim());
          } finally {
            setSaving(false);
          }
        }}
      >
        {saving ? "Saving…" : "Save note"}
      </button>
    </div>
  );
}
