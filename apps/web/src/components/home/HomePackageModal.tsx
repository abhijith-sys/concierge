import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { Service } from "../../lib/api";
import { displayValue, fieldByKey } from "../../lib/field-values";
import { formatHomeMoney, homeDurationHours, homePackageRates } from "../../lib/home";
import { Button } from "../ui";
import { SafeImage } from "../SafeImage";

export function HomePackageModal({
  service,
  onClose,
  onEnquire,
}: {
  service: Service;
  onClose: () => void;
  onEnquire: (service: Service) => void;
}) {
  const gallery = service.images?.length ? service.images : [];
  const [index, setIndex] = useState(0);
  const rates = homePackageRates(service);
  const packageType = displayValue(fieldByKey(service.fieldValues, "job_package_type")?.value);
  const duration = homeDurationHours(service);

  useEffect(() => {
    setIndex(0);
  }, [service.id]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight" && gallery.length) setIndex((current) => (current + 1) % gallery.length);
      if (event.key === "ArrowLeft" && gallery.length) {
        setIndex((current) => (current - 1 + gallery.length) % gallery.length);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [gallery.length, onClose]);

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-3xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="home-package-modal-title"
      >
        <div className="relative aspect-[16/9] bg-black">
          {gallery[index] ? (
            <SafeImage src={gallery[index]} alt={service.name} className="size-full object-cover" />
          ) : (
            <div className="size-full bg-surface-high" />
          )}
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 grid size-10 place-items-center rounded-full bg-black/70 text-white"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
          {gallery.length > 1 ? (
            <>
              <button
                type="button"
                className="absolute left-4 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-black/60 text-white"
                onClick={() => setIndex((current) => (current - 1 + gallery.length) % gallery.length)}
                aria-label="Previous image"
              >
                <ChevronLeft className="size-5" />
              </button>
              <button
                type="button"
                className="absolute right-4 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-black/60 text-white"
                onClick={() => setIndex((current) => (current + 1) % gallery.length)}
                aria-label="Next image"
              >
                <ChevronRight className="size-5" />
              </button>
              <p className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs font-bold text-white">
                {index + 1} / {gallery.length}
              </p>
            </>
          ) : null}
        </div>
        {gallery.length > 1 ? (
          <div className="flex gap-2 overflow-x-auto bg-black px-4 py-3">
            {gallery.map((src, imageIndex) => (
              <button
                key={`${src}-${imageIndex}`}
                type="button"
                onClick={() => setIndex(imageIndex)}
                className={`relative h-16 w-20 shrink-0 overflow-hidden rounded-lg ${
                  imageIndex === index ? "ring-2 ring-white" : "opacity-70 hover:opacity-100"
                }`}
                aria-label={`Photo ${imageIndex + 1}`}
                aria-current={imageIndex === index}
              >
                <SafeImage src={src} alt="" className="size-full object-cover" />
              </button>
            ))}
          </div>
        ) : null}
        <div className="grid gap-8 p-6 md:grid-cols-[1.25fr_0.75fr] md:p-8">
          <div>
            {packageType ? <p className="label-caps text-gold-dark">{packageType}</p> : null}
            <h2 id="home-package-modal-title" className="mt-2 text-3xl font-extrabold tracking-tight text-ink">
              {service.name}
            </h2>
            {service.description ? (
              <p className="mt-4 text-sm leading-7 text-ink-soft">{service.description}</p>
            ) : null}
            <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-3 text-sm">
              {duration != null ? (
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-ink-soft/70">Duration</dt>
                  <dd className="mt-0.5 font-semibold text-ink">{duration} hrs</dd>
                </div>
              ) : null}
            </dl>
          </div>
          <aside className="rounded-2xl bg-surface-low p-5">
            <p className="label-caps text-ink-soft/70">Rates</p>
            <ul className="mt-4 grid gap-3 text-sm">
              {rates.hourly != null ? (
                <li className="flex justify-between gap-4">
                  <span>Hourly</span>
                  <strong>{formatHomeMoney(rates.hourly, rates.currency)}</strong>
                </li>
              ) : null}
              {rates.job != null ? (
                <li className="flex justify-between gap-4">
                  <span>Job</span>
                  <strong>{formatHomeMoney(rates.job, rates.currency)}</strong>
                </li>
              ) : null}
            </ul>
            <Button className="mt-6 w-full" onClick={() => onEnquire(service)}>
              Enquire about this package
            </Button>
          </aside>
        </div>
      </div>
    </div>
  );
}
