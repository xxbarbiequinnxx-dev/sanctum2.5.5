import { clipIdeaTitle, resolveIdeaSlug } from "./idea-bank";
import { canMutate } from "./house";
import { KINDS, type Kind } from "./kinds";
import { plainExcerpt } from "./notes-library";
import type { Me } from "./types";

export type LinkedPath =
  | "/tasks"
  | "/habits"
  | "/training"
  | "/punishments"
  | "/rewards"
  | "/games"
  | "/talk"
  | "/roleplay"
  | "/challenges"
  | "/scenes"
  | "/journal"
  | "/catalog"
  | "/wishlist";

export type NoteLink = {
  kind: Kind;
  category?: string;
  subcategory?: string;
  cadence?: string;
  label: string;
  path: LinkedPath;
};

function to(kind: Kind, extra?: { category?: string; cadence?: string; label?: string; path?: LinkedPath }): NoteLink {
  const config = KINDS[kind];
  const habit = extra?.cadence === "habit";
  return {
    kind,
    category: extra?.category,
    cadence: extra?.cadence,
    label: extra?.label ?? (habit ? "Habits" : config.title),
    path: extra?.path ?? (habit ? "/habits" : (config.path as LinkedPath)),
  };
}

export const IDEA_LINKS: Record<string, NoteLink> = {
  scenes: to("scene"),
  roleplay: to("roleplay", { category: "prompt" }),
  "public-play": to("scene"),
  exhibitionism: to("scene"),
  voyeurism: to("scene"),
  voyerism: to("scene"),
  praise: to("reward"),
  humiliation: to("scene"),
  punishments: to("punishment"),
  rewards: to("reward"),
  tasks: to("task", { cadence: "once" }),
  commands: to("rabbit", { category: "command" }),
  training: to("rabbit", { category: "protocol" }),
  "temperature-play": to("scene"),
  "sensory-deprivation": to("scene"),
  masochism: to("scene"),
  sadism: to("scene"),
  bondage: to("scene"),
  "cock-worship": to("scene"),
  "double-penetration": to("scene"),
  "triple-penetration": to("scene"),
  electrostimulation: to("scene"),
  "impact-play": to("scene"),
  shibari: to("scene"),
  "orgasm-control": to("scene"),
  games: to("game", { category: "card" }),
  "dominant-self-improvement": to("journal"),
  "submissive-self-improvement": to("journal"),
};

export const ACTIVITY_LINKS: Record<string, NoteLink> = {
  self: to("rabbit", { category: "protocol" }),
  partner: to("talk", { category: "question" }),
  dynamic: to("rabbit", { category: "ritual" }),
  kinks: to("talk", { category: "kink" }),
  communication: to("talk", { category: "question" }),
  play: to("scene"),
  roles: to("roleplay", { category: "prompt" }),
  bratting: to("rabbit", { category: "protocol" }),
  body: to("scene"),
};

export const LIBRARY_LINKS: Record<string, NoteLink> = {
  "ex-confidence": to("rabbit", { category: "protocol" }),
  "ex-improve-self": to("task", { cadence: "habit", label: "Habits", path: "/habits" }),
  "ex-know-partner": to("talk", { category: "question" }),
  "ex-dynamic": to("rabbit", { category: "ritual" }),
  "ex-explore-kink": to("talk", { category: "kink" }),
  "ex-communication": to("talk", { category: "question" }),
  "ex-instructions": to("rabbit", { category: "command" }),
  "ex-create-scene": to("scene"),
  "ex-create-roleplay": to("roleplay", { category: "script" }),
  "ex-role-voice": to("rabbit", { category: "command" }),
  "ex-deal-brat": to("punishment"),
  "ex-be-brat": to("rabbit", { category: "protocol" }),
  "act-body-map": to("journal"),
  "act-edging-lab": to("scene"),
  "act-orgasm-touch": to("rabbit", { category: "ritual" }),
  "act-orgasm-voice": to("rabbit", { category: "ritual" }),
  "act-brat-needs": to("talk", { category: "question" }),
  "act-why-brat": to("talk", { category: "issues" }),
};

export const ASSIGN_PAGES: NoteLink[] = [
  to("scene"),
  to("roleplay", { category: "prompt" }),
  to("task", { cadence: "once" }),
  to("task", { cadence: "habit", label: "Habits", path: "/habits" }),
  to("rabbit", { category: "protocol" }),
  to("punishment"),
  to("reward"),
  to("game", { category: "card" }),
  to("talk", { category: "fantasy" }),
  to("challenge"),
  to("journal"),
  to("catalog", { category: "toy" }),
  to("wishlist", { category: "lingerie" }),
];

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&" + "amp;")
    .replace(/</g, "&" + "lt;")
    .replace(/>/g, "&" + "gt;")
    .replace(/"/g, "&" + "quot;");
}

