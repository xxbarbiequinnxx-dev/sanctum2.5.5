import { Archive, ChevronDown, ChevronUp, Minus, Plus, Settings2, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { ChanceWheel } from "@/components/chance-wheel";
import { GameDeckPlay } from "@/components/game-deck";
import { LibraryDocDialog, MoreInfoButton } from "@/components/library-reader";
import { SpawnCheckbox } from "@/components/spawn-check";
import { EntryForm } from "@/components/entry-form";
import { Lightbox, PhotoStrip, VideoStrip } from "@/components/photo-field";
import { PdfStrip } from "@/components/pdf-field";
import { RichText } from "@/components/rich-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  addCategory,
  buyEntry,
  deleteCategory,
  deleteEntry,
  getMe,
  getPoints,
  listCategories,
  listEntries,
  reorderCategories,
  reorderEntries,
  savePlay,
  setEarnedCount,
  setUrgency,
  toggleEntry,
  updateCategory,
  updateEntry,
} from "@/lib/api";
import { catChildren, catDescendants, catLabelPath, catPath, catTree } from "@/lib/categories";
import { parseExperience } from "@/lib/experience";
import { fillSelectOptions, isArchivedEntry, KINDS, type Kind } from "@/lib/kinds";
import { isLibraryNote, plainExcerpt } from "@/lib/notes-library";
import { linkForEntry, sourceKeyFor, type NoteLink } from "@/lib/note-links";
import { relatedLibraryKeys } from "@/lib/talk-notes";
import { countdownLabel } from "@/lib/countdown";
import { parseCatalogRoles } from "@/lib/game-deck";
import type { Category, Entry, Me, PointsBoard } from "@/lib/types";
import { formatWhen, intensityMarks } from "@/lib/format";
import { canEditEntry, canMutate, canSetEarnedCount, dutiesPaused, editDeniedCopy, isDutyKind, lockedCopy } from "@/lib/house";
import { subscribeMe } from "@/lib/me-sync";
import { useLiveReload } from "@/lib/live-sync";
import { PDF_META_KEY } from "@/lib/pdf";
import { VIDEO_META_KEY } from "@/lib/video";
import { parseCustomDays, sortNamed, URGENCY, urgencyOf, type Urgency } from "@/lib/sort";
import { countWord, earnedCountOf, isBought, isCountedKind, outcomeMessage, shopBuyLabel, shopCost } from "@/lib/stakes";
import { cn } from "@/lib/utils";

const HIDDEN_META = new Set([
  "catalogIds",
  "catalogTitles",
  "visibility",
  "stakesMode",
  "points",
  "skipPoints",
  "rewardIds",
  "punishmentIds",
  "rewardTitles",
  "punishmentTitles",
  "reminderTime",
  "reminderEnabled",
  PDF_META_KEY,
  VIDEO_META_KEY,
  "customDays",
  "urgency",
  "sortOrder",
  "overdueOn",
  "month",
  "day",
  "cost",
  "boughtBy",
  "boughtAt",
  "boughtCost",
  "earnedCount",
  "cards",
  "prompts",
  "catalogRoles",
  "onWheel",
  "countdownDays",
  "countdownHours",
  "countdownMinutes",
  "countdownAnchor",
  "libraryKey",
  "ideaBank",
  "ideaIndex",
  "spawnedFrom",
  "spawnedKind",
  "spawnedId",
  "spawnedPages",
]);

