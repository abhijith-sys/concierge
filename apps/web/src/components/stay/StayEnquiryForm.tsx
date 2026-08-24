import { useMutation } from "@tanstack/react-query";
import { Minus, Plus } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { useAuth } from "../../context/useAuth";
import { ApiError, api, type Service } from "../../lib/api";
import { fieldNumber, nightsBetween } from "../../lib/stays";
import { Button, Input } from "../ui";

const MAX_ROOM_QTY = 20;
const fieldClass = "min-h-10 rounded-lg border-white/10 bg-[#1c1c1c] px-3 text-white";

function roomMax(service: Service) {
  const units = fieldNumber(service.fieldValues, "room_count");
  return Math.min(MAX_ROOM_QTY, Math.max(1, units ?? MAX_ROOM_QTY));
}

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
        <button
          type="button"
          aria-label={`Decrease ${name} count`}
          disabled={value <= 1}
          onClick={() => onChange(value - 1)}
          className="grid size-7 place-items-center text-white disabled:opacity-30"
        >
          <Minus className="size-3" />
        </button>
        <input
          type="number"
          min={1}
          max={max}
          value={value}
          aria-label={`${name} count`}
          onChange={(event) => onChange(Number(event.target.value) || 1)}
          className="h-7 w-8 bg-transparent text-center text-sm font-bold text-white outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <button
          type="button"
          aria-label={`Increase ${name} count`}
          disabled={value >= max}
          onClick={() => onChange(value + 1)}
          className="grid size-7 place-items-center text-white disabled:opacity-30"
        >
          <Plus className="size-3" />
        </button>
      </div>
    </div>
  );
}

export function StayEnquiryForm({
  businessId,
  rooms,
  selectedIds,
  onToggleRoom,
}: {
  businessId: string;
  rooms: Service[];
  selectedIds: string[];
  onToggleRoom: (id: string) => void;
}) {
  const { user } = useAuth();
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    guestName: user?.name ?? "",
    guestEmail: user?.email ?? "",
    guestPhone: user?.phone ?? "",
    checkIn: "",
    checkOut: "",
    adults: "2",
    children: "0",
    notes: "",
  });
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    setQuantities((current) => {
      const next: Record<string, number> = {};
      for (const id of selectedIds) {
        next[id] = current[id] ?? 1;
      }
      return next;
    });
  }, [selectedIds]);

  const nights = nightsBetween(form.checkIn, form.checkOut);
  const create = useMutation({
    mutationFn: api.createStayEnquiry,
    onSuccess: () => {
      toast.success("Enquiry sent to the property. They will contact you directly.");
      setForm((current) => ({ ...current, notes: "" }));
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Unable to send this enquiry.");
    },
  });

  const selectedRooms = useMemo(
    () => rooms.filter((room) => selectedIds.includes(room.id)),
    [rooms, selectedIds],
  );
  const totalRooms = selectedRooms.reduce((sum, room) => sum + (quantities[room.id] ?? 1), 0);

  function setQuantity(id: string, value: number) {
    const room = rooms.find((item) => item.id === id);
    const max = room ? roomMax(room) : MAX_ROOM_QTY;
    const next = Math.min(max, Math.max(1, Number.isFinite(value) ? Math.trunc(value) : 1));
    setQuantities((current) => ({ ...current, [id]: next }));
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!selectedIds.length) {
      toast.error("Select at least one room or cottage.");
      return;
    }
    if (nights < 1) {
      toast.error("Check-out must be after check-in.");
      return;
    }
    create.mutate({
      businessId,
      guestName: form.guestName.trim(),
      guestEmail: form.guestEmail.trim(),
      guestPhone: form.guestPhone.trim() || undefined,
      checkIn: form.checkIn,
      checkOut: form.checkOut,
      adults: Number(form.adults),
      children: Number(form.children),
      notes: form.notes.trim() || undefined,
      roomSelections: selectedIds.map((serviceId) => ({
        serviceId,
        quantity: quantities[serviceId] ?? 1,
      })),
    });
  }

  return (
    <form onSubmit={submit} className="mt-5 grid gap-4">
      <section>
        <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-white/50">Rooms</p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => {
            const checked = selectedIds.includes(room.id);
            return (
              <div
                key={room.id}
                className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 text-sm ${
                  checked ? "border-white/35 bg-white/10" : "border-white/10 bg-[#1c1c1c]"
                }`}
              >
                <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggleRoom(room.id)}
                    className="size-4 accent-white"
                  />
                  <span className="truncate font-semibold">{room.name}</span>
                </label>
                {checked ? (
                  <QuantityStepper
                    value={quantities[room.id] ?? 1}
                    max={roomMax(room)}
                    name={room.name}
                    onChange={(value) => setQuantity(room.id, value)}
                  />
                ) : null}
              </div>
            );
          })}
        </div>
        <p className="mt-1.5 text-[11px] text-white/45">
          {selectedRooms.length
            ? `${totalRooms} room${totalRooms === 1 ? "" : "s"} selected${nights > 0 ? ` · ${nights} night${nights === 1 ? "" : "s"}` : ""}`
            : "Tick a room. Count starts at 1."}
        </p>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <CompactField label="Check-in">
          <Input
            type="date"
            required
            min={today}
            value={form.checkIn}
            onChange={(event) => setForm((current) => ({ ...current, checkIn: event.target.value }))}
            className={fieldClass}
          />
        </CompactField>
        <CompactField label="Check-out">
          <Input
            type="date"
            required
            min={form.checkIn || today}
            value={form.checkOut}
            onChange={(event) => setForm((current) => ({ ...current, checkOut: event.target.value }))}
            className={fieldClass}
          />
        </CompactField>
        <CompactField label="Adults">
          <Input
            type="number"
            min={1}
            max={50}
            required
            value={form.adults}
            onChange={(event) => setForm((current) => ({ ...current, adults: event.target.value }))}
            className={fieldClass}
          />
        </CompactField>
        <CompactField label="Children">
          <Input
            type="number"
            min={0}
            max={50}
            value={form.children}
            onChange={(event) => setForm((current) => ({ ...current, children: event.target.value }))}
            className={fieldClass}
          />
        </CompactField>
        <CompactField label="Your name">
          <Input
            required
            value={form.guestName}
            onChange={(event) => setForm((current) => ({ ...current, guestName: event.target.value }))}
            className={fieldClass}
          />
        </CompactField>
        <CompactField label="Email">
          <Input
            type="email"
            required
            value={form.guestEmail}
            onChange={(event) => setForm((current) => ({ ...current, guestEmail: event.target.value }))}
            className={fieldClass}
          />
        </CompactField>
        <CompactField label="Phone">
          <Input
            value={form.guestPhone}
            onChange={(event) => setForm((current) => ({ ...current, guestPhone: event.target.value }))}
            className={fieldClass}
          />
        </CompactField>
        <CompactField label="Notes (optional)">
          <Input
            value={form.notes}
            onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
            placeholder="Arrival time, extra bed…"
            className={`${fieldClass} placeholder:text-white/30`}
          />
        </CompactField>
      </div>

      <Button type="submit" variant="gold" className="h-11 w-full rounded-lg" disabled={create.isPending}>
        {create.isPending ? "Sending…" : create.isSuccess ? "Enquiry sent" : "Enquire Now"}
      </Button>
    </form>
  );
}
