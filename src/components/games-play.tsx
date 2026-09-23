import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { KindPage } from "@/components/kind-page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getMe, listEntries, savePlay } from "@/lib/api";
import { DEFAULT_PLAY, canMutate } from "@/lib/house";
import { parseLineList } from "@/lib/game-deck";
import { KINDS } from "@/lib/kinds";
import { subscribeMe } from "@/lib/me-sync";
import { useLiveReload } from "@/lib/live-sync";
import type { Entry, Me, PlayCard as PlayCardType, PlaySettings } from "@/lib/types";
import { cn } from "@/lib/utils";

export function GamesPlay() {
  const [me, setMe] = useState<Me | null>(null);
  const [catalog, setCatalog] = useState<Entry[]>([]);
  const [editing, setEditing] = useState<"wheel" | "draw" | "dice" | "timer" | null>(null);

  async function load() {
    try {
      const [mine, shelf] = await Promise.all([getMe(), listEntries({ data: { kind: "catalog" } })]);
      setMe(mine);
      setCatalog(shelf);
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    void load();
  }, []);
  useEffect(() => subscribeMe(setMe), []);
  useLiveReload(load);

  const play = me?.house.play ?? DEFAULT_PLAY;
  const canEditGames = canMutate(me, "game");

  async function persist(next: Partial<PlaySettings>) {
    try {
      const updated = await savePlay({ data: { play: { ...play, ...next } } });
      setMe(updated);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save the game.");
    }
  }

  return (
    <div className="space-y-10">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">Play</p>
        <h1 className="mt-1 font-display text-4xl font-medium">Games</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Edit the built-in games the same way you write a new one — title, rules, cards, prompts, and catalogue pieces. Then add games you can buy with points.
        </p>
      </header>
      <div className="grid gap-3 lg:grid-cols-2">
        <Wheel play={play} catalog={catalog} onEdit={canEditGames ? () => setEditing("wheel") : undefined} />
        <Draw play={play} catalog={catalog} onEdit={canEditGames ? () => setEditing("draw") : undefined} />
        <Dice play={play} catalog={catalog} onEdit={canEditGames ? () => setEditing("dice") : undefined} />
        <Timer play={play} onEdit={canEditGames ? () => setEditing("timer") : undefined} />
      </div>
      <div>
        <h2 className="font-display text-2xl">Your games</h2>
        <p className="mb-4 mt-1 text-sm text-muted-foreground">
          Add cards and prompts, then mark catalogue items as a prop, a card, or a prompt. Draw to randomise. Set a points cost to let the Submissive buy a game.
        </p>
        <KindPage kind="game" hideHeader />
      </div>
      {editing ? (
        <BuiltinEditor
          kind={editing}
          play={play}
          catalog={catalog}
          open
          onOpenChange={(open) => {
            if (!open) setEditing(null);
          }}
          onSave={(next) => {
            void persist(next);
            setEditing(null);
          }}
        />
      ) : null}
    </div>
  );
}

function catalogTitles(ids: string[], catalog: Entry[]) {
  return ids
    .map((id) => catalog.find((item) => String(item.id) === id)?.title)
    .filter((item): item is string => Boolean(item));
}

function Wheel({
  play,
  catalog,
  onEdit,
}: {
  play: PlaySettings;
  catalog: Entry[];
  onEdit?: () => void;
}) {
  const [angle, setAngle] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const labels = [
    ...play.wheelSlices,
    ...play.wheelPrompts,
    ...catalogTitles(play.wheelCatalogIds, catalog),
  ].filter(Boolean);
  const slices = labels.length ? labels : ["Add slices first"];
  const slice = 360 / slices.length;

  function spin() {
    if (spinning || !labels.length) return;
    setSpinning(true);
    const index = Math.floor(Math.random() * labels.length);
    const turns = 6;
    const next = turns * 360 + (360 - index * slice - slice / 2);
    setAngle(next);
    window.setTimeout(() => {
      setResult(labels[index] ?? null);
      setSpinning(false);
    }, 2400);
  }

  const gradient = slices
    .map((_, i) => {
      const color = i % 2 === 0 ? "var(--color-raised)" : "var(--color-primary)";
      return `${color} ${i * slice}deg ${(i + 1) * slice}deg`;
    })
    .join(", ");

  return (
    <PlayShell title={play.wheelTitle} copy={play.wheelBody || "Spin for a beat of the evening."} onEdit={onEdit}>
      <div className="relative mx-auto size-52">
        <div
          className="size-full rounded-full border border-border shadow-inner"
          style={{
            background: `conic-gradient(${gradient})`,
            transform: `rotate(${angle}deg)`,
            transition: spinning ? "transform 2.3s cubic-bezier(0.22, 1, 0.36, 1)" : "none",
          }}
        />
        <div className="absolute top-1/2 left-1/2 size-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-background" />
        <div className="absolute -top-1 left-1/2 h-6 w-0 -translate-x-1/2 border-x-8 border-b-[14px] border-x-transparent border-b-primary" />
      </div>
      <p className="mt-4 min-h-6 text-center font-display text-xl">{result ?? " "}</p>
      <Button className="mt-3 w-full" onClick={spin} disabled={spinning || !labels.length}>
        {spinning ? "Spinning…" : "Spin"}
      </Button>
    </PlayShell>
  );
}

