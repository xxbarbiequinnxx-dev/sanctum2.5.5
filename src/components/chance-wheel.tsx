import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ChanceWheel({
  title,
  copy,
  slices,
  extras = [],
  empty = "Add a few items, then spin.",
  canEdit = false,
  onAddExtra,
  onRemoveExtra,
}: {
  title: string;
  copy: string;
  slices: string[];
  extras?: string[];
  empty?: string;
  canEdit?: boolean;
  onAddExtra?: (label: string) => void;
  onRemoveExtra?: (label: string) => void;
}) {
  const [angle, setAngle] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const labels = slices.length ? slices : ["Add items first"];
  const slice = 360 / labels.length;
  const showLabels = labels.length >= 2 && labels.length <= 12;

  const gradient = useMemo(
    () =>
      labels
        .map((_, i) => {
          const color = i % 2 === 0 ? "var(--color-raised)" : "var(--color-primary)";
          return `${color} ${i * slice}deg ${(i + 1) * slice}deg`;
        })
        .join(", "),
    [labels, slice],
  );

  function spin() {
    if (spinning || !slices.length) return;
    setSpinning(true);
    setResult(null);
    const index = Math.floor(Math.random() * labels.length);
    const target = 360 - index * slice - slice / 2;
    setAngle((prev) => {
      const current = ((prev % 360) + 360) % 360;
      const delta = (target - current + 360) % 360;
      return prev + 6 * 360 + delta;
    });
    window.setTimeout(() => {
      setResult(labels[index] ?? null);
      setSpinning(false);
    }, 2400);
  }

  function add() {
    const label = draft.trim();
    if (!label || !onAddExtra) return;
    onAddExtra(label);
    setDraft("");
  }

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <h2 className="font-display text-2xl">{title}</h2>
      <p className="mb-4 text-sm text-muted-foreground">{copy}</p>
      <div className="relative mx-auto size-56">
        <div
          className="size-full rounded-full border border-border"
          style={{
            background: `conic-gradient(${gradient})`,
            transform: `rotate(${angle}deg)`,
            transition: spinning ? "transform 2.3s cubic-bezier(0.22, 1, 0.36, 1)" : "none",
          }}
        >
          {showLabels
            ? labels.map((label, i) => {
                const mid = i * slice + slice / 2;
                return (
                  <span
                    key={`${label}-${i}`}
                    className="pointer-events-none absolute top-1/2 left-1/2 w-[4.4rem] origin-left -translate-y-1/2 text-center text-[10px] leading-tight text-foreground"
                    style={{ transform: `rotate(${mid - 90}deg) translate(2.6rem)` }}
                  >
                    {label.slice(0, 18)}
                  </span>
                );
              })
            : null}
        </div>
        <div className="absolute top-1/2 left-1/2 size-8 -translate-x-1/2 -translate-y-1/2 rounded-full border border-border bg-background" />
        <div className="absolute -top-1 left-1/2 h-6 w-0 -translate-x-1/2 border-x-8 border-b-[14px] border-x-transparent border-b-primary" />
      </div>
      <p className="mt-4 min-h-6 text-center font-display text-xl">
        {result ?? (slices.length ? " " : empty)}
      </p>
      <Button className="mt-3 w-full" onClick={spin} disabled={spinning || !slices.length}>
        {spinning ? "Spinning…" : "Spin"}
      </Button>
      {canEdit && onAddExtra ? (
        <div className="mt-4 space-y-2 border-t border-border pt-3">
          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Wheel extras</p>
          <div className="flex gap-2">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Add a slice"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  add();
                }
              }}
            />
            <Button type="button" variant="outline" onClick={add} disabled={!draft.trim()}>
              Add
            </Button>
          </div>
          {extras.length ? (
            <ul className="space-y-1">
              {extras.map((item) => (
                <li key={item} className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate">{item}</span>
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => onRemoveExtra?.(item)}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">Page entries spin too. Add extra slices here.</p>
          )}
        </div>
      ) : null}
    </section>
  );
}
