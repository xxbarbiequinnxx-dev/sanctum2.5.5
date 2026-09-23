import type { Kind } from "@/lib/kinds";
import type { Entry } from "@/lib/types";

export const COUNTDOWN_KINDS: Kind[] = [
  "task",
  "challenge",
  "punishment",
  "reward",
  "roleplay",
  "game",
  "scene",
];

export function usesCountdown(kind: Kind, cadence?: string | null) {
  if (kind === "task" && cadence === "habit") return false;
  return COUNTDOWN_KINDS.includes(kind);
}

export function countdownMode(kind: Kind): "ends" | "starts" | null {
  if (kind === "task" || kind === "challenge" || kind === "punishment") return "ends";
  if (kind === "reward" || kind === "roleplay" || kind === "game" || kind === "scene") return "starts";
  return null;
}

export function parseCountdown(meta: Record<string, string>) {
  const days = clampInt(meta.countdownDays, 0, 365);
  const hours = clampInt(meta.countdownHours, 0, 23);
  const minutes = clampInt(meta.countdownMinutes, 0, 59);
  const total = days * 86400 + hours * 3600 + minutes * 60;
  return { days, hours, minutes, total };
}

export function countdownAnchor(entry: Entry) {
  return entry.meta.countdownAnchor || entry.createdAt;
}

export function remainingSeconds(entry: Entry, now = new Date()) {
  if (!usesCountdown(entry.kind, entry.cadence)) return null;
  if (entry.status === "archived" || entry.effectiveStatus === "archived") return null;
  if (entry.effectiveStatus === "done" || entry.status === "done") return null;
  const { total } = parseCountdown(entry.meta);
  if (total <= 0) return null;
  const start = new Date(countdownAnchor(entry)).getTime();
  if (!Number.isFinite(start)) return null;
  return Math.floor((start + total * 1000 - now.getTime()) / 1000);
}

export function formatCountdown(seconds: number) {
  const overdue = seconds < 0;
  const abs = Math.abs(seconds);
  const days = Math.floor(abs / 86400);
  const hours = Math.floor((abs % 86400) / 3600);
  const minutes = Math.floor((abs % 3600) / 60);
  const secs = abs % 60;
  const clock =
    days > 0
      ? `${days}d ${hours}h ${String(minutes).padStart(2, "0")}m`
      : hours > 0
        ? `${hours}h ${String(minutes).padStart(2, "0")}m`
        : `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  return overdue ? `Overdue ${clock}` : clock;
}

export function countdownLabel(entry: Entry, now = new Date()) {
  const left = remainingSeconds(entry, now);
  if (left == null) return null;
  const mode = countdownMode(entry.kind);
  const clock = formatCountdown(left);
  if (left < 0) return mode === "starts" ? `Should have started · ${clock}` : clock;
  return mode === "starts" ? `Starts in ${clock}` : `Ends in ${clock}`;
}

function clampInt(raw: string | undefined, min: number, max: number) {
  const n = Number(raw);
  if (!Number.isFinite(n)) return 0;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}