export function KindPage({
  kind,
  hideHeader = false,
  wheel,
  initialFilter,
  entryFilter,
  defaultCadence,
  addLabel,
  title,
  kicker,
  blurb,
  emptyTitle,
  emptyBody,
}: {
  kind: Kind;
  hideHeader?: boolean;
  wheel?: { title: string; copy: string };
  initialFilter?: string;
  entryFilter?: (entry: Entry) => boolean;
  defaultCadence?: string;
  addLabel?: string;
  title?: string;
  kicker?: string;
  blurb?: string;
  emptyTitle?: string;
  emptyBody?: string;
}) {
  const config = fillSelectOptions({
    ...KINDS[kind],
    ...(title ? { title } : {}),
    ...(kicker ? { kicker } : {}),
    ...(blurb ? { blurb } : {}),
    ...(addLabel ? { addLabel } : {}),
    ...(emptyTitle ? { emptyTitle } : {}),
    ...(emptyBody ? { emptyBody } : {}),
  });
  const [entries, setEntries] = useState<Entry[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>(initialFilter ?? "all");
  const [trail, setTrail] = useState<string[]>([]);
  const [editing, setEditing] = useState<Entry | null | undefined>(undefined);
  const [reading, setReading] = useState<Entry | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [manage, setManage] = useState(false);
  const [points, setPoints] = useState<PointsBoard | null>(null);
  const [catalog, setCatalog] = useState<Entry[]>([]);

  const load = useCallback(async () => {
    try {
      const [rows, categories, mine, board, shelf] = await Promise.all([
        listEntries({ data: { kind } }),
        listCategories({ data: { kind } }),
        getMe(),
        config.shop ? getPoints() : Promise.resolve(null),
        kind === "game" ? listEntries({ data: { kind: "catalog" } }) : Promise.resolve([] as Entry[]),
      ]);
      setEntries(rows);
      setCats(categories);
      setMe(mine);
      if (board) setPoints(board as PointsBoard);
      setCatalog(shelf);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load.");
    } finally {
      setLoading(false);
    }
  }, [kind, config.shop]);

  useEffect(() => {
    setLoading(true);
    setFilter(initialFilter ?? "all");
    setTrail([]);
    setReading(null);
    void load();
  }, [load, initialFilter]);

  useEffect(() => subscribeMe(setMe), []);
  useLiveReload(load);

  const playbookPrefill = useRef(false);
  useEffect(() => {
    if (kind !== "playbook" || playbookPrefill.current || !me?.profile?.experience) return;
    playbookPrefill.current = true;
    setFilter(parseExperience(me.profile.experience));
    setTrail([]);
  }, [kind, me?.profile?.experience]);

  const parents = sortNamed(cats.filter((c) => !c.parentSlug && !c.archived));
  const nestedRows = useMemo(() => {
    if (!parents.some((c) => c.slug === filter)) return [] as { parent: string; items: Category[]; selected: string }[];
    const rows: { parent: string; items: Category[]; selected: string }[] = [];
    let parent = filter;
    for (let i = 0; i <= trail.length; i += 1) {
      const items = sortNamed(catChildren(cats, parent));
      if (!items.length) break;
      const selected = trail[i] ?? "all";
      rows.push({ parent, items, selected });
      if (selected === "all") break;
      parent = selected;
      if (i > 8) break;
    }
    return rows;
  }, [cats, filter, parents, trail]);

  const visible = useMemo(() => {
    return sortNamed(
      entries.filter((item) => {
      if (entryFilter && !entryFilter(item)) return false;
      const archived = isArchivedEntry(item);
      if (filter === "archived") return archived;
      if (archived) return false;
      if (filter === "all") return true;
      if (parents.some((c) => c.slug === filter)) {
        if (!trail.length) {
          return item.category === filter || item.subcategory === filter;
        }
        const focus = trail[trail.length - 1]!;
        const ids = catDescendants(cats, focus);
        return ids.has(item.subcategory ?? "") || item.category === focus;
      }
      return item.effectiveStatus === filter || item.status === filter;
    }),
    );
  }, [entries, filter, trail, parents, cats, entryFilter]);

  function onSaved(next: Entry, removed?: boolean) {
    setEntries((prev) => {
      if (removed) return prev.filter((item) => item.id !== next.id);
      const exists = prev.some((item) => item.id === next.id);
      return exists ? prev.map((item) => (item.id === next.id ? next : item)) : [next, ...prev];
    });
  }

  async function toggle(entry: Entry) {
    if (dutiesPaused(me?.house) && isDutyKind(entry.kind)) {
      toast.message("Vacation is on. Resume it to complete duties.");
      return;
    }
    try {
      const done = entry.effectiveStatus !== "done";
      const updated = await toggleEntry({ data: { id: entry.id, done } });
      setEntries((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      const note = outcomeMessage(entry, updated);
      if (note?.tone === "success") toast.success(note.text);
      else if (note) toast.message(note.text);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update.");
    }
  }

  async function buy(entry: Entry) {
    try {
      const result = await buyEntry({ data: { id: entry.id } });
      setEntries((prev) => prev.map((item) => (item.id === result.entry.id ? result.entry : item)));
      setPoints(result.points);
      toast.success(`Bought for ${shopCost(result.entry.meta) ?? result.entry.meta.boughtCost} points.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not buy.");
    }
  }

  async function saveBody(entry: Entry, html: string) {
    try {
      const updated = await updateEntry({
        data: { id: entry.id, kind: entry.kind, body: html },
      });
      setEntries((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
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
      const updated = await updateEntry({ data: { id: entry.id, kind: entry.kind, status: next } });
      setEntries((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      toast.success(next === "archived" ? "Archived." : "Restored.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not archive.");
    }
  }

  async function remove(entry: Entry) {
    if (!canEditEntry(me, entry)) {
      toast.message(editDeniedCopy(me, entry));
      return;
    }
    if (isLibraryNote(entry)) {
      await archive(entry);
      return;
    }
    if (typeof window !== "undefined" && !window.confirm(`Delete “${entry.title}”? This cannot be undone.`)) {
      return;
    }
    try {
      await deleteEntry({ data: { id: entry.id } });
      setEntries((prev) => prev.filter((item) => item.id !== entry.id));
      toast.success("Deleted.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete.");
    }
  }

  async function moveEntry(entry: Entry, dir: -1 | 1) {
    const ids = visible.map((item) => item.id);
    const index = ids.indexOf(entry.id);
    const next = index + dir;
    if (index < 0 || next < 0 || next >= ids.length) return;
    const swapped = [...ids];
    [swapped[index], swapped[next]] = [swapped[next], swapped[index]];
    const order = new Map(swapped.map((id, i) => [id, i + 1]));
    setEntries((prev) => prev.map((item) => (order.has(item.id) ? { ...item, sortOrder: order.get(item.id)! } : item)));
    try {
      await reorderEntries({ data: { ids: swapped } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not reorder.");
      void load();
    }
  }

  async function setEntryUrgency(entry: Entry, value: Urgency) {
    try {
      const updated = await setUrgency({ data: { id: entry.id, urgency: value } });
      setEntries((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not set importance.");
    }
  }

  async function setEntryEarned(entry: Entry, count: number) {
    const next = Math.max(0, Math.min(999, Math.trunc(count)));
    try {
      const updated = await setEarnedCount({ data: { id: entry.id, count: next } });
      setEntries((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not change the count.");
    }
  }

  const names: Record<string, string> = {};
  if (me?.profile) names[me.profile.userId] = me.profile.displayName || "Me";
  if (me?.partner) names[me.partner.userId] = me.partner.displayName || "Partner";
  names.both = "Both";
  const allowed = canMutate(me, kind, defaultCadence);
  const extras = me?.house.wheels?.[kind] ?? [];
  const heading = title ?? config.title;
  const createLabel = addLabel ?? config.addLabel;
  const activitiesMode = kind === "note" && filter === "exercises";

  function spawnProps(entry: Entry) {
    if (kind !== "note") return {};
    const dest = linkForEntry(entry);
    if (!dest && entry.category !== "ideas" && entry.category !== "exercises") return {};
    return {
      spawnLink: dest,
      me,
      onSpawned: (_created: Entry, source?: Entry) => {
        if (source) onSaved(source);
      },
    };
  }

  async function saveWheelExtras(next: string[]) {
    if (!me) return;
    try {
      const updated = await savePlay({ data: { wheels: { ...me.house.wheels, [kind]: next } } });
      setMe(updated);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update the wheel.");
    }
  }

  function openEditor(entry: Entry | null) {
    if (entry) {
      setEditing(entry);
      return;
    }
    if (!allowed) {
      toast.message(lockedCopy(kind));
      return;
    }
    setEditing(null);
  }

  return (
    <div className="space-y-6">
      {hideHeader ? (
        <div className="flex justify-end gap-2">
          {allowed ? (
            <>
              <Button variant="outline" onClick={() => setManage(true)}>
                <Settings2 />
                Categories
              </Button>
              <Button onClick={() => openEditor(null)}>
                <Plus />
                {createLabel}
              </Button>
            </>
          ) : null}
        </div>
      ) : (
        <header className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">{kicker ?? config.kicker}</p>
            <h1 className="mt-1 font-display text-4xl font-medium">{heading}</h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">{blurb ?? config.blurb}</p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            {config.shop && me?.profile?.role === "submissive" && points ? (
              <Badge variant="outline">{points.mine} pts</Badge>
            ) : null}
            {allowed ? (
              <>
                <Button variant="outline" onClick={() => setManage(true)}>
                  <Settings2 />
                  <span className="hidden sm:inline">Categories</span>
                </Button>
                <Button onClick={() => openEditor(null)}>
                  <Plus />
                  {createLabel}
                </Button>
              </>
            ) : (
              <Badge variant="outline">Editing locked</Badge>
            )}
          </div>
        </header>
      )}

      {wheel ? (
        <ChanceWheel
          title={wheel.title}
          copy={wheel.copy}
          slices={[
            ...entries
              .filter((e) => e.effectiveStatus !== "archived" && e.meta.onWheel !== "0")
              .map((e) => e.title),
            ...extras,
          ]}
          extras={extras}
          canEdit={allowed}
          onAddExtra={(label) => void saveWheelExtras([...extras, label])}
          onRemoveExtra={(label) => void saveWheelExtras(extras.filter((item) => item !== label))}
        />
      ) : null}

      <div className="flex flex-wrap gap-1.5">
        <FilterChip
          active={filter === "all"}
          onClick={() => {
            setFilter("all");
            setTrail([]);
          }}
        >
          All
        </FilterChip>
        {(parents.length ? parents : config.statuses.filter((item) => item.value !== "archived")).map((item) => {
          const value = "slug" in item ? item.slug : item.value;
          const label = "name" in item ? item.name : item.label;
          return (
            <FilterChip
              key={value}
              active={filter === value}
              onClick={() => {
                setFilter(value);
                setTrail([]);
              }}
            >
              {label}
            </FilterChip>
          );
        })}
        {parents.length && config.completeLabel ? (
          <FilterChip
            active={filter === "done"}
            onClick={() => {
              setFilter("done");
              setTrail([]);
            }}
          >
            {config.statuses.find((item) => item.value === "done")?.label ?? "Completed"}
          </FilterChip>
        ) : null}
        <FilterChip
          active={filter === "archived"}
          onClick={() => {
            setFilter("archived");
            setTrail([]);
          }}
        >
          Archived
        </FilterChip>
      </div>
      {nestedRows.map((row, rowIndex) => (
        <div key={`${row.parent}-${rowIndex}`} className="flex flex-wrap gap-1.5">
          <FilterChip
            active={row.selected === "all"}
            onClick={() => setTrail(trail.slice(0, rowIndex))}
          >
            All
          </FilterChip>
          {row.items.map((item) => (
            <FilterChip
              key={item.slug}
              active={row.selected === item.slug}
              onClick={() => setTrail([...trail.slice(0, rowIndex), item.slug])}
            >
              {item.name}
            </FilterChip>
          ))}
        </div>
      ))}

      {activitiesMode && !loading ? (
        <p className="rounded-xl border border-border bg-secondary/60 px-4 py-3 text-sm text-muted-foreground">
          Check an original entry, then choose the page, category, and subcategory it should appear on.
        </p>
      ) : null}

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-xl bg-card" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          title={
            filter === "ideas"
              ? "No ideas yet"
              : (emptyTitle ?? config.emptyTitle)
          }
          body={
            allowed
              ? filter === "ideas"
                ? "These shelves are empty on purpose. Add your own idea, and nest subcategories if you want them finer."
                : (emptyBody ?? config.emptyBody)
              : lockedCopy(kind)
          }
          action={allowed ? createLabel : undefined}
          onAction={allowed ? () => openEditor(null) : undefined}
        />
      ) : (
        <div
          className={cn(
            "grid gap-3",
            config.layout === "grid" ? "sm:grid-cols-2" : "grid-cols-1",
          )}
        >
          {visible.map((entry) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              config={config}
              cats={cats}
              assignee={
                entry.assignedTo === "both"
                  ? "Both"
                  : entry.assignedTo
                    ? names[entry.assignedTo] ?? null
                    : null
              }
              onOpen={() => {
                if (isLibraryNote(entry)) setReading(entry);
                else openEditor(entry);
              }}
              onToggle={() => void toggle(entry)}
              onArchive={() => void archive(entry)}
              onDelete={() => void remove(entry)}
              onPhoto={setLightbox}
              onBody={canEditEntry(me, entry) && !isLibraryNote(entry) ? (html) => void saveBody(entry, html) : undefined}
              paused={dutiesPaused(me?.house) && isDutyKind(entry.kind)}
              canEdit={canEditEntry(me, entry)}
              onMoveUp={visible[0]?.id === entry.id ? undefined : () => void moveEntry(entry, -1)}
              onMoveDown={visible[visible.length - 1]?.id === entry.id ? undefined : () => void moveEntry(entry, 1)}
              onUrgency={kind === "task" ? (value) => void setEntryUrgency(entry, value) : undefined}
              onEarnedChange={
                isCountedKind(kind) && canSetEarnedCount(me)
                  ? (count) => void setEntryEarned(entry, count)
                  : undefined
              }
              onBuy={
                me?.profile?.role === "submissive" && shopCost(entry.meta) && !isBought(entry.meta)
                  ? () => void buy(entry)
                  : undefined
              }
              balance={points?.mine ?? 0}
              boughtByName={
                entry.meta.boughtBy
                  ? names[entry.meta.boughtBy] ?? (entry.meta.boughtBy === me?.profile?.userId ? "You" : "Bought")
                  : null
              }
              catalog={kind === "game" ? catalog : []}
              {...spawnProps(entry)}
            />
          ))}
        </div>
      )}

      <EntryForm
        config={config}
        entry={editing ?? undefined}
        open={editing !== undefined}
        addLabel={createLabel}
        defaultCadence={defaultCadence}
        defaultCategory={parents.some((c) => c.slug === filter) ? filter : undefined}
        defaultSubcategory={trail[trail.length - 1]}
        readOnly={Boolean(editing && !canEditEntry(me, editing))}
        onOpenChange={(open) => {
          if (!open) setEditing(undefined);
        }}
        onSaved={(entry, removed) => {
          onSaved(entry, removed);
          void listCategories({ data: { kind } }).then(setCats);
        }}
      />
      <LibraryDocDialog
        entry={reading}
        open={Boolean(reading)}
        canEdit={reading ? canEditEntry(me, reading) : false}
        catName={
          reading
            ? (cats.find((c) => c.slug === reading.category)?.name ??
              config.categories?.find((c) => c.value === reading.category)?.label ??
              reading.category)
            : null
        }
        subName={
          reading
            ? (cats.find((c) => c.slug === reading.subcategory)?.name ?? reading.subcategory)
            : null
        }
        relatedKeys={
          reading
            ? relatedLibraryKeys({
                text: `${reading.title} ${reading.body ?? ""}`,
              })
            : []
        }
        me={me}
        onSpawned={(_created, source) => {
          if (source) {
            onSaved(source);
            setReading(source);
          }
        }}
        onClose={() => setReading(null)}
        onEdit={() => {
          if (!reading) return;
          const row = reading;
          setReading(null);
          openEditor(row);
        }}
      />
      <CategoryManager
        kind={kind}
        open={manage}
        cats={cats}
        onClose={() => setManage(false)}
        onChange={setCats}
      />
      <Lightbox src={lightbox} onClose={() => setLightbox(null)} />
    </div>
  );
}

export function CategoryManager({
  kind,
  open,
  cats,
  onClose,
  onChange,
}: {
  kind: Kind;
  open: boolean;
  cats: Category[];
  onClose: () => void;
  onChange: (cats: Category[]) => void;
}) {
  const [name, setName] = useState("");
  const [parent, setParent] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const ordered = catTree(sortNamed(cats));
  const parentChoices = ordered.filter((c) => !c.archived);

  async function refresh() {
    onChange(await listCategories({ data: { kind } }));
  }

  async function add() {
    if (!name.trim()) return;
    try {
      await addCategory({
        data: { kind, name: name.trim(), parentSlug: parent || null },
      });
      setName("");
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add category.");
    }
  }

  async function saveName(item: Category) {
    const next = editName.trim();
    if (!next) return;
    try {
      await updateCategory({ data: { kind, slug: item.slug, id: item.id ?? undefined, name: next } });
      setEditing(null);
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not rename.");
    }
  }

  async function archive(item: Category) {
    try {
      await updateCategory({
        data: { kind, slug: item.slug, id: item.id ?? undefined, archived: !item.archived },
      });
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not archive.");
    }
  }

  async function remove(item: Category) {
    if (typeof window !== "undefined" && !window.confirm(`Delete “${item.name}”? Entries keep their old label.`)) {
      return;
    }
    try {
      await deleteCategory({ data: { id: item.id ?? undefined, kind, slug: item.slug } });
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete.");
    }
  }

  async function moveCat(item: Category, dir: -1 | 1) {
    const siblings = ordered.filter((c) => (c.parentSlug ?? "") === (item.parentSlug ?? ""));
    const slugs = siblings.map((c) => c.slug);
    const index = slugs.indexOf(item.slug);
    const next = index + dir;
    if (index < 0 || next < 0 || next >= slugs.length) return;
    const swappedSiblings = [...slugs];
    [swappedSiblings[index], swappedSiblings[next]] = [swappedSiblings[next], swappedSiblings[index]];
    const siblingSet = new Set(slugs);
    let cursor = 0;
    const swapped = ordered.map((c) => {
      if (!siblingSet.has(c.slug)) return c.slug;
      return swappedSiblings[cursor++];
    });
    try {
      await reorderCategories({ data: { kind, slugs: swapped } });
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not reorder.");
    }
  }

  function siblingIndex(item: Category) {
    const siblings = ordered.filter((c) => (c.parentSlug ?? "") === (item.parentSlug ?? ""));
    return { index: siblings.findIndex((c) => c.slug === item.slug), last: siblings.length - 1 };
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Categories</DialogTitle>
          <DialogDescription>
            Edit, archive, or delete any category — including the built-in ones. A subcategory can sit under another subcategory. Archived categories stay out of new entries.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <label className="block space-y-1.5">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Kneeling" />
          </label>
          <label className="block space-y-1.5">
            <Label>Parent (for a sub-category)</Label>
            <Select value={parent} onChange={(e) => setParent(e.target.value)}>
              <option value="">None — top level</option>
              {parentChoices.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {catLabelPath(cats, item.slug) || item.name}
                </option>
              ))}
            </Select>
          </label>
          <Button onClick={() => void add()} className="w-full">
            Add
          </Button>
          <ul className="max-h-56 space-y-1 overflow-y-auto text-sm">
            {ordered.map((item) => {
              const sib = siblingIndex(item);
              const depth = Math.max(0, catPath(cats, item.slug).length - 1);
              return (
              <li
                key={`${item.slug}-${item.id ?? "b"}`}
                className={cn(
                  "flex items-center justify-between gap-2 rounded-md px-3 py-2",
                  item.archived ? "bg-muted/60" : "bg-secondary",
                )}
                style={{ marginLeft: depth ? `${Math.min(depth, 6) * 12}px` : undefined }}
              >
                <div className="min-w-0 flex-1">
                  {editing === item.slug ? (
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={() => void saveName(item)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") void saveName(item);
                        if (e.key === "Escape") setEditing(null);
                      }}
                      autoFocus
                    />
                  ) : (
                    <button
                      type="button"
                      className="block min-h-9 w-full truncate text-left"
                      onClick={() => {
                        setEditing(item.slug);
                        setEditName(item.name);
                      }}
                    >
                      {item.parentSlug ? (
                        <span className="text-muted-foreground">
                          {catLabelPath(cats, item.parentSlug) || item.parentSlug} /{" "}
                        </span>
                      ) : null}
                      {item.name}
                      {item.builtin ? (
                        <span className="ml-2 text-xs text-muted-foreground">built-in</span>
                      ) : null}
                      {item.archived ? (
                        <span className="ml-2 text-xs text-muted-foreground">archived</span>
                      ) : null}
                    </button>
                  )}
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    className="grid size-9 place-items-center text-muted-foreground hover:text-foreground disabled:opacity-30"
                    onClick={() => void moveCat(item, -1)}
                    disabled={sib.index <= 0}
                    aria-label="Move up"
                  >
                    <ChevronUp className="size-4" />
                  </button>
                  <button
                    type="button"
                    className="grid size-9 place-items-center text-muted-foreground hover:text-foreground disabled:opacity-30"
                    onClick={() => void moveCat(item, 1)}
                    disabled={sib.index >= sib.last}
                    aria-label="Move down"
                  >
                    <ChevronDown className="size-4" />
                  </button>
                  <button
                    type="button"
                    className="h-9 rounded-md px-2 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => void archive(item)}
                  >
                    {item.archived ? "Restore" : "Archive"}
                  </button>
                  <button
                    type="button"
                    className="h-9 rounded-md px-2 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => void remove(item)}
                  >
                    Delete
                  </button>
                </div>
              </li>
              );
            })}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-9 rounded-full px-3 text-sm",
        active ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground",
      )}
    >
      {children}
    </button>
  );
}

export function UrgencyControl({
  value,
  onChange,
}: {
  value: Urgency;
  onChange: (value: Urgency) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {URGENCY.map((item) => (
        <button
          key={item.value}
          type="button"
          onClick={() => onChange(item.value)}
          className={cn(
            "h-7 rounded-full px-2 text-[11px]",
            value === item.value ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground",
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action,
  onAction,
}: {
  title: string;
  body: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card/60 px-6 py-14 text-center">
      <h2 className="font-display text-2xl font-medium">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{body}</p>
      {action && onAction ? (
        <Button className="mt-5" onClick={onAction}>
          {action}
        </Button>
      ) : null}
    </div>
  );
}

export function EntryCard({
  entry,
  config,
  cats = [],
  assignee,
  onOpen,
  onToggle,
  onArchive,
  onDelete,
  onPhoto,
  onBody,
  paused,
  canEdit,
  onMoveUp,
  onMoveDown,
  onUrgency,
  onEarnedChange,
  onBuy,
  balance = 0,
  boughtByName,
  catalog = [],
  spawnLink,
  me: spawnMe,
  onSpawned,
}: {
  entry: Entry;
  config: ReturnType<typeof fillSelectOptions>;
  cats?: Category[];
  assignee?: string | null;
  onOpen: () => void;
  onToggle?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
  onPhoto?: (src: string) => void;
  onBody?: (html: string) => void;
  paused?: boolean;
  canEdit?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onUrgency?: (value: Urgency) => void;
  onEarnedChange?: (count: number) => void;
  onBuy?: () => void;
  balance?: number;
  boughtByName?: string | null;
  catalog?: Entry[];
  spawnLink?: NoteLink | null;
  me?: Me | null;
  onSpawned?: (created: Entry, source?: Entry) => void;
}) {
  const status = config.statuses.find(
    (item) => item.value === entry.effectiveStatus || item.value === entry.status,
  );
  const done = entry.effectiveStatus === "done";
  const cost = shopCost(entry.meta);
  const bought = isBought(entry.meta);
  const countdown = countdownLabel(entry);
  const catName =
    cats.find((c) => c.slug === entry.category)?.name ??
    config.categories?.find((c) => c.value === entry.category)?.label ??
    entry.category;
  const subName = cats.find((c) => c.slug === entry.subcategory)?.name ?? entry.subcategory;
  return (
    <article className="overflow-hidden rounded-xl border border-border bg-card">
      {entry.photos[0] ? (
        <button type="button" className="block w-full" onClick={() => onPhoto?.(entry.photos[0]!)}>
          <img src={entry.photos[0]} alt="" className="h-44 w-full object-cover" />
        </button>
      ) : null}
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <button type="button" onClick={onOpen} className="text-left">
            <h2 className="font-display text-xl font-medium leading-snug">{entry.title}</h2>
            {catName ? (
              <p className="mt-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                {catName}
                {subName ? ` · ${subName}` : ""}
                {isLibraryNote(entry) ? " · Library" : ""}
              </p>
            ) : isLibraryNote(entry) ? (
              <p className="mt-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">Library</p>
            ) : null}
          </button>
          {status ? (
            <Badge variant={done || entry.status === "archived" ? "muted" : "default"}>{status.label}</Badge>
          ) : null}
        </div>
        {entry.kind === "talk" ? (
          <MoreInfoButton text={`${entry.title} ${entry.body ?? ""}`} />
        ) : null}
        {isCountedKind(entry.kind) ? (
          <div className="flex items-center gap-2">
            {onEarnedChange ? (
              <>
                <button
                  type="button"
                  className="grid size-8 place-items-center rounded-md bg-secondary text-muted-foreground disabled:opacity-30"
                  onClick={() => onEarnedChange(earnedCountOf(entry.meta) - 1)}
                  disabled={earnedCountOf(entry.meta) <= 0}
                  aria-label={`Fewer ${countWord(entry.kind)}`}
                >
                  <Minus className="size-3.5" />
                </button>
                <p className="min-w-16 text-xs uppercase tracking-[0.14em] text-primary">
                  {earnedCountOf(entry.meta)} {countWord(entry.kind)}
                </p>
                <button
                  type="button"
                  className="grid size-8 place-items-center rounded-md bg-secondary text-muted-foreground disabled:opacity-30"
                  onClick={() => onEarnedChange(earnedCountOf(entry.meta) + 1)}
                  disabled={earnedCountOf(entry.meta) >= 999}
                  aria-label={`More ${countWord(entry.kind)}`}
                >
                  <Plus className="size-3.5" />
                </button>
              </>
            ) : (
              <p className="text-xs uppercase tracking-[0.14em] text-primary">
                {earnedCountOf(entry.meta)} {countWord(entry.kind)}
              </p>
            )}
          </div>
        ) : null}
        {assignee ? (
          <p className="text-xs text-muted-foreground">Assigned to {assignee}</p>
        ) : null}
        {cost ? (
          <p className="text-xs text-muted-foreground">
            {bought
              ? `Bought${boughtByName ? ` · ${boughtByName}` : ""} · ${cost} pts`
              : `${cost} pts to buy`}
          </p>
        ) : null}
        {onUrgency ? (
          <UrgencyControl value={urgencyOf(entry.meta)} onChange={onUrgency} />
        ) : entry.kind === "task" && urgencyOf(entry.meta) !== "normal" ? (
          <p className="text-xs uppercase tracking-[0.14em] text-primary">{urgencyOf(entry.meta)}</p>
        ) : null}
        {entry.body ? (
          isLibraryNote(entry) ? (
            <p className="text-sm text-muted-foreground">{plainExcerpt(entry.body)}</p>
          ) : (
            <RichText html={entry.body} clamp={!onBody} className="text-sm" onChange={onBody} />
          )
        ) : null}
        {entry.kind === "game" ? <GameDeckPlay entry={entry} catalog={catalog} /> : null}
        {entry.cadence ? (
          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
            {entry.cadence}
            {entry.weekday != null ? ` · ${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][entry.weekday]}` : ""}
            {entry.cadence === "custom"
              ? ` · ${parseCustomDays(entry.meta.customDays)
                  .map((d) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d])
                  .join(" ")}`
              : ""}
          </p>
        ) : null}
        {(() => {
          const shown = new Set<string>();
          const rows = config.fields
            .filter((field) => field.store === "meta")
            .map((field) => {
              const value = entry.meta[field.key];
              if (!value || HIDDEN_META.has(field.key)) return null;
              shown.add(field.key);
              if (field.type === "textarea") {
                return (
                  <div key={field.key} className="text-sm">
                    <p className="text-muted-foreground">{field.label}</p>
                    <RichText html={value} clamp className="mt-1" />
                  </div>
                );
              }
              const href = field.key === "link" && /^https?:\/\//i.test(value) ? value : null;
              return (
                <p key={field.key} className="text-sm">
                  <span className="text-muted-foreground">{field.label}: </span>
                  {href ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary underline-offset-2 hover:underline"
                    >
                      Open
                    </a>
                  ) : (
                    value
                  )}
                </p>
              );
            });
          const extras = Object.entries(entry.meta)
            .filter(([k, v]) => v && !HIDDEN_META.has(k) && !shown.has(k))
            .slice(0, 3)
            .map(([key, value]) => (
              <p key={key} className="text-sm">
                <span className="text-muted-foreground">{key}: </span>
                {value}
              </p>
            ));
          return (
            <>
              {rows}
              {extras}
            </>
          );
        })()}
        {entry.meta.catalogTitles ? (
          <div className="flex flex-wrap gap-1">
            {(() => {
              const ids = (entry.meta.catalogIds ?? "").split(",").map((value) => value.trim()).filter(Boolean);
              const titles = entry.meta.catalogTitles.split(" · ").filter(Boolean);
              const roles = entry.kind === "game" ? parseCatalogRoles(entry.meta) : {};
              return titles.map((title, index) => {
                const role = ids[index] ? roles[ids[index]!] : undefined;
                return (
                  <span key={`${title}-${index}`} className="rounded-full bg-secondary px-2 py-1 text-[11px] text-muted-foreground">
                    {title}
                    {role && role !== "prop" ? ` · ${role}` : ""}
                  </span>
                );
              });
            })()}
          </div>
        ) : null}
        {entry.meta.points ? (
          <p className="text-xs text-muted-foreground">
            {Number(entry.meta.points) >= 0 ? "+" : ""}
            {entry.meta.points} pts if done
            {entry.meta.skipPoints ? ` · ${entry.meta.skipPoints} if skipped` : ""}
          </p>
        ) : null}
        {entry.meta.rewardTitles ? (
          <p className="text-xs text-muted-foreground">Earns {entry.meta.rewardTitles}</p>
        ) : null}
        {entry.meta.punishmentTitles ? (
          <p className="text-xs text-muted-foreground">If skipped: {entry.meta.punishmentTitles}</p>
        ) : null}
        {entry.meta.reminderEnabled === "1" && entry.meta.reminderTime ? (
          <p className="text-xs text-muted-foreground">Reminder {entry.meta.reminderTime}</p>
        ) : null}
        {countdown ? (
          <p className="text-xs text-muted-foreground">{countdown}</p>
        ) : null}
        {spawnLink || spawnMe ? (
          <SpawnCheckbox
            suggested={spawnLink}
            title={entry.title}
            body={entry.body ?? ""}
            sourceKey={sourceKeyFor(entry)}
            sourceEntry={entry}
            me={spawnMe}
            onSpawned={onSpawned}
          />
        ) : null}
        {entry.kind === "journal" ? (
          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
            {entry.meta.visibility === "private" ? "Private" : "Shared"}
          </p>
        ) : null}
        {entry.intensity ? (
          <div className="flex gap-1" aria-label={`Intensity ${entry.intensity}`}>
            {intensityMarks(entry.intensity).map((on, i) => (
              <span
                key={i}
                className={cn("size-2 rounded-full", on ? "bg-primary" : "bg-border")}
              />
            ))}
          </div>
        ) : null}
        {entry.photos.length > 1 ? (
          <PhotoStrip photos={entry.photos.slice(1)} onOpen={onPhoto} />
        ) : null}
        {entry.videos?.length ? <VideoStrip videos={entry.videos} /> : null}
        {entry.pdfs?.length ? <PdfStrip pdfs={entry.pdfs} /> : null}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <p className="text-xs text-muted-foreground">{formatWhen(entry.updatedAt || entry.createdAt)}</p>
          <div className="flex flex-wrap justify-end gap-2">
            {canEdit && (onMoveUp || onMoveDown) ? (
              <div className="flex">
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
              </div>
            ) : null}
            {onBuy && cost && !bought ? (
              <div className="flex flex-col items-end gap-1">
                <Button size="sm" onClick={onBuy}>
                  {shopBuyLabel(entry.kind, cost)}
                </Button>
                {balance < cost ? (
                  <p className="text-[11px] text-muted-foreground">You have {balance} pts</p>
                ) : null}
              </div>
            ) : null}
            {config.completeLabel ? (
              <Button
                size="sm"
                variant={done ? "outline" : "default"}
                onClick={onToggle}
                disabled={paused || Boolean(onBuy && cost && !bought)}
              >
                {paused
                  ? "Paused"
                  : onBuy && cost && !bought
                    ? config.completeLabel
                    : done
                      ? config.reopenLabel ?? "Reopen"
                      : config.completeLabel}
              </Button>
            ) : null}
            {canEdit ? (
              <>
                <Button size="sm" variant="ghost" onClick={onOpen}>
                  {isLibraryNote(entry) ? "Read" : "Edit"}
                </Button>
                <Button size="sm" variant="ghost" onClick={onArchive}>
                  <Archive className="size-3.5" />
                  {entry.status === "archived" ? "Restore" : "Archive"}
                </Button>
                {isLibraryNote(entry) ? null : (
                <Button size="sm" variant="ghost" onClick={onDelete}>
                  <Trash2 className="size-3.5" />
                  Delete
                </Button>
                )}
              </>
            ) : (
              <Button size="sm" variant="ghost" onClick={onOpen}>
                View
              </Button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
