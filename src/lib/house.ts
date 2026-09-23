import { isLeadRole, type Kind } from "@/lib/kinds";
import type { HouseSettings, Me, PlaySettings, SubEditKey, UserOptions } from "@/lib/types";

export const DEFAULT_PLAY: PlaySettings = {
  wheelTitle: "The wheel",
  wheelSlices: [
    "Dominant's choice",
    "A reward",
    "A punishment",
    "Training command",
    "Scene beat",
    "Free pass",
    "Write a journal page",
    "Photograph an item",
  ],
  wheelBody: "Spin for a beat of the evening.",
  wheelPrompts: [],
  wheelCatalogIds: [],
  drawTitle: "Draw a command",
  drawCards: [
    { title: "Present", body: "Kneel until you are acknowledged. Then wait for the next command." },
    { title: "Hold still", body: "Stay in position until released." },
    { title: "Speak last", body: "Do not speak unless spoken to for the next ten minutes." },
  ],
  drawBody: "Your deck. One card per line: Title — the command.",
  drawPrompts: [],
  drawCatalogIds: [],
  diceTitle: "Dice of service",
  diceActs: [
    "A glance. Soft.",
    "A small service.",
    "A training command.",
    "A timed hold.",
    "A punishment or reward of their choosing.",
    "A scene beat. Negotiate first.",
  ],
  diceBody: "Six acts. Edit each face.",
  dicePrompts: [],
  diceCatalogIds: [],
  timerTitle: "Timer",
  timerBody: "A timed kneel, present, or silence. Set any time you like.",
};

export const DEFAULT_HOUSE: HouseSettings = {
  subEdit: {
    tasks: true,
    habits: true,
    rewards: true,
    punishments: true,
    training: true,
    games: true,
    costs: true,
    earnedCounts: true,
    countdowns: true,
  },
  vacation: false,
  vacationSince: null,
  play: DEFAULT_PLAY,
  wheels: {},
  lastWeeklyReset: null,
};

export const DEFAULT_OPTIONS: UserOptions = {
  honorific: "",
  addressAs: "",
  safeword: "",
  checkIn: "",
  hideCompleted: false,
  showReminders: true,
  autoCompleteNote: false,
  noteTask: "Good {name}. {title} is done. I'm pleased with you.",
  noteHabit: "{title} is kept. That's my good {name}.",
  noteTraining: "Well trained. {title} is marked. I'm proud of you.",
  quickNav: ["/", "/tasks", "/games", "/talk"],
};

export const EMPTY_ME: Me = {
  profile: null,
  partner: null,
  lastPartner: null,
  partners: [],
  house: DEFAULT_HOUSE,
  options: DEFAULT_OPTIONS,
};

export const EDIT_SCOPES: { key: SubEditKey; label: string; hint: string }[] = [
  { key: "tasks", label: "Tasks", hint: "Daily, weekly, and one-off assignments" },
  { key: "habits", label: "Habits", hint: "Repeating habit cards" },
  { key: "rewards", label: "Rewards", hint: "Treats and privileges" },
  { key: "punishments", label: "Punishments", hint: "Corrections and consequences" },
  { key: "training", label: "Training", hint: "Protocols, positions, and commands" },
  { key: "games", label: "Games", hint: "Games and play cards" },
  {
    key: "costs",
    label: "Points costs",
    hint: "Set the price on rewards, scenes, roleplay, and games. Buying with points still belongs to them.",
  },
  {
    key: "earnedCounts",
    label: "Counts",
    hint: "Change how many times punishments, rewards, scenes, roleplay, and games have been used. Completing them still belongs to them.",
  },
  {
    key: "countdowns",
    label: "Timers",
    hint: "Set days, hours, and minutes on tasks, challenges, punishments, and rewards. Completing them still belongs to them.",
  },
];

export const HOUSE_TABS = [
  "you",
  "partner",
  "options",
  "app",
  "calendar",
  "archive",
  "location",
  "permissions",
] as const;

export type HouseTab = (typeof HOUSE_TABS)[number];

export function parseHouseTab(hash: string | undefined | null): HouseTab {
  const value = (hash ?? "").replace(/^#/, "");
  return (HOUSE_TABS as readonly string[]).includes(value) ? (value as HouseTab) : "you";
}

export function parseHouse(raw: unknown): HouseSettings {
  const base = structuredClone(DEFAULT_HOUSE);
  const parsed = asObject(raw);
  const sub = asObject(parsed.subEdit);
  for (const key of Object.keys(base.subEdit) as SubEditKey[]) {
    if (typeof sub[key] === "boolean") base.subEdit[key] = sub[key];
  }
  if (typeof parsed.vacation === "boolean") base.vacation = parsed.vacation;
  if (typeof parsed.vacationSince === "string" && parsed.vacationSince) {
    base.vacationSince = parsed.vacationSince;
  } else if (parsed.vacationSince === null) {
    base.vacationSince = null;
  }
  if (typeof parsed.lastWeeklyReset === "string" && parsed.lastWeeklyReset) {
    base.lastWeeklyReset = parsed.lastWeeklyReset;
  }
  const play = asObject(parsed.play);
  base.play = parsePlay(play);
  const wheels = asObject(parsed.wheels);
  const nextWheels: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(wheels)) {
    if (Array.isArray(value)) {
      nextWheels[key] = value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).slice(0, 40);
    }
  }
  base.wheels = nextWheels;
  return base;
}