function Draw({
  play,
  catalog,
  onEdit,
}: {
  play: PlaySettings;
  catalog: Entry[];
  onEdit?: () => void;
}) {
  const [card, setCard] = useState<PlayCardType | null>(null);
  const [flipped, setFlipped] = useState(false);
  const extras = [
    ...play.drawPrompts.map((line) => {
      const [title, ...rest] = line.split("—");
      return { title: (title ?? "Prompt").trim(), body: rest.join("—").trim() };
    }),
    ...catalogTitles(play.drawCatalogIds, catalog).map((title) => ({ title, body: "From the catalogue" })),
  ];

  function draw() {
    const deck = [...play.drawCards, ...extras];
    if (!deck.length) {
      setCard({ title: "Empty deck", body: "Edit this game to add cards, prompts, or catalogue pieces." });
    } else {
      setCard(deck[Math.floor(Math.random() * deck.length)] ?? null);
    }
    setFlipped(false);
    requestAnimationFrame(() => setFlipped(true));
  }

  return (
    <PlayShell title={play.drawTitle} copy={play.drawBody || "Draw a card from your deck."} onEdit={onEdit}>
      <div className="grid min-h-40 place-items-center">
        <div
          className={cn(
            "w-full rounded-lg border border-border bg-secondary p-4 text-center transition-transform duration-300",
            flipped ? "scale-100 opacity-100" : "scale-95 opacity-80",
          )}
        >
          {card ? (
            <>
              <p className="font-display text-2xl">{card.title}</p>
              <p className="mt-2 text-sm text-muted-foreground">{card.body}</p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">The deck is face down.</p>
          )}
        </div>
      </div>
      <Button className="mt-3 w-full" onClick={draw}>
        Draw
      </Button>
    </PlayShell>
  );
}

function Dice({
  play,
  catalog,
  onEdit,
}: {
  play: PlaySettings;
  catalog: Entry[];
  onEdit?: () => void;
}) {
  const [value, setValue] = useState<number | null>(null);
  const [rolling, setRolling] = useState(false);
  const faces = useMemo(() => [1, 2, 3, 4, 5, 6], []);
  const extras = [
    ...play.dicePrompts,
    ...catalogTitles(play.diceCatalogIds, catalog),
  ].filter(Boolean);
  const meaning = extras.length ? [...extras, ...play.diceActs].slice(0, 6) : [...play.diceActs];

  function roll() {
    if (rolling) return;
    setRolling(true);
    let ticks = 0;
    const id = window.setInterval(() => {
      setValue(faces[Math.floor(Math.random() * 6)] ?? 1);
      ticks += 1;
      if (ticks > 10) {
        window.clearInterval(id);
        setRolling(false);
      }
    }, 80);
  }

  return (
    <PlayShell title={play.diceTitle} copy={play.diceBody || "Six acts. Edit each face."} onEdit={onEdit}>
      <div className="grid place-items-center py-4">
        <div className="grid size-20 place-items-center rounded-xl border border-border bg-secondary font-display text-4xl">
          {value ?? "—"}
        </div>
        <p className="mt-3 min-h-10 text-center text-sm text-muted-foreground">
          {value ? meaning[value - 1] : "Roll when you are ready."}
        </p>
      </div>
      <Button className="w-full" onClick={roll} disabled={rolling}>
        {rolling ? "Rolling…" : "Roll"}
      </Button>
    </PlayShell>
  );
}

