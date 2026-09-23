import type { Role } from "@/lib/kinds";

export type TagOption = { value: string; label: string };

type RoleLabels = { value: string; dominant: string; submissive: string; switch: string };

function optionsFor(role: Role, rows: RoleLabels[]): TagOption[] {
  return rows.map((row) => ({ value: row.value, label: row[role] }));
}

const KINK_ROWS: RoleLabels[] = [
  { value: "bondage", dominant: "Bondage (tying them)", submissive: "Being bound", switch: "Bondage" },
  { value: "spanking", dominant: "Spanking them", submissive: "Being spanked", switch: "Spanking" },
  { value: "impact-play", dominant: "Impact play", submissive: "Impact play", switch: "Impact play" },
  { value: "rope", dominant: "Rope (tying)", submissive: "Rope (being tied)", switch: "Rope" },
  { value: "power-exchange", dominant: "Power exchange", submissive: "Power exchange", switch: "Power exchange" },
  { value: "protocol", dominant: "Protocol (running it)", submissive: "Protocol (keeping it)", switch: "Protocol" },
  { value: "service", dominant: "Receiving service", submissive: "Service", switch: "Service" },
  { value: "pet-play", dominant: "Pet play (owning)", submissive: "Pet play (being)", switch: "Pet play" },
  { value: "praise", dominant: "Praise (giving)", submissive: "Praise (receiving)", switch: "Praise" },
  { value: "humiliation", dominant: "Humiliating them", submissive: "Humiliation", switch: "Humiliation" },
  { value: "degradation", dominant: "Degrading them", submissive: "Degradation", switch: "Degradation" },
  { value: "orgasm-control", dominant: "Orgasm control", submissive: "Orgasm control", switch: "Orgasm control" },
  { value: "chastity", dominant: "Chastity (locking them)", submissive: "Chastity (wearing it)", switch: "Chastity" },
  { value: "exhibitionism", dominant: "Exhibitionism (showing them)", submissive: "Exhibitionism (being seen)", switch: "Exhibitionism" },
  { value: "voyeurism", dominant: "Voyeurism (watching them)", submissive: "Voyeurism (watching)", switch: "Voyeurism" },
  { value: "roleplay", dominant: "Roleplay", submissive: "Roleplay", switch: "Roleplay" },
  { value: "primal", dominant: "Primal (predator)", submissive: "Primal (prey)", switch: "Primal" },
  { value: "sensation-play", dominant: "Sensation play", submissive: "Sensation play", switch: "Sensation play" },
  { value: "sensory-deprivation", dominant: "Sensory deprivation", submissive: "Sensory deprivation", switch: "Sensory deprivation" },
  { value: "temperature-play", dominant: "Temperature play", submissive: "Temperature play", switch: "Temperature play" },
  { value: "brat-dynamic", dominant: "Brat taming", submissive: "Bratting", switch: "Brat dynamic" },
  { value: "ownership", dominant: "Ownership", submissive: "Being owned", switch: "Ownership" },
  { value: "denial", dominant: "Denial", submissive: "Being denied", switch: "Denial" },
  { value: "marking", dominant: "Marking them", submissive: "Being marked", switch: "Marking" },
  { value: "objectification", dominant: "Objectification", submissive: "Objectification", switch: "Objectification" },
  { value: "sadomasochism", dominant: "Sadism", submissive: "Masochism", switch: "Sadomasochism" },
  { value: "verbal", dominant: "Verbal domination", submissive: "Verbal submission", switch: "Verbal play" },
  { value: "training", dominant: "Training them", submissive: "Being trained", switch: "Training" },
  { value: "breath-play", dominant: "Breath play", submissive: "Breath play", switch: "Breath play" },
  { value: "cnc", dominant: "CNC", submissive: "CNC", switch: "CNC" },
];