export function linkForIdea(slug: string | null | undefined): NoteLink | null {
  if (!slug) return null;
  return IDEA_LINKS[slug] ?? IDEA_LINKS[resolveIdeaSlug(slug)] ?? null;
}

export function linkForActivity(slug: string | null | undefined): NoteLink | null {
  if (!slug) return null;
  return ACTIVITY_LINKS[slug] ?? null;
}

export function linkForEntry(entry: {
  category?: string | null;
  subcategory?: string | null;
  meta?: Record<string, string> | null;
}): NoteLink | null {
  const meta = entry.meta ?? {};
  if (meta.libraryKey && LIBRARY_LINKS[meta.libraryKey]) return LIBRARY_LINKS[meta.libraryKey];
  if (meta.ideaBank && IDEA_LINKS[meta.ideaBank]) return IDEA_LINKS[meta.ideaBank];
  if (entry.category === "ideas") return linkForIdea(entry.subcategory);
  if (entry.category === "exercises") return linkForActivity(entry.subcategory);
  return null;
}

export function sourceKeyFor(entry: { id: number; meta?: Record<string, string> | null }): string {
  const meta = entry.meta ?? {};
  if (meta.libraryKey) return `library:${meta.libraryKey}`;
  if (meta.ideaBank && meta.ideaIndex) return `idea:${meta.ideaBank}:${meta.ideaIndex}`;
  return `note:${entry.id}`;
}

export function ideaSourceKey(slug: string, index: number) {
  return `idea:${slug}:${index}`;
}

export function resolveAssign(chosen: NoteLink, suggested?: NoteLink | null): NoteLink {
  if (suggested && chosen.path === suggested.path) return suggested;
  return chosen;
}

export function spawnedPathsOf(meta?: Record<string, string> | null): LinkedPath[] {
  const raw = meta?.spawnedPages ?? "";
  const fromPages = raw
    .split(",")
    .map((item) => item.trim())
    .filter((item): item is LinkedPath => ASSIGN_PAGES.some((page) => page.path === item));
  if (fromPages.length) return fromPages;
  if (meta?.spawnedKind && KINDS[meta.spawnedKind as Kind]) {
    return [KINDS[meta.spawnedKind as Kind].path as LinkedPath];
  }
  return [];
}

export function mergeSpawnedPages(meta: Record<string, string> | null | undefined, path: LinkedPath): string {
  const next = new Set(spawnedPathsOf(meta));
  next.add(path);
  return [...next].join(",");
}

export function isSpawned(entry: { meta?: Record<string, string> | null }): boolean {
  return Boolean(entry.meta?.spawnedId || spawnedPathsOf(entry.meta).length);
}

export function spawnTitle(title: string) {
  return clipIdeaTitle(title, 160);
}

export function spawnBody(link: NoteLink, title: string, html: string) {
  if (link.kind === "talk") {
    const excerpt = plainExcerpt(html, 240);
    return `<p>${escapeHtml(title)}</p>${excerpt ? `<p>${escapeHtml(excerpt)}</p>` : ""}`;
  }
  if (!html.trim()) return `<p>${escapeHtml(title)}</p>`;
  return html;
}

export function spawnFields(link: NoteLink, title: string, html: string, sourceKey: string) {
  const wheel = Boolean(KINDS[link.kind].wheel);
  return {
    kind: link.kind,
    title: spawnTitle(title),
    body: spawnBody(link, title, html),
    category: link.category ?? null,
    subcategory: link.subcategory ?? null,
    cadence: link.cadence ?? (link.kind === "task" ? "once" : null),
    status: "open" as const,
    meta: {
      spawnedFrom: sourceKey,
      ...(link.kind === "journal" ? { visibility: "shared" } : {}),
      ...(wheel ? { onWheel: "1" } : {}),
    },
  };
}

export function assignLabel(link: NoteLink) {
  const cat = KINDS[link.kind].categories?.find((item) => item.value === link.category)?.label ?? link.category;
  const sub = KINDS[link.kind].categories?.find((item) => item.value === link.subcategory)?.label ?? link.subcategory;
  return [link.label, cat, sub].filter(Boolean).join(" · ");
}

export function canAssign(me: Me | null | undefined, link: NoteLink) {
  return canMutate(me, link.kind, link.cadence);
}
