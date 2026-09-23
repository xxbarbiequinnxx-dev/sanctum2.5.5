import { Bell, ChevronDown, ChevronUp } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { EmptyState, UrgencyControl } from "@/components/kind-page";
import { EntryForm } from "@/components/entry-form";
import { PdfStrip } from "@/components/pdf-field";
import { PointsBoardCard } from "@/components/points-board";
import { RichText } from "@/components/rich-text";
import { Button } from "@/components/ui/button";
import { deleteEntry, getDashboard, getMe, getPoints, reorderEntries, seedStarter, setUrgency, toggleEntry, updateEntry } from "@/lib/api";
import { greeting, roleLabel } from "@/lib/format";
import { canEditEntry, dutiesPaused, editDeniedCopy } from "@/lib/house";
import { fillSelectOptions, KINDS } from "@/lib/kinds";
import { subscribeMe } from "@/lib/me-sync";
import { useLiveReload } from "@/lib/live-sync";
import { reminderOf, reminderStorageKey, sortReminders, countdownReminder } from "@/lib/reminders";
import { styleLabel } from "@/lib/role-styles";
import { sortNamed, urgencyOf, type Urgency } from "@/lib/sort";
import { outcomeMessage } from "@/lib/stakes";
import type { Dashboard, Entry, Me, PointsBoard } from "@/lib/types";
import { cn } from "@/lib/utils";