export function parsePlay(raw: unknown): PlaySettings {
  const base = structuredClone(DEFAULT_PLAY);
  const parsed = asObject(raw);
  if (typeof parsed.wheelTitle === "string" && parsed.wheelTitle.trim()) base.wheelTitle = parsed.wheelTitle.trim().slice(0, 80);
  if (typeof parsed.wheelBody === "string") base.wheelBody = parsed.wheelBody.slice(0, 4000);
  if (typeof parsed.drawTitle === "string" && parsed.drawTitle.trim()) base.drawTitle = parsed.drawTitle.trim().slice(0, 80);
  if (typeof parsed.drawBody === "string") base.drawBody = parsed.drawBody.slice(0, 4000);
  if (typeof parsed.diceTitle === "string" && parsed.diceTitle.trim()) base.diceTitle = parsed.diceTitle.trim().slice(0, 80);
  if (typeof parsed.diceBody === "string") base.diceBody = parsed.diceBody.slice(0, 4000);
  if (typeof parsed.timerTitle === "string" && parsed.timerTitle.trim()) base.timerTitle = parsed.timerTitle.trim().slice(0, 80);
  if (typeof parsed.timerBody === "string") base.timerBody = parsed.timerBody.slice(0, 4000);
  if (Array.isArray(parsed.wheelSlices)) {
    const slices = parsed.wheelSlices.filter((item): item is string => typeof item === "string" && item.trim().length > 0).map((item) => item.trim().slice(0, 80));
    if (slices.length) base.wheelSlices = slices.slice(0, 24);
  }
  if (Array.isArray(parsed.wheelPrompts)) {
    base.wheelPrompts = parsed.wheelPrompts.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean).slice(0, 40);
  }
  if (Array.isArray(parsed.drawPrompts)) {
    base.drawPrompts = parsed.drawPrompts.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean).slice(0, 40);
  }
  if (Array.isArray(parsed.dicePrompts)) {
    base.dicePrompts = parsed.dicePrompts.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean).slice(0, 40);
  }
  if (Array.isArray(parsed.wheelCatalogIds)) {
    base.wheelCatalogIds = parsed.wheelCatalogIds.filter((item): item is string => typeof item === "string").slice(0, 24);
  }
  if (Array.isArray(parsed.drawCatalogIds)) {
    base.drawCatalogIds = parsed.drawCatalogIds.filter((item): item is string => typeof item === "string").slice(0, 24);
  }
  if (Array.isArray(parsed.diceCatalogIds)) {
    base.diceCatalogIds = parsed.diceCatalogIds.filter((item): item is string => typeof item === "string").slice(0, 24);
  }
  if (Array.isArray(parsed.drawCards)) {
    const cards = parsed.drawCards
      .map((item) => {
        const card = asObject(item);
        const title = typeof card.title === "string" ? card.title.trim().slice(0, 80) : "";
        const body = typeof card.body === "string" ? card.body.trim().slice(0, 800) : "";
        if (!title && !body) return null;
        return { title: title || "Card", body };
      })
      .filter((item): item is { title: string; body: string } => Boolean(item));
    if (cards.length) base.drawCards = cards.slice(0, 40);
  }
  if (Array.isArray(parsed.diceActs)) {
    const acts = parsed.diceActs.filter((item): item is string => typeof item === "string").map((item) => item.trim().slice(0, 160));
    if (acts.length >= 6) base.diceActs = acts.slice(0, 6);
    else if (acts.length) base.diceActs = [...acts, ...base.diceActs].slice(0, 6);
  }
  return base;
}

export function parseOptions(raw: unknown): UserOptions {
  const base = { ...DEFAULT_OPTIONS };
  const parsed = asObject(raw);
  if (typeof parsed.honorific === "string") base.honorific = parsed.honorific;
  if (typeof parsed.addressAs === "string") base.addressAs = parsed.addressAs;
  if (typeof parsed.safeword === "string") base.safeword = parsed.safeword;
  if (typeof parsed.checkIn === "string") base.checkIn = parsed.checkIn;
  if (typeof parsed.hideCompleted === "boolean") base.hideCompleted = parsed.hideCompleted;
  if (typeof parsed.showReminders === "boolean") base.showReminders = parsed.showReminders;
  if (typeof parsed.autoCompleteNote === "boolean") base.autoCompleteNote = parsed.autoCompleteNote;
  if (typeof parsed.noteTask === "string") base.noteTask = parsed.noteTask;
  if (typeof parsed.noteHabit === "string") base.noteHabit = parsed.noteHabit;
  if (typeof parsed.noteTraining === "string") base.noteTraining = parsed.noteTraining;
  if (Array.isArray(parsed.quickNav)) {
    base.quickNav = parsed.quickNav.filter((item): item is string => typeof item === "string").slice(0, 4);
  }
  return base;
}

