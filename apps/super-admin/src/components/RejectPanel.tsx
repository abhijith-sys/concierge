import { useState, type FormEvent } from "react";

export function RejectPanel({
  title,
  pending,
  error,
  onCancel,
  onSubmit,
}: {
  title: string;
  pending: boolean;
  error?: string;
  onCancel: () => void;
  onSubmit: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    onSubmit(reason.trim());
  }

  return (
    <form className="panel stack" onSubmit={submit}>
      <strong>{title}</strong>
      <p className="muted" style={{ margin: 0 }}>
        This reason is shown to the provider.
      </p>
      <textarea
        className="textarea"
        required
        minLength={2}
        maxLength={2000}
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        placeholder="Explain what needs to change"
      />
      {error ? <p className="error">{error}</p> : null}
      <div className="row">
        <button className="btn danger" type="submit" disabled={pending || reason.trim().length < 2}>
          {pending ? "Rejecting…" : "Reject"}
        </button>
        <button className="btn" type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
