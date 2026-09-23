import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { KindPage } from "@/components/kind-page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createEntry, getMe, listEntries, toggleEntry } from "@/lib/api";
import { challengesFor, monthKey, monthLabel } from "@/lib/challenges";
import { canMutate } from "@/lib/house";
import type { Entry, Me } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useLiveReload } from "@/lib/live-sync";

export function ChallengesView() {
  const [me, setMe] = useState<Me | null>(null);
  const [rows, setRows] = useState<Entry[]>([]);
  const [busy, setBusy] = useState(false);
  const month = monthKey();

  const load = useCallback(async () => {
    const [mine, list] = await Promise.all([getMe(), listEntries({ data: { kind: "challenge" } })]);
    setMe(mine);
    const mineMonth = list.filter((item: Entry) => item.meta.month === month);
    setRows(mineMonth);
    return { mine, list: mineMonth };
  }, [month]);

  useEffect(() => {
    void load().catch((err) => {
      toast.error(err instanceof Error ? err.message : "Could not load challenges.");
    });
  }, [load]);
  useLiveReload(load);

  async function seed() {
    if (!me?.profile) return;
    setBusy(true);
    try {
      const items = challengesFor(me.profile.role, month);
      for (const item of items) {
        await createEntry({
          data: {
            kind: "challenge",
            title: `Day ${item.day} · ${item.title}`,
            body: item.title,
            cadence: "daily",
            status: "open",
            meta: { month, day: String(item.day) },
          },
        });
      }
      toast.success("This month's challenges are ready.");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not set the month.");
    } finally {
      setBusy(false);
    }
  }

  async function toggle(entry: Entry) {
    try {
      const updated = await toggleEntry({ data: { id: entry.id, done: entry.effectiveStatus !== "done" } });
      setRows((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update.");
    }
  }

  const today = new Date().getDate();
  const done = rows.filter((item) => item.effectiveStatus === "done").length;
  const todayRow = rows.find((item) => Number(item.meta.day) === today);
  const allowed = canMutate(me, "challenge");

  const ordered = useMemo(
    () => [...rows].sort((a, b) => Number(a.meta.day ?? 0) - Number(b.meta.day ?? 0)),
    [rows],
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">The month</p>
          <h1 className="mt-1 font-display text-4xl font-medium">Challenges</h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Daily practice for {monthLabel(month)}, plus challenges you assign each other.
          </p>
        </div>
        {rows.length ? (
          <Badge>
            {done}/{rows.length} kept
          </Badge>
        ) : allowed ? (
          <Button onClick={() => void seed()} disabled={busy}>
            {busy ? "Setting…" : "Set this month"}
          </Button>
        ) : null}
      </header>

      {todayRow ? (
        <section className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Today · Day {today}</p>
          <h2 className="mt-2 font-display text-2xl">{todayRow.body || todayRow.title}</h2>
          <Button
            className="mt-4"
            variant={todayRow.effectiveStatus === "done" ? "secondary" : "default"}
            onClick={() => void toggle(todayRow)}
          >
            {todayRow.effectiveStatus === "done" ? "Done — reopen" : "Mark done"}
          </Button>
        </section>
      ) : null}

      {ordered.length ? (
        <ol className="space-y-2">
          {ordered.map((item) => {
            const day = Number(item.meta.day ?? 0);
            const isToday = day === today;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => void toggle(item)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left",
                    item.effectiveStatus === "done"
                      ? "border-border bg-secondary/50 text-muted-foreground"
                      : isToday
                        ? "border-primary bg-primary/10"
                        : "border-border bg-card",
                  )}
                >
                  <span className="w-8 shrink-0 font-display text-xl tabular-nums">{day}</span>
                  <span className="min-w-0 flex-1 text-sm">{item.body || item.title}</span>
                  <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                    {item.effectiveStatus === "done" ? "Kept" : isToday ? "Today" : "Open"}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="rounded-xl border border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
          Set the month for a daily practice, or assign a challenge to your partner below.
        </p>
      )}

      <section className="space-y-3">
        <div>
          <h2 className="font-display text-2xl">Assigned</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {me?.partner
              ? `Give ${me.partner.displayName || "your partner"} — or both of you — a challenge to keep.`
              : "Connect a partner to assign challenges to each other. You can still write one for yourself."}
          </p>
        </div>
        <KindPage kind="challenge" hideHeader entryFilter={(entry) => !entry.meta.month} />
      </section>
    </div>
  );
}
