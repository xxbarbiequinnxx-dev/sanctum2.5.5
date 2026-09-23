import { NOTE_LIBRARY_CATEGORIES } from "./notes-library";
import { PLAYBOOK_CATEGORIES } from "./playbook-library";

export type Role = "dominant" | "submissive" | "switch";

export type Kind =
  | "task"
  | "rabbit"
  | "punishment"
  | "reward"
  | "game"
  | "scene"
  | "journal"
  | "note"
  | "catalog"
  | "talk"
  | "roleplay"
  | "challenge"
  | "playbook"
  | "calendar";

export type FieldSpec = {
  key: string;
  label: string;
  type: "text" | "textarea" | "select" | "intensity" | "cadence";
  placeholder?: string;
  options?: { value: string; label: string }[];
  store?: "column" | "meta";
};

export type CategorySpec = {
  value: string;
  label: string;
  parent?: string;
};

export type KindConfig = {
  kind: Kind;
  path: string;
  title: string;
  kicker: string;
  blurb: string;
  addLabel: string;
  emptyTitle: string;
  emptyBody: string;
  layout: "list" | "grid" | "timeline";
  categories?: CategorySpec[];
  statuses: { value: string; label: string }[];
  fields: FieldSpec[];
  completeLabel?: string;
  reopenLabel?: string;
  assignable?: boolean;
  catalogLink?: boolean;
  stakes?: boolean;
  reminders?: boolean;
  shop?: boolean;
  wheel?: boolean;
};

export const TASK_STATUSES = [
  { value: "open", label: "Open" },
  { value: "done", label: "Done" },
  { value: "skipped", label: "Skipped" },
];

