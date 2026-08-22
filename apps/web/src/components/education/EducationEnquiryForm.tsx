import { useMutation } from "@tanstack/react-query";
import { Minus, Plus } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { useAuth } from "../../context/useAuth";
import { ApiError, api, type Service } from "../../lib/api";
import { Button, Input } from "../ui";

const fieldClass = "min-h-10 rounded-lg border-white/10 bg-[#1c1c1c] px-3 text-white";

function CompactField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-1 text-xs font-semibold text-white/70">
      {label}
      {children}
    </label>
  );
}

function QuantityStepper({
  value,
  max,
  name,
  onChange,
}: {
  value: number;
  max: number;
  name: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] font-bold uppercase tracking-wide text-white/45">Qty</span>
      <div className="flex items-center rounded-md border border-white/15">
        <button type="button" aria-label={`Decrease ${name}`} disabled={value <= 1} onClick={() => onChange(value - 1)} className="grid size-7 place-items-center text-white disabled:opacity-30">
          <Minus className="size-3" />
        </button>
        <input type="number" min={1} max={max} value={value} aria-label={`${name} count`} onChange={(event) => onChange(Number(event.target.value) || 1)} className="h-7 w-8 bg-transparent text-center text-sm font-bold text-white outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
        <button type="button" aria-label={`Increase ${name}`} disabled={value >= max} onClick={() => onChange(value + 1)} className="grid size-7 place-items-center text-white disabled:opacity-30">
          <Plus className="size-3" />
        </button>
      </div>
    </div>
  );
}

export function EducationEnquiryForm({
  businessId,
  courses,
  selectedIds,
  onToggleCourse,
}: {
  businessId: string;
  courses: Service[];
  selectedIds: string[];
  onToggleCourse: (id: string) => void;
}) {
  const { user } = useAuth();
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    guestName: user?.name ?? "",
    guestEmail: user?.email ?? "",
    guestPhone: user?.phone ?? "",
    startDate: "",
    preferredTime: "",
    learningMode: "",
    learners: 1,
    notes: "",
  });
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    setQuantities((current) => {
      const next: Record<string, number> = {};
      for (const id of selectedIds) next[id] = current[id] ?? 1;
      return next;
    });
  }, [selectedIds]);

  const create = useMutation({
    mutationFn: api.createEducationEnquiry,
    onSuccess: () => {
      toast.success("Enquiry sent to the institute. They will contact you directly.");
      setForm((current) => ({ ...current, notes: "" }));
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Unable to send this enquiry.");
    },
  });

  const selected = useMemo(() => courses.filter((item) => selectedIds.includes(item.id)), [courses, selectedIds]);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!selectedIds.length) {
      toast.error("Select at least one course.");
      return;
    }
    if (!form.startDate || !form.learningMode.trim()) {
      toast.error("Add a start date and learning mode.");
      return;
    }
    create.mutate({
      businessId,
      guestName: form.guestName.trim(),
      guestEmail: form.guestEmail.trim(),
      guestPhone: form.guestPhone.trim() || undefined,
      startDate: form.startDate,
      preferredTime: form.preferredTime || undefined,
      learningMode: form.learningMode.trim(),
      learners: form.learners,
      notes: form.notes.trim() || undefined,
      courseSelections: selectedIds.map((serviceId) => ({ serviceId, quantity: quantities[serviceId] ?? 1 })),
    });
  }

  return (
    <form onSubmit={submit} className="mt-5 grid gap-4">
      <section>
        <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-white/50">Courses</p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((item) => {
            const checked = selectedIds.includes(item.id);
            return (
              <div key={item.id} className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 text-sm ${checked ? "border-white/35 bg-white/10" : "border-white/10 bg-[#1c1c1c]"}`}>
                <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5">
                  <input type="checkbox" checked={checked} onChange={() => onToggleCourse(item.id)} className="size-4 accent-white" />
                  <span className="truncate font-semibold">{item.name}</span>
                </label>
                {checked ? (
                  <QuantityStepper value={quantities[item.id] ?? 1} max={20} name={item.name} onChange={(value) => setQuantities((current) => ({ ...current, [item.id]: Math.min(20, Math.max(1, value)) }))} />
                ) : null}
              </div>
            );
          })}
        </div>
        <p className="mt-1.5 text-[11px] text-white/45">{selected.length ? `${selected.length} course${selected.length === 1 ? "" : "s"} selected` : "Tick a course."}</p>
      </section>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <CompactField label="Start date">
          <Input type="date" required min={today} value={form.startDate} onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))} className={fieldClass} />
        </CompactField>
        <CompactField label="Preferred time">
          <Input type="time" value={form.preferredTime} onChange={(event) => setForm((current) => ({ ...current, preferredTime: event.target.value }))} className={fieldClass} />
        </CompactField>
        <CompactField label="Learning mode">
          <Input required value={form.learningMode} onChange={(event) => setForm((current) => ({ ...current, learningMode: event.target.value }))} placeholder="Online, classroom, hybrid…" className={`${fieldClass} placeholder:text-white/30`} />
        </CompactField>
        <CompactField label="Learners">
          <Input type="number" min={1} max={500} required value={form.learners} onChange={(event) => setForm((current) => ({ ...current, learners: Number(event.target.value) || 1 }))} className={fieldClass} />
        </CompactField>
        <CompactField label="Your name">
          <Input required value={form.guestName} onChange={(event) => setForm((current) => ({ ...current, guestName: event.target.value }))} className={fieldClass} />
        </CompactField>
        <CompactField label="Email">
          <Input type="email" required value={form.guestEmail} onChange={(event) => setForm((current) => ({ ...current, guestEmail: event.target.value }))} className={fieldClass} />
        </CompactField>
        <CompactField label="Phone">
          <Input value={form.guestPhone} onChange={(event) => setForm((current) => ({ ...current, guestPhone: event.target.value }))} className={fieldClass} />
        </CompactField>
        <CompactField label="Notes (optional)">
          <Input value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Goals, level, schedule…" className={`${fieldClass} placeholder:text-white/30`} />
        </CompactField>
      </div>
      <Button type="submit" variant="gold" className="h-11 w-full rounded-lg" disabled={create.isPending}>
        {create.isPending ? "Sending…" : create.isSuccess ? "Enquiry sent" : "Enquire Now"}
      </Button>
    </form>
  );
}
