import { Minus, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adjustPoints } from "@/lib/api";
import { formatWhen } from "@/lib/format";
import type { Me, PointsBoard } from "@/lib/types";

export function PointsBoardCard({
  me,
  board,
  onChange,
}: {
  me: Me;
  board: PointsBoard;
  onChange: (next: PointsBoard) => void;
}) {
  const profile = me.profile;
  const [reason, setReason] = useState("");
  const [amount, setAmount] = useState("5");
  const [busy, setBusy] = useState(false);
  if (!profile) return null;

  async function move(userId: string, sign: 1 | -1) {
    const n = Math.trunc(Number(amount));
    if (!Number.isFinite(n) || n === 0) {
      toast.error("Enter a point amount.");
      return;
    }
    setBusy(true);
    try {
      const next = await adjustPoints({
        data: {
          userId,
          delta: sign * Math.abs(n),
          reason: reason.trim() || undefined,
        },
      });
      onChange(next);
      setReason("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not adjust points.");
    } finally {
      setBusy(false);
    }
  }

  const submissive =
    profile.role === "submissive"
      ? { id: profile.userId, name: profile.displayName || "You", score: board.mine }
      : me.partner?.role === "submissive"
        ? {
            id: me.partner.userId,
            name: me.partner.displayName || "Partner",
            score: board.partner ?? 0,
          }
        : null;

  return (
    <section id="home-points" className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="font-display text-2xl">Points</h2>
        <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
          {submissive ? `${submissive.name}'s total` : "Connect a Submissive to keep a total"}
        </p>
      </div>
      {submissive ? (
        <div className="rounded-lg bg-secondary/70 p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
            {profile.role === "submissive" ? "Your total" : submissive.name}
          </p>
          <p className="mt-1 font-display text-5xl tabular-nums">{submissive.score}</p>
          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => void move(submissive.id, 1)}
            >
              <Plus />
              Add
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => void move(submissive.id, -1)}
            >
              <Minus />
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Points are kept as a single total for the Submissive, visible to both of you once you connect.
        </p>
      )}
      <div className="mt-3 grid gap-2 sm:grid-cols-[5.5rem_1fr]">
        <Input
          type="number"
          inputMode="numeric"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          aria-label="Point amount"
        />
        <Input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason (optional)"
          maxLength={160}
        />
      </div>
      {board.ledger.length ? (
        <ul className="mt-4 space-y-1.5 text-sm">
          {board.ledger.slice(0, 6).map((event) => {
            const who =
              event.userId === profile.userId
                ? profile.displayName || "You"
                : me.partner?.userId === event.userId
                  ? me.partner.displayName || "Partner"
                  : "Bond";
            return (
              <li key={event.id} className="flex items-baseline justify-between gap-3 text-muted-foreground">
                <span className="min-w-0 truncate">
                  <span className={event.delta >= 0 ? "text-foreground" : "text-primary"}>
                    {event.delta >= 0 ? "+" : ""}
                    {event.delta}
                  </span>{" "}
                  {who}
                  {event.reason ? ` · ${event.reason}` : ""}
                </span>
                <span className="shrink-0 text-[11px]">{formatWhen(event.createdAt)}</span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">No points moved yet. Completing a task can award them, or add some by hand.</p>
      )}
    </section>
  );
}
