import { ChevronLeft, ChevronRight, Clock3, MapPin } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { getHouseHistory } from "@/lib/api";
import { formatWhen } from "@/lib/format";
import {
  changesOnDay,
  describeChange,
  emptyHistory,
  formatDurationMs,
  formatOpenCount,
  localDateKey,
  monthMarks,
  monthWindow,
  openCountsByUser,
  personName,
  visitsOnDay,
} from "@/lib/history";
import { googleMapsLink } from "@/lib/location";
import type { HouseHistory, Me } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useLiveReload } from "@/lib/live-sync";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function HouseCalendar({ me }: { me: Me }) {
  const today = localDateKey(new Date());
  const now = new Date();
  const [cursor, setCursor] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const [selected, setSelected] = useState(today);
  const [history, setHistory] = useState<HouseHistory>(emptyHistory());
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const range = monthWindow(cursor.year, cursor.month);
    try {
      setHistory(await getHouseHistory({ data: range }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load the calendar.");
    } finally {
      setLoading(false);
    }
  }, [cursor.month, cursor.year]);

  useEffect(() => {
    void load();
  }, [load]);
  useLiveReload(load);

  const marks = useMemo(
    () => monthMarks(history, cursor.year, cursor.month),
    [cursor.month, cursor.year, history],
  );

  const firstWeekday = new Date(cursor.year, cursor.month, 1).getDay();
  const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
  const title = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(
    new Date(cursor.year, cursor.month, 1),
  );
  const selectedLabel = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date(`${selected}T12:00:00`));

  const openRows = openCountsByUser(history, selected);
  const visitRows = visitsOnDay(history, selected);
  const changeRows = changesOnDay(history, selected);
  const myId = me.profile?.userId;

  function shiftMonth(delta: number) {
    setCursor((prev) => {
      const date = new Date(prev.year, prev.month + delta, 1);
      return { year: date.getFullYear(), month: date.getMonth() };
    });
  }

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Shared with both of you — opens, places, and every change in Sanctum.
            </p>
          </div>
          <div className="flex shrink-0 gap-1">
            <button
              type="button"
              className="grid size-10 place-items-center rounded-lg bg-secondary text-muted-foreground hover:text-foreground"
              onClick={() => shiftMonth(-1)}
              aria-label="Previous month"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              className="grid size-10 place-items-center rounded-lg bg-secondary text-muted-foreground hover:text-foreground"
              onClick={() => shiftMonth(1)}
              aria-label="Next month"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs uppercase tracking-[0.12em] text-muted-foreground">
          {WEEKDAYS.map((day) => (
            <div key={day} className="py-1">
              {day}
            </div>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {Array.from({ length: firstWeekday }, (_, i) => (
            <div key={`pad-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const key = localDateKey(new Date(cursor.year, cursor.month, day));
            const mark = marks[key];
            const isToday = key === today;
            const isSelected = key === selected;
            const opens = mark?.opens ?? 0;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelected(key)}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center rounded-lg px-1 py-1.5 text-sm",
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : isToday
                      ? "bg-secondary text-foreground"
                      : "text-foreground hover:bg-secondary/70",
                )}
              >
                <span className="tabular-nums leading-none">{day}</span>
                {opens > 0 ? (
                  <span
                    className={cn(
                      "mt-1 text-xs tabular-nums",
                      isSelected ? "text-primary-foreground/80" : "text-primary",
                    )}
                  >
                    {opens}×
                  </span>
                ) : mark && (mark.visits > 0 || mark.changes > 0) ? (
                  <span className={cn("mt-1 size-1 rounded-full", isSelected ? "bg-primary-foreground/80" : "bg-primary")} />
                ) : (
                  <span className="mt-1 h-1" />
                )}
              </button>
            );
          })}
        </div>
        {loading ? <p className="mt-3 text-xs text-muted-foreground">Reading the log…</p> : null}
      </section>

      <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <h3 className="font-display text-2xl">{selectedLabel}</h3>
        <p className="mt-1 text-sm text-muted-foreground">Visible to both of you.</p>

        <div className="mt-4 space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Opens</p>
          {openRows.length === 0 ? (
            <p className="rounded-lg bg-secondary px-3 py-3 text-sm text-muted-foreground">
              No one is connected to this bond yet.
            </p>
          ) : (
            openRows.map(({ person, count }) => (
              <div key={person.userId} className="flex items-center gap-3 rounded-lg bg-secondary/70 px-3 py-3">
                <Avatar name={person.displayName} src={person.avatarData} />
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {person.userId === myId ? "You" : person.displayName || "Partner"}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatOpenCount(count)}</p>
                </div>
                <p className="ml-auto font-display text-2xl tabular-nums leading-none">{count}</p>
              </div>
            ))
          )}
        </div>

        <div className="mt-6 space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Places</p>
          {visitRows.length === 0 ? (
            <p className="rounded-lg bg-secondary px-3 py-3 text-sm text-muted-foreground">
              No shared locations this day.
            </p>
          ) : (
            visitRows.map(({ visit, durationMs }) => {
              const who = visit.userId === myId ? "You" : personName(history.people, visit.userId);
              const stay = formatDurationMs(durationMs) || "a moment";
              const href =
                visit.lat != null && visit.lng != null ? googleMapsLink(visit.lat, visit.lng) : null;
              const inner = (
                <>
                  <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{visit.placeName || "Unnamed place"}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock3 className="size-3" />
                      {who} · stayed {stay}
                    </p>
                  </div>
                </>
              );
              return href ? (
                <a
                  key={visit.id}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-start gap-3 rounded-lg bg-secondary/70 px-3 py-3 hover:bg-secondary"
                >
                  {inner}
                </a>
              ) : (
                <div key={visit.id} className="flex items-start gap-3 rounded-lg bg-secondary/70 px-3 py-3">
                  {inner}
                </div>
              );
            })
          )}
        </div>

        <div className="mt-6 space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Changes</p>
          {changeRows.length === 0 ? (
            <p className="rounded-lg bg-secondary px-3 py-3 text-sm text-muted-foreground">
              Nothing was changed this day.
            </p>
          ) : (
            <ol className="space-y-2">
              {changeRows.map((change) => {
                const name = change.actorId === myId ? "You" : personName(history.people, change.actorId);
                return (
                  <li key={change.id} className="rounded-lg bg-secondary/70 px-3 py-3">
                    <p className="text-sm">{describeChange(change, name)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{formatWhen(change.createdAt)}</p>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </section>
    </div>
  );
}

function Avatar({ name, src }: { name: string; src: string | null }) {
  if (src) {
    return (
      <img
        src={src}
        alt=""
        className="size-10 rounded-lg object-cover outline outline-1 -outline-offset-1 outline-foreground/15"
      />
    );
  }
  return (
    <div className="grid size-10 place-items-center rounded-lg bg-background font-display text-lg text-muted-foreground">
      {(name || "?").charAt(0)}
    </div>
  );
}
