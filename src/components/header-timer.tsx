import { Timer } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PRESETS = [60, 180, 300, 600, 900];

function format(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function HeaderTimer() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [total, setTotal] = useState(300);
  const [left, setLeft] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const endRef = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      const end = endRef.current;
      if (!end) return;
      const remain = Math.max(0, Math.ceil((end - Date.now()) / 1000));
      setLeft(remain);
      if (remain <= 0) {
        setRunning(false);
        endRef.current = null;
      }
    }, 200);
    return () => window.clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (!open) return;
    function onDoc(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  function start() {
    const duration = left && left > 0 ? left : total;
    endRef.current = Date.now() + duration * 1000;
    setLeft(duration);
    setRunning(true);
    setOpen(false);
  }

  function pause() {
    setRunning(false);
    endRef.current = null;
  }

  function reset() {
    setRunning(false);
    endRef.current = null;
    setLeft(null);
  }

  const display = left ?? total;
  const active = left != null;
  const done = left === 0 && !running;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-10 items-center gap-1.5 rounded-l-full px-3 text-sm",
          open || running || done
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
        aria-label="Timer"
      >
        <Timer className="size-4" />
        <span className="tabular-nums">
          {active || running ? format(display) : <span className="hidden sm:inline">Timer</span>}
        </span>
      </button>
      {open ? (
        <div className="absolute top-12 right-0 z-50 w-64 rounded-xl border border-border bg-popover p-3 shadow-soft">
          <p className="text-center font-display text-3xl tabular-nums">{format(display)}</p>
          <div className="mt-3 flex flex-wrap gap-1">
            {PRESETS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => {
                  setTotal(n);
                  if (!running) setLeft(null);
                }}
                className={cn(
                  "h-8 rounded-full px-2.5 text-xs",
                  total === n && !running
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground",
                )}
              >
                {n < 60 ? `${n}s` : `${n / 60}m`}
              </button>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {running ? (
              <Button size="sm" variant="secondary" onClick={pause}>
                Pause
              </Button>
            ) : (
              <Button size="sm" onClick={start}>
                Start
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={reset}>
              Reset
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
