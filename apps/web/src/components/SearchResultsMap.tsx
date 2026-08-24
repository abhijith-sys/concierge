import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import L from "leaflet";
import type { Listing } from "../lib/api";
import { listingHref } from "./ListingCard";

type MapPin = {
  lat: number;
  lng: number;
  label: string;
  href: string;
};

function pinsFromListings(items: Listing[]): MapPin[] {
  return items.flatMap((listing) => {
    const lat = listing.lat;
    const lng = listing.lng;
    if (typeof lat !== "number" || typeof lng !== "number") return [];
    return [
      {
        lat,
        lng,
        label: listing.title,
        href: listingHref(listing),
      },
    ];
  });
}

export default function SearchResultsMap({ items }: { items: Listing[] }) {
  const elementRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const pins = pinsFromListings(items);

  useEffect(() => {
    if (!elementRef.current) return;

    if (!mapRef.current) {
      mapRef.current = L.map(elementRef.current, { scrollWheelZoom: false });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(mapRef.current);
    }

    const map = mapRef.current;
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.CircleMarker) {
        map.removeLayer(layer);
      }
    });

    const nextPins = pinsFromListings(items);

    if (nextPins.length === 0) {
      map.setView([20.5937, 78.9629], 5);
      return;
    }

    const bounds = L.latLngBounds(nextPins.map((pin) => [pin.lat, pin.lng] as [number, number]));
    for (const pin of nextPins) {
      L.circleMarker([pin.lat, pin.lng], {
        radius: 8,
        color: "#ffffff",
        weight: 3,
        fillColor: "#0f172a",
        fillOpacity: 1,
      })
        .addTo(map)
        .bindPopup(`<a href="${pin.href}">${pin.label}</a>`);
    }

    if (nextPins.length === 1) {
      map.setView([nextPins[0]!.lat, nextPins[0]!.lng], 14);
    } else {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }

    return () => {
      map.eachLayer((layer) => {
        if (layer instanceof L.Marker || layer instanceof L.CircleMarker) {
          map.removeLayer(layer);
        }
      });
    };
  }, [items]);

  useEffect(() => {
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  if (pins.length === 0) {
    return (
      <div className="rounded-2xl border border-line bg-surface-low p-8 text-center">
        <p className="font-semibold text-navy">No map locations for these results</p>
        <p className="mt-2 text-sm text-ink-soft">
          Switch to list view or try a broader search. Listings need latitude and longitude to appear on the map.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div ref={elementRef} className="h-[28rem] w-full rounded-2xl border border-line" role="img" aria-label="Map of search results" />
      <p className="text-xs text-ink-soft">
        Showing {pins.length} location{pins.length === 1 ? "" : "s"}.{" "}
        {pins.slice(0, 3).map((pin, index) => (
          <span key={pin.href}>
            {index > 0 ? ", " : ""}
            <Link to={pin.href} className="font-semibold text-navy underline-offset-2 hover:underline">
              {pin.label}
            </Link>
          </span>
        ))}
        {pins.length > 3 ? ` and ${pins.length - 3} more` : null}
      </p>
    </div>
  );
}
