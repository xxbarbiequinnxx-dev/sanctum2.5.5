import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { buildGameDecks, shuffleItems, type DeckItem } from "@/lib/game-deck";
import type { Entry } from "@/lib/types";
import { cn } from "@/lib/utils";

export function GameDeckPlay({
  entry,
  catalog,
}: {
  entry: Entry;
  catalog: Entry[];
}) {
  const decks = useMemo(() => buildGameDecks(entry, catalog), [entry, catalog]);
  if (!decks.cards.length && !decks.prompts.length) return null;

  return (
    <div className="space-y-3">
      {decks.cards.length ? (
        <DrawPile label="Card" items={decks.cards} empty="Add cards, or set a catalogue piece as a card." />
      ) : null}
      {decks.prompts.length ? (
        <DrawPile label="Prompt" items={decks.prompts} empty="Add prompts, or set a catalogue piece as a prompt." />
      ) : null}
    </div>
  );
}

function DrawPile({
  label,
  items,
  empty,
}: {
  label: string;
  items: DeckItem[];
  empty: string;
}) {
  const signature = items.map((item) => item.key).join("|");
  const [pile, setPile] = useState<DeckItem[]>([]);
  const [current, setCurrent] = useState<DeckItem | null>(null);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  useEffect(() => {
    setPile(shuffleItems(itemsRef.current));
    setCurrent(null);
  }, [signature]);

  function draw() {
    const deck = itemsRef.current;
    if (!deck.length) return;
    const next = pile.length ? pile : shuffleItems(deck);
    const [picked, ...rest] = next;
    setCurrent(picked ?? null);
    setPile(rest);
  }

  function reshuffle() {
    setPile(shuffleItems(itemsRef.current));
    setCurrent(null);
  }

  return (
    <div className="rounded-lg border border-border bg-secondary/60 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          {label}s · {items.length}
        </p>
        <p className="text-[11px] text-muted-foreground">
          {pile.length ? `${pile.length} left in the pile` : current ? "Pile empty" : "Shuffled"}
        </p>
      </div>
      {current ? <DrawnCard item={current} /> : (
        <p className="rounded-md border border-dashed border-border px-3 py-4 text-center text-sm text-muted-foreground">
          {items.length ? `Draw a ${label.toLowerCase()}.` : empty}
        </p>
      )}
      <div className="mt-2 flex gap-2">
        <Button size="sm" className="flex-1" onClick={draw} disabled={!items.length}>
          Draw {label.toLowerCase()}
        </Button>
        <Button size="sm" variant="outline" onClick={reshuffle} disabled={!items.length}>
          Shuffle
        </Button>
      </div>
    </div>
  );
}

function DrawnCard({ item }: { item: DeckItem }) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-md border border-border bg-card",
        item.photo ? "" : "p-3",
      )}
    >
      {item.photo ? (
        <img src={item.photo} alt="" className="h-36 w-full object-cover" />
      ) : null}
      <div className={item.photo ? "p-3" : undefined}>
        <p className="font-display text-xl leading-snug">{item.title}</p>
        {item.body ? <p className="mt-1 text-sm text-muted-foreground">{item.body}</p> : null}
        {item.source === "catalog" ? (
          <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-primary">From the catalogue</p>
        ) : null}
      </div>
    </div>
  );
}
