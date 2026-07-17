import { useEffect, useRef } from "react";
import L from "leaflet";

export default function BusinessMap({
  lat,
  lng,
  name,
}: {
  lat: number;
  lng: number;
  name: string;
}) {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!elementRef.current) return;
    const map = L.map(elementRef.current, { scrollWheelZoom: false }).setView([lat, lng], 14);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);
    L.circleMarker([lat, lng], {
      radius: 9,
      color: "#ffffff",
      weight: 3,
      fillColor: "#000000",
      fillOpacity: 1,
    }).addTo(map).bindPopup(name);
    return () => {
      map.remove();
    };
  }, [lat, lng, name]);

  return <div ref={elementRef} className="h-80 w-full rounded-2xl" aria-label={`Map showing ${name}`} />;
}
