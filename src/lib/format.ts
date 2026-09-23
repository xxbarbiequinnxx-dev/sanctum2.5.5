import { SEX_OPTIONS } from "@/lib/types";
import type { Role } from "@/lib/kinds";

export function roleLabel(role: Role | string) {
  if (role === "dominant") return "Dominant";
  if (role === "switch") return "Switch";
  return "Submissive";
}

export function publicName(person: { username?: string | null; displayName?: string | null } | null | undefined) {
  return person?.username?.trim() || "Partner";
}

export function sexLabel(value: string) {
  return SEX_OPTIONS.find((item) => item.value === value)?.label ?? "";
}

export function formatWhen(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function greeting() {
  const hour = new Date().getHours();
  if (hour < 5) return "Late night";
  if (hour < 12) return "Morning";
  if (hour < 18) return "Afternoon";
  return "Evening";
}

export function intensityMarks(value: number | null) {
  const n = value ?? 0;
  return Array.from({ length: 5 }, (_, i) => i < n);
}

export function isPresent(lastSeen: string | null | undefined, now = Date.now()) {
  if (!lastSeen) return false;
  const then = new Date(lastSeen).getTime();
  if (!Number.isFinite(then)) return false;
  return now - then < 3 * 60 * 1000;
}
