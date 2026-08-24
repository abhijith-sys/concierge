import { useQuery } from "@tanstack/react-query";
import { Building2, FolderTree, Search } from "lucide-react";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { api, type SearchSuggestion } from "../lib/api";
import { twMerge } from "tailwind-merge";

function suggestionIcon(type: SearchSuggestion["type"]) {
  if (type === "category") return FolderTree;
  if (type === "query") return Search;
  return Building2;
}

export function SearchAutocomplete({
  value,
  onChange,
  city,
  placeholder,
  className,
  inputClassName,
  onSelect,
  id,
}: {
  value: string;
  onChange: (value: string) => void;
  city?: string;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  onSelect: (suggestion: SearchSuggestion) => void;
  id?: string;
}) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [debounced, setDebounced] = useState(value.trim());
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebounced(value.trim()), 250);
    return () => window.clearTimeout(timeout);
  }, [value]);

  const suggestions = useQuery({
    queryKey: ["search-suggest", debounced, city ?? ""],
    queryFn: () => api.searchSuggest(debounced, city),
    enabled: debounced.length >= 2,
    staleTime: 30_000,
  });

  const items = suggestions.data?.suggestions ?? [];
  const showDropdown = open && debounced.length >= 2 && (suggestions.isFetching || items.length > 0);

  useEffect(() => {
    setActiveIndex(-1);
  }, [debounced, items.length]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  function choose(suggestion: SearchSuggestion) {
    setOpen(false);
    onSelect(suggestion);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!showDropdown || items.length === 0) {
      if (event.key === "Escape") setOpen(false);
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % items.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => (current <= 0 ? items.length - 1 : current - 1));
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      choose(items[activeIndex]!);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className={twMerge("relative min-w-0 flex-1", className)}>
      <input
        id={id}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        role="combobox"
        aria-expanded={showDropdown}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
        className={twMerge("h-11 w-full bg-transparent text-sm outline-none", inputClassName)}
        placeholder={placeholder}
        autoComplete="off"
      />
      {showDropdown ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+0.35rem)] z-50 max-h-72 overflow-auto rounded-2xl border border-line bg-white py-1 shadow-xl shadow-navy/10"
        >
          {suggestions.isFetching && items.length === 0 ? (
            <li className="px-4 py-3 text-sm text-ink-soft">Searching…</li>
          ) : null}
          {items.map((suggestion, index) => {
            const Icon = suggestionIcon(suggestion.type);
            const active = index === activeIndex;
            return (
              <li key={`${suggestion.type}-${suggestion.id ?? suggestion.label}-${index}`} role="option" aria-selected={active}>
                <button
                  id={`${listId}-${index}`}
                  type="button"
                  className={twMerge(
                    "flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition",
                    active ? "bg-surface-low text-navy" : "text-ink hover:bg-surface-low",
                  )}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => choose(suggestion)}
                >
                  <Icon className="size-4 shrink-0 text-gold-dark" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate font-medium">{suggestion.label}</span>
                  <span className="shrink-0 text-[11px] uppercase tracking-wide text-ink-soft">
                    {suggestion.type === "query" ? "Search" : suggestion.type}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
