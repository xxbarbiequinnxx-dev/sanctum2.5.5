import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { MediaField } from "@/components/photo-field";
import { PdfField } from "@/components/pdf-field";
import { RichEditor } from "@/components/rich-text";
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
import { createEntry, deleteEntry, getMe, listCategories, listEntries, updateEntry } from "@/lib/api";
import { SaveHint, useAutoSave } from "@/lib/auto-save";
import { catChildren, catPath, catStore } from "@/lib/categories";
import { canSetCost, canSetCountdown, canSetEarnedCount } from "@/lib/house";
import { fillSelectOptions, KINDS, type KindConfig } from "@/lib/kinds";
import { CATALOG_ROLES, parseCatalogRoles, parseLineList, type CatalogRole } from "@/lib/game-deck";
import { countdownMode, parseCountdown, usesCountdown } from "@/lib/countdown";
import { countWord, isCountedKind, parseIdList, parsePoints, stakesModeOf, usesPunishments, usesPoints, usesRewards, type StakesMode } from "@/lib/stakes";
import { applyPdfs } from "@/lib/pdf";
import { applyVideos } from "@/lib/video";
import { encodeCustomDays, parseCustomDays, URGENCY, urgencyOf } from "@/lib/sort";
import type { Category, Entry, Me, PdfAttachment } from "@/lib/types";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const CADENCES = ["daily", "habit", "weekly", "custom", "once"];

type Draft = {
  title: string;
  body: string;
  cadence: string;
  weekday: number | null;
  status: string;
  category: string;
  subcategory: string;
  assignedTo: string;
  intensity: number | null;
  photos: string[];
  videos: { name: string; data: string }[];
  pdfs: PdfAttachment[];
  catalogIds: string[];
  visibility: "shared" | "private";
  stakesMode: StakesMode;
  points: string;
  skipPoints: string;
  rewardIds: string[];
  punishmentIds: string[];
  reminderEnabled: boolean;
  reminderTime: string;
  customDays: number[];
  urgency: string;
  cost: string;
  earnedCount: string;
  cards: string;
  prompts: string;
  catalogRoles: Record<string, CatalogRole>;
  countdownDays: string;
  countdownHours: string;
  countdownMinutes: string;
  onWheel: boolean;
  meta: Record<string, string>;
};

function catalogIdsFrom(meta: Record<string, string>) {
  return (meta.catalogIds ?? "").split(",").map((s) => s.trim()).filter(Boolean);
}

function fromEntry(entry?: Entry | null, defaultAssignee = "", defaultCadence?: string): Draft {
  const meta = { ...(entry?.meta ?? {}) };
  return {
    title: entry?.title ?? "",
    body: entry?.body ?? "",
    cadence: entry?.cadence ?? (entry?.kind === "task" ? defaultCadence || "daily" : defaultCadence || ""),
    weekday: entry?.weekday ?? null,
    status: entry?.status ?? "open",
    category: entry?.category ?? "",
    subcategory: entry?.subcategory ?? "",
    assignedTo: entry?.assignedTo ?? defaultAssignee,
    intensity: entry?.intensity ?? null,
    photos: entry?.photos ?? (entry?.photoData ? [entry.photoData] : []),
    videos: entry?.videos ?? [],
    pdfs: entry?.pdfs ?? [],
    catalogIds: catalogIdsFrom(meta),
    visibility: meta.visibility === "private" ? "private" : "shared",
    stakesMode: stakesModeOf(meta),
    points: meta.points ?? "",
    skipPoints: meta.skipPoints ?? "",
    rewardIds: parseIdList(meta.rewardIds).map(String),
    punishmentIds: parseIdList(meta.punishmentIds).map(String),
    reminderEnabled: meta.reminderEnabled === "1",
    reminderTime: meta.reminderTime ?? "09:00",
    customDays: parseCustomDays(meta.customDays),
    urgency: urgencyOf(meta),
    cost: meta.cost ?? "",
    earnedCount: meta.earnedCount ?? (entry?.kind === "punishment" && entry.assignedTo ? "1" : "0"),
    cards: parseLineList(meta.cards).join("\n"),
    prompts: parseLineList(meta.prompts).join("\n"),
    catalogRoles: parseCatalogRoles(meta),
    countdownDays: String(parseCountdown(meta).days || ""),
    countdownHours: String(parseCountdown(meta).hours || ""),
    countdownMinutes: String(parseCountdown(meta).minutes || ""),
    onWheel: meta.onWheel !== "0",
    meta,
  };
}

