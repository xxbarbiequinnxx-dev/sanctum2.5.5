import type { CalendarChange, CalendarOpen, CalendarPerson, CalendarVisit, HouseHistory } from "@/lib/types";

export const OPEN_GAP_MS = 20 * 60 * 1000;

export function localDateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function monthWindow(year: number, month: number) {
  const from = new Date(year, month, 1);
  const to = new Date(year, month + 1, 1);
  return { from: from.toISOString(), to: to.toISOString() };
}

export function dayBounds(dateKey: string) {
  const [y, m, d] = dateKey.split("-").map(Number);
  const start = new Date(y, m - 1, d);
  const end = new Date(y, m - 1, d + 1);
  return { start: start.getTime(), end: end.getTime() };
}

export function formatDurationMs(ms: number) {
  if (!Number.isFinite(ms) || ms <= 0) return "";
  if (ms < 45_000) return "a moment";
  if (ms < 3_600_000) {
    const minutes = Math.max(1, Math.round(ms / 60_000));
    return minutes === 1 ? "1 min" : `${minutes} min`;
  }
  if (ms < 86_400_000) {
    const hours = Math.floor(ms / 3_600_000);
    const minutes = Math.round((ms % 3_600_000) / 60_000);
    if (!minutes) return hours === 1 ? "1 hour" : `${hours} hours`;
    return `${hours}h ${minutes}m`;
  }
  const days = Math.floor(ms / 86_400_000);
  return days === 1 ? "1 day" : `${days} days`;
}

export function formatOpenCount(count: number) {
  if (count <= 0) return "did not open Sanctum";
  if (count === 1) return "opened Sanctum 1 time";
  return `opened Sanctum ${count} times`;
}

export function entityLabel(entity: string) {
  if (entity === "rabbit" || entity === "training") return "training";
  if (entity === "task") return "task";
  if (entity === "habit") return "habit";
  if (entity === "punishment") return "punishment";
  if (entity === "reward") return "reward";
  if (entity === "game") return "game";
  if (entity === "scene") return "scene";
  if (entity === "journal") return "journal";
  if (entity === "note") return "note";
  if (entity === "catalog") return "catalogue item";
  if (entity === "wishlist") return "wish";
  if (entity === "roleplay") return "roleplay";
  if (entity === "challenge") return "challenge";
  if (entity === "house") return "the dynamic";
  if (entity === "location") return "location";
  return entity || "entry";
}

export function describeChange(change: CalendarChange, actorName: string) {
  const title = change.title.trim();
  const entity = entityLabel(change.entity);
  switch (change.action) {
    case "created":
      return `${actorName} added ${entity}${title ? ` “${title}”` : ""}`;
    case "completed":
      return `${actorName} completed${title ? ` “${title}”` : ` ${entity}`}`;
    case "reopened":
      return `${actorName} reopened${title ? ` “${title}”` : ` ${entity}`}`;
    case "skipped":
      return `${actorName} skipped${title ? ` “${title}”` : ` ${entity}`}`;
    case "overdue":
      return `${actorName} missed due time on${title ? ` “${title}”` : ` ${entity}`}`;
    case "archived":
      return `${actorName} archived${title ? ` “${title}”` : ` ${entity}`}`;
    case "restored":
      return `${actorName} restored${title ? ` “${title}”` : ` ${entity}`}`;
    case "updated":
      return `${actorName} edited${title ? ` “${title}”` : ` ${entity}`}`;
    case "deleted":
      return `${actorName} deleted${title ? ` “${title}”` : ` ${entity}`}`;
    case "weekly_reset":
      return `${title ? `“${title}”` : entity} was reset for the new week`;
    case "bought":
      return `${actorName} bought${title ? ` “${title}”` : ` ${entity}`}${change.detail ? ` for ${change.detail}` : ""}`;
    case "vacation_on":
      return `${actorName} paused duties`;
    case "vacation_off":
      return `${actorName} resumed duties`;
    case "sharing_on":
      return `${actorName} started sharing location`;
    case "sharing_off":
      return `${actorName} stopped sharing location`;
    case "paired":
      return `${actorName} connected a partner`;
    case "unpaired":
      return `${actorName} disconnected`;
    case "talk":
      return `${actorName} answered in Talk${title ? ` — ${title}` : ""}`;
    case "journal":
      return `${actorName} shared a journal page${title ? ` “${title}”` : ""}`;
    case "points":
      return `${actorName} moved points${change.detail ? ` (${change.detail})` : ""}`;
    case "permissions":
      return `${actorName} changed permissions`;
    case "message":
      return `${actorName} sent a message`;
    case "photo":
      return `${actorName} sent a photo`;
    case "video":
      return `${actorName} sent a video`;
    case "voice":
      return `${actorName} sent a voice note`;
    default:
      return change.detail || `${actorName} ${change.action}${title ? ` “${title}”` : ""}`;
  }
}

export function opensOnDay(history: HouseHistory, dateKey: string) {
  return history.opens.filter((item) => localDateKey(new Date(item.openedAt)) === dateKey);
}

export function openCountsByUser(history: HouseHistory, dateKey: string) {
  const counts = new Map<string, number>();
  for (const person of history.people) counts.set(person.userId, 0);
  for (const open of opensOnDay(history, dateKey)) {
    counts.set(open.userId, (counts.get(open.userId) ?? 0) + 1);
  }
  return history.people.map((person) => ({
    person,
    count: counts.get(person.userId) ?? 0,
  }));
}

export function totalOpensOnDay(history: HouseHistory, dateKey: string) {
  return opensOnDay(history, dateKey).length;
}

export function visitsOnDay(history: HouseHistory, dateKey: string, now = Date.now()) {
  const { start, end } = dayBounds(dateKey);
  return history.visits
    .map((visit) => {
      const arrived = new Date(visit.arrivedAt).getTime();
      const departed = visit.departedAt ? new Date(visit.departedAt).getTime() : now;
      const clipStart = Math.max(arrived, start);
      const clipEnd = Math.min(departed, end);
      const durationMs = Math.max(0, clipEnd - clipStart);
      return { visit, durationMs, arrived, departed };
    })
    .filter((item) => item.durationMs > 0)
    .sort((a, b) => a.arrived - b.arrived);
}

export function changesOnDay(history: HouseHistory, dateKey: string) {
  return history.changes
    .filter((item) => localDateKey(new Date(item.createdAt)) === dateKey)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function personName(people: CalendarPerson[], userId: string) {
  return people.find((item) => item.userId === userId)?.displayName || "Someone";
}

export function monthMarks(history: HouseHistory, year: number, month: number) {
  const marks: Record<string, { opens: number; visits: number; changes: number }> = {};
  const last = new Date(year, month + 1, 0).getDate();
  for (let day = 1; day <= last; day += 1) {
    const key = localDateKey(new Date(year, month, day));
    marks[key] = {
      opens: totalOpensOnDay(history, key),
      visits: visitsOnDay(history, key).length,
      changes: changesOnDay(history, key).length,
    };
  }
  return marks;
}

export function emptyHistory(): HouseHistory {
  return { people: [], opens: [], visits: [], changes: [] };
}

export type DayVisit = {
  visit: CalendarVisit;
  durationMs: number;
};

export type { CalendarOpen, CalendarVisit, CalendarChange, CalendarPerson };
