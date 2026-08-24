import { useMutation } from "@tanstack/react-query";
import { Minus, Plus } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { useAuth } from "../../context/useAuth";
import { ApiError, api, type Service } from "../../lib/api";
import { travelVehicleCount } from "../../lib/travel";
import { Button, Input } from "../ui";

const MAX_VEHICLE_QTY = 20;
const fieldClass = "min-h-10 rounded-lg border-white/10 bg-[#1c1c1c] px-3 text-white";

function vehicleMax(service: Service) {
  const units = travelVehicleCount(service);
  return Math.min(MAX_VEHICLE_QTY, Math.max(1, units ?? MAX_VEHICLE_QTY));
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

export function TravelEnquiryForm({
  businessId,
  vehicles,
  selectedIds,
  onToggleVehicle,
}: {
  businessId: string;
  vehicles: Service[];
  selectedIds: string[];
  onToggleVehicle: (id: string) => void;
}) {
  const { user } = useAuth();
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    guestName: user?.name ?? "",
    guestEmail: user?.email ?? "",
    guestPhone: user?.phone ?? "",
    pickupDate: "",
    pickupTime: "",
    pickupLocation: "",
    dropoffLocation: "",
    passengers: 1,
    roundTrip: false,
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

  const create = useMutation({
    mutationFn: api.createTravelEnquiry,
    onSuccess: () => {
      toast.success("Enquiry sent to the operator. They will contact you directly.");
      setForm((current) => ({ ...current, notes: "" }));
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Unable to send this enquiry.");
    },
  });

  const selectedVehicles = useMemo(
    () => vehicles.filter((item) => selectedIds.includes(item.id)),
    [vehicles, selectedIds],
  );
  const totalQty = selectedVehicles.reduce((sum, item) => sum + (quantities[item.id] ?? 1), 0);

  function setQuantity(id: string, value: number) {
    const item = vehicles.find((row) => row.id === id);
    const max = item ? vehicleMax(item) : MAX_VEHICLE_QTY;
    const next = Math.min(max, Math.max(1, Number.isFinite(value) ? Math.trunc(value) : 1));
    setQuantities((current) => ({ ...current, [id]: next }));
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!selectedIds.length) {
      toast.error("Select at least one vehicle or trip.");
      return;
    }
    if (!form.pickupDate || !form.pickupLocation.trim() || !form.dropoffLocation.trim()) {
      toast.error("Add pickup date, pickup, and drop-off.");
      return;
    }
    create.mutate({
      businessId,
      guestName: form.guestName.trim(),
      guestEmail: form.guestEmail.trim(),
      guestPhone: form.guestPhone.trim() || undefined,
      pickupDate: form.pickupDate,
      pickupTime: form.pickupTime || undefined,
      pickupLocation: form.pickupLocation.trim(),
      dropoffLocation: form.dropoffLocation.trim(),
      passengers: form.passengers,
      roundTrip: form.roundTrip,
      notes: form.notes.trim() || undefined,
      vehicleSelections: selectedIds.map((serviceId) => ({
        serviceId,
        quantity: quantities[serviceId] ?? 1,
      })),
    });
  }

  return (
    <form onSubmit={submit} className="mt-5 grid gap-4">
      <section>
        <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-white/50">Vehicles</p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((item) => {
            const checked = selectedIds.includes(item.id);
            return (
              <div
                key={item.id}
                className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 text-sm ${
                  checked ? "border-white/35 bg-white/10" : "border-white/10 bg-[#1c1c1c]"
                }`}
              >
                <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggleVehicle(item.id)}
                    className="size-4 accent-white"
                  />
                  <span className="truncate font-semibold">{item.name}</span>
                </label>
                {checked ? (
                  <QuantityStepper
                    value={quantities[item.id] ?? 1}
                    max={vehicleMax(item)}
                    name={item.name}
                    onChange={(value) => setQuantity(item.id, value)}
                  />
                ) : null}
              </div>
            );
          })}
        </div>
        <p className="mt-1.5 text-[11px] text-white/45">
          {selectedVehicles.length
            ? `${totalQty} vehicle${totalQty === 1 ? "" : "s"} selected`
            : "Tick a vehicle or trip. Count starts at 1."}
        </p>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <CompactField label="Pickup date">
          <Input
            type="date"
            required
            min={today}
            value={form.pickupDate}
            onChange={(event) => setForm((current) => ({ ...current, pickupDate: event.target.value }))}
            className={fieldClass}
          />
        </CompactField>
        <CompactField label="Pickup time">
          <Input
            type="time"
            value={form.pickupTime}
            onChange={(event) => setForm((current) => ({ ...current, pickupTime: event.target.value }))}
            className={fieldClass}
          />
        </CompactField>
        <CompactField label="Pickup">
          <Input
            required
            value={form.pickupLocation}
            onChange={(event) => setForm((current) => ({ ...current, pickupLocation: event.target.value }))}
            placeholder="Hotel, airport, address…"
            className={`${fieldClass} placeholder:text-white/30`}
          />
        </CompactField>
        <CompactField label="Drop-off">
          <Input
            required
            value={form.dropoffLocation}
            onChange={(event) => setForm((current) => ({ ...current, dropoffLocation: event.target.value }))}
            placeholder="Destination"
            className={`${fieldClass} placeholder:text-white/30`}
          />
        </CompactField>
        <CompactField label="Passengers">
          <Input
            type="number"
            min={1}
            max={80}
            required
            value={form.passengers}
            onChange={(event) =>
              setForm((current) => ({ ...current, passengers: Number(event.target.value) || 1 }))
            }
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
        <label className="flex items-end gap-2 pb-2 text-sm font-semibold text-white/80">
          <input
            type="checkbox"
            checked={form.roundTrip}
            onChange={(event) => setForm((current) => ({ ...current, roundTrip: event.target.checked }))}
            className="size-4 accent-white"
          />
          Round trip
        </label>
        <CompactField label="Notes (optional)">
          <Input
            value={form.notes}
            onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
            placeholder="Flight number, child seat…"
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
