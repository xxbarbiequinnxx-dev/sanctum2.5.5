export type StakesMode = "none" | "points" | "items" | "punishments" | "both";

export const SHOP_KINDS = ["reward", "scene", "roleplay", "game"] as const;
export type ShopKind = (typeof SHOP_KINDS)[number];

export const COUNTED_KINDS = ["punishment", "reward", "scene", "roleplay", "game"] as const;
export type CountedKind = (typeof COUNTED_KINDS)[number];

export function isShopKind(kind: string): kind is ShopKind {
  return (SHOP_KINDS as readonly string[]).includes(kind);
}

export function isCountedKind(kind: string): kind is CountedKind {
  return (COUNTED_KINDS as readonly string[]).includes(kind);
}

export function countWord(kind: string) {
  if (kind === "punishment") return "earned";
  if (kind === "reward") return "given";
  if (kind === "scene") return "run";
  if (kind === "roleplay") return "played";
  if (kind === "game") return "played";
  return "times";
}

export function parseIdList(raw: string | undefined | null): number[] {
  if (!raw) return [];
  return raw
    .split(/[, ]+/)
    .map((value) => Number(value.trim()))
    .filter((n) => Number.isInteger(n) && n > 0);
}

export function parsePoints(raw: string | undefined | null): number | null {
  if (raw == null || raw === "") return null;
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  return Math.trunc(n);
}

export function shopCost(meta: Record<string, string> | undefined | null): number | null {
  const n = parsePoints(meta?.cost);
  if (n == null || n <= 0) return null;
  return n;
}

export function isBought(meta: Record<string, string> | undefined | null) {
  return Boolean(meta?.boughtBy);
}

export function earnedCountOf(meta: Record<string, string> | undefined | null) {
  const n = Number(meta?.earnedCount);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.trunc(n);
}

export function shopBuyLabel(kind: string, cost: number) {
  if (kind === "scene") return `Book · ${cost} pts`;
  if (kind === "game") return `Play · ${cost} pts`;
  return `Buy · ${cost} pts`;
}

export function stakesModeOf(meta: Record<string, string>): StakesMode {
  const mode = meta.stakesMode;
  if (mode === "points" || mode === "items" || mode === "punishments" || mode === "both" || mode === "none") {
    return mode;
  }
  const hasPoints = parsePoints(meta.points) != null || parsePoints(meta.skipPoints) != null;
  const hasRewards = parseIdList(meta.rewardIds).length > 0;
  const hasPunishments = parseIdList(meta.punishmentIds).length > 0;
  if (hasPoints && (hasRewards || hasPunishments)) return "both";
  if (hasPoints) return "points";
  if (hasRewards && hasPunishments) return "both";
  if (hasRewards) return "items";
  if (hasPunishments) return "punishments";
  return "none";
}

export function usesPoints(mode: StakesMode) {
  return mode === "points" || mode === "both";
}

export function usesRewards(mode: StakesMode) {
  return mode === "items" || mode === "both";
}

export function usesPunishments(mode: StakesMode) {
  return mode === "punishments" || mode === "both";
}

export function usesItems(mode: StakesMode) {
  return usesRewards(mode) || usesPunishments(mode);
}

export function outcomeMessage(
  previous: { effectiveStatus: string; status: string; meta: Record<string, string> },
  next: { effectiveStatus: string; status: string; meta: Record<string, string> },
): { tone: "success" | "message"; text: string } | null {
  const wasDone = previous.effectiveStatus === "done";
  const nowDone = next.effectiveStatus === "done";
  if (!wasDone && nowDone) {
    const pts = parsePoints(next.meta.points);
    const bits: string[] = [];
    if (pts) bits.push(`${pts > 0 ? "+" : ""}${pts} points`);
    if (next.meta.rewardTitles) bits.push(`reward: ${next.meta.rewardTitles}`);
    if (bits.length) return { tone: "success", text: bits.join(" · ") };
    return null;
  }
  if (previous.status !== "skipped" && next.status === "skipped") {
    const pts = parsePoints(next.meta.skipPoints);
    const bits: string[] = [];
    if (pts) bits.push(`${pts > 0 ? "+" : ""}${pts} points`);
    if (next.meta.punishmentTitles) bits.push(`punishment: ${next.meta.punishmentTitles}`);
    if (bits.length) return { tone: "message", text: bits.join(" · ") };
  }
  return null;
}
