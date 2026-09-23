export function googleMapsEmbed(lat: number, lng: number) {
  return `https://maps.google.com/maps?q=${lat},${lng}&z=16&hl=en&output=embed`;
}

export function googleMapsLink(lat: number, lng: number) {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

export function haversineMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
) {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

export function formatMeters(meters: number) {
  if (!Number.isFinite(meters)) return "";
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(meters >= 10000 ? 0 : 1)} km`;
}

export function formatAgo(iso: string | null | undefined, now = Date.now()) {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "";
  const delta = now - then;
  if (delta < 20_000) return "just now";
  if (delta < 60_000) return `${Math.round(delta / 1000)}s ago`;
  if (delta < 3_600_000) return `${Math.round(delta / 60_000)}m ago`;
  if (delta < 86_400_000) return `${Math.round(delta / 3_600_000)}h ago`;
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date(then));
}

export function formatStay(iso: string | null | undefined, now = Date.now()) {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "";
  const delta = Math.max(0, now - then);
  if (delta < 45_000) return "just arrived";
  if (delta < 3_600_000) {
    const minutes = Math.max(1, Math.round(delta / 60_000));
    return minutes === 1 ? "1 min" : `${minutes} min`;
  }
  if (delta < 86_400_000) {
    const hours = Math.floor(delta / 3_600_000);
    const minutes = Math.round((delta % 3_600_000) / 60_000);
    if (!minutes) return hours === 1 ? "1 hour" : `${hours} hours`;
    return `${hours}h ${minutes}m`;
  }
  const days = Math.floor(delta / 86_400_000);
  return days === 1 ? "1 day" : `${days} days`;
}

export function formatNominatimAddress(json: {
  display_name?: string;
  address?: Record<string, string | undefined>;
} | null | undefined) {
  if (!json) return "";
  const a = json.address ?? {};
  const street = [a.house_number, a.road || a.pedestrian || a.footway || a.path || a.residential]
    .filter(Boolean)
    .join(" ");
  const locality = a.suburb || a.neighbourhood || a.quarter || a.city_district || a.hamlet;
  const city = a.city || a.town || a.village || a.municipality;
  const region = a.state;
  const postcode = a.postcode;
  const parts: string[] = [];
  if (street) parts.push(street);
  if (locality && locality !== city) parts.push(locality);
  if (city) parts.push(city);
  if (region) parts.push(region);
  if (postcode) parts.push(postcode);
  if (parts.length) return parts.join(", ");
  return (json.display_name ?? "")
    .split(",")
    .slice(0, 4)
    .map((part) => part.trim())
    .filter(Boolean)
    .join(", ");
}

export const LOCATION_EVENT = "sanctum:location";

export function notifyLocationChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(LOCATION_EVENT));
}

/** ~150 m — beyond typical GPS jitter, still a real change of place. */
export const PLACE_MOVE_METERS = 150;
