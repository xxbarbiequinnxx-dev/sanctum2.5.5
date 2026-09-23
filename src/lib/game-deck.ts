import type { Entry } from "@/lib/types";

export type CatalogRole = "prop" | "card" | "prompt";

export type DeckItem = {
  key: string;
  title: string;
  body: string;
  photo: string | null;
  source: "written" | "catalog";
};

export const CATALOG_ROLES: { value: CatalogRole; label: string; hint: string }[] = [
  { value: "prop", label: "Prop", hint: "On the table, not drawn" },
  { value: "card", label: "Card", hint: "Joins the card pile" },
  { value: "prompt", label: "Prompt", hint: "Joins the prompt pile" },
];

export function parseLineList(raw?: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      return parsed
        .map((item) => {
          if (typeof item === "string") return item;
          if (item && typeof item === "object" && "title" in item) {
            const title = String((item as { title: unknown }).title ?? "").trim();
            const body = "body" in item ? String((item as { body: unknown }).body ?? "").trim() : "";
            return body ? `${title} — ${body}` : title;
          }
          return "";
        })
        .map((line) => line.trim())
        .filter(Boolean);
    }
  } catch {
    /* newline list */
  }
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function parseDeckLine(line: string): { title: string; body: string } {
  const [left, ...rest] = line.split("—");
  return {
    title: (left ?? "").trim() || "Card",
    body: rest.join("—").trim(),
  };
}

export function parseCatalogRoles(meta: Record<string, string>): Record<string, CatalogRole> {
  const ids = (meta.catalogIds ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const roles: Record<string, CatalogRole> = {};
  try {
    const parsed = JSON.parse(meta.catalogRoles || "{}") as unknown;
    if (parsed && typeof parsed === "object") {
      for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
        if (value === "prop" || value === "card" || value === "prompt") roles[key] = value;
      }
    }
  } catch {
    /* ignore */
  }
  for (const id of ids) {
    if (!roles[id]) roles[id] = "prop";
  }
  return roles;
}

function plainText(html: string) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function catalogTitleAt(meta: Record<string, string>, index: number) {
  return (meta.catalogTitles ?? "")
    .split(" · ")
    .map((value) => value.trim())
    .filter(Boolean)[index];
}

export function buildGameDecks(entry: Entry, catalog: Entry[]) {
  const byId = new Map(catalog.map((item) => [String(item.id), item]));
  const roles = parseCatalogRoles(entry.meta);
  const cards: DeckItem[] = parseLineList(entry.meta.cards).map((line, index) => {
    const parsed = parseDeckLine(line);
    return { key: `card:${index}:${parsed.title}`, ...parsed, photo: null, source: "written" as const };
  });
  const prompts: DeckItem[] = parseLineList(entry.meta.prompts).map((line, index) => {
    const parsed = parseDeckLine(line);
    return { key: `prompt:${index}:${parsed.title}`, ...parsed, photo: null, source: "written" as const };
  });
  const ids = (entry.meta.catalogIds ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  ids.forEach((id, index) => {
    const role = roles[id];
    if (role !== "card" && role !== "prompt") return;
    const item = byId.get(id);
    const deckItem: DeckItem = {
      key: `catalog:${id}`,
      title: item?.title || catalogTitleAt(entry.meta, index) || "Catalogue item",
      body: item ? plainText(item.body).slice(0, 180) : "",
      photo: item?.photos[0] ?? null,
      source: "catalog",
    };
    if (role === "card") cards.push(deckItem);
    else prompts.push(deckItem);
  });
  return { cards, prompts };
}

export function shuffleItems<T>(items: T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j]!, next[i]!];
  }
  return next;
}