function Timer({ play, onEdit }: { play: PlaySettings; onEdit?: () => void }) {
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(1);
  const [seconds, setSeconds] = useState(0);
  const configured = Math.max(1, hours * 3600 + minutes * 60 + seconds);
  const [left, setLeft] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const leftRef = useRef(0);
  const tickRef = useRef<number | null>(null);

  function clearTick() {
    if (tickRef.current) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }

  useEffect(() => () => clearTick(), []);

  function startFrom(total: number) {
    clearTick();
    leftRef.current = total;
    setLeft(total);
    setPaused(false);
    const started = Date.now();
    const origin = total;
    tickRef.current = window.setInterval(() => {
      const remain = Math.max(0, origin - Math.floor((Date.now() - started) / 1000));
      leftRef.current = remain;
      setLeft(remain);
      if (remain <= 0) clearTick();
    }, 250);
  }

  function pause() {
    if (left == null || left <= 0) return;
    clearTick();
    setPaused(true);
  }

  function resume() {
    if (left == null || left <= 0) return;
    startFrom(left);
  }

  function stop() {
    clearTick();
    setLeft(0);
    setPaused(false);
  }

  function reset() {
    clearTick();
    setLeft(null);
    setPaused(false);
  }

  const running = left != null && left > 0 && !paused;

  return (
    <PlayShell title={play.timerTitle || "Timer"} copy={play.timerBody || "A timed kneel, present, or silence."} onEdit={onEdit}>
      <div className="flex flex-wrap items-center justify-center gap-2 py-2">
        {[30, 60, 120, 300, 600, 3600].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => {
              setHours(Math.floor(n / 3600));
              setMinutes(Math.floor((n % 3600) / 60));
              setSeconds(n % 60);
              reset();
            }}
            className={cn(
              "h-9 rounded-full px-3 text-sm",
              configured === n ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground",
            )}
          >
            {n < 60 ? `${n}s` : n < 3600 ? `${n / 60}m` : `${n / 3600}h`}
          </button>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2">
        <label className="text-xs text-muted-foreground">
          Hours
          <Input
            type="number"
            min={0}
            max={12}
            value={hours}
            onChange={(e) => {
              setHours(Math.max(0, Math.min(12, Number(e.target.value) || 0)));
              reset();
            }}
          />
        </label>
        <label className="text-xs text-muted-foreground">
          Minutes
          <Input
            type="number"
            min={0}
            max={59}
            value={minutes}
            onChange={(e) => {
              setMinutes(Math.max(0, Math.min(59, Number(e.target.value) || 0)));
              reset();
            }}
          />
        </label>
        <label className="text-xs text-muted-foreground">
          Seconds
          <Input
            type="number"
            min={0}
            max={59}
            value={seconds}
            onChange={(e) => {
              setSeconds(Math.max(0, Math.min(59, Number(e.target.value) || 0)));
              reset();
            }}
          />
        </label>
      </div>
      <p className="py-4 text-center font-display text-5xl tabular-nums">
        {formatClock(left == null ? configured : left)}
      </p>
      <div className="grid grid-cols-2 gap-2">
        <Button onClick={() => (running ? pause() : paused ? resume() : startFrom(configured))}>
          {running ? "Pause" : paused ? "Resume" : left === 0 ? "Again" : "Start"}
        </Button>
        <Button variant="outline" onClick={stop} disabled={left == null}>
          Stop
        </Button>
        <Button variant="outline" className="col-span-2" onClick={reset}>
          Reset
        </Button>
      </div>
    </PlayShell>
  );
}