export const DOMINANT_KINKS = optionsFor("dominant", KINK_ROWS);
export const SUBMISSIVE_KINKS = optionsFor("submissive", KINK_ROWS);
export const SWITCH_KINKS = optionsFor("switch", KINK_ROWS);

export const ALL_KINK_OPTIONS: TagOption[] = SWITCH_KINKS;

export const PROFILE_KINKS = SWITCH_KINKS;

export const DOMINANT_TRAITS: TagOption[] = [
  { value: "commanding", label: "Commanding" },
  { value: "cruel", label: "Cruel" },
  { value: "possessive", label: "Possessive" },
  { value: "protective", label: "Protective" },
  { value: "patient", label: "Patient" },
  { value: "sharp", label: "Sharp" },
  { value: "stoic", label: "Stoic" },
  { value: "formal", label: "Formal" },
  { value: "intense", label: "Intense" },
  { value: "calm", label: "Calm" },
  { value: "teasing", label: "Teasing" },
  { value: "filthy", label: "Filthy" },
  { value: "warm", label: "Warm" },
  { value: "tender", label: "Tender" },
  { value: "strict", label: "Strict" },
  { value: "predatory", label: "Predatory" },
  { value: "exacting", label: "Exacting" },
  { value: "unhurried", label: "Unhurried" },
  { value: "smug", label: "Smug" },
  { value: "watchful", label: "Watchful" },
  { value: "nurturing", label: "Nurturing" },
  { value: "ruthless", label: "Ruthless" },
  { value: "composed", label: "Composed" },
  { value: "dry", label: "Dry" },
  { value: "indulgent", label: "Indulgent" },
  { value: "authoritative", label: "Authoritative" },
  { value: "precise", label: "Precise" },
  { value: "generous", label: "Generous" },
  { value: "bored", label: "Bored" },
  { value: "sadistic", label: "Sadistic" },
];

export const SUBMISSIVE_TRAITS: TagOption[] = [
  { value: "devoted", label: "Devoted" },
  { value: "bratty", label: "Bratty" },
  { value: "needy", label: "Needy" },
  { value: "tender", label: "Tender" },
  { value: "soft", label: "Soft" },
  { value: "playful", label: "Playful" },
  { value: "quiet", label: "Quiet" },
  { value: "eager", label: "Eager" },
  { value: "obedient", label: "Obedient" },
  { value: "shy", label: "Shy" },
  { value: "filthy", label: "Filthy" },
  { value: "warm", label: "Warm" },
  { value: "teasing", label: "Teasing" },
  { value: "earnest", label: "Earnest" },
  { value: "coy", label: "Coy" },
  { value: "yielding", label: "Yielding" },
  { value: "cheeky", label: "Cheeky" },
  { value: "hungry", label: "Hungry" },
  { value: "pliant", label: "Pliant" },
  { value: "restless", label: "Restless" },
  { value: "sweet", label: "Sweet" },
  { value: "grateful", label: "Grateful" },
  { value: "clingy", label: "Clingy" },
  { value: "proud", label: "Proud" },
  { value: "sincere", label: "Sincere" },
  { value: "breathless", label: "Breathless" },
  { value: "service-minded", label: "Service-minded" },
  { value: "fierce", label: "Fierce" },
  { value: "bashful", label: "Bashful" },
  { value: "willing", label: "Willing" },
];