export function HomeView() {
  const [me, setMe] = useState<Me | null>(null);
  const [dash, setDash] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Entry | null | undefined>(undefined);
  const [composeCadence, setComposeCadence] = useState("daily");
  const [now, setNow] = useState(() => new Date());

  const load = useCallback(async () => {
    try {
      const [mine, dashboard] = await Promise.all([
        getMe(),
        getDashboard(),
      ]);
      setMe(mine);
      setDash(dashboard as Dashboard);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load Sanctum.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => subscribeMe(setMe), []);
  useLiveReload(load);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(id);
  }, []);

  const allTasks = useMemo(() => {
    if (!dash) return [];
    const seen = new Set<number>();
    const out: Entry[] = [];
    for (const item of [
      ...dash.daily,
      ...dash.weekly,
      ...dash.once,
      ...dash.habits,
      ...(dash.custom ?? []),
      ...dash.training,
      ...(dash.timed ?? []),
    ]) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      out.push(item);
    }
    return out;
  }, [dash]);

  const reminders = useMemo(() => {
    if (dutiesPaused(me?.house)) return [];
    const clock = allTasks
      .map((item) => reminderOf(item, now))
      .filter((item): item is NonNullable<typeof item> => item != null);
    const counts = allTasks
      .map((item) => countdownReminder(item, now))
      .filter((item): item is NonNullable<typeof item> => item != null);
    return sortReminders([...clock, ...counts]);
  }, [allTasks, now, me?.house]);

  useEffect(() => {
    for (const item of reminders) {
      if (!item.overdue) continue;
      const key = reminderStorageKey(item.entry.id, now);
      if (typeof window === "undefined") continue;
      if (window.localStorage.getItem(key)) continue;
      window.localStorage.setItem(key, "1");
      toast.message(`Reminder · ${item.entry.title}`, { description: `Due at ${item.time}` });
      if ("Notification" in window && Notification.permission === "granted") {
        try {
          new Notification(item.entry.title, { body: `Due at ${item.time}` });
        } catch {
          // ignore
        }
      }
    }
  }, [reminders, now]);

  async function toggle(entry: Entry) {
    if (dutiesPaused(me?.house)) {
      toast.message("Vacation is on. Resume it to complete duties.");
      return;
    }
    try {
      const updated = await toggleEntry({
        data: { id: entry.id, done: entry.effectiveStatus !== "done" },
      });
      patchTask(updated);
      await refreshPoints();
      announceOutcome(entry, updated);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update.");
    }
  }

  async function skip(entry: Entry) {
    if (dutiesPaused(me?.house)) {
      toast.message("Vacation is on. Resume it to complete duties.");
      return;
    }
    if (entry.kind !== "task") return;
    try {
      const updated = await updateEntry({
        data: { id: entry.id, kind: "task", status: "skipped" },
      });
      patchTask(updated);
      await refreshPoints();
      announceOutcome(entry, updated);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not skip.");
    }
  }

  function openExisting(entry: Entry) {
    setComposeCadence(entry.cadence === "habit" ? "habit" : entry.cadence || "daily");
    setEditing(entry);
  }

  async function saveBody(entry: Entry, html: string) {
    if (!canEditEntry(me, entry)) {
      toast.message(editDeniedCopy(me, entry));
      return;
    }
    try {
      const updated = await updateEntry({
        data: { id: entry.id, kind: entry.kind, body: html },
      });
      patchTask(updated);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update.");
    }
  }

  async function archive(entry: Entry) {
    if (!canEditEntry(me, entry)) {
      toast.message(editDeniedCopy(me, entry));
      return;
    }
    try {
      const next = entry.status === "archived" ? "open" : "archived";
      await updateEntry({ data: { id: entry.id, kind: entry.kind, status: next } });
      toast.success(next === "archived" ? "Archived." : "Restored.");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not archive.");
    }
  }

  async function remove(entry: Entry) {
    if (!canEditEntry(me, entry)) {
      toast.message(editDeniedCopy(me, entry));
      return;
    }
    if (typeof window !== "undefined" && !window.confirm(`Delete “${entry.title}”? This cannot be undone.`)) {
      return;
    }
    try {
      await deleteEntry({ data: { id: entry.id } });
      toast.success("Deleted.");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete.");
    }
  }

  async function refreshPoints() {
    try {
      const board = await getPoints();
      setDash((prev) => (prev ? { ...prev, points: board } : prev));
    } catch {
      // points are secondary
    }
  }

  function patchTask(updated: Entry) {
    setDash((prev) => {
      if (!prev) return prev;
      const patch = (list: Entry[]) => list.map((item) => (item.id === updated.id ? updated : item));
      return {
        ...prev,
        daily: patch(prev.daily),
        weekly: patch(prev.weekly),
        once: patch(prev.once),
        habits: patch(prev.habits),
        custom: patch(prev.custom ?? []),
        training: patch(prev.training),
      };
    });
  }

  async function seed() {
    try {
      const result = await seedStarter();
      if (result.created === 0) toast.message("Entries are already in place.");
      else toast.success("A starter protocol is in place.");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not seed.");
    }
  }

  async function changeUrgency(entry: Entry, value: Urgency) {
    try {
      const updated = await setUrgency({ data: { id: entry.id, urgency: value } });
      patchTask(updated);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not set importance.");
    }
  }

  if (loading || !dash || !me?.profile) {
    return (
      <div className="space-y-4">
        <div className="h-24 animate-pulse rounded-xl bg-card" />
        <div className="h-40 animate-pulse rounded-xl bg-card" />
      </div>
    );
  }

  const profile = me.profile;
  const empty = Object.values(dash.counts).every((n) => n === 0);
  const dailyDone = dash.daily.filter((t) => t.effectiveStatus === "done").length;
  const weeklyDone = dash.weekly.filter((t) => t.effectiveStatus === "done").length;
  const names: Record<string, string> = {};
  names[profile.userId] = profile.displayName || "Me";
  if (me.partner) names[me.partner.userId] = me.partner.displayName || "Partner";
  names.both = "Both";
  const typeName = styleLabel(profile.role, profile.roleStyle);
  const partnerType = me.partner ? styleLabel(me.partner.role, me.partner.roleStyle) : "";
  const dailyItems = sortNamed(
    me.options.hideCompleted ? dash.daily.filter((item) => item.effectiveStatus !== "done") : dash.daily,
  );
  const weeklyItems = sortNamed(
    me.options.hideCompleted ? dash.weekly.filter((item) => item.effectiveStatus !== "done") : dash.weekly,
  );
  const onceItems = sortNamed(
    me.options.hideCompleted ? dash.once.filter((item) => item.effectiveStatus !== "done") : dash.once,
  );
  const habitItems = sortNamed(
    me.options.hideCompleted ? dash.habits.filter((item) => item.effectiveStatus !== "done") : dash.habits,
  );
  const customItems = sortNamed(
    me.options.hideCompleted
      ? (dash.custom ?? []).filter((item) => item.effectiveStatus !== "done")
      : (dash.custom ?? []),
  );
  const trainingItems = sortNamed(
    me.options.hideCompleted ? dash.training.filter((item) => item.effectiveStatus !== "done") : dash.training,
  );

  async function moveList(list: Entry[], entry: Entry, dir: -1 | 1) {
    const ids = list.map((item) => item.id);
    const index = ids.indexOf(entry.id);
    const next = index + dir;
    if (index < 0 || next < 0 || next >= ids.length) return;
    const swapped = [...ids];
    [swapped[index], swapped[next]] = [swapped[next], swapped[index]];
    try {
      await reorderEntries({ data: { ids: swapped } });
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not reorder.");
    }
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
            {greeting()} · {typeName ? `${typeName} · ` : ""}
            {roleLabel(profile.role)}
          </p>
          <h1 className="mt-1 font-display text-4xl font-medium sm:text-5xl">
            {profile.displayName || "Unnamed"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {me.partner
              ? `Bound to ${me.partner.displayName || "your partner"}, ${
                  partnerType ? `${partnerType.toLowerCase()} ` : ""
                }${roleLabel(me.partner.role).toLowerCase()}.`
              : profile.playMode === "companion"
                ? "Playing with the companion. These pages are only this house."
                : "Solo. These pages are only yours. The companion can talk, but cannot change them."}
          </p>
        </div>
        {empty ? (
          <Button variant="secondary" onClick={() => void seed()}>
            Load sample protocol
          </Button>
        ) : null}
      </header>

      {me.options.showReminders && !dutiesPaused(me.house) ? (
        <section className="rounded-xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 font-display text-2xl">
              <Bell className="size-5 text-primary" />
              Reminders
            </h2>
            <button
              type="button"
              className="text-xs text-muted-foreground"
              onClick={() => {
                if ("Notification" in window && Notification.permission === "default") {
                  void Notification.requestPermission();
                }
              }}
            >
              {typeof Notification !== "undefined" && Notification.permission === "granted"
                ? "Alerts on"
                : "Enable alerts"}
            </button>
          </div>
          {reminders.length ? (
            <div className="space-y-2">
              {reminders.map((item) => (
                <div
                  key={`${item.entry.id}:${item.mode}`}
                  className="flex items-center justify-between gap-3 rounded-lg bg-secondary/70 px-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{item.entry.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.time}
                      {item.weekdayLabel ? ` · ${item.weekdayLabel}` : ""}
                      {item.mode === "ends" ? " · until it ends" : item.mode === "starts" ? " · until it starts" : ""}
                      {item.entry.kind === "rabbit" ? " · training" : item.entry.cadence === "habit" ? " · habit" : ` · ${item.entry.kind}`}
                      {item.entry.kind === "task" && urgencyOf(item.entry.meta) !== "normal"
                        ? ` · ${urgencyOf(item.entry.meta)}`
                        : ""}
                      {item.overdue ? " · overdue" : item.upcoming ? " · soon" : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button size="sm" onClick={() => void toggle(item.entry)}>
                      Done
                    </Button>
                    {item.entry.kind === "task" ? (
                      <Button size="sm" variant="ghost" onClick={() => void skip(item.entry)}>
                        Skip
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No timed reminders yet. Add a clock time on a task, or days/hours/minutes on a task, challenge, punishment, reward, scene, roleplay, or game.
            </p>
          )}
        </section>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2">
        <TaskColumn
          title="Daily"
          kicker={dutiesPaused(me.house) ? "Paused" : `${dailyDone}/${dash.daily.length} complete`}
          items={dailyItems}
          empty="No daily tasks yet. Add them from the Tasks category."
          names={names}
          paused={dutiesPaused(me.house)}
          me={me}
          onToggle={(entry) => void toggle(entry)}
          onSkip={(entry) => void skip(entry)}
          onBody={(entry, html) => void saveBody(entry, html)}
          onOpen={(entry) => openExisting(entry)}
          onArchive={(entry) => void archive(entry)}
          onDelete={(entry) => void remove(entry)}
          onMove={(entry, dir) => void moveList(dailyItems, entry, dir)}
          onUrgency={(entry, value) => void changeUrgency(entry, value)}
        />
        <TaskColumn
          title="Weekly"
          kicker={dutiesPaused(me.house) ? "Paused" : `${weeklyDone}/${dash.weekly.length} complete`}
          items={weeklyItems}
          empty="No weekly tasks yet."
          names={names}
          paused={dutiesPaused(me.house)}
          me={me}
          onToggle={(entry) => void toggle(entry)}
          onSkip={(entry) => void skip(entry)}
          onBody={(entry, html) => void saveBody(entry, html)}
          onOpen={(entry) => openExisting(entry)}
          onArchive={(entry) => void archive(entry)}
          onDelete={(entry) => void remove(entry)}
          onMove={(entry, dir) => void moveList(weeklyItems, entry, dir)}
          onUrgency={(entry, value) => void changeUrgency(entry, value)}
        />
      </section>

      {habitItems.length ? (
        <section className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-2xl">Habits</h2>
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
              {dutiesPaused(me.house)
                ? "Paused"
                : `${dash.habits.filter((t) => t.effectiveStatus === "done").length}/${dash.habits.length} complete`}
            </p>
          </div>
          <div className="space-y-2">
            {habitItems.map((item, index) => (
              <TaskRow
                key={item.id}
                entry={item}
                names={names}
                paused={dutiesPaused(me.house)}
                canEdit={canEditEntry(me, item)}
                onToggle={() => void toggle(item)}
                onSkip={() => void skip(item)}
                onBody={canEditEntry(me, item) ? (html) => void saveBody(item, html) : undefined}
                onOpen={() => openExisting(item)}
                onArchive={() => void archive(item)}
                onDelete={() => void remove(item)}
                onMoveUp={index === 0 ? undefined : () => void moveList(habitItems, item, -1)}
                onMoveDown={index === habitItems.length - 1 ? undefined : () => void moveList(habitItems, item, 1)}
                onUrgency={(value) => void changeUrgency(item, value)}
              />
            ))}
          </div>
        </section>
      ) : null}

      {customItems.length ? (
        <section className="space-y-3">
          <h2 className="font-display text-2xl">Custom days</h2>
          <div className="space-y-2">
            {customItems.map((item, index) => (
              <TaskRow
                key={item.id}
                entry={item}
                names={names}
                paused={dutiesPaused(me.house)}
                canEdit={canEditEntry(me, item)}
                onToggle={() => void toggle(item)}
                onSkip={() => void skip(item)}
                onBody={canEditEntry(me, item) ? (html) => void saveBody(item, html) : undefined}
                onOpen={() => openExisting(item)}
                onArchive={() => void archive(item)}
                onDelete={() => void remove(item)}
                onMoveUp={index === 0 ? undefined : () => void moveList(customItems, item, -1)}
                onMoveDown={index === customItems.length - 1 ? undefined : () => void moveList(customItems, item, 1)}
                onUrgency={(value) => void changeUrgency(item, value)}
              />
            ))}
          </div>
        </section>
      ) : null}

      {onceItems.length ? (
        <section className="space-y-3">
          <h2 className="font-display text-2xl">One-time</h2>
          <div className="space-y-2">
            {onceItems.map((item, index) => (
              <TaskRow
                key={item.id}
                entry={item}
                names={names}
                paused={dutiesPaused(me.house)}
                canEdit={canEditEntry(me, item)}
                onToggle={() => void toggle(item)}
                onSkip={() => void skip(item)}
                onBody={canEditEntry(me, item) ? (html) => void saveBody(item, html) : undefined}
                onOpen={() => openExisting(item)}
                onArchive={() => void archive(item)}
                onDelete={() => void remove(item)}
                onMoveUp={index === 0 ? undefined : () => void moveList(onceItems, item, -1)}
                onMoveDown={index === onceItems.length - 1 ? undefined : () => void moveList(onceItems, item, 1)}
                onUrgency={(value) => void changeUrgency(item, value)}
              />
            ))}
          </div>
        </section>
      ) : null}

      {trainingItems.length ? (
        <section className="space-y-3">
          <h2 className="font-display text-2xl">Training</h2>
          <div className="space-y-2">
            {trainingItems.map((item, index) => (
              <TaskRow
                key={item.id}
                entry={item}
                names={names}
                paused={dutiesPaused(me.house)}
                canEdit={canEditEntry(me, item)}
                onToggle={() => void toggle(item)}
                onSkip={() => undefined}
                onBody={canEditEntry(me, item) ? (html) => void saveBody(item, html) : undefined}
                onOpen={() => openExisting(item)}
                onArchive={() => void archive(item)}
                onDelete={() => void remove(item)}
                onMoveUp={index === 0 ? undefined : () => void moveList(trainingItems, item, -1)}
                onMoveDown={index === trainingItems.length - 1 ? undefined : () => void moveList(trainingItems, item, 1)}
              />
            ))}
          </div>
        </section>
      ) : null}

      {dash.archived?.length ? (
        <section className="space-y-3">
          <h2 className="font-display text-2xl">Archived</h2>
          <div className="space-y-2">
            {dash.archived.map((item) => (
              <TaskRow
                key={item.id}
                entry={item}
                names={names}
                archivedMode
                canEdit={canEditEntry(me, item)}
                onToggle={() => undefined}
                onSkip={() => undefined}
                onOpen={() => openExisting(item)}
                onArchive={() => void archive(item)}
                onDelete={() => void remove(item)}
              />
            ))}
          </div>
        </section>
      ) : null}

      {empty ? (
        <EmptyState
          title="Sanctum is quiet"
          body="Load a sample protocol, or start writing tasks, training, punishments, and rewards yourselves."
          action="Load sample protocol"
          onAction={() => void seed()}
        />
      ) : null}

      <PointsBoardCard
        me={me}
        board={dash.points}
        onChange={(board: PointsBoard) => setDash((prev) => (prev ? { ...prev, points: board } : prev))}
      />

      <EntryForm
        config={fillSelectOptions(KINDS.task)}
        entry={editing ?? undefined}
        open={editing !== undefined}
        defaultCadence={composeCadence}
        addLabel={composeCadence === "habit" ? "New habit" : "New task"}
        readOnly={Boolean(editing && !canEditEntry(me, editing))}
        onOpenChange={(open) => {
          if (!open) setEditing(undefined);
        }}
        onSaved={() => void load()}
      />
    </div>
  );
}

function announceOutcome(previous: Entry, next: Entry) {
  const note = outcomeMessage(previous, next);
  if (!note) return;
  if (note.tone === "success") toast.success(note.text);
  else toast.message(note.text);
}

function TaskColumn({
  title,
  kicker,
  items,
  empty,
  names,
  paused,
  me,
  onToggle,
  onSkip,
  onBody,
  onOpen,
  onArchive,
  onDelete,
  onMove,
  onUrgency,
}: {
  title: string;
  kicker: string;
  items: Entry[];
  empty: string;
  names: Record<string, string>;
  paused?: boolean;
  me: Me;
  onToggle: (entry: Entry) => void;
  onSkip: (entry: Entry) => void;
  onBody: (entry: Entry, html: string) => void;
  onOpen: (entry: Entry) => void;
  onArchive: (entry: Entry) => void;
  onDelete: (entry: Entry) => void;
  onMove?: (entry: Entry, dir: -1 | 1) => void;
  onUrgency?: (entry: Entry, value: Urgency) => void;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="font-display text-2xl">{title}</h2>
        <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{kicker}</p>
      </div>
      {items.length === 0 ? (
        <p className="py-6 text-sm text-muted-foreground">{empty}</p>
      ) : (
        <div className="space-y-2">
          {items.map((item, index) => {
            const editable = canEditEntry(me, item);
            return (
              <TaskRow
                key={item.id}
                entry={item}
                names={names}
                paused={paused}
                canEdit={editable}
                onToggle={() => onToggle(item)}
                onSkip={() => onSkip(item)}
                onBody={editable ? (html) => onBody(item, html) : undefined}
                onOpen={() => onOpen(item)}
                onArchive={() => onArchive(item)}
                onDelete={() => onDelete(item)}
                onMoveUp={index === 0 ? undefined : () => onMove?.(item, -1)}
                onMoveDown={index === items.length - 1 ? undefined : () => onMove?.(item, 1)}
                onUrgency={editable && onUrgency ? (value) => onUrgency(item, value) : undefined}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}

function TaskRow({
  entry,
  names,
  paused,
  archivedMode,
  canEdit,
  onToggle,
  onSkip,
  onBody,
  onOpen,
  onArchive,
  onDelete,
  onMoveUp,
  onMoveDown,
  onUrgency,
}: {
  entry: Entry;
  names: Record<string, string>;
  paused?: boolean;
  archivedMode?: boolean;
  canEdit?: boolean;
  onToggle: () => void;
  onSkip: () => void;
  onBody?: (html: string) => void;
  onOpen?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onUrgency?: (value: Urgency) => void;
}) {
  const done = entry.effectiveStatus === "done";
  const skipped = entry.status === "skipped" && !done;
  const assignee =
    entry.assignedTo === "both"
      ? "Both"
      : entry.assignedTo
        ? names[entry.assignedTo] ?? null
        : null;
  return (
    <div className="flex items-start gap-3 rounded-lg bg-secondary/60 p-3">
      {archivedMode ? null : (
        <button
          type="button"
          onClick={onToggle}
          disabled={paused}
          className={cn(
            "mt-0.5 size-6 shrink-0 rounded-full border",
            done ? "border-primary bg-primary" : "border-input",
            paused && "opacity-40",
          )}
          aria-label={paused ? "Paused" : done ? "Reopen" : "Mark done"}
        />
      )}
      <div className="min-w-0 flex-1">
        <button type="button" onClick={onOpen} className="block w-full text-left">
          <p className={cn("text-sm font-medium", done && "text-muted-foreground line-through")}>
            {entry.title}
          </p>
        </button>
        {entry.body ? (
          <RichText html={entry.body} clamp={!onBody} className="mt-0.5 text-xs" onChange={onBody} />
        ) : null}
        {entry.pdfs?.length ? <PdfStrip pdfs={entry.pdfs} className="mt-2" /> : null}
        <p className="mt-1 text-xs uppercase tracking-[0.12em] text-muted-foreground">
          {assignee ? `For ${assignee}` : null}
          {entry.meta.points ? ` · ${entry.meta.points} pts` : ""}
          {entry.kind === "task" && urgencyOf(entry.meta) !== "normal" ? ` · ${urgencyOf(entry.meta)}` : ""}
          {entry.meta.reminderEnabled === "1" && entry.meta.reminderTime
            ? ` · ${entry.meta.reminderTime}`
            : ""}
          {skipped ? " · skipped" : ""}
          {paused ? " · paused" : ""}
          {archivedMode ? " · archived" : ""}
        </p>
        {onUrgency ? (
          <div className="mt-2">
            <UrgencyControl value={urgencyOf(entry.meta)} onChange={onUrgency} />
          </div>
        ) : null}
        {entry.meta.catalogTitles ? (
          <p className="mt-1 text-xs text-muted-foreground">Using {entry.meta.catalogTitles}</p>
        ) : null}
        {entry.meta.rewardTitles || entry.meta.punishmentTitles ? (
          <p className="mt-1 text-xs text-muted-foreground">
            {entry.meta.rewardTitles ? `Earns ${entry.meta.rewardTitles}` : ""}
            {entry.meta.rewardTitles && entry.meta.punishmentTitles ? " · " : ""}
            {entry.meta.punishmentTitles ? `Skip: ${entry.meta.punishmentTitles}` : ""}
          </p>
        ) : null}
        <div className="mt-1 flex flex-wrap gap-3">
          {!archivedMode && !done && !skipped && !paused && entry.kind === "task" ? (
            <button type="button" className="h-9 text-xs text-muted-foreground" onClick={onSkip}>
              Skip
            </button>
          ) : null}
          {canEdit ? (
            <>
              {onMoveUp || onMoveDown ? (
                <span className="inline-flex">
                  <button
                    type="button"
                    className="grid size-9 place-items-center text-muted-foreground disabled:opacity-30"
                    onClick={onMoveUp}
                    disabled={!onMoveUp}
                    aria-label="Move up"
                  >
                    <ChevronUp className="size-4" />
                  </button>
                  <button
                    type="button"
                    className="grid size-9 place-items-center text-muted-foreground disabled:opacity-30"
                    onClick={onMoveDown}
                    disabled={!onMoveDown}
                    aria-label="Move down"
                  >
                    <ChevronDown className="size-4" />
                  </button>
                </span>
              ) : null}
              <button type="button" className="h-9 text-xs text-muted-foreground" onClick={onOpen}>
                Edit
              </button>
              <button type="button" className="h-9 text-xs text-muted-foreground" onClick={onArchive}>
                {archivedMode ? "Restore" : "Archive"}
              </button>
              <button type="button" className="h-9 text-xs text-muted-foreground" onClick={onDelete}>
                Delete
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
