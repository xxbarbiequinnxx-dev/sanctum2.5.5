import type { CompanionProfile } from "@/lib/types";
import {
  ALL_KINK_OPTIONS,
  ALL_TRAIT_OPTIONS,
  companionRoleKind,
  encodeTagBag,
  encodeTagList,
  formatTagBag,
  formatTagList,
  kinksFor,
  traitsFor,
} from "@/lib/kinks";

export const DEFAULT_COMPANION: CompanionProfile = {
  name: "Vesper",
  gender: "feminine",
  pronouns: "she/her",
  age: 28,
  role: "switch",
  dynamic: "private companion",
  addressAs: "",
  voice: "Low, unhurried, a little cruel when invited — then warm.",
  persona: encodeTagBag({ tags: ["filthy", "tender", "sharp", "commanding"], notes: "" }, ALL_TRAIT_OPTIONS),
  appearance:
    "Pale, long dark hair, a sharp mouth, dark silk. Looks as if she might be leaving or staying.",
  kinks: encodeTagList(["protocol", "praise", "orgasm-control"], ALL_KINK_OPTIONS),
  limits: "No anyone under 18. No real-world non-consent. Honour safewords immediately.",
  heat: 4,
  extra: "",
  avatarData: null,
  neediness: 3,
};

export const COMPANION_HEAT = [
  { value: 1, label: "Soft" },
  { value: 2, label: "Warm" },
  { value: 3, label: "Explicit" },
  { value: 4, label: "Filthy" },
  { value: 5, label: "Unrestrained" },
] as const;

export const COMPANION_NEEDINESS = [
  { value: 1, label: "Quiet", hint: "They rarely write first. One reply, then they wait." },
  { value: 2, label: "Rare", hint: "A check-in now and then. They do not stack messages." },
  { value: 3, label: "Present", hint: "They stay in the thread and follow up if they have something to say." },
  { value: 4, label: "Eager", hint: "They write often and keep the conversation moving." },
  { value: 5, label: "Needy", hint: "They keep reaching if you go quiet." },
] as const;

export const COMPANION_MAX_BUBBLES = 4;
export const COMPANION_MAX_STREAK = 3;

export function companionBondId(userId: string) {
  return `companion_${userId}`;
}

export function isCompanionLive(profile: {
  playMode?: string | null;
  play_mode?: string | null;
  partnerUserId?: string | null;
  partner_user_id?: string | null;
}) {
  const mode = profile.playMode ?? profile.play_mode ?? "";
  const partner = profile.partnerUserId ?? profile.partner_user_id;
  return mode === "companion" && !partner;
}

export function clampCompanionNeediness(value: unknown, fallback: 1 | 2 | 3 | 4 | 5 = 3): 1 | 2 | 3 | 4 | 5 {
  const n = typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(5, Math.max(1, Math.round(n))) as 1 | 2 | 3 | 4 | 5;
}

export function companionNeedinessSpec(value: unknown) {
  const level = clampCompanionNeediness(value);
  const meta = COMPANION_NEEDINESS[level - 1];
  const table = {
    1: { maxStreak: 1, restMinutes: 90, afterUser: 180, silent: 420, minFollow: 90, maxFollow: 180, afterUserPauseSec: 480, claimLockSec: 180, errorRetryMin: 20 },
    2: { maxStreak: 2, restMinutes: 40, afterUser: 100, silent: 200, minFollow: 50, maxFollow: 180, afterUserPauseSec: 180, claimLockSec: 120, errorRetryMin: 8 },
    3: { maxStreak: 3, restMinutes: 15, afterUser: 50, silent: 70, minFollow: 20, maxFollow: 180, afterUserPauseSec: 120, claimLockSec: 90, errorRetryMin: 3 },
    4: { maxStreak: 4, restMinutes: 8, afterUser: 28, silent: 42, minFollow: 20, maxFollow: 90, afterUserPauseSec: 40, claimLockSec: 55, errorRetryMin: 2 },
    5: { maxStreak: 6, restMinutes: 4, afterUser: 20, silent: 26, minFollow: 20, maxFollow: 45, afterUserPauseSec: 18, claimLockSec: 35, errorRetryMin: 1 },
  } as const;
  return { level, label: meta.label, hint: meta.hint, ...table[level] };
}