export const SWITCH_TRAITS: TagOption[] = [
  { value: "commanding", label: "Commanding" },
  { value: "devoted", label: "Devoted" },
  { value: "teasing", label: "Teasing" },
  { value: "bratty", label: "Bratty" },
  { value: "sharp", label: "Sharp" },
  { value: "tender", label: "Tender" },
  { value: "playful", label: "Playful" },
  { value: "possessive", label: "Possessive" },
  { value: "filthy", label: "Filthy" },
  { value: "warm", label: "Warm" },
  { value: "intense", label: "Intense" },
  { value: "calm", label: "Calm" },
  { value: "fluid", label: "Fluid" },
  { value: "hungry", label: "Hungry" },
  { value: "patient", label: "Patient" },
  { value: "cruel", label: "Cruel" },
  { value: "needy", label: "Needy" },
  { value: "stoic", label: "Stoic" },
  { value: "soft", label: "Soft" },
  { value: "formal", label: "Formal" },
  { value: "protective", label: "Protective" },
  { value: "quiet", label: "Quiet" },
  { value: "smug", label: "Smug" },
  { value: "coy", label: "Coy" },
  { value: "precise", label: "Precise" },
  { value: "eager", label: "Eager" },
  { value: "watchful", label: "Watchful" },
  { value: "indulgent", label: "Indulgent" },
  { value: "dual", label: "Dual" },
  { value: "adaptive", label: "Adaptive" },
];

export const ALL_TRAIT_OPTIONS: TagOption[] = [
  ...SWITCH_TRAITS,
  ...DOMINANT_TRAITS,
  ...SUBMISSIVE_TRAITS,
].filter((item, index, list) => list.findIndex((other) => other.value === item.value) === index);

export const COMPANION_TRAITS = SWITCH_TRAITS;
export const COMPANION_KINKS = SWITCH_KINKS;

export const MAX_PROFILE_KINKS = 50;
export const MAX_KINK_LABEL = 48;

export function companionRoleKind(role: string): Role {
  const r = role.trim().toLowerCase();
  if (!r) return "switch";
  if (r === "switch" || r.includes("switch")) return "switch";
  if (
    r === "dom" ||
    r === "dominant" ||
    /\b(brat[-\s]?tamer|caretaker|caregiver|dominant|domme|master|mistress|owner|daddy|handler|trainer|rigger|sadist|\bsir\b)\b/.test(r)
  ) {
    return "dominant";
  }
  if (
    r === "sub" ||
    r === "service" ||
    /\b(submissive|slave|pet|brat|kitten|pup|prey|princess|little|masochist|servant|service)\b/.test(r)
  ) {
    return "submissive";
  }
  return "switch";
}

export function kinksFor(role: Role | string) {
  const kind = role === "dominant" || role === "submissive" || role === "switch" ? role : companionRoleKind(role);
  if (kind === "dominant") return DOMINANT_KINKS;
  if (kind === "submissive") return SUBMISSIVE_KINKS;
  return SWITCH_KINKS;
}

export function traitsFor(role: Role | string) {
  const kind = role === "dominant" || role === "submissive" || role === "switch" ? role : companionRoleKind(role);
  if (kind === "dominant") return DOMINANT_TRAITS;
  if (kind === "submissive") return SUBMISSIVE_TRAITS;
  return SWITCH_TRAITS;
}

function catalogMap(catalog: readonly TagOption[]) {
  return new Map(catalog.map((item) => [item.value, item.label]));
}

export function tagLabel(value: string, catalog: readonly TagOption[]) {
  return catalogMap(catalog).get(value) ?? value;
}

export function isKnownTag(value: string, catalog: readonly TagOption[]) {
  return catalog.some((item) => item.value === value);
}

function cleanTag(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, MAX_KINK_LABEL);
}

function matchInCatalog(label: string, catalog: readonly TagOption[]) {
  const next = cleanTag(label);
  if (!next) return null;
  const known = catalog.find(
    (item) => item.value === next || item.label.toLowerCase() === next.toLowerCase(),
  );
  return known?.value ?? next;
}

export function parseTagList(raw: unknown, catalog: readonly TagOption[], max = MAX_PROFILE_KINKS): string[] {
  let list: unknown[] = [];
  if (Array.isArray(raw)) {
    list = raw;
  } else if (typeof raw === "string") {
    const text = raw.trim();
    if (!text) return [];
    try {
      const parsed = JSON.parse(text) as unknown;
      if (Array.isArray(parsed)) list = parsed;
      else if (parsed && typeof parsed === "object" && Array.isArray((parsed as { tags?: unknown }).tags)) {
        list = (parsed as { tags: unknown[] }).tags;
      } else list = text.split(/[,;\n]+/);
    } catch {
      list = text.split(/[,;\n]+/);
    }
  }
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of list) {
    const matched = matchInCatalog(String(item ?? ""), catalog);
    if (!matched) continue;
    const key = matched.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(matched);
    if (out.length >= max) break;
  }
  return out;
}

