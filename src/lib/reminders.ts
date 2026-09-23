import type { Entry } from "@/lib/types";
import { countdownLabel, remainingSeconds, usesCountdown } from "@/lib/countdown";
import { isDueToday } from "@/lib/sort";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export type ReminderState = {
  entry: Entry;
  time: string;
  minutes: number;
  overdue: boolean;
  upcoming: boolean;
  weekdayLabel: string | null;
  mode: "clock" | "ends" | "starts";
};

function parseHm(value: string): { h: number; m: number } | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return { h, m };
}

export function reminderOf(entry: Entry, now = new Date()): ReminderState | null {
  if (entry.kind !== "task" && entry.kind !== "rabbit" && entry.kind !== "calendar") return null;
  if (entry.status === "archived" || entry.effectiveStatus === "archived") return null;
  if (entry.kind === "calendar") {
    if (!isDueToday(entry, now)) return null;
    if (entry.effectiveStatus === "done") return null;
    const parsed = parseHm(entry.meta.reminderTime ?? "");
    const minutes = parsed ? parsed.h * 60 + parsed.m : now.getHours() * 60 + now.getMinutes();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const overdue = parsed ? nowMinutes >= minutes : false;
    const upcoming = parsed ? !overdue && minutes - nowMinutes <= 90 : true;
    return {
      entry,
      time: parsed ? `${String(parsed.h).padStart(2, "0")}:${String(parsed.m).padStart(2, "0")}` : "All day",
      minutes,
      overdue,
      upcoming,
      weekdayLabel: null,
      mode: "clock",
    };
  }
  if (entry.meta.reminderEnabled !== "1") return null;
  const parsed = parseHm(entry.meta.reminderTime ?? "");
  if (!parsed) return null;
  if (entry.effectiveStatus === "done") return null;
  if (!isDueToday(entry, now)) return null;
  const minutes = parsed.h * 60 + parsed.m;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const overdue = nowMinutes >= minutes;
  const upcoming = !overdue && minutes - nowMinutes <= 90;
  return {
    entry,
    time: `${String(parsed.h).padStart(2, "0")}:${String(parsed.m).padStart(2, "0")}`,
    minutes,
    overdue,
    upcoming,
    weekdayLabel: entry.weekday != null ? (WEEKDAYS[entry.weekday] ?? null) : null,
    mode: "clock",
  };
}

export function countdownReminder(entry: Entry, now = new Date()): ReminderState | null {
  if (!usesCountdown(entry.kind, entry.cadence)) return null;
  const left = remainingSeconds(entry, now);
  if (left == null) return null;
  const label = countdownLabel(entry, now);
  if (!label) return null;
  return {
    entry,
    time: label,
    minutes: Math.floor(left / 60),
    overdue: left < 0,
    upcoming: left >= 0 && left <= 90 * 60,
    weekdayLabel: null,
    mode: entry.kind === "task" || entry.kind === "challenge" || entry.kind === "punishment" ? "ends" : "starts",
  };
}

export function sortReminders(items: ReminderState[]) {
  return [...items].sort((a, b) => a.minutes - b.minutes);
}

export function reminderStorageKey(entryId: number, now = new Date()) {
  const day = now.toISOString().slice(0, 10);
  return `sanctum-reminded-${entryId}-${day}`;
}