function formatClock(total: number) {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function PlayShell({
  title,
  copy,
  onEdit,
  children,
}: {
  title: string;
  copy: string;
  onEdit?: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl">{title}</h2>
          <p className="text-sm text-muted-foreground">{copy}</p>
        </div>
        {onEdit ? (
          <Button size="sm" variant="outline" onClick={onEdit}>
            Edit
          </Button>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function BuiltinEditor({
  kind,
  play,
  catalog,
  open,
  onOpenChange,
  onSave,
}: {
  kind: "wheel" | "draw" | "dice" | "timer";
  play: PlaySettings;
  catalog: Entry[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (next: Partial<PlaySettings>) => void;
}) {
  const labels = {
    wheel: { title: "The wheel", hint: "Cards become slices. Prompts and catalogue pieces join the spin." },
    draw: { title: "Draw a command", hint: "One card per line: Title — the command." },
    dice: { title: "Dice of service", hint: "Six acts, one per line. Catalogue pieces can replace a face." },
    timer: { title: "Timer", hint: "Name it and write when you use it." },
  }[kind];
  const [title, setTitle] = useState(
    kind === "wheel" ? play.wheelTitle : kind === "draw" ? play.drawTitle : kind === "dice" ? play.diceTitle : play.timerTitle,
  );
  const [body, setBody] = useState(
    kind === "wheel" ? play.wheelBody : kind === "draw" ? play.drawBody : kind === "dice" ? play.diceBody : play.timerBody,
  );
  const [cards, setCards] = useState(
    kind === "wheel"
      ? play.wheelSlices.join("\n")
      : kind === "draw"
        ? play.drawCards.map((item) => (item.body ? `${item.title} — ${item.body}` : item.title)).join("\n")
        : kind === "dice"
          ? play.diceActs.join("\n")
          : "",
  );
  const [prompts, setPrompts] = useState(
    kind === "wheel" ? play.wheelPrompts.join("\n") : kind === "draw" ? play.drawPrompts.join("\n") : play.dicePrompts.join("\n"),
  );
  const [catalogIds, setCatalogIds] = useState(
    kind === "wheel" ? play.wheelCatalogIds : kind === "draw" ? play.drawCatalogIds : play.diceCatalogIds,
  );

  const groups = (KINDS.catalog.categories ?? [])
    .map((group) => ({ ...group, items: catalog.filter((item) => item.category === group.value) }))
    .filter((group) => group.items.length > 0);

  function save() {
    const cardLines = parseLineList(cards);
    const promptLines = parseLineList(prompts);
    if (kind === "wheel") {
      onSave({
        wheelTitle: title.trim() || DEFAULT_PLAY.wheelTitle,
        wheelBody: body,
        wheelSlices: cardLines.slice(0, 24),
        wheelPrompts: promptLines,
        wheelCatalogIds: catalogIds,
      });
    } else if (kind === "draw") {
      onSave({
        drawTitle: title.trim() || DEFAULT_PLAY.drawTitle,
        drawBody: body,
        drawCards: cardLines.slice(0, 40).map((line) => {
          const [left, ...rest] = line.split("—");
          return { title: (left ?? "Card").trim() || "Card", body: rest.join("—").trim() };
        }),
        drawPrompts: promptLines,
        drawCatalogIds: catalogIds,
      });
    } else if (kind === "dice") {
      const acts = [...cardLines, ...DEFAULT_PLAY.diceActs].slice(0, 6);
      onSave({
        diceTitle: title.trim() || DEFAULT_PLAY.diceTitle,
        diceBody: body,
        diceActs: acts,
        dicePrompts: promptLines,
        diceCatalogIds: catalogIds,
      });
    } else {
      onSave({
        timerTitle: title.trim() || DEFAULT_PLAY.timerTitle,
        timerBody: body,
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit {labels.title}</DialogTitle>
          <DialogDescription>{labels.hint}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <label className="block space-y-1.5">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} />
          </label>
          <label className="block space-y-1.5">
            <Label>Rules</Label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </label>
          {kind !== "timer" ? (
            <>
              <label className="block space-y-1.5">
                <Label>{kind === "dice" ? "Acts" : "Cards"}</Label>
                <textarea
                  value={cards}
                  onChange={(e) => setCards(e.target.value)}
                  className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="One per line"
                />
              </label>
              <label className="block space-y-1.5">
                <Label>Prompts</Label>
                <textarea
                  value={prompts}
                  onChange={(e) => setPrompts(e.target.value)}
                  className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Optional. One per line."
                />
              </label>
              <div className="space-y-2">
                <Label>From the catalogue</Label>
                {catalog.length === 0 ? (
                  <p className="text-sm text-muted-foreground">The catalogue is empty.</p>
                ) : (
                  <div className="max-h-48 space-y-2 overflow-y-auto">
                    {groups.map((group) => (
                      <div key={group.value}>
                        <p className="mb-1 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{group.label}</p>
                        <div className="flex flex-wrap gap-1">
                          {group.items.map((item) => {
                            const id = String(item.id);
                            const on = catalogIds.includes(id);
                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() =>
                                  setCatalogIds((prev) => (on ? prev.filter((value) => value !== id) : [...prev, id]))
                                }
                                className={cn(
                                  "rounded-full border px-3 py-1.5 text-xs",
                                  on ? "border-primary bg-primary/10" : "border-border text-muted-foreground",
                                )}
                              >
                                {item.title}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Selected pieces join the {kind === "wheel" ? "wheel" : kind === "draw" ? "deck" : "dice"} when you play.
                </p>
              </div>
            </>
          ) : null}
          <Button className="w-full" onClick={save}>
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
