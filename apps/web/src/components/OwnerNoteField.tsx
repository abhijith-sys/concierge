import { useEffect, useState } from "react";
import { Button } from "./ui";

export function OwnerNoteField({
  value,
  onSave,
  disabled,
}: {
  value?: string | null;
  onSave: (note: string) => Promise<void>;
  disabled?: boolean;
}) {
  const [note, setNote] = useState(value ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setNote(value ?? "");
  }, [value]);

  async function save() {
    setSaving(true);
    try {
      await onSave(note.trim());
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid min-w-[12rem] gap-2">
      <textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        rows={3}
        disabled={disabled || saving}
        placeholder="Internal note for your team"
        className="w-full rounded-lg border border-line bg-white px-3 py-2 text-xs leading-5"
      />
      <Button type="button" variant="outline" className="min-h-8 text-xs" disabled={disabled || saving} onClick={save}>
        {saving ? "Saving…" : "Save note"}
      </Button>
    </div>
  );
}
