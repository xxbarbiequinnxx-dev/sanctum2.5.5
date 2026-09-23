import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { createEntry, listCategories, updateEntry } from "@/lib/api";
import { catChildren, catStore } from "@/lib/categories";
import { lockedCopy } from "@/lib/house";
import {
  ASSIGN_PAGES,
  assignLabel,
  canAssign,
  mergeSpawnedPages,
  spawnFields,
  spawnedPathsOf,
  type LinkedPath,
  type NoteLink,
} from "@/lib/note-links";
import type { Category, Entry, Me } from "@/lib/types";
import { cn } from "@/lib/utils";

function catName(cats: Category[], slug: string | null | undefined) {
  if (!slug) return "";
  return cats.find((item) => item.slug === slug)?.name ?? slug;
}

export function SpawnCheckbox({
  suggested,
  title,
  body,
  sourceKey,
  sourceEntry,
  already = [],
  me,
  onSpawned,
}: {
  suggested?: NoteLink | null;
  title: string;
  body: string;
  sourceKey: string;
  sourceEntry?: Entry | null;
  already?: string[];
  me?: Me | null;
  onSpawned?: (created: Entry, source?: Entry, link?: NoteLink) => void;
}) {
  const navigate = useNavigate();
  const alreadyKey = already.join("|");
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [added, setAdded] = useState<string[]>(() => {
    const fromMeta = spawnedPathsOf(sourceEntry?.meta);
    return Array.from(new Set([...fromMeta, ...already]));
  });
  const [page, setPage] = useState<NoteLink | null>(null);
  const [catTrail, setCatTrail] = useState<string[]>([]);
  const [cats, setCats] = useState<Category[]>([]);

  useEffect(() => {
    const fromMeta = spawnedPathsOf(sourceEntry?.meta);
    setAdded((prev) => Array.from(new Set([...prev, ...fromMeta, ...already])));
  }, [alreadyKey, sourceEntry?.meta.spawnedPages, sourceEntry?.meta.spawnedId]);

  const done = added.length > 0;
  const last = useMemo(
    () => ASSIGN_PAGES.find((item) => item.path === added[added.length - 1]) ?? suggested ?? null,
    [added, suggested],
  );
  const parents = catChildren(cats, null);

  function resetPick() {
    setPage(null);
    setCatTrail([]);
    setCats([]);
  }

  async function commit(target: NoteLink, cat?: string | null, sub?: string | null, live: Category[] = cats) {
    const link: NoteLink = {
      ...target,
      category: cat || undefined,
      subcategory: sub || undefined,
    };
    if (added.includes(link.path)) {
      toast.message(`Already on ${link.label}.`);
      return;
    }
    if (!canAssign(me, link)) {
      toast.message(lockedCopy(link.kind));
      return;
    }
    setPending(true);
    try {
      const created = await createEntry({ data: spawnFields(link, title, body, sourceKey) });
      let source = sourceEntry ?? undefined;
      if (source) {
        try {
          source = await updateEntry({
            data: {
              id: source.id,
              kind: source.kind,
              meta: {
                ...source.meta,
                spawnedFrom: sourceKey,
                spawnedKind: link.kind,
                spawnedId: String(created.id),
                spawnedPages: mergeSpawnedPages(source.meta, link.path),
              },
            },
          });
        } catch {
          source = {
            ...source,
            meta: {
              ...source.meta,
              spawnedKind: link.kind,
              spawnedId: String(created.id),
              spawnedPages: mergeSpawnedPages(source.meta, link.path),
            },
          };
        }
      }
      setAdded((prev) => Array.from(new Set([...prev, link.path])));
      setOpen(false);
      resetPick();
      onSpawned?.(created, source, link);
      const where = [link.label, catName(live, link.category), catName(live, link.subcategory)]
        .filter(Boolean)
        .join(" · ");
      toast.success(`Added to ${where || assignLabel(link)}.`, {
        action: {
          label: "Open",
          onClick: () => navigate({ to: link.path }),
        },
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add that entry.");
    } finally {
      setPending(false);
    }
  }

  async function choosePage(next: NoteLink) {
    if (added.includes(next.path)) {
      toast.message(`Already on ${next.label}.`);
      return;
    }
    if (!canAssign(me, next)) {
      toast.message(lockedCopy(next.kind));
      return;
    }
    setPage(next);
    setCatTrail([]);
    setPending(true);
    try {
      const live = await listCategories({ data: { kind: next.kind } });
      const usable = live.filter((item) => !item.archived);
      setCats(usable);
      if (!catChildren(usable, null).length) {
        await commit(next, null, null, usable);
      }
    } catch {
      setCats([]);
      await commit(next, null, null, []);
    } finally {
      setPending(false);
    }
  }

  function chooseCat(slug: string | null, at: number) {
    if (!page) return;
    if (!slug) {
      const used = at === 0 ? null : catTrail[at - 1] ?? null;
      const stored = catStore(cats, used);
      void commit(page, stored.category, stored.subcategory);
      return;
    }
    const nested = catChildren(cats, slug);
    if (!nested.length) {
      const stored = catStore(cats, slug);
      void commit(page, stored.category, stored.subcategory);
      return;
    }
    setCatTrail([...catTrail.slice(0, at), slug]);
  }

  const nestedRows = catTrail.map((slug, i) => ({
    slug,
    items: catChildren(cats, slug),
    at: i + 1,
  })).filter((row) => row.items.length);

  return (
    <div className="w-full min-w-0" onClick={(event) => event.stopPropagation()}>
      <label
        className={cn(
          "inline-flex min-h-9 cursor-pointer items-center gap-2 text-sm",
          pending && "cursor-default",
        )}
        title={done ? "Add this to another page" : "Choose a page, category, and subcategory"}
      >
        <input
          type="checkbox"
          className="size-4 accent-primary"
          checked={done || open}
          disabled={pending}
          onChange={(event) => {
            if (event.target.checked) {
              resetPick();
              setOpen(true);
            } else if (!done) {
              setOpen(false);
              resetPick();
            } else {
              setOpen((value) => {
                if (value) resetPick();
                return !value;
              });
            }
          }}
        />
        {done && last && !open ? (
          last.path === "/talk" ? (
            <Link
              to="/talk"
              className="text-primary underline-offset-2 hover:underline"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              Added to {added.length > 1 ? `${added.length} pages` : last.label}
            </Link>
          ) : (
            <span className="text-foreground">
              Added to {added.length > 1 ? `${added.length} pages` : last.label}
            </span>
          )
        ) : (
          <span className="text-muted-foreground">
            {open ? (page ? "Choose a category" : "Choose a page") : "Add to a page"}
          </span>
        )}
      </label>
      {open ? (
        <div className="mt-2 rounded-xl border border-border bg-secondary/50 p-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            {page ? `${page.label} — pick a category` : "Tap a page, then a category if it has one."}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {ASSIGN_PAGES.map((item) => {
              const allowed = canAssign(me, item);
              const selected = added.includes(item.path);
              const current = page?.path === item.path;
              const isSuggested = suggested?.path === item.path && !page;
              return (
                <button
                  key={item.path}
                  type="button"
                  disabled={!allowed || pending || selected}
                  onClick={() => void choosePage(item)}
                  className={cn(
                    "h-9 rounded-full px-3 text-sm",
                    selected
                      ? "bg-primary text-primary-foreground"
                      : current || isSuggested
                        ? "border border-primary bg-card text-primary"
                        : "bg-card text-muted-foreground hover:text-foreground",
                    (!allowed || pending) && "opacity-40",
                  )}
                  title={!allowed ? lockedCopy(item.kind) : selected ? `Already on ${item.label}` : `Add to ${item.label}`}
                >
                  {pending && current ? "Adding…" : selected ? `On ${item.label}` : item.label}
                </button>
              );
            })}
          </div>
          {page && parents.length ? (
            <div className="mt-3">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Category</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {parents.map((item) => {
                  const current = catTrail[0] === item.slug;
                  return (
                    <button
                      key={item.slug}
                      type="button"
                      disabled={pending}
                      onClick={() => chooseCat(item.slug, 0)}
                      className={cn(
                        "h-9 rounded-full px-3 text-sm",
                        current ? "border border-primary bg-card text-primary" : "bg-card text-muted-foreground hover:text-foreground",
                        pending && "opacity-40",
                      )}
                    >
                      {item.name}
                    </button>
                  );
                })}
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => chooseCat(null, 0)}
                  className="h-9 rounded-full bg-card px-3 text-sm text-muted-foreground hover:text-foreground"
                >
                  No category
                </button>
              </div>
            </div>
          ) : null}
          {page
            ? nestedRows.map((row) => (
                <div key={`${row.slug}-${row.at}`} className="mt-3">
                  <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    {row.at === 1 ? "Subcategory" : "Nested category"}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {row.items.map((item) => (
                      <button
                        key={item.slug}
                        type="button"
                        disabled={pending}
                        onClick={() => chooseCat(item.slug, row.at)}
                        className={cn(
                          "h-9 rounded-full px-3 text-sm",
                          catTrail[row.at] === item.slug
                            ? "border border-primary bg-card text-primary"
                            : "bg-card text-muted-foreground hover:text-foreground",
                          pending && "opacity-40",
                        )}
                      >
                        {item.name}
                      </button>
                    ))}
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => chooseCat(null, row.at)}
                      className="h-9 rounded-full bg-card px-3 text-sm text-muted-foreground hover:text-foreground"
                    >
                      Stop here
                    </button>
                  </div>
                </div>
              ))
            : null}
        </div>
      ) : done ? (
        <button
          type="button"
          className="mt-1 text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          onClick={() => {
            resetPick();
            setOpen(true);
          }}
        >
          Add to another page
        </button>
      ) : null}
    </div>
  );
}

export type { LinkedPath };