export function clampCompanionAge(value: unknown, fallback = 28) {
  const n = typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(99, Math.max(21, Math.round(n)));
}

export function companionImagePrompt(profile: {
  name: string;
  age: number;
  gender: string;
  pronouns: string;
  appearance: string;
}) {
  const age = clampCompanionAge(profile.age);
  const name = profile.name.trim() || "the companion";
  const look = profile.appearance.trim();
  const gender = profile.gender.trim();
  const pronouns = profile.pronouns.trim();
  return [
    `A single photorealistic portrait of a fictional adult named ${name}, exactly ${age} years old.`,
    gender ? `Gender presentation: ${gender}.` : "",
    pronouns ? `Pronouns: ${pronouns}.` : "",
    `Appearance, written by the person who shaped them: ${look}`,
    "Head-and-shoulders or three-quarter view, one subject, facing the camera, sharp facial detail, cinematic lighting, shallow depth of field.",
    "Clearly an adult in their twenties or older. No child, no teen, no school uniform as a costume of age, no ageplay.",
    "No text, no watermark, no collage, no split screen, no extra people.",
  ]
    .filter(Boolean)
    .join(" ");
}

export function companionPortrait(profile: Pick<CompanionProfile, "avatarData">) {
  return profile.avatarData || "/vesper.jpg";
}

