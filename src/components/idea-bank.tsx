import { BookmarkPlus, Check, ChevronLeft, ChevronRight, Search, Shuffle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { SpawnCheckbox } from "@/components/spawn-check";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createEntry, listEntries } from "@/lib/api";
import {
  clipIdeaTitle,
  IDEA_BLURBS,
  IDEA_GROUPS,
  IDEA_NOTES,
  ideaGroup,
  ideaKey,
  ideasFor,
  resolveIdeaSlug,
} from "@/lib/idea-bank";
import { ideaSourceKey, linkForIdea, spawnedPathsOf } from "@/lib/note-links";
import type { Entry, Me } from "@/lib/types";
import { cn } from "@/lib/utils";

const PAGE = 24;

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&" + "amp;")
    .replace(/</g, "&" + "lt;")
    .replace(/>/g, "&" + "gt;")
    .replace(/"/g, "&" + "quot;");
}

function shuffleIndex(length: number) {
  const idx = Array.from({ length }, (_, i) => i);
  for (let i = idx.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx;
}

function noteForIdea(entries: Entry[], slug: string, index: number) {
  const resolved = resolveIdeaSlug(slug);
  return (
    entries.find((item) => {
      const bank = item.meta.ideaBank;
      if (item.meta.ideaIndex !== String(index) || !bank) return false;
      return bank === slug || resolveIdeaSlug(bank) === resolved;
    }) ?? null
  );
}

export function IdeaBankPanel({
  slug,
  canSave,
  savedKeys,
  savedEntries = [],
  me,
  onPickGroup,
  onSaved,
}: {
  slug: string | null;
  canSave: boolean;
  savedKeys: Set<string>;
  savedEntries?: Entry[];
  me?: Me | null;
  onPickGroup: (slug: string | null) => void;
  onSaved: (entry: Entry) => void;
}) {
  const group = slug ? ideaGroup(slug) : null;
  const link = linkForIdea(slug);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [order, setOrder] = useState<number[] | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState<Set<string>>(() => new Set());
  const [spawnedKeys, setSpawnedKeys] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    setQuery("");
    setPage(0);
    setOrder(null);
  }, [slug]);

  useEffect(() => {
    const fromNotes = new Set<string>();
    for (const item of savedEntries) {
      if (item.meta.ideaBank && item.meta.ideaIndex && item.meta.spawnedId) {
        fromNotes.add(ideaSourceKey(item.meta.ideaBank, Number(item.meta.ideaIndex)));
        fromNotes.add(ideaSourceKey(resolveIdeaSlug(item.meta.ideaBank), Number(item.meta.ideaIndex)));
      }
    }
    if (!slug || !link) {
      setSpawnedKeys(fromNotes);
      return;
    }
    let cancelled = false;
    void listEntries({ data: { kind: link.kind } })
      .then((rows) => {
        if (cancelled) return;
        const next = new Set(fromNotes);
        for (const row of rows) {
          const from = row.meta.spawnedFrom;
          if (from?.startsWith(`idea:${slug}:`) || from?.startsWith(`idea:${resolveIdeaSlug(slug)}:`)) next.add(from);
        }
        setSpawnedKeys(next);
      })
      .catch(() => {
        if (!cancelled) setSpawnedKeys(fromNotes);
      });
    return () => {
      cancelled = true;
    };
  }, [slug, link?.kind, savedEntries]);

  const ideas = useMemo(() => (slug ? ideasFor(slug) : []), [slug]);
  const ranked = useMemo(() => {
    if (!order || order.length !== ideas.length) return ideas.map((text, index) => ({ text, index }));
    return order.map((index) => ({ text: ideas[index]!, index }));
  }, [ideas, order]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ranked;
    return ranked.filter((item) => item.text.toLowerCase().includes(q));
  }, [ranked, query]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const safePage = Math.min(page, pages - 1);
  const slice = filtered.slice(safePage * PAGE, safePage * PAGE + PAGE);

  async function saveIdea(index: number, text: string) {
    if (!slug || !group) return;
    const key = ideaKey(slug, index);
    if (savedKeys.has(key) || justSaved.has(key)) {
      toast.message("Already in Notes.");
      return;
    }
    if (!canSave) {
      toast.message("Editing is locked on Notes.");
      return;
    }
    setPending(key);
    try {
      const entry = await createEntry({
        data: {
          kind: "note",
          title: clipIdeaTitle(text),
          body: `<p>${escapeHtml(text)}</p><p>From the ${escapeHtml(group.label)} idea bank. Negotiate, colour-check, and aftercare still apply.</p>`,
          category: "ideas",
          subcategory: slug,
          status: "open",
          meta: { ideaBank: slug, ideaIndex: String(index) },
        },
      });
      setJustSaved((prev) => new Set(prev).add(key));
      onSaved(entry);
      toast.success("Saved to Notes.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setPending(null);
    }
  }

  if (!slug) {
    return (
      <section className="space-y-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">Idea banks</p>
          <h2 className="mt-1 font-display text-2xl font-medium">Five hundred to pick from, in each</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            These live here, not as eleven thousand notes. Open a bank, check an idea, and choose the page, category, and subcategory it belongs on. Saving to Notes is optional.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {IDEA_GROUPS.map((item) => {
            return (
              <div
                key={item.slug}
                className="overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-primary/40 hover:bg-raised"
              >
                <button
                  type="button"
                  onClick={() => onPickGroup(item.slug)}
                  className="w-full p-4 text-left"
                >
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">500 ideas</p>
                  <h3 className="mt-1 font-display text-xl font-medium">{item.label}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{IDEA_BLURBS[item.slug]}</p>
                </button>
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  const note = IDEA_NOTES[slug];
  const savedHere = (key: string) => savedKeys.has(key) || justSaved.has(key);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <button
            type="button"
            onClick={() => onPickGroup(null)}
            className="text-xs font-medium uppercase tracking-[0.2em] text-primary"
          >
            ← All idea banks
          </button>
          <h2 className="mt-1 font-display text-2xl font-medium">{group?.label ?? slug}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {filtered.length} of {ideas.length} ideas{query.trim() ? " matching" : ""}. Check one, then choose the page, category, and subcategory. You can still save it into Notes.
          </p>
        </div>
      </div>
      {note ? (
        <p className="rounded-xl border border-border bg-secondary/60 px-4 py-3 text-sm text-muted-foreground">
          {note}
        </p>
      ) : null}
      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            placeholder="Search this bank"
            className="pl-10"
            aria-label="Search this bank"
          />
        </label>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setOrder(shuffleIndex(ideas.length));
            setPage(0);
          }}
        >
          <Shuffle />
          Shuffle
        </Button>
      </div>
      {slice.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
          Nothing in this bank matches that search.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {slice.map((item) => {
            const key = ideaKey(slug, item.index);
            const from = ideaSourceKey(slug, item.index);
            const saved = savedHere(key);
            const html = `<p>${escapeHtml(item.text)}</p>`;
            const savedNote = noteForIdea(savedEntries, slug, item.index);
            return (
              <li key={key} className="flex flex-col rounded-xl border border-border bg-card p-4">
                <p className="flex-1 text-sm leading-relaxed">{item.text}</p>
                <div className="mt-3 flex flex-col gap-2">
                  <SpawnCheckbox
                    suggested={link}
                    title={clipIdeaTitle(item.text)}
                    body={html}
                    sourceKey={from}
                    sourceEntry={savedNote}
                    already={
                      spawnedPathsOf(savedNote?.meta).length
                        ? spawnedPathsOf(savedNote?.meta)
                        : spawnedKeys.has(from) && link
                          ? [link.path]
                          : []
                    }
                    me={me}
                    onSpawned={(_created, source) => {
                      setSpawnedKeys((prev) => new Set(prev).add(from));
                      if (source) onSaved(source);
                    }}
                  />
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      size="sm"
                      variant={saved ? "secondary" : "outline"}
                      disabled={saved || pending === key}
                      onClick={() => void saveIdea(item.index, item.text)}
                      className={cn(saved && "text-muted-foreground")}
                    >
                      {saved ? <Check /> : <BookmarkPlus />}
                      {saved ? "Saved" : pending === key ? "Saving…" : "Save as note"}
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {filtered.length > PAGE ? (
        <div className="flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={safePage <= 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            <ChevronLeft />
            Previous
          </Button>
          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
            {safePage * PAGE + 1}–{Math.min(filtered.length, safePage * PAGE + PAGE)} of {filtered.length}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={safePage >= pages - 1}
            onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}
          >
            Next
            <ChevronRight />
          </Button>
        </div>
      ) : null}
    </section>
  );
}