export const KINDS: Record<Kind, KindConfig> = {
  calendar: {
    kind: "calendar",
    path: "/house",
    title: "Calendar",
    kicker: "The date",
    blurb: "Shared day entries both of you can add and edit. They appear on Home reminders when the date is today.",
    addLabel: "New calendar entry",
    emptyTitle: "Nothing on this day",
    emptyBody: "Add a shared note, appointment, or reminder for this date.",
    layout: "list",
    assignable: true,
    reminders: true,
    statuses: [
      { value: "open", label: "Open" },
      { value: "done", label: "Done" },
    ],
    fields: [
      { key: "body", label: "Notes", type: "textarea", placeholder: "What happens this day.", store: "column" },
    ],
  },
  task: {
    kind: "task",
    path: "/tasks",
    title: "Tasks",
    kicker: "The day",
    blurb: "Daily, weekly, custom-day, and one-off assignments — either of you can write them.",
    addLabel: "New task",
    emptyTitle: "No tasks yet",
    emptyBody: "Set the first daily, weekly, or custom assignment.",
    layout: "list",
    statuses: TASK_STATUSES,
    assignable: true,
    catalogLink: true,
    stakes: true,
    reminders: true,
    fields: [
      { key: "cadence", label: "Cadence", type: "cadence", store: "column" },
      { key: "body", label: "Instructions", type: "textarea", placeholder: "What is expected, and how it should be done.", store: "column" },
    ],
    completeLabel: "Mark done",
    reopenLabel: "Reopen",
  },
  rabbit: {
    kind: "rabbit",
    path: "/training",
    title: "Training",
    kicker: "The school",
    blurb: "Protocol, positions, commands, and rituals you are training.",
    addLabel: "New training",
    emptyTitle: "No training posted",
    emptyBody: "Add a protocol, position, command, or ritual to train.",
    layout: "grid",
    assignable: true,
    catalogLink: true,
    stakes: true,
    reminders: true,
    categories: [
      { value: "protocol", label: "Protocol" },
      { value: "position", label: "Position" },
      { value: "command", label: "Command" },
      { value: "ritual", label: "Ritual" },
    ],
    statuses: [
      { value: "open", label: "Learning" },
      { value: "done", label: "Mastered" },
      { value: "archived", label: "Archived" },
    ],
    fields: [
      { key: "cadence", label: "Cadence", type: "cadence", store: "column" },
      { key: "category", label: "Type", type: "select", store: "column", options: [] },
      { key: "command", label: "Cue / command", type: "text", placeholder: "The spoken or gestured cue", store: "meta" },
      { key: "body", label: "How it is done", type: "textarea", placeholder: "Posture, duration, etiquette, corrections.", store: "column" },
      { key: "treat", label: "Treat or marker", type: "text", placeholder: "What marks a good performance", store: "meta" },
      { key: "intensity", label: "Demand", type: "intensity", store: "column" },
    ],
    completeLabel: "Mark mastered",
    reopenLabel: "Reopen",
  },
  punishment: {
    kind: "punishment",
    path: "/punishments",
    title: "Punishments",
    kicker: "Corrections",
    blurb: "Assigned corrections, how many times each was earned, and whether they have been served.",
    addLabel: "New punishment",
    emptyTitle: "No punishments posted",
    emptyBody: "Record a correction, with optional photo evidence.",
    layout: "list",
    assignable: true,
    catalogLink: true,
    wheel: true,
    statuses: [
      { value: "open", label: "Assigned" },
      { value: "done", label: "Served" },
      { value: "archived", label: "Waived" },
    ],
    fields: [
      { key: "reason", label: "Reason", type: "text", placeholder: "What earned this", store: "meta" },
      { key: "body", label: "The correction", type: "textarea", placeholder: "What must be done, and any limits.", store: "column" },
      { key: "intensity", label: "Severity", type: "intensity", store: "column" },
    ],
    completeLabel: "Mark served",
    reopenLabel: "Reassign",
  },
  reward: {
    kind: "reward",
    path: "/rewards",
    title: "Rewards",
    kicker: "Grace",
    blurb: "Privileges, treats, and tokens that can be earned, granted, or bought with points.",
    addLabel: "New reward",
    emptyTitle: "No rewards posted",
    emptyBody: "Offer something worth earning.",
    layout: "grid",
    assignable: true,
    catalogLink: true,
    shop: true,
    wheel: true,
    statuses: [
      { value: "open", label: "Available" },
      { value: "done", label: "Completed" },
      { value: "archived", label: "Retired" },
    ],
    fields: [
      { key: "earn", label: "How it is earned", type: "text", placeholder: "What unlocks this", store: "meta" },
      { key: "body", label: "The reward", type: "textarea", placeholder: "What is given, and any conditions.", store: "column" },
      { key: "intensity", label: "Indulgence", type: "intensity", store: "column" },
    ],
    completeLabel: "Complete",
    reopenLabel: "Make available",
  },
  game: {
    kind: "game",
    path: "/games",
    title: "Games",
    kicker: "Play",
    blurb: "Write games with their own cards, prompts, and catalogue pieces — draw at random, or buy them with points.",
    addLabel: "New game",
    emptyTitle: "No custom games yet",
    emptyBody: "Write a game with cards, prompts, or a catalogue piece to draw.",
    layout: "grid",
    catalogLink: true,
    shop: true,
    categories: [
      { value: "card", label: "Cards" },
    ],
    statuses: [
      { value: "open", label: "Ready" },
      { value: "done", label: "Played" },
      { value: "archived", label: "Archived" },
    ],
    fields: [
      { key: "category", label: "Type", type: "select", store: "column" },
      { key: "body", label: "Rules", type: "textarea", placeholder: "How to play, scoring, and limits.", store: "column" },
      { key: "intensity", label: "Heat", type: "intensity", store: "column" },
    ],
    completeLabel: "Mark played",
    reopenLabel: "Make ready",
  },
  scene: {
    kind: "scene",
    path: "/scenes",
    title: "Scenes",
    kicker: "The floor",
    blurb: "Plan, run, and archive scenes — with aftercare, photos, and an optional points cost.",
    addLabel: "New scene",
    emptyTitle: "No scenes booked",
    emptyBody: "Sketch the next scene, or log one you already ran.",
    layout: "list",
    catalogLink: true,
    shop: true,
    wheel: true,
    statuses: [
      { value: "open", label: "Planned" },
      { value: "done", label: "Completed" },
      { value: "archived", label: "Cancelled" },
    ],
    fields: [
      { key: "when", label: "When", type: "text", placeholder: "Date, time, or ‘tonight’", store: "meta" },
      { key: "duration", label: "Duration", type: "text", placeholder: "e.g. 45 minutes", store: "meta" },
      { key: "body", label: "Outline", type: "textarea", placeholder: "Arc, roles, toys, limits, safeword.", store: "column" },
      { key: "aftercare", label: "Aftercare", type: "textarea", placeholder: "What happens after.", store: "meta" },
      { key: "intensity", label: "Intensity", type: "intensity", store: "column" },
    ],
    completeLabel: "Mark completed",
    reopenLabel: "Reopen plan",
  },
  journal: {
    kind: "journal",
    path: "/journal",
    title: "Journal",
    kicker: "The page",
    blurb: "Private or shared entries. Shared pages can take comments from your partner.",
    addLabel: "New entry",
    emptyTitle: "The journal is blank",
    emptyBody: "Write the first page. Keep it private, or share it for comments.",
    layout: "timeline",
    statuses: [
      { value: "open", label: "Open" },
      { value: "archived", label: "Filed" },
    ],
    fields: [
      { key: "mood", label: "Mood", type: "text", placeholder: "A word for the weather inside", store: "meta" },
      { key: "body", label: "Entry", type: "textarea", placeholder: "Write freely.", store: "column" },
      { key: "intensity", label: "Charge", type: "intensity", store: "column" },
    ],
  },
  note: {
    kind: "note",
    path: "/notes",
    title: "Notes",
    kicker: "The desk",
    blurb: "Contracts, agreements, rules, limits, aftercare, and ideas you both keep — plus Education and Activities. Check an idea or activity to add it to another page, and choose the category.",
    addLabel: "New note",
    emptyTitle: "No notes",
    emptyBody: "Pin a contract, a rule, a limit, aftercare, or an idea. Education and activities are already on the desk. Ideas start empty — add your own, and nest subcategories if you want them finer.",
    layout: "grid",
    categories: [
      { value: "contract", label: "Contract" },
      { value: "agreements", label: "Agreements" },
      { value: "rules", label: "Rules" },
      { value: "limits", label: "Limits" },
      { value: "aftercare", label: "Aftercare" },
      { value: "ideas", label: "Ideas" },
      ...NOTE_LIBRARY_CATEGORIES,
    ],
    statuses: [
      { value: "open", label: "Active" },
      { value: "archived", label: "Filed" },
    ],
    fields: [
      { key: "category", label: "Type", type: "select", store: "column" },
      { key: "body", label: "Note", type: "textarea", placeholder: "Anything worth keeping.", store: "column" },
    ],
  },
  catalog: {
    kind: "catalog",
    path: "/catalog",
    title: "Catalogue",
    kicker: "The shelf",
    blurb: "Toys, outfits, accessories, restraints, furniture, and spaces.",
    addLabel: "New item",
    emptyTitle: "The catalogue is empty",
    emptyBody: "Photograph a toy, an outfit, a restraint, a piece of furniture, or a space.",
    layout: "grid",
    categories: [
      { value: "toy", label: "Toys" },
      { value: "outfit", label: "Outfits" },
      { value: "lingerie", label: "Lingerie" },
      { value: "accessory", label: "Accessories" },
      { value: "restraint", label: "Restraints" },
      { value: "furniture", label: "Furniture" },
      { value: "room", label: "Spaces" },
    ],
    statuses: [
      { value: "open", label: "In rotation" },
      { value: "archived", label: "Packed away" },
    ],
    fields: [
      { key: "category", label: "Kind", type: "select", store: "column" },
      { key: "brand", label: "Maker / brand", type: "text", placeholder: "Optional", store: "meta" },
      { key: "body", label: "Notes", type: "textarea", placeholder: "Use, care, limits, favourites.", store: "column" },
      { key: "intensity", label: "Intensity", type: "intensity", store: "column" },
    ],
  },
  talk: {
    kind: "talk",
    path: "/talk",
    title: "Talk",
    kicker: "The table",
    blurb: "One shared card each day, kinks, quizzes, fantasies, and issues — both of you answer here. More info on a prompt opens Education and Activities in Notes.",
    addLabel: "New prompt",
    emptyTitle: "Nothing on the table",
    emptyBody: "Add a question, a kink, a fantasy, or an issue.",
    layout: "list",
    categories: [
      { value: "question", label: "Questions" },
      { value: "kink", label: "Kinks" },
      { value: "fantasy", label: "Fantasies" },
      { value: "quiz", label: "Quizzes" },
      { value: "issues", label: "Issues" },
    ],
    statuses: [
      { value: "open", label: "Open" },
      { value: "done", label: "Answered" },
    ],
    fields: [
      { key: "category", label: "Type", type: "select", store: "column" },
      { key: "body", label: "Prompt", type: "textarea", placeholder: "The question, kink, fantasy, or issue.", store: "column" },
    ],
  },
  roleplay: {
    kind: "roleplay",
    path: "/roleplay",
    title: "Roleplay",
    kicker: "The scene",
    blurb: "Characters, prompts, and scripts you both can run — or buy with points.",
    addLabel: "New roleplay",
    emptyTitle: "No roleplay yet",
    emptyBody: "Write a prompt, a character, or a script.",
    layout: "list",
    catalogLink: true,
    shop: true,
    wheel: true,
    categories: [
      { value: "prompt", label: "Prompts" },
      { value: "character", label: "Characters" },
      { value: "script", label: "Scripts" },
      { value: "setting", label: "Settings" },
    ],
    statuses: [
      { value: "open", label: "Ready" },
      { value: "done", label: "Completed" },
      { value: "archived", label: "Shelved" },
    ],
    fields: [
      { key: "category", label: "Type", type: "select", store: "column" },
      { key: "body", label: "Scene", type: "textarea", placeholder: "Who you are, the setup, limits, and how it ends.", store: "column" },
      { key: "intensity", label: "Heat", type: "intensity", store: "column" },
    ],
    completeLabel: "Complete",
    reopenLabel: "Make ready",
  },
  challenge: {
    kind: "challenge",
    path: "/challenges",
    title: "Challenges",
    kicker: "The month",
    blurb: "Daily practice for your role, plus challenges you assign each other.",
    addLabel: "Assign a challenge",
    emptyTitle: "No assigned challenges",
    emptyBody: "Write a challenge for your partner — or for both of you.",
    layout: "list",
    assignable: true,
    statuses: TASK_STATUSES,
    fields: [
      { key: "body", label: "Practice", type: "textarea", placeholder: "What to do.", store: "column" },
    ],
    completeLabel: "Mark done",
    reopenLabel: "Reopen",
  },
  playbook: {
    kind: "playbook",
    path: "/playbook",
    title: "The Playbook",
    kicker: "The craft",
    blurb: "How to practise this dynamic at your experience — Curious through Established. Add your own notes under each level.",
    addLabel: "New playbook note",
    emptyTitle: "This level is empty",
    emptyBody: "Add a note for this experience, or open the seeded guide.",
    layout: "list",
    categories: PLAYBOOK_CATEGORIES,
    statuses: [
      { value: "open", label: "Active" },
      { value: "archived", label: "Filed" },
    ],
    fields: [
      { key: "category", label: "Experience", type: "select", store: "column" },
      { key: "body", label: "Note", type: "textarea", placeholder: "Practice, cautions, and what you actually do at this depth.", store: "column" },
    ],
  },
};

export function isLeadRole(role: Role | string | null | undefined) {
  return role === "dominant" || role === "switch";
}

export function fillSelectOptions(config: KindConfig): KindConfig {
  const fields = config.fields.map((field) => {
    if (field.type !== "select") return field;
    const options = field.options?.length
      ? field.options
      : (config.categories ?? []).filter((item) => !item.parent);
    return { ...field, options };
  });
  const statuses = config.statuses.some((item) => item.value === "archived")
    ? config.statuses
    : [...config.statuses, { value: "archived", label: "Archived" }];
  return { ...config, fields, statuses };
}

export function isArchivedEntry(entry: { status: string; effectiveStatus?: string }) {
  return entry.status === "archived" || entry.effectiveStatus === "archived";
}

export function builtinSlugs(kind: Kind) {
  return new Set((KINDS[kind].categories ?? []).map((item) => item.value));
}

export function slugify(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "item";
}