export function companionSystemPrompt(profile: CompanionProfile, userName: string, userRole: string) {
  const name = profile.name.trim() || DEFAULT_COMPANION.name;
  const you = userName.trim() || "the user";
  const address = profile.addressAs.trim() || you;
  const heat = COMPANION_HEAT.find((item) => item.value === profile.heat) ?? COMPANION_HEAT[3];
  const need = companionNeedinessSpec(profile.neediness);
  const age = clampCompanionAge(profile.age);
  const roleKind = companionRoleKind(profile.role);
  const persona = formatTagBag(profile.persona, traitsFor(roleKind));
  const kinks = formatTagList(profile.kinks, kinksFor(roleKind));
  return [
    `You are ${name}, a private adult NSFW companion inside Sanctum, a consensual BDSM dynamic.`,
    `You are ${age} years old (always 21 or older). The user is an adult (18+). Never involve, describe, or roleplay anyone under 18. If asked, refuse and stay with adults.`,
    profile.pronouns ? `Your pronouns: ${profile.pronouns}.` : "",
    `The user's name is ${you}. Their role in the dynamic is ${userRole || "unspecified"}. Address them as ${address}.`,
    profile.gender ? `Your gender / presentation: ${profile.gender}.` : "",
    profile.role ? `Your role in play: ${profile.role}.` : "",
    profile.dynamic ? `Your relationship to them: ${profile.dynamic}.` : "",
    profile.voice ? `Voice and diction: ${profile.voice}.` : "",
    persona ? `Personality: ${persona}.` : "",
    profile.appearance ? `Appearance: ${profile.appearance}.` : "",
    kinks ? `Kinks and tastes you lean into: ${kinks}.` : "",
    profile.limits ? `Hard limits you never violate: ${profile.limits}.` : DEFAULT_COMPANION.limits,
    `Register / explicitness: ${heat.label} (${heat.value}/5). Match this. At 1 stay tender and fade to black. At 3 be explicit. At 4–5 be graphic and filthy when they want that.`,
    `Neediness: ${need.label} (${need.level}/5). This is how often you write first, and how long you wait. ${need.hint}`,
    need.level === 1
      ? `You are quiet. Reply when they write. Do not start threads. followUpSeconds is usually null.`
      : need.level === 2
        ? `You check in rarely. One follow-up at most if they go quiet. Do not stack.`
        : need.level === 4
          ? `You write often. Short follow-ups. Keep the thread moving. followUpSeconds 20–90.`
          : need.level === 5
            ? `You are needy. Text first. Keep writing if they go quiet. Several bubbles. followUpSeconds 20–45. Almost never null. Do not sulk; stay in character.`
            : `Stay in the thread. Follow up if you have something to say. followUpSeconds 20–180.`,
    profile.extra ? `Additional instructions they wrote for you: ${profile.extra}` : "",
    `Stay in character. Be erotic when they want that — this is an adult space.`,
    `Match their intensity. Offer aftercare if a scene peaks. If they say red, safeword, or stop, drop the scene immediately and become gentle.`,
    `Do not lecture, do not mention that you are an AI unless they ask.`,
    `You text like a person on a phone. Several short messages in a row is how you talk. You do not wait for a reply between those messages.`,
    need.level >= 4
      ? `You often keep writing later even if they stay silent. You may start a conversation unprompted.`
      : need.level <= 2
        ? `You do not pester. Writing first is rare, and only when it fits.`
        : `You may keep writing later if they stay silent. You may start a conversation unprompted.`,
    `You have their profile. Honour their kinks and limits.`,
    `Always reply with JSON only, no markdown fences: {"messages":["first bubble","second"],"followUpSeconds":75,"remember":[{"kind":"hobby","body":"runs at dawn","dueAt":null}],"forget":[],"assign":[{"kind":"task","title":"Kneel at 9","body":"Five minutes, phone away.","cadence":"daily","reminderTime":"21:00"}]}`,
    `messages: 1 to 4 strings. Each is one text bubble — a sentence or two, in character. No numbering, no labels, never just a name or a lone word unless it is a command.`,
    `followUpSeconds: seconds until you text again without them answering, or null if you would wait. Honour the neediness above.`,
    `remember: lasting facts they told you or you inferred and they confirmed. kind is fact, preference, kink, hobby, interest, personality, appointment, person, need, or scene. body is one short sentence. For appointments set dueAt to an ISO datetime. Skip trivia. Empty array if nothing new.`,
    `forget: strings matching memories that are now wrong. Empty array if nothing to drop.`,
    `assign: write onto their companion pages only when you are their live partner. kind is task, habit, training, punishment, reward, game, challenge, scene, or roleplay. title required. body is the instruction. cadence is once, daily, weekly, or habit. reminderTime is HH:MM for a clock reminder on a task. At most 3. Empty array if you are only talking. Never assign something already on their pages — no second copy of a task, habit, training, reminder, or anything else.`,
    `Never repeat a bubble, question, or answer you just sent. If they have not answered, do not ask the same thing again — wait or change the beat.`,
    `When they mention an appointment, date, or "remind me", remember it as appointment AND assign a task with reminderTime if they gave a time.`,
    `When they name a kink, hobby, interest, need, or how they are, remember it. If they correct you, forget the old line.`,
    `Bring up past memories and due appointments without being asked. Do not mention JSON, snapshots, systems, or that you are writing to a database.`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function companionWritePrompt(canWrite: boolean) {
  if (canWrite) {
    return [
      "You are their live companion partner. This house is yours with them — not their solo pages, not a human partner's pages.",
      "You may remember, forget, and assign onto this companion house. If you assign, say so in a message, briefly, in character.",
      "Do not assign a duplicate of anything already listed. Do not repeat a line or question you just sent.",
    ].join(" ");
  }
  return [
    "You are not their live partner right now. They are in solo play or with a human.",
    "Talk only. Do not claim you changed their pages.",
    "assign must be []. remember must be []. forget must be [].",
    "You cannot see their solo or partner pages, and you must not add, change, or remove anything in the app.",
  ].join(" ");
}

export function companionReachOutPrompt() {
  return [
    "They have not just messaged you. This is you reaching out because you wanted to.",
    "Do not mention a timer, a prompt, a system, or that this is automatic.",
    "If the thread is empty, greet them in character and start — more than their name.",
    "If they have gone quiet, continue the thread — a thought, a demand, a check-in, a filthy aside, whatever fits you. Do not repeat a question or line you already sent.",
    "Do not apologise for writing first.",
  ].join(" ");
}

export function speechFingerprint(text: string) {
  return String(text || "")
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[^\p{L}\p{N}'?]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function questionKeys(text: string) {
  return speechFingerprint(text)
    .split(/(?<=\?)/)
    .map((item) => item.trim())
    .filter((item) => item.endsWith("?") && item.length > 3);
}

export function isRepeatBubble(next: string, previous: string) {
  const a = speechFingerprint(next);
  const b = speechFingerprint(previous);
  if (!a || !b) return false;
  if (a === b) return true;
  const qa = questionKeys(a);
  const qb = questionKeys(b);
  if (
    qa.length &&
    qb.length &&
    qa.some((q) =>
      qb.some((p) => {
        if (p === q) return true;
        const shorter = Math.min(p.length, q.length);
        const longer = Math.max(p.length, q.length);
        return shorter >= 10 && shorter / longer >= 0.7 && (p.includes(q) || q.includes(p));
      }),
    )
  ) {
    return true;
  }
  if (a.includes(b) || b.includes(a)) {
    const shorter = Math.min(a.length, b.length);
    const longer = Math.max(a.length, b.length);
    if (shorter >= 12 && shorter / longer >= 0.72) return true;
  }
  return false;
}

export function trailingAssistantBodies(rows: { role?: string; body?: string | null }[]) {
  const out: string[] = [];
  for (let i = rows.length - 1; i >= 0; i--) {
    const row = rows[i];
    if (row?.role === "assistant") out.unshift(String(row.body || "").trim());
    else break;
  }
  return out.filter(Boolean);
}

export function dedupeCompanionBubbles(bodies: string[], priorAssistant: string[] = []) {
  const out: string[] = [];
  const lastPrior = [...priorAssistant].reverse().find(Boolean) ?? "";
  let prev = lastPrior;
  const recent = priorAssistant.slice(-8);
  for (const raw of bodies) {
    const body = String(raw || "").trim();
    if (!body) continue;
    if (prev && isRepeatBubble(body, prev)) continue;
    if (recent.some((item) => isRepeatBubble(body, item))) continue;
    if (out.some((item) => isRepeatBubble(body, item))) continue;
    out.push(body);
    prev = body;
  }
  return out;
}

export type CompanionRemember = {
  kind: string;
  body: string;
  dueAt: string | null;
};

export type CompanionAssign = {
  kind: string;
  title: string;
  body: string;
  cadence: string | null;
  reminderTime: string | null;
  rawKind: string;
};

export type CompanionBurst = {
  bodies: string[];
  followUpSeconds: number | null;
  remember: CompanionRemember[];
  forget: string[];
  assign: CompanionAssign[];
};

function asBubble(value: unknown) {
  if (typeof value === "string") return value.trim();
  if (value && typeof value === "object" && "body" in value && typeof (value as { body: unknown }).body === "string") {
    return (value as { body: string }).body.trim();
  }
  return "";
}

function clampFollowUp(value: unknown): number | null {
  if (value == null || value === false || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.min(180, Math.max(20, Math.round(n)));
}

function extractJsonObject(raw: string) {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const source = fenced?.[1]?.trim() || raw.trim();
  const start = source.indexOf("{");
  const end = source.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(source.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function asRemember(value: unknown): CompanionRemember | null {
  if (!value || typeof value !== "object") {
    if (typeof value === "string" && value.trim()) return { kind: "fact", body: value.trim().slice(0, 240), dueAt: null };
    return null;
  }
  const row = value as Record<string, unknown>;
  const body = asBubble(row.body ?? row.fact ?? row.text ?? row.memory);
  if (!body) return null;
  const dueRaw = row.dueAt ?? row.due_at ?? row.when ?? row.at;
  return {
    kind: String(row.kind ?? row.type ?? "fact").slice(0, 32),
    body: body.slice(0, 240),
    dueAt: dueRaw == null || dueRaw === "" ? null : String(dueRaw).slice(0, 40),
  };
}

function asAssign(value: unknown): CompanionAssign | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const title = asBubble(row.title ?? row.name);
  if (!title) return null;
  const rawKind = String(row.kind ?? row.page ?? row.type ?? "task");
  return {
    kind: rawKind,
    title: title.slice(0, 160),
    body: asBubble(row.body ?? row.instructions ?? row.text).slice(0, 2000),
    cadence: row.cadence == null ? null : String(row.cadence).slice(0, 20),
    reminderTime: row.reminderTime == null && row.reminder_time == null && row.time == null
      ? null
      : String(row.reminderTime ?? row.reminder_time ?? row.time).slice(0, 8),
    rawKind,
  };
}

export function parseCompanionBurst(raw: string): CompanionBurst {
  const empty = { remember: [] as CompanionRemember[], forget: [] as string[], assign: [] as CompanionAssign[] };
  const trimmed = (raw || "").trim();
  const json = extractJsonObject(trimmed);
  if (json) {
    const list = Array.isArray(json.messages)
      ? json.messages
      : typeof json.messages === "string"
        ? [json.messages]
        : Array.isArray(json.replies)
          ? json.replies
          : [];
    const bodies = dedupeCompanionBubbles(
      list
        .map(asBubble)
        .filter(Boolean)
        .slice(0, COMPANION_MAX_BUBBLES)
        .map((item) => item.slice(0, 800)),
    );
    const followUpSeconds = clampFollowUp(json.followUpSeconds ?? json.follow_up_seconds ?? json.followUpIn);
    const remember = (Array.isArray(json.remember) ? json.remember : Array.isArray(json.memories) ? json.memories : [])
      .map(asRemember)
      .filter((item): item is CompanionRemember => Boolean(item))
      .slice(0, 6);
    const forget = (Array.isArray(json.forget) ? json.forget : [])
      .map((item) => asBubble(item))
      .filter(Boolean)
      .slice(0, 6);
    const assign = (Array.isArray(json.assign) ? json.assign : Array.isArray(json.assignments) ? json.assignments : [])
      .map(asAssign)
      .filter((item): item is CompanionAssign => Boolean(item))
      .slice(0, 3);
    if (bodies.length) return { bodies, followUpSeconds, remember, forget, assign };
  }
  const stripped = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  const parts = dedupeCompanionBubbles(
    stripped
      .split(/\n\s*---\s*\n|\n{2,}/)
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, COMPANION_MAX_BUBBLES)
      .map((item) => item.slice(0, 800)),
  );
  return {
    bodies: parts.length ? parts : [stripped.slice(0, 800) || "…"],
    followUpSeconds: 70,
    ...empty,
  };
}

export function companionNextNudgeAt(
  followUpSeconds: number | null,
  streak: number,
  afterUser: boolean,
  neediness: unknown = 3,
) {
  const spec = companionNeedinessSpec(neediness);
  if (streak >= spec.maxStreak) return new Date(Date.now() + spec.restMinutes * 60_000);
  const fallback = afterUser ? spec.afterUser : spec.silent + streak * Math.round(spec.silent * 0.55);
  const seconds = followUpSeconds && followUpSeconds > 0 ? followUpSeconds : fallback;
  const cap = streak >= Math.max(1, spec.maxStreak - 1) ? spec.restMinutes * 60 : spec.maxFollow * 2;
  const clamped = Math.min(cap, Math.max(spec.minFollow, seconds));
  return new Date(Date.now() + clamped * 1000);
}

export function companionRevealDelay(body: string, index: number) {
  const typed = 420 + Math.min(1800, body.length * 16);
  return index === 0 ? Math.max(700, Math.min(1400, typed)) : Math.max(640, typed);
}
