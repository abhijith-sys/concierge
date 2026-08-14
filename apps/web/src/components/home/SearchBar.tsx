import { ChevronDown, MapPin } from "lucide-react";
import type { FormEvent } from "react";
import { Button } from "../ui";

export function SearchBar({
  city,
  query,
  onCityChange,
  onQueryChange,
  onSubmit,
  onUseLocation,
}: {
  city: string;
  query: string;
  onCityChange: (value: string) => void;
  onQueryChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
  onUseLocation?: () => void;
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="search-panel mt-6 flex flex-col gap-2 rounded-3xl border border-line bg-white p-1.5 shadow-xl shadow-navy/10 md:flex-row md:items-center md:rounded-full"
    >
      <label className="flex min-w-36 items-center gap-2 px-4">
        <MapPin className="size-4 shrink-0 text-gold-dark" aria-hidden="true" />
        <span className="sr-only">Location</span>
        <input
          value={city}
          onChange={(event) => onCityChange(event.target.value)}
          className="h-11 w-full bg-transparent text-sm font-semibold outline-none"
          placeholder="Kochi"
          autoComplete="address-level2"
        />
        <button
          type="button"
          className="text-ink-soft"
          aria-label={onUseLocation ? "Use my location" : "Choose location"}
          onClick={onUseLocation}
        >
          <ChevronDown className="size-4" />
        </button>
      </label>
      <label className="flex flex-1 items-center gap-3 border-t border-line px-4 md:border-l md:border-t-0">
        <span className="sr-only">Search services, businesses or professionals</span>
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          className="h-11 w-full bg-transparent text-sm outline-none"
          placeholder="Search services, businesses or professionals..."
        />
      </label>
      <Button type="submit" variant="gold" className="w-full px-7 md:w-auto">
        Search
      </Button>
    </form>
  );
}