export function encodeTagList(list: string[], catalog: readonly TagOption[] = ALL_KINK_OPTIONS) {
  return JSON.stringify(parseTagList(list, catalog));
}

export function formatTagList(raw: unknown, catalog: readonly TagOption[]) {
  return parseTagList(raw, catalog)
    .map((item) => tagLabel(item, catalog))
    .join(", ");
}

export type TagBag = { tags: string[]; notes: string };

export function parseTagBag(raw: unknown, catalog: readonly TagOption[]): TagBag {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const obj = raw as { tags?: unknown; notes?: unknown };
    return { tags: parseTagList(obj.tags, catalog), notes: typeof obj.notes === "string" ? obj.notes.trim() : "" };
  }
  if (typeof raw === "string") {
    const text = raw.trim();
    if (!text) return { tags: [], notes: "" };
    if (text.startsWith("{")) {
      try {
        const parsed = JSON.parse(text) as unknown;
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          const obj = parsed as { tags?: unknown; notes?: unknown };
          return {
            tags: parseTagList(obj.tags, catalog),
            notes: typeof obj.notes === "string" ? obj.notes.trim() : "",
          };
        }
      } catch {
        /* fall through */
      }
    }
    const tags = parseTagList(text, catalog);
    if (text.startsWith("[")) return { tags, notes: "" };
    const pieces = text.split(/[,;\n]+/).map((item) => item.trim()).filter(Boolean);
    const looksLikeList =
      pieces.length > 0 &&
      pieces.every((item) => item.length <= MAX_KINK_LABEL) &&
      (pieces.length >= 2 || isKnownTag(tags[0] ?? "", catalog));
    if (looksLikeList) return { tags, notes: "" };
    return { tags: [], notes: text };
  }
  if (Array.isArray(raw)) return { tags: parseTagList(raw, catalog), notes: "" };
  return { tags: [], notes: "" };
}

export function encodeTagBag(bag: TagBag, catalog: readonly TagOption[]) {
  const tags = parseTagList(bag.tags, catalog);
  let notes = (bag.notes ?? "").trim();
  let out = JSON.stringify({ tags, notes });
  if (out.length > 2000) {
    notes = notes.slice(0, Math.max(0, notes.length - (out.length - 1990)));
    out = JSON.stringify({ tags, notes });
  }
  return out;
}

export function formatTagBag(raw: unknown, catalog: readonly TagOption[]) {
  const bag = parseTagBag(raw, catalog);
  const labels = bag.tags.map((item) => tagLabel(item, catalog)).join(", ");
  return [labels, bag.notes].filter(Boolean).join(". ");
}

export function kinkLabel(value: string, role?: Role | string) {
  return tagLabel(value, role ? kinksFor(role) : ALL_KINK_OPTIONS);
}

export function isKnownKink(value: string) {
  return isKnownTag(value, ALL_KINK_OPTIONS);
}

export function parseKinks(raw: unknown): string[] {
  return parseTagList(raw, ALL_KINK_OPTIONS);
}

export function encodeKinks(list: string[]) {
  return encodeTagList(list, ALL_KINK_OPTIONS);
}

export function matchKnownKink(label: string) {
  return matchInCatalog(label, [...DOMINANT_KINKS, ...SUBMISSIVE_KINKS, ...SWITCH_KINKS]);
}

export function matchKnownTag(label: string, catalog: readonly TagOption[]) {
  return matchInCatalog(label, catalog);
}
