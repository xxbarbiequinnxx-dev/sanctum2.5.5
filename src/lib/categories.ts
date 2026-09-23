import type { Category } from "@/lib/types";

export function catChildren(cats: Category[], parent: string | null | undefined) {
  const key = parent ?? "";
  return cats.filter((item) => !item.archived && (item.parentSlug ?? "") === key);
}

export function catBySlug(cats: Category[], slug: string | null | undefined) {
  if (!slug) return null;
  return cats.find((item) => item.slug === slug) ?? null;
}

export function catPath(cats: Category[], slug: string | null | undefined): Category[] {
  if (!slug) return [];
  const bySlug = new Map(cats.map((item) => [item.slug, item]));
  const out: Category[] = [];
  const seen = new Set<string>();
  let current = bySlug.get(slug);
  while (current && !seen.has(current.slug)) {
    seen.add(current.slug);
    out.unshift(current);
    current = current.parentSlug ? bySlug.get(current.parentSlug) : undefined;
  }
  return out;
}

export function catDescendants(cats: Category[], slug: string): Set<string> {
  const ids = new Set<string>([slug]);
  let added = true;
  while (added) {
    added = false;
    for (const item of cats) {
      if (item.parentSlug && ids.has(item.parentSlug) && !ids.has(item.slug)) {
        ids.add(item.slug);
        added = true;
      }
    }
  }
  return ids;
}

export function catLabelPath(cats: Category[], slug: string | null | undefined) {
  return catPath(cats, slug)
    .map((item) => item.name)
    .join(" · ");
}

export function catRoot(cats: Category[], slug: string | null | undefined) {
  return catPath(cats, slug)[0]?.slug ?? slug ?? null;
}

/** Persist the tree root in `category` and the selected leaf in `subcategory`. */
export function catStore(cats: Category[], selected: string | null | undefined) {
  if (!selected) return { category: null as string | null, subcategory: null as string | null };
  const path = catPath(cats, selected);
  if (!path.length) return { category: selected, subcategory: null as string | null };
  return {
    category: path[0].slug,
    subcategory: path.length > 1 ? path[path.length - 1].slug : null,
  };
}

export function catTree(cats: Category[]) {
  const result: Category[] = [];
  const seen = new Set<string>();
  const walk = (parent: string) => {
    for (const item of cats.filter((c) => (c.parentSlug ?? "") === parent)) {
      if (seen.has(item.slug)) continue;
      seen.add(item.slug);
      result.push(item);
      walk(item.slug);
    }
  };
  walk("");
  for (const item of cats) {
    if (!seen.has(item.slug)) result.push(item);
  }
  return result;
}

export function wouldCycle(cats: Category[], slug: string, parentSlug: string | null) {
  if (!parentSlug) return false;
  if (parentSlug === slug) return true;
  return catDescendants(cats, slug).has(parentSlug);
}
