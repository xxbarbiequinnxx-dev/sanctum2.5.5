import { kinkLabel, parseKinks } from "@/lib/kinks";
import { experienceLabel } from "@/lib/experience";
import { roleLabel, sexLabel } from "@/lib/format";
import { styleLabel } from "@/lib/role-styles";
import type { Role } from "@/lib/kinds";

export const MEMORY_KINDS = [
  "fact",
  "preference",
  "kink",
  "hobby",
  "interest",
  "personality",
  "appointment",
  "person",
  "need",
  "scene",
] as const;

export type MemoryKind = (typeof MEMORY_KINDS)[number];

export type CompanionMemory = {
  id: number;
  kind: string;
  body: string;
  dueAt: string | null;
  salience: number;
  updatedAt: string;
};

export type WorldEntry = {
  kind: string;
  title: string;
  status: string;
  cadence: string | null;
};

export type CompanionWorld = {
  nowLabel: string;
  writable: boolean;
  profile: {
    displayName: string;
    username: string;
    age: number | null;
    sex: string;
    role: string;
    roleStyle: string;
    experience: string;
    playMode: string;
    kinks: string[];
  };
  partner: { username: string; role: string } | null;
  entries: WorldEntry[];
  memories: CompanionMemory[];
};

const ASSIGN_KIND: Record<string, string> = {
  task: "task",
  tasks: "task",
  reminder: "task",
  habit: "task",
  habits: "task",
  training: "rabbit",
  rabbit: "rabbit",
  protocol: "rabbit",
  punishment: "punishment",
  punishments: "punishment",
  correction: "punishment",
  reward: "reward",
  rewards: "reward",
  game: "game",
  games: "game",
  challenge: "challenge",
  challenges: "challenge",
  scene: "scene",
  scenes: "scene",
  roleplay: "roleplay",
};

const KIND_LABEL: Record<string, string> = {
  task: "Tasks",
  rabbit: "Training",
  punishment: "Punishments",
  reward: "Rewards",
  game: "Games",
  challenge: "Challenges",
  scene: "Scenes",
  roleplay: "Roleplay",
  journal: "Journal",
  talk: "Talk",
};

export function normalizeMemoryKind(value: unknown): MemoryKind {
  const raw = String(value ?? "")
    .trim()
    .toLowerCase();
  if ((MEMORY_KINDS as readonly string[]).includes(raw)) return raw as MemoryKind;
  if (raw === "appointment" || raw === "appt" || raw === "event") return "appointment";
  if (raw.includes("kink")) return "kink";
  if (raw.includes("hobby")) return "hobby";
  if (raw.includes("interest")) return "interest";
  if (raw.includes("need")) return "need";
  if (raw.includes("person")) return "person";
  return "fact";
}

export function normalizeAssignKind(value: unknown) {
  const raw = String(value ?? "")
    .trim()
    .toLowerCase();
  return ASSIGN_KIND[raw] ?? null;
}

export function normalizeCadence(kind: string, value: unknown, assignKindHint?: string) {
  const raw = String(value ?? "")
    .trim()
    .toLowerCase();
  if (assignKindHint === "habit" || raw === "habit") return "habit";
  if (raw === "daily") return "daily";
  if (raw === "weekly") return "weekly";
  if (raw === "custom") return "custom";
  if (kind === "rabbit" && (raw === "once" || !raw)) return "daily";
  if (raw === "once" || raw === "one-off" || raw === "oneoff") return null;
  return raw || null;
}