export function EntryForm({
  config,
  entry,
  open,
  onOpenChange,
  onSaved,
  defaultCadence,
  defaultCategory,
  defaultSubcategory,
  addLabel,
  readOnly = false,
}: {
  config: KindConfig;
  entry?: Entry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (entry: Entry, removed?: boolean) => void;
  defaultCadence?: string;
  defaultCategory?: string;
  defaultSubcategory?: string;
  addLabel?: string;
  readOnly?: boolean;
}) {
  const spec = fillSelectOptions(config);
  const [me, setMe] = useState<Me | null>(null);
  const [cats, setCats] = useState<Category[]>([]);
  const [catalog, setCatalog] = useState<Entry[]>([]);
  const [rewards, setRewards] = useState<Entry[]>([]);
  const [punishments, setPunishments] = useState<Entry[]>([]);
  const [draft, setDraft] = useState<Draft>(() => fromEntry(entry, "", defaultCadence));
  const [saving, setSaving] = useState(false);
  const entryId = entry?.id ?? null;
  const entryRef = useRef(entry);
  // Do not overwrite the ID assigned by the first autosave on every render.
  useEffect(() => { entryRef.current = entry; }, [entryId, open]);
  const persistSeq = useRef(0);

  useEffect(() => {
    if (!open) return;
    const current = entryRef.current;
    setDraft(fromEntry(current, current?.assignedTo ?? "", defaultCadence));
    let cancelled = false;
    void getMe().then((data) => {
      if (cancelled) return;
      setMe(data);
      const fallback = data.partner?.userId ?? data.profile?.userId ?? "";
      setDraft((prev) => {
        const next = { ...prev };
        if (!next.assignedTo || (next.assignedTo === "both" && !data.partner)) {
          next.assignedTo = current?.assignedTo && current.assignedTo !== "both" ? current.assignedTo : fallback;
        }
        if (!current && spec.kind === "game" && !next.category) next.category = "card";
        if (!current && spec.kind === "task" && defaultCadence && !next.cadence) next.cadence = defaultCadence;
        if (!current && defaultCategory && !next.category) {
          next.category = defaultCategory;
          next.subcategory = defaultSubcategory ?? "";
        }
        return next;
      });
    });
    void listCategories({ data: { kind: spec.kind } }).then(setCats).catch(() => setCats([]));
    if (spec.catalogLink) {
      void listEntries({ data: { kind: "catalog" } }).then(setCatalog).catch(() => setCatalog([]));
    }
    if (spec.stakes) {
      void listEntries({ data: { kind: "reward" } }).then(setRewards).catch(() => setRewards([]));
      void listEntries({ data: { kind: "punishment" } })
        .then(setPunishments)
        .catch(() => setPunishments([]));
    }
    return () => {
      cancelled = true;
    };
  }, [open, entryId, spec.kind, spec.catalogLink, spec.stakes, defaultCadence, defaultCategory, defaultSubcategory]);

  const parents = useMemo(() => catChildren(cats, null), [cats]);
  const catChain = useMemo(() => {
    const leaf = draft.subcategory || draft.category;
    const path = catPath(cats, leaf);
    if (path.length && path[0]?.slug === draft.category) return path;
    const root = cats.find((c) => c.slug === draft.category);
    return root ? [root, ...path.filter((item) => item.slug !== root.slug)] : path;
  }, [cats, draft.category, draft.subcategory]);
  const nestedLevels = useMemo(() => {
    const levels: { parent: string; items: Category[]; value: string }[] = [];
    if (!draft.category) return levels;
    let parent = draft.category;
    for (let i = 1; i < 8; i += 1) {
      const items = catChildren(cats, parent);
      if (!items.length) break;
      const value = catChain[i]?.slug ?? "";
      levels.push({ parent, items, value });
      if (!value) break;
      parent = value;
    }
    return levels;
  }, [cats, catChain, draft.category]);
  const cadenceOptions = useMemo(() => {
    if (!entry && defaultCadence === "habit") return ["habit"];
    if (!entry && defaultCadence) return CADENCES.filter((value) => value !== "habit");
    return CADENCES;
  }, [entry, defaultCadence]);

  const catalogGroups = useMemo(() => {
    const known = new Set((KINDS.catalog.categories ?? []).map((group) => group.value));
    const groups = (KINDS.catalog.categories ?? []).map((group) => ({
      ...group,
      items: catalog.filter((item) => item.category === group.value),
    }));
    const rest = catalog.filter((item) => !item.category || !known.has(item.category));
    if (rest.length) groups.push({ value: "other", label: "Other", items: rest });
    return groups.filter((group) => group.items.length > 0);
  }, [catalog]);

  function setMeta(key: string, value: string) {
    setDraft((prev) => ({ ...prev, meta: { ...prev.meta, [key]: value } }));
  }

  async function persist(close: boolean) {
    if (!draft.title.trim()) {
      if (close) toast.error("Give it a title.");
      return;
    }
    const current = entryRef.current;
    const seq = ++persistSeq.current;
    setSaving(true);
    try {
      const titles = catalog
        .filter((item) => draft.catalogIds.includes(String(item.id)))
        .map((item) => item.title);
      const rewardTitles = rewards
        .filter((item) => draft.rewardIds.includes(String(item.id)))
        .map((item) => item.title);
      const punishmentTitles = punishments
        .filter((item) => draft.punishmentIds.includes(String(item.id)))
        .map((item) => item.title);
      const meta: Record<string, string> = applyVideos(applyPdfs({ ...draft.meta }, draft.pdfs), draft.videos);
      meta.catalogIds = draft.catalogIds.join(",");
      meta.catalogTitles = titles.join(" · ");
      if (spec.kind === "journal") meta.visibility = draft.visibility;
      if (spec.kind === "task") meta.urgency = draft.urgency || "normal";
      else delete meta.urgency;
      if (draft.cadence === "custom") meta.customDays = encodeCustomDays(draft.customDays);
      else delete meta.customDays;
      if (spec.shop) {
        if (canSetCost(me)) {
          const cost = parsePoints(draft.cost);
          if (cost != null && cost > 0) meta.cost = String(cost);
          else delete meta.cost;
        } else if (current?.meta.cost) {
          meta.cost = current.meta.cost;
        } else {
          delete meta.cost;
        }
      }
      if (isCountedKind(spec.kind)) {
        if (canSetEarnedCount(me)) {
          const n = Number(draft.earnedCount);
          meta.earnedCount = String(Number.isFinite(n) && n >= 0 ? Math.min(999, Math.trunc(n)) : 0);
        } else if (current?.meta.earnedCount != null && current.meta.earnedCount !== "") {
          meta.earnedCount = current.meta.earnedCount;
        } else {
          meta.earnedCount = spec.kind === "punishment" && draft.assignedTo ? "1" : "0";
        }
      }
      if (spec.kind === "game") {
        const cards = parseLineList(draft.cards).slice(0, 60);
        const prompts = parseLineList(draft.prompts).slice(0, 60);
        if (cards.length) meta.cards = JSON.stringify(cards);
        else delete meta.cards;
        if (prompts.length) meta.prompts = JSON.stringify(prompts);
        else delete meta.prompts;
        const roles: Record<string, CatalogRole> = {};
        for (const id of draft.catalogIds) {
          roles[id] = draft.catalogRoles[id] ?? "prop";
        }
        if (Object.keys(roles).length) meta.catalogRoles = JSON.stringify(roles);
        else delete meta.catalogRoles;
      } else {
        delete meta.cards;
        delete meta.prompts;
        delete meta.catalogRoles;
      }
      if (spec.wheel) meta.onWheel = draft.onWheel ? "1" : "0";
      else delete meta.onWheel;
      if (usesCountdown(spec.kind, draft.cadence)) {
        if (canSetCountdown(me)) {
          const days = Math.max(0, Math.min(365, Math.trunc(Number(draft.countdownDays) || 0)));
          const hours = Math.max(0, Math.min(23, Math.trunc(Number(draft.countdownHours) || 0)));
          const minutes = Math.max(0, Math.min(59, Math.trunc(Number(draft.countdownMinutes) || 0)));
          if (days || hours || minutes) {
            meta.countdownDays = String(days);
            meta.countdownHours = String(hours);
            meta.countdownMinutes = String(minutes);
            const prev = current ? parseCountdown(current.meta) : { days: 0, hours: 0, minutes: 0 };
            const changed = !current || prev.days !== days || prev.hours !== hours || prev.minutes !== minutes;
            meta.countdownAnchor = changed || !current?.meta.countdownAnchor ? new Date().toISOString() : current.meta.countdownAnchor;
          } else {
            delete meta.countdownDays;
            delete meta.countdownHours;
            delete meta.countdownMinutes;
            delete meta.countdownAnchor;
          }
        } else if (current) {
          for (const key of ["countdownDays", "countdownHours", "countdownMinutes", "countdownAnchor"] as const) {
            if (current.meta[key]) meta[key] = current.meta[key]!;
            else delete meta[key];
          }
        }
      } else {
        delete meta.countdownDays;
        delete meta.countdownHours;
        delete meta.countdownMinutes;
        delete meta.countdownAnchor;
      }
      if (spec.stakes) {
        meta.stakesMode = draft.stakesMode;
        const pts = parsePoints(draft.points);
        const skip = parsePoints(draft.skipPoints);
        if (usesPoints(draft.stakesMode) && pts != null) meta.points = String(pts);
        else delete meta.points;
        if (usesPoints(draft.stakesMode) && skip != null) meta.skipPoints = String(skip);
        else delete meta.skipPoints;
        if (usesRewards(draft.stakesMode)) {
          meta.rewardIds = draft.rewardIds.join(",");
          meta.rewardTitles = rewardTitles.join(" · ");
        } else {
          delete meta.rewardIds;
          delete meta.rewardTitles;
        }
        if (usesPunishments(draft.stakesMode)) {
          meta.punishmentIds = draft.punishmentIds.join(",");
          meta.punishmentTitles = punishmentTitles.join(" · ");
        } else {
          delete meta.punishmentIds;
          delete meta.punishmentTitles;
        }
        meta.reminderEnabled = draft.reminderEnabled ? "1" : "0";
        meta.reminderTime = draft.reminderEnabled ? draft.reminderTime : "";
      }
      const payload = {
        kind: spec.kind,
        title: draft.title.trim(),
        body: draft.body,
        cadence: spec.kind === "task" ? draft.cadence || "daily" : draft.cadence || null,
        weekday: draft.weekday,
        status: draft.status,
        category: draft.category || null,
        subcategory: draft.subcategory || null,
        assignedTo: spec.assignable ? draft.assignedTo || null : null,
        intensity: draft.intensity,
        photos: draft.photos,
        photoData: draft.photos[0] ?? null,
        meta,
      };
      const saved = current
        ? await updateEntry({ data: { id: current.id, ...payload } })
        : await createEntry({ data: payload });
      if (seq !== persistSeq.current) return;
      // Autosave must update the newly-created entry, not create duplicates.
      entryRef.current = saved;
      onSaved(saved);
      if (close) onOpenChange(false);
    } catch (err) {
      if (close) toast.error(err instanceof Error ? err.message : "Could not save.");
      else throw err;
    } finally {
      setSaving(false);
    }
  }

  const autoStatus = useAutoSave(
    JSON.stringify(draft),
    () => persist(false),
    {
      delay: 700,
      enabled: Boolean(open && entryId && !readOnly && draft.title.trim()),
      resetKey: `${open}:${entryId ?? "new"}`,
    },
  );

  async function remove() {
    if (!entry) return;
    if (typeof window !== "undefined" && !window.confirm(`Delete “${entry.title}”? This cannot be undone.`)) {
      return;
    }
    setSaving(true);
    try {
      await deleteEntry({ data: { id: entry.id } });
      onSaved(entry, true);
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete.");
    } finally {
      setSaving(false);
    }
  }

  async function archiveNow() {
    if (!entry) return;
    const nextStatus = draft.status === "archived" ? "open" : "archived";
    setSaving(true);
    try {
      const saved = await updateEntry({
        data: { id: entry.id, kind: spec.kind, status: nextStatus },
      });
      onSaved(saved);
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not archive.");
    } finally {
      setSaving(false);
    }
  }

  const profile = me?.profile;
  const partner = me?.partner;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && entryId && !readOnly && draft.title.trim()) {
          void persist(false).catch(() => {});
        }
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{entry ? (readOnly ? "View" : "Edit") : addLabel ?? spec.addLabel}</DialogTitle>
          <DialogDescription>{spec.blurb}</DialogDescription>
        </DialogHeader>
        <div className={cn("space-y-4", readOnly && "pointer-events-none opacity-90")}>
          <Field label="Title">
            <Input
              value={draft.title}
              onChange={(e) => setDraft((p) => ({ ...p, title: e.target.value }))}
              placeholder="Name this"
              maxLength={160}
            />
          </Field>
          {spec.kind === "journal" ? (
            <Field label="Visibility">
              <div className="grid grid-cols-2 gap-1 rounded-lg bg-secondary p-1">
                {(["shared", "private"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setDraft((p) => ({ ...p, visibility: value }))}
                    className={cn(
                      "h-9 rounded-md text-sm capitalize",
                      draft.visibility === value
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {value}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {draft.visibility === "private"
                  ? "Only you can read this page."
                  : "Your partner can read this page and leave comments."}
              </p>
            </Field>
          ) : null}
          {spec.assignable && profile ? (
            <Field label="Assign to">
              <Select
                value={draft.assignedTo}
                onChange={(e) => setDraft((p) => ({ ...p, assignedTo: e.target.value }))}
              >
                <option value={profile.userId}>{profile.displayName || "Me"} ({profile.role})</option>
                {partner ? (
                  <option value={partner.userId}>
                    {partner.displayName || "Partner"} ({partner.role})
                  </option>
                ) : null}
                {partner ? <option value="both">Both of us</option> : null}
              </Select>
            </Field>
          ) : null}
          {isCountedKind(spec.kind) ? (
            <Field label={`Times ${countWord(spec.kind)}`}>
              <Input
                type="number"
                min={0}
                max={999}
                inputMode="numeric"
                value={draft.earnedCount}
                disabled={!canSetEarnedCount(me)}
                onChange={(e) => setDraft((p) => ({ ...p, earnedCount: e.target.value }))}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">
                {canSetEarnedCount(me)
                  ? `How many times this has been ${countWord(spec.kind)}. Completing it still adds to this.`
                  : "Your Dominant has locked these counts. Completing still belongs to you."}
              </p>
            </Field>
          ) : null}
          {spec.kind === "task" ? (
            <Field label="Importance">
              <div className="grid grid-cols-4 gap-1 rounded-lg bg-secondary p-1">
                {URGENCY.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setDraft((p) => ({ ...p, urgency: item.value }))}
                    className={cn(
                      "h-9 rounded-md text-sm",
                      draft.urgency === item.value
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </Field>
          ) : null}
          {spec.shop ? (
            <Field label="Points cost">
              <Input
                type="number"
                min={0}
                inputMode="numeric"
                value={draft.cost}
                disabled={!canSetCost(me)}
                onChange={(e) => setDraft((p) => ({ ...p, cost: e.target.value }))}
                placeholder="Leave blank if it is not for sale"
              />
              <p className="text-xs text-muted-foreground">
                {canSetCost(me)
                  ? "The Submissive can spend their points to buy this. Leave empty to grant it without a price."
                  : "Your Dominant has locked price changes. You can still buy it with your points."}
              </p>
            </Field>
          ) : null}
          {parents.length ? (
            <Field label="Category">
              <Select
                value={draft.category}
                onChange={(e) =>
                  setDraft((p) => ({ ...p, category: e.target.value, subcategory: "" }))
                }
              >
                <option value="">Choose…</option>
                {parents.map((opt) => (
                  <option key={opt.slug} value={opt.slug}>
                    {opt.name}
                  </option>
                ))}
              </Select>
            </Field>
          ) : null}
          {nestedLevels.map((level, index) => (
            <Field key={`${level.parent}-${index}`} label={index === 0 ? "Sub-category" : "Nested category"}>
              <Select
                value={level.value}
                onChange={(e) => {
                  const next = e.target.value;
                  setDraft((p) => {
                    if (!next) {
                      return {
                        ...p,
                        subcategory: index === 0 ? "" : (catChain[index]?.slug ?? ""),
                      };
                    }
                    const stored = catStore(cats, next);
                    return {
                      ...p,
                      category: stored.category ?? p.category,
                      subcategory: stored.subcategory ?? next,
                    };
                  });
                }}
              >
                <option value="">None</option>
                {level.items.map((opt) => (
                  <option key={opt.slug} value={opt.slug}>
                    {opt.name}
                  </option>
                ))}
              </Select>
            </Field>
          ))}
          {spec.fields.map((field) => {
            if (field.key === "category") return null;
            if (field.key === "body") {
              return (
                <Field key={field.key} label={field.label}>
                  <RichEditor
                    value={draft.body}
                    onChange={(html) => setDraft((p) => ({ ...p, body: html }))}
                    placeholder={field.placeholder}
                  />
                </Field>
              );
            }
            if (field.type === "cadence") {
              if (cadenceOptions.length <= 1) return null;
              return (
                <Field key={field.key} label={field.label}>
                  <div className="flex flex-wrap gap-1 rounded-lg bg-secondary p-1">
                    {cadenceOptions.map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setDraft((p) => ({ ...p, cadence: value }))}
                        className={cn(
                          "h-9 min-w-14 flex-1 rounded-md px-2 text-sm capitalize",
                          draft.cadence === value
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                  {draft.cadence === "weekly" ? (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {WEEKDAYS.map((day, i) => (
                        <button
                          key={day}
                          type="button"
                          onClick={() =>
                            setDraft((p) => ({ ...p, weekday: p.weekday === i ? null : i }))
                          }
                          className={cn(
                            "h-9 min-w-11 rounded-md px-2 text-xs",
                            draft.weekday === i
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  ) : null}
                  {draft.cadence === "custom" ? (
                    <div className="mt-2">
                      <p className="mb-1 text-xs text-muted-foreground">Set days</p>
                      <div className="flex flex-wrap gap-1">
                        {WEEKDAYS.map((day, i) => {
                          const on = draft.customDays.includes(i);
                          return (
                            <button
                              key={day}
                              type="button"
                              onClick={() =>
                                setDraft((p) => ({
                                  ...p,
                                  customDays: on
                                    ? p.customDays.filter((d) => d !== i)
                                    : [...p.customDays, i].sort((a, b) => a - b),
                                }))
                              }
                              className={cn(
                                "h-9 min-w-11 rounded-md px-2 text-xs",
                                on
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground",
                              )}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </Field>
              );
            }
            if (field.type === "select") {
              if (field.key === "category" && parents.length) return null;
              return (
                <Field key={field.key} label={field.label}>
                  <Select
                    value={draft.category}
                    onChange={(e) => setDraft((p) => ({ ...p, category: e.target.value, subcategory: "" }))}
                  >
                    <option value="">Choose…</option>
                    {(field.options ?? []).map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Select>
                </Field>
              );
            }
            if (field.type === "intensity") {
              return (
                <Field key={field.key} label={field.label}>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() =>
                          setDraft((p) => ({ ...p, intensity: p.intensity === n ? null : n }))
                        }
                        className={cn(
                          "size-9 rounded-full border",
                          (draft.intensity ?? 0) >= n
                            ? "border-primary bg-primary"
                            : "border-input bg-transparent",
                        )}
                        aria-label={`${n}`}
                      />
                    ))}
                  </div>
                </Field>
              );
            }
            if (field.type === "textarea") {
              return (
                <Field key={field.key} label={field.label}>
                  <RichEditor
                    value={draft.meta[field.key] ?? ""}
                    onChange={(html) => setMeta(field.key, html)}
                    placeholder={field.placeholder}
                    compact
                  />
                </Field>
              );
            }
            return (
              <Field key={field.key} label={field.label}>
                <Input
                  value={draft.meta[field.key] ?? ""}
                  onChange={(e) => setMeta(field.key, e.target.value)}
                  placeholder={field.placeholder}
                />
              </Field>
            );
          })}
          {spec.stakes ? (
            <TaskStakes
              draft={draft}
              setDraft={setDraft}
              rewards={rewards}
              punishments={punishments}
              canSkip={spec.kind === "task" || spec.kind === "rabbit"}
            />
          ) : null}
          {spec.catalogLink ? (
            <div className="space-y-2">
              <Label>From the catalogue</Label>
              <p className="text-xs text-muted-foreground">
                {spec.kind === "game"
                  ? "Attach a piece as a prop, or use it as a card or a prompt you can draw."
                  : "Attach toys, outfits, accessories, restraints, furniture, or spaces."}
              </p>
              {catalog.length === 0 ? (
                <p className="rounded-md bg-secondary px-3 py-3 text-sm text-muted-foreground">
                  The catalogue is empty.{" "}
                  <Link to="/catalog" className="text-primary underline-offset-2 hover:underline">
                    Add items
                  </Link>
                  , then attach them here.
                </p>
              ) : (
                <div className="max-h-64 space-y-3 overflow-y-auto">
                  {catalogGroups.map((group) => (
                    <div key={group.value}>
                      <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                        {group.label}
                      </p>
                      <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                        {group.items.map((item) => {
                          const id = String(item.id);
                          const on = draft.catalogIds.includes(id);
                          const role = on ? (draft.catalogRoles[id] ?? "prop") : null;
                          return (
                            <div
                              key={item.id}
                              className={cn(
                                "rounded-md border px-2 py-2",
                                on ? "border-primary bg-primary/10" : "border-border",
                              )}
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  setDraft((p) => {
                                    if (on) {
                                      const nextRoles = { ...p.catalogRoles };
                                      delete nextRoles[id];
                                      return {
                                        ...p,
                                        catalogIds: p.catalogIds.filter((value) => value !== id),
                                        catalogRoles: nextRoles,
                                      };
                                    }
                                    return {
                                      ...p,
                                      catalogIds: [...p.catalogIds, id],
                                      catalogRoles: { ...p.catalogRoles, [id]: "prop" },
                                    };
                                  })
                                }
                                className="flex w-full items-center gap-2 text-left text-xs"
                              >
                                {item.photos[0] ? (
                                  <img
                                    src={item.photos[0]}
                                    alt=""
                                    className="size-8 shrink-0 rounded object-cover"
                                  />
                                ) : (
                                  <span className="grid size-8 shrink-0 place-items-center rounded bg-secondary text-[10px] uppercase text-muted-foreground">
                                    {group.label.slice(0, 2)}
                                  </span>
                                )}
                                <span className="truncate">{item.title}</span>
                              </button>
                              {on && spec.kind === "game" ? (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {CATALOG_ROLES.map((option) => (
                                    <button
                                      key={option.value}
                                      type="button"
                                      title={option.hint}
                                      onClick={() =>
                                        setDraft((p) => ({
                                          ...p,
                                          catalogRoles: { ...p.catalogRoles, [id]: option.value },
                                        }))
                                      }
                                      className={cn(
                                        "h-7 rounded-full px-2.5 text-[11px]",
                                        role === option.value
                                          ? "bg-primary text-primary-foreground"
                                          : "bg-secondary text-muted-foreground",
                                      )}
                                    >
                                      {option.label}
                                    </button>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}
          {spec.kind === "game" ? (
            <>
              <Field label="Cards">
                <textarea
                  value={draft.cards}
                  disabled={readOnly}
                  onChange={(e) => setDraft((p) => ({ ...p, cards: e.target.value }))}
                  placeholder={"Present — Kneel until you are acknowledged.\nHold still — Stay in position until released."}
                  className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  One card per line. Use Title — the command if you want a subtitle. Catalogue pieces set to Card join this pile when you draw.
                </p>
              </Field>
              <Field label="Prompts">
                <textarea
                  value={draft.prompts}
                  disabled={readOnly}
                  onChange={(e) => setDraft((p) => ({ ...p, prompts: e.target.value }))}
                  placeholder={"What would you do if I asked you to wait here?\nName a limit you want restated."}
                  className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  One prompt per line. Catalogue pieces set to Prompt join this pile.
                </p>
              </Field>
            </>
          ) : null}
          {spec.wheel ? (
            <div className="flex items-center justify-between gap-3 rounded-lg bg-secondary/70 px-3 py-3">
              <div>
                <p className="text-sm font-medium">Add to the wheel</p>
                <p className="text-xs text-muted-foreground">Spin this page's chance wheel and this title can come up.</p>
              </div>
              <button
                type="button"
                disabled={readOnly}
                onClick={() => setDraft((p) => ({ ...p, onWheel: !p.onWheel }))}
                className={cn(
                  "h-9 rounded-full px-3 text-sm",
                  draft.onWheel ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground",
                )}
              >
                {draft.onWheel ? "On the wheel" : "Off"}
              </button>
            </div>
          ) : null}
          {usesCountdown(spec.kind, draft.cadence) ? (
            <div className="space-y-2">
              <Label>{countdownMode(spec.kind) === "starts" ? "Time until it starts" : "Time until it ends"}</Label>
              <div className="grid grid-cols-3 gap-2">
                <label className="text-xs text-muted-foreground">
                  Days
                  <Input
                    type="number"
                    min={0}
                    max={365}
                    disabled={readOnly || !canSetCountdown(me)}
                    value={draft.countdownDays}
                    onChange={(e) => setDraft((p) => ({ ...p, countdownDays: e.target.value }))}
                  />
                </label>
                <label className="text-xs text-muted-foreground">
                  Hours
                  <Input
                    type="number"
                    min={0}
                    max={23}
                    disabled={readOnly || !canSetCountdown(me)}
                    value={draft.countdownHours}
                    onChange={(e) => setDraft((p) => ({ ...p, countdownHours: e.target.value }))}
                  />
                </label>
                <label className="text-xs text-muted-foreground">
                  Minutes
                  <Input
                    type="number"
                    min={0}
                    max={59}
                    disabled={readOnly || !canSetCountdown(me)}
                    value={draft.countdownMinutes}
                    onChange={(e) => setDraft((p) => ({ ...p, countdownMinutes: e.target.value }))}
                  />
                </label>
              </div>
              <p className="text-xs text-muted-foreground">
                {canSetCountdown(me)
                  ? "Shown as a countdown on Home. Saving a new duration starts the clock from now."
                  : "Your Dominant has locked timers. Completing this still belongs to you."}
              </p>
            </div>
          ) : null}
          <Field label="Status">
            <Select
              value={draft.status}
              onChange={(e) => setDraft((p) => ({ ...p, status: e.target.value }))}
            >
              {spec.statuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </Select>
          </Field>
          <MediaField
            photos={draft.photos}
            videos={draft.videos}
            onPhotos={(photos) => setDraft((p) => ({ ...p, photos }))}
            onVideos={(videos) => setDraft((p) => ({ ...p, videos }))}
          />
          <PdfField
            pdfs={draft.pdfs}
            onChange={(pdfs) => setDraft((p) => ({ ...p, pdfs }))}
            onInsertText={(name, text) =>
              setDraft((p) => {
                const escape = (value: string) =>
                  value
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;")
                    .replace(/\"/g, "&quot;")
                    .replace(/'/g, "&#39;");
                const block = `<h3>${escape(name)}</h3>${text
                  .split(/\n{2,}/)
                  .map((part) => `<p>${escape(part).replace(/\n/g, "<br>")}</p>`)
                  .join("")}`;
                return { ...p, body: p.body ? `${p.body}<hr>${block}` : block };
              })
            }
          />
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {entry && !readOnly ? (
              <>
                <SaveHint status={saving ? "saving" : autoStatus} />
                <div className="ml-auto flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => void persist(true)} disabled={saving}>
                    Done
                  </Button>
                  <Button variant="outline" onClick={() => void archiveNow()} disabled={saving}>
                    {draft.status === "archived" ? "Unarchive" : "Archive"}
                  </Button>
                  <Button variant="outline" onClick={() => void remove()} disabled={saving}>
                    Delete
                  </Button>
                </div>
              </>
            ) : (
              <Button onClick={() => void persist(true)} disabled={saving || readOnly} className="flex-1">
                {readOnly ? "View only" : saving ? "Saving…" : "Save"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function TaskStakes({
  draft,
  setDraft,
  rewards,
  punishments,
  canSkip,
}: {
  draft: Draft;
  setDraft: (updater: (prev: Draft) => Draft) => void;
  rewards: Entry[];
  punishments: Entry[];
  canSkip: boolean;
}) {
  const modes: { value: StakesMode; label: string }[] = [
    { value: "none", label: "None" },
    { value: "points", label: "Points" },
    { value: "items", label: "Reward" },
    { value: "punishments", label: "Punishments" },
  ];
  const openRewards = rewards.filter((item) => item.status !== "archived");
  const openPunishments = punishments.filter((item) => item.status !== "archived");
  const selectedMode = draft.stakesMode === "both" ? "punishments" : draft.stakesMode;

  function toggleId(key: "rewardIds" | "punishmentIds", id: string) {
    setDraft((p) => {
      const on = p[key].includes(id);
      return { ...p, [key]: on ? p[key].filter((item) => item !== id) : [...p[key], id] };
    });
  }

  return (
    <div className="space-y-4 rounded-lg border border-border p-3">
      <Field label="Stakes">
        <div className="grid grid-cols-4 gap-1 rounded-lg bg-secondary p-1">
          {modes.map((mode) => (
            <button
              key={mode.value}
              type="button"
              onClick={() => setDraft((p) => ({ ...p, stakesMode: mode.value }))}
              className={cn(
                "h-9 rounded-md text-xs",
                selectedMode === mode.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {mode.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Completing assigns points or a reward. Skipping or missing the due time assigns a punishment.
        </p>
      </Field>
      {usesPoints(draft.stakesMode) ? (
        canSkip ? (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Points if done">
              <Input
                type="number"
                inputMode="numeric"
                value={draft.points}
                onChange={(e) => setDraft((p) => ({ ...p, points: e.target.value }))}
                placeholder="e.g. 10"
              />
            </Field>
            <Field label="Points if missed">
              <Input
                type="number"
                inputMode="numeric"
                value={draft.skipPoints}
                onChange={(e) => setDraft((p) => ({ ...p, skipPoints: e.target.value }))}
                placeholder="e.g. -5"
              />
            </Field>
          </div>
        ) : (
          <Field label="Points if done">
            <Input
              type="number"
              inputMode="numeric"
              value={draft.points}
              onChange={(e) => setDraft((p) => ({ ...p, points: e.target.value }))}
              placeholder="e.g. 10"
            />
          </Field>
        )
      ) : null}
      {usesRewards(draft.stakesMode) ? (
        <div className="space-y-2">
          <Label>Rewards on complete</Label>
          {openRewards.length === 0 ? (
            <p className="text-xs text-muted-foreground">No rewards posted yet.</p>
          ) : (
            <div className="flex flex-wrap gap-1">
              {openRewards.map((item) => {
                const on = draft.rewardIds.includes(String(item.id));
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleId("rewardIds", String(item.id))}
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
          )}
        </div>
      ) : null}
      {usesPunishments(draft.stakesMode) && canSkip ? (
        <div className="space-y-2">
          <Label>Punishments if skipped or overdue</Label>
          {openPunishments.length === 0 ? (
            <p className="text-xs text-muted-foreground">No punishments posted yet.</p>
          ) : (
            <div className="flex flex-wrap gap-1">
              {openPunishments.map((item) => {
                const on = draft.punishmentIds.includes(String(item.id));
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleId("punishmentIds", String(item.id))}
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
          )}
        </div>
      ) : null}
      <Field label="Reminder">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setDraft((p) => ({ ...p, reminderEnabled: !p.reminderEnabled }))}
            className={cn(
              "h-9 rounded-full px-3 text-sm",
              draft.reminderEnabled ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground",
            )}
          >
            {draft.reminderEnabled ? "On" : "Off"}
          </button>
          <Input
            type="time"
            value={draft.reminderTime}
            disabled={!draft.reminderEnabled}
            onChange={(e) => setDraft((p) => ({ ...p, reminderTime: e.target.value }))}
            className="max-w-40"
          />
        </div>
        <p className="text-xs text-muted-foreground">Shown on Home while this is still open.</p>
      </Field>
    </div>
  );
}