export function completeNoteKind(kind: Kind, cadence?: string | null): "task" | "habit" | "training" | null {
  if (kind === "rabbit") return "training";
  if (kind === "task") return cadence === "habit" ? "habit" : "task";
  return null;
}

export function fillCompleteNote(
  template: string,
  vars: { name: string; title: string; you: string },
) {
  const name = vars.name.trim() || "you";
  const you = vars.you.trim() || name;
  const title = vars.title.trim() || "that";
  return template
    .replace(/\{name\}/gi, name)
    .replace(/\{title\}/gi, title)
    .replace(/\{you\}/gi, you)
    .replace(/[ \t]+\n/g, "\n")
    .trim()
    .slice(0, 4000);
}

function asObject(raw: unknown): Record<string, unknown> {
  if (!raw) return {};
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === "object") return parsed as Record<string, unknown>;
    } catch {
      return {};
    }
    return {};
  }
  if (typeof raw === "object") return raw as Record<string, unknown>;
  return {};
}

export function canEditKind(house: HouseSettings, kind: Kind, cadence?: string | null): boolean {
  if (kind === "task") {
    if (cadence === "habit") return house.subEdit.habits;
    if (cadence == null || cadence === "") return house.subEdit.tasks || house.subEdit.habits;
    return house.subEdit.tasks;
  }
  if (kind === "rabbit") return house.subEdit.training;
  if (kind === "reward") return house.subEdit.rewards;
  if (kind === "punishment") return house.subEdit.punishments;
  if (kind === "game") return house.subEdit.games;
  return true;
}

export function canMutate(me: Me | null | undefined, kind: Kind, cadence?: string | null): boolean {
  if (!me?.profile) return false;
  if (isLeadRole(me.profile.role)) return true;
  return canEditKind(me.house, kind, cadence);
}

export function canSetCost(me: Me | null | undefined): boolean {
  if (!me?.profile) return false;
  if (isLeadRole(me.profile.role)) return true;
  return Boolean(me.house.subEdit.costs);
}

export function canSetEarnedCount(me: Me | null | undefined): boolean {
  if (!me?.profile) return false;
  if (isLeadRole(me.profile.role)) return true;
  return Boolean(me.house.subEdit.earnedCounts);
}

export function canSetCountdown(me: Me | null | undefined): boolean {
  if (!me?.profile) return false;
  if (isLeadRole(me.profile.role)) return true;
  return Boolean(me.house.subEdit.countdowns);
}

export function assignmentLocked(
  me: Me | null | undefined,
  entry: { kind: string; createdBy?: string | null; assignedTo?: string | null },
) {
  if (!me?.profile) return false;
  if (entry.kind !== "task" && entry.kind !== "challenge") return false;
  if (!entry.createdBy || entry.createdBy === me.profile.userId) return false;
  const assigned = entry.assignedTo;
  if (!assigned) return false;
  return assigned === me.profile.userId || assigned === "both";
}

export function canEditEntry(
  me: Me | null | undefined,
  entry: { kind: Kind; cadence?: string | null; createdBy?: string | null; assignedTo?: string | null },
) {
  if (assignmentLocked(me, entry)) return false;
  return canMutate(me, entry.kind, entry.cadence);
}

export function isDutyKind(kind: Kind) {
  return kind === "task" || kind === "rabbit";
}

export function dutiesPaused(house: HouseSettings | null | undefined) {
  return Boolean(house?.vacation);
}

export function lockedCopy(kind: Kind) {
  const label =
    kind === "rabbit"
      ? "training"
      : kind === "task"
        ? "tasks"
        : kind === "game"
          ? "games"
          : kind === "reward"
            ? "rewards"
            : kind === "punishment"
              ? "punishments"
              : "this category";
  return `Your Dominant has locked editing for ${label}.`;
}

export function assignmentLockedCopy() {
  return "Only the person who assigned this can edit it.";
}

export function editDeniedCopy(
  me: Me | null | undefined,
  entry: { kind: Kind; cadence?: string | null; createdBy?: string | null; assignedTo?: string | null },
) {
  if (assignmentLocked(me, entry)) return assignmentLockedCopy();
  return lockedCopy(entry.kind);
}


