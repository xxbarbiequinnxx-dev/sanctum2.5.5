export function byTitle<T extends { title?: string; name?: string }>(a: T, b: T) {
  const left = (a.title ?? a.name ?? "").trim();
  const right = (b.title ?? b.name ?? "").trim();
  return left.localeCompare(right, undefined, { sensitivity: "base" });
}

export function sortOrderOf(item: { sortOrder?: number | null; meta?: Record<string, string> }) {
  if (typeof item.sortOrder === "number" && Number.isFinite(item.sortOrder) && item.sortOrder !== 0) {
    return item.sortOrder;
  }
  const raw = item.meta?.sortOrder;
  const n = raw ? Number(raw) : 0;
  return Number.isFinite(n) ? n : 0;
}

export function sortNamed<T>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const ao = sortOrderOf(a as { sortOrder?: number | null; meta?: Record<string, string> });
    const bo = sortOrderOf(b as { sortOrder?: number | null; meta?: Record<string, string> });
    if (ao !== bo) return ao - bo;
    return byTitle(a as { title?: string; name?: string }, b as { title?: string; name?: string });
  });
}

export function parseCustomDays(raw: string | undefined | null): number[] {
  if (!raw) return [];
  return raw
    .split(/[, ]+/)
    .map((value) => Number(value.trim()))
    .filter((n) => Number.isInteger(n) && n >= 0 && n <= 6);
}

export function encodeCustomDays(days: number[]) {
  return [...new Set(days)].sort((a, b) => a - b).join(",");
}

export function isDueToday(entry: { cadence?: string | null; weekday?: number | null; meta?: Record<string, string> }, now = new Date()) {
  const calendarDate = entry.meta?.calendarDate?.trim();
  if (calendarDate) {
    const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    return calendarDate === key;
  }
  const cadence = entry.cadence ?? "";
  if (cadence === "weekly") return entry.weekday == null || entry.weekday === now.getDay();
  if (cadence === "custom") {
    const days = parseCustomDays(entry.meta?.customDays);
    if (!days.length) return true;
    return days.includes(now.getDay());
  }
  return true;
}

export const URGENCY = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
] as const;

export type Urgency = (typeof URGENCY)[number]["value"];

export function urgencyOf(meta: Record<string, string> | undefined | null): Urgency {
  const value = meta?.urgency;
  if (value === "low" || value === "high" || value === "urgent") return value;
  return "normal";
}