export function normalizeReminderTime(value: unknown) {
  const raw = String(value ?? "").trim();
  const match = /^(\d{1,2}):(\d{2})$/.exec(raw);
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function normalizeEntryTitle(value: unknown) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function titlesOverlap(a: unknown, b: unknown) {
  const na = normalizeEntryTitle(a);
  const nb = normalizeEntryTitle(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  if (na.includes(nb) || nb.includes(na)) {
    const shorter = Math.min(na.length, nb.length);
    const longer = Math.max(na.length, nb.length);
    if (shorter >= 6 && shorter / longer >= 0.55) return true;
  }
  const ta = new Set(na.split(" ").filter((item) => item.length > 1));
  const tb = new Set(nb.split(" ").filter((item) => item.length > 1));
  if (!ta.size || !tb.size) return false;
  let inter = 0;
  for (const token of ta) if (tb.has(token)) inter += 1;
  const union = new Set([...ta, ...tb]).size;
  return inter >= 2 && inter / union >= 0.8;
}

export function parseDueAt(value: unknown) {
  if (value == null || value === "") return null;
  const raw = String(value).trim();
  if (!raw) return null;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export function formatCompanionWorld(world: CompanionWorld) {
  const p = world.profile;
  const kinks = p.kinks.map((item) => kinkLabel(item)).filter(Boolean);
  const lines: string[] = [
    world.writable
      ? `Sanctum snapshot (${world.nowLabel}). This is their companion house. You can see it and you may write into it.`
      : `Sanctum snapshot (${world.nowLabel}). Talk only. You cannot see or change their solo or partner pages.`,
    `Profile: ${p.displayName || p.username || "them"}, ${p.age ?? "age unset"}, ${sexLabel(p.sex) || "sex unset"}, ${roleLabel(p.role as Role)}${p.roleStyle ? ` (${styleLabel(p.role as Role, p.roleStyle) || p.roleStyle})` : ""}, ${experienceLabel(p.experience)}, play ${p.playMode || "solo"}. Username ${p.username || "unset"}.`,
    kinks.length ? `Their kinks: ${kinks.join(", ")}.` : "Their kinks: none listed yet.",
  ];
  if (world.partner) {
    lines.push(`Live partner: ${world.partner.username}, ${roleLabel(world.partner.role as Role)}.`);
  } else {
    lines.push("No live human partner.");
  }

  if (!world.writable) {
    return lines.join("\n");
  }

  const open = world.entries.filter((item) => item.status !== "done" && item.status !== "archived" && item.status !== "skipped");
  const byKind = new Map<string, WorldEntry[]>();
  for (const item of open) {
    const list = byKind.get(item.kind) ?? [];
    if (list.length < 6) list.push(item);
    byKind.set(item.kind, list);
  }
  if (!open.length) {
    lines.push("Open pages: nothing waiting.");
  } else {
    for (const [kind, list] of byKind) {
      const label = KIND_LABEL[kind] ?? kind;
      lines.push(
        `${label}: ${list.map((item) => `${item.title}${item.cadence ? ` (${item.cadence})` : ""}`).join("; ")}.`,
      );
    }
  }
  lines.push("Do not assign a second copy of anything already listed.");
  const already = world.entries
    .filter((item) => item.status === "done" || item.status === "skipped")
    .slice(0, 12);
  if (already.length) {
    lines.push(`Already on file (do not duplicate): ${already.map((item) => item.title).join("; ")}.`);
  }

  const due = world.memories.filter((item) => item.kind === "appointment" && item.dueAt);
  if (due.length) {
    lines.push(
      `Appointments you remember: ${due
        .slice(0, 8)
        .map((item) => `${item.body} @ ${item.dueAt}`)
        .join("; ")}.`,
    );
  }

  const facts = world.memories.filter((item) => item.kind !== "appointment").slice(0, 36);
  if (facts.length) {
    lines.push(
      `Memories you already hold (use them; update them when they change): ${facts
        .map((item) => `[${item.kind}] ${item.body}`)
        .join(" | ")}.`,
    );
  } else {
    lines.push("Memories: none yet. Save what they tell you that should last.");
  }

  return lines.join("\n");
}

export function dueCompanionCue(world: CompanionWorld, now = new Date()) {
  const soon = now.getTime() + 36 * 60 * 60 * 1000;
  const appts = world.memories.filter((item) => {
    if (item.kind !== "appointment" || !item.dueAt) return false;
    const t = new Date(item.dueAt).getTime();
    return Number.isFinite(t) && t <= soon;
  });
  if (!appts.length) return "";
  return `Something is due. Bring it up in character, specifically: ${appts
    .map((item) => item.body)
    .join("; ")}. Do not wait for them to mention it.`;
}
