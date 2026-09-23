import { Pause, Play } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { saveVacation } from "@/lib/api";
import { dutiesPaused } from "@/lib/house";
import { broadcastMe } from "@/lib/me-sync";
import type { Me } from "@/lib/types";
import { cn } from "@/lib/utils";

async function persist(on: boolean, onChange: (me: Me) => void) {
  const next = await saveVacation({ data: { on } });
  broadcastMe(next);
  onChange(next);
  toast.success(on ? "Vacation started. Duties are paused." : "Vacation ended. Duties are live again.");
  return next;
}

export function VacationToggle({
  me,
  onChange,
  compact = false,
}: {
  me: Me;
  onChange: (me: Me) => void;
  compact?: boolean;
}) {
  const on = dutiesPaused(me.house);
  const [busy, setBusy] = useState(false);

  async function setOn(next: boolean) {
    setBusy(true);
    try {
      await persist(next, onChange);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update vacation.");
    } finally {
      setBusy(false);
    }
  }

  if (compact) {
    return (
      <button
        type="button"
        disabled={busy}
        onClick={() => void setOn(!on)}
        className={cn(
          "flex min-h-12 w-full items-center justify-between rounded-lg px-3 py-2 text-sm",
          on ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground",
        )}
      >
        <span className="flex min-w-0 items-center gap-2 text-left">
          {on ? <Play className="size-4 shrink-0" /> : <Pause className="size-4 shrink-0" />}
          <span className="min-w-0">
            <span className="block">Vacation</span>
            <span className="block text-xs opacity-80">
              {on ? "Duties paused" : "Pause tasks, habits, training"}
            </span>
          </span>
        </span>
        <span className="text-xs opacity-80">{on ? "On" : "Off"}</span>
      </button>
    );
  }

  return (
    <div className="grid grid-cols-2 rounded-lg bg-background p-1">
      <button
        type="button"
        disabled={busy}
        onClick={() => void setOn(true)}
        className={cn("h-10 rounded-md text-sm", on ? "bg-primary text-primary-foreground" : "text-muted-foreground")}
      >
        Pause
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => void setOn(false)}
        className={cn("h-10 rounded-md text-sm", !on ? "bg-primary text-primary-foreground" : "text-muted-foreground")}
      >
        Live
      </button>
    </div>
  );
}

export function VacationBanner({ me, onChange }: { me: Me; onChange: (me: Me) => void }) {
  const [busy, setBusy] = useState(false);
  if (!dutiesPaused(me.house)) return null;
  return (
    <div className="border-b border-border bg-primary/15">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2">
        <p className="flex min-w-0 items-center gap-2 text-sm">
          <Pause className="size-4 shrink-0 text-primary" />
          <span className="truncate">On vacation — tasks, habits, training, and protocols are paused.</span>
        </p>
        <button
          type="button"
          disabled={busy}
          className="flex h-9 shrink-0 items-center gap-1.5 rounded-md border border-border px-3 text-sm"
          onClick={() => {
            setBusy(true);
            void persist(false, onChange).catch((err) => {
              toast.error(err instanceof Error ? err.message : "Could not resume.");
            }).finally(() => setBusy(false));
          }}
        >
          <Play className="size-4" />
          {busy ? "Resuming…" : "Resume"}
        </button>
      </div>
    </div>
  );
}
