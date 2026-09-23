import { coupleExperience, meetsExperience, parseExperience, type Experience } from "@/lib/experience";
import type { Role } from "@/lib/kinds";
import { WEEKLY_PROMPTS } from "@/lib/weekly-prompts";
import { soloBody } from "@/lib/weekly-solo";

export type QuizOption = { value: string; label: string };
export type QuizQuestion = {
  prompt: string;
  options: QuizOption[];
  min?: Experience;
};

export type QuizPack = {
  id: string;
  title: string;
  blurb: string;
  questions: QuizQuestion[];
};

export type WeekKind =
  | "communication"
  | "public"
  | "scene"
  | "roleplay"
  | "task"
  | "game"
  | "training"
  | "reward"
  | "punishment"
  | "kink";

export const WEEK_KINDS: WeekKind[] = [
  "communication",
  "public",
  "scene",
  "roleplay",
  "task",
  "game",
  "training",
  "reward",
  "punishment",
  "kink",
];

export type WeekPromptBody = {
  title: string;
  description: string;
  easy: string;
  hard: string;
  extreme: string;
};

export type WeekPrompt = {
  id: string;
  kind: WeekKind;
  kinks: string[];
  min?: Experience;
  dominant: WeekPromptBody;
  submissive: WeekPromptBody;
};

export type ResolvedWeekPrompt = WeekPromptBody & {
  id: string;
  kind: WeekKind;
  kinks: string[];
  matchedKinks: string[];
  min?: Experience;
  role: Role;
  solo: boolean;
};

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function talkWeekKey(date = new Date()) {
  const day = date.getUTCDay();
  const daysFromMonday = (day + 6) % 7;
  const monday = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() - daysFromMonday, 0, 1, 0, 0));
  if (date.getTime() < monday.getTime()) monday.setUTCDate(monday.getUTCDate() - 7);
  return monday.toISOString().slice(0, 10);
}

function seededPick<T>(items: T[], seed: string, count: number) {
  if (!items.length) return [];
  const rand = mulberry32(
    [...seed].reduce((h, ch) => Math.imul(h ^ ch.charCodeAt(0), 16777619), 2166136261) >>> 0,
  );
  const pool = [...items];
  const out: T[] = [];
  while (pool.length && out.length < count) {
    const i = Math.floor(rand() * pool.length);
    out.push(pool.splice(i, 1)[0]!);
  }
  return out;
}

export const WEEKLY_QUIZZES: QuizPack[] = [
  {
    id: "love",
    title: "Love languages",
    blurb: "How care actually lands — in and out of dynamic.",
    questions: [
      { prompt: "I feel most loved when you…", options: [
        { value: "words", label: "Tell me, specifically, what I did well" },
        { value: "time", label: "Give me undivided time with no phones" },
        { value: "touch", label: "Reach for me without it having to become a scene" },
        { value: "acts", label: "Do the unglamorous thing I asked for last week" },
        { value: "gifts", label: "Leave something small that says you thought of me" },
      ]},
      { prompt: "When I am dropping, the language I need first is…", options: [
        { value: "words", label: "Words — I am safe, I did well, you are here" },
        { value: "touch", label: "Quiet touch and a blanket" },
        { value: "acts", label: "Water, food, the lights down" },
        { value: "time", label: "You staying, even if we say nothing" },
      ]},
      { prompt: "A public way you can love me without anyone else clocking it…", options: [
        { value: "glance", label: "A look we already agreed means 'I have you'" },
        { value: "text", label: "A short message in the ordinary day" },
        { value: "errand", label: "Handling something so I don't have to" },
        { value: "none", label: "Keep it private. Public is not for us." },
      ]},
      { prompt: "The love language I fake because I think I should…", min: "curious", options: [
        { value: "gifts", label: "Gifts — I smile and feel nothing" },
        { value: "words", label: "Praise that sounds like a script" },
        { value: "touch", label: "Touch I don't actually want yet" },
        { value: "acts", label: "Service I resent later" },
      ]},
      { prompt: "In protocol, love looks like…", min: "practiced", options: [
        { value: "precision", label: "Exactness. You meant what you asked." },
        { value: "warmth", label: "Warmth inside the rule, not instead of it" },
        { value: "release", label: "Being allowed to stop performing" },
        { value: "demand", label: "Being asked for more because you trust I can" },
      ]},
      { prompt: "The unsexy act that is actually my love language in a 24/7 stretch…", min: "seasoned", options: [
        { value: "calendar", label: "Keeping the calendar so I don't have to hold it" },
        { value: "food", label: "Feeding me when I forget" },
        { value: "sleep", label: "Protecting sleep and drop days" },
        { value: "repair", label: "Coming back after a rupture without theatre" },
      ]},
      { prompt: "Edge-play aftercare as a love language should include…", min: "established", options: [
        { value: "medical", label: "Practical body care, not just cuddles" },
        { value: "debrief", label: "A real debrief, even if it is ugly" },
        { value: "space", label: "Space first, then a scheduled check-in" },
        { value: "claim", label: "Being claimed again, so I know I still belong" },
      ]},
    ],
  },
  {
    id: "kink",
    title: "Kink",
    blurb: "Taste, appetite, and the difference between a picture and a practice.",
    questions: [
      { prompt: "Right now my kink appetite is…", options: [
        { value: "soft", label: "Soft — protocol, voice, being held in a role" },
        { value: "sensation", label: "Sensation — I want to feel something" },
        { value: "head", label: "Headspace more than pain or toys" },
        { value: "mixed", label: "A mix, but I need to name it each time" },
      ]},
      { prompt: "The kink I want named out loud this week is…", options: [
        { value: "restraint", label: "Restraint / being held still" },
        { value: "impact", label: "Impact" },
        { value: "service", label: "Service" },
        { value: "control", label: "Control of orgasm, time, or permission" },
        { value: "none", label: "None — I want vanilla closeness" },
      ]},
      { prompt: "A hard limit I need restated, even if you already know…", options: [
        { value: "body", label: "Something about my body" },
        { value: "words", label: "Words or names" },
        { value: "people", label: "Other people, even in fantasy" },
        { value: "record", label: "Photos, video, or anything kept" },
        { value: "none", label: "Nothing new — my list is current" },
      ]},
      { prompt: "I want intensity to trend…", min: "curious", options: [
        { value: "down", label: "Down. More aftercare than edge." },
        { value: "even", label: "Where we already are" },
        { value: "up", label: "Up, slowly, with a plan" },
        { value: "spike", label: "One planned spike, then rest" },
      ]},
      { prompt: "Marks, bruises, or evidence should be…", min: "practiced", options: [
        { value: "none", label: "None this season" },
        { value: "hidden", label: "Fine if hidden" },
        { value: "kept", label: "I want to keep them a few days" },
        { value: "shown", label: "I want them seen by you, not the world" },
      ]},
      { prompt: "The kink I perform because I think you want it…", min: "seasoned", options: [
        { value: "pain", label: "Pain I don't actually crave" },
        { value: "degrade", label: "Degradation that misses me" },
        { value: "service", label: "Service that has gone empty" },
        { value: "none", label: "I am not performing. I will say if I am." },
      ]},
      { prompt: "Edge play this week is…", min: "established", options: [
        { value: "off", label: "Off the table" },
        { value: "talk", label: "Talk only — no running it" },
        { value: "negotiated", label: "Negotiated, with a written aftercare plan" },
        { value: "trusted", label: "Inside our standing yes, with safewords live" },
      ]},
    ],
  },
  {
    id: "roleplay",
    title: "Roleplay",
    blurb: "Who you become, and how you get back.",
    questions: [
      { prompt: "I slip into a role best when…", options: [
        { value: "clothes", label: "Clothes or a collar change first" },
        { value: "voice", label: "Your voice changes" },
        { value: "name", label: "You use a name that isn't the daily one" },
        { value: "place", label: "We leave the ordinary room, even a little" },
      ]},
      { prompt: "A role I want to try or return to…", options: [
        { value: "service", label: "Service — staff, attendant, kept" },
        { value: "stranger", label: "Strangers who shouldn't" },
        { value: "owner", label: "Owner and belonging" },
        { value: "teacher", label: "Teacher / coach / inspector" },
        { value: "none", label: "I don't want a role. I want us." },
      ]},
      { prompt: "When the role slips, please…", options: [
        { value: "catch", label: "Catch me back in, gently" },
        { value: "ask", label: "Ask if I want in or out" },
        { value: "drop", label: "Let it become us without comment" },
        { value: "stop", label: "Stop the scene and check" },
      ]},
      { prompt: "Words that belong only in the role…", min: "curious", options: [
        { value: "titles", label: "Titles" },
        { value: "cruel", label: "Cruel or filthy lines" },
        { value: "story", label: "The backstory we invented" },
        { value: "none", label: "No special vocabulary" },
      ]},
      { prompt: "How long should a role last?", min: "practiced", options: [
        { value: "scene", label: "The scene, then a clear out" },
        { value: "evening", label: "The evening, with a safeword out" },
        { value: "thread", label: "A message thread across days" },
        { value: "rare", label: "Rare, and fully planned" },
      ]},
      { prompt: "A role that is too close to real life is…", min: "seasoned", options: [
        { value: "work", label: "Work / rank / actual jobs" },
        { value: "family", label: "Family-shaped stories" },
        { value: "ex", label: "Anyone who actually existed" },
        { value: "ok", label: "Fine if we name the difference first" },
      ]},
      { prompt: "CNC or resistance-in-role this week is…", min: "established", options: [
        { value: "no", label: "No" },
        { value: "light", label: "Light struggle, lots of checking" },
        { value: "scripted", label: "Scripted, with a written out" },
        { value: "standing", label: "Inside our standing negotiation only" },
      ]},
    ],
  },
  {
    id: "scenes",
    title: "Scenes",
    blurb: "How a night is built, run, and closed.",
    questions: [
      { prompt: "The next scene should start with…", options: [
        { value: "talk", label: "A talk and a drink of water" },
        { value: "protocol", label: "Protocol — present, wait, be arranged" },
        { value: "warm", label: "Warm-up that could still turn vanilla" },
        { value: "in", label: "In media res. We already negotiated." },
      ]},
      { prompt: "Who names the night?", options: [
        { value: "dom", label: "The Dominant" },
        { value: "sub", label: "The submissive may ask" },
        { value: "either", label: "Either, without ceremony" },
        { value: "calendar", label: "It goes on a calendar" },
      ]},
      { prompt: "I want the arc to be…", options: [
        { value: "slow", label: "Slow, with lots of checking" },
        { value: "peak", label: "A clear peak and a long come-down" },
        { value: "service", label: "Service-shaped, not climax-shaped" },
        { value: "short", label: "Short. I don't have a long runway." },
      ]},
      { prompt: "Toys in the next scene…", min: "curious", options: [
        { value: "none", label: "None. Hands and voice." },
        { value: "one", label: "One chosen piece" },
        { value: "kit", label: "A small kit we lay out together" },
        { value: "surprise", label: "Surprise from a negotiated list" },
      ]},
      { prompt: "If I safeword, the scene…", min: "practiced", options: [
        { value: "ends", label: "Ends. Aftercare starts." },
        { value: "pause", label: "Pauses. We may resume if I say so." },
        { value: "down", label: "Drops two gears, does not end unless I ask" },
        { value: "script", label: "Follows the written plan, not improvisation" },
      ]},
      { prompt: "A scene I want logged (photos, notes) is…", min: "seasoned", options: [
        { value: "never", label: "Never" },
        { value: "notes", label: "Notes only, in Journal" },
        { value: "still", label: "Stills we both agree to keep" },
        { value: "full", label: "A full record, private to the bond" },
      ]},
      { prompt: "Risk-aware edge this week needs…", min: "established", options: [
        { value: "off", label: "It is off" },
        { value: "sober", label: "Sober, slept, eaten" },
        { value: "third", label: "A check-in person or a time-cap" },
        { value: "kit", label: "Kit, first aid, and a written out" },
      ]},
    ],
  },
  {
    id: "aftercare",
    title: "Aftercare",
    blurb: "What happens when the scene ends — and the next morning.",
    questions: [
      { prompt: "Right after, I most need…", options: [
        { value: "touch", label: "Quiet touch and a blanket" },
        { value: "words", label: "Words — what happened, that I did well" },
        { value: "space", label: "A little space, then check-in" },
        { value: "practical", label: "Water, food, and the lights down" },
      ]},
      { prompt: "The next morning I want…", options: [
        { value: "message", label: "A short message, no pressure" },
        { value: "debrief", label: "A proper debrief" },
        { value: "normal", label: "Ordinary day unless I ask" },
        { value: "plan", label: "Already planning the next one" },
      ]},
      { prompt: "If I drop later, please…", options: [
        { value: "stay", label: "Stay close and slow everything down" },
        { value: "call", label: "Call, even if it is late" },
        { value: "list", label: "Use the written list, not improvisation" },
        { value: "ask", label: "Ask me what I need rather than guessing" },
      ]},
      { prompt: "Aftercare I do not want…", min: "curious", options: [
        { value: "sex", label: "Sex as a closer" },
        { value: "jokes", label: "Jokes about what just happened" },
        { value: "crowd", label: "Other people around" },
        { value: "analysis", label: "A post-mortem while I am still in it" },
      ]},
      { prompt: "Food, sugar, salt, protein — my body wants…", min: "practiced", options: [
        { value: "sweet", label: "Something sweet" },
        { value: "savoury", label: "Something savoury and grounding" },
        { value: "water", label: "Water and time, not food yet" },
        { value: "later", label: "A real meal an hour later" },
      ]},
      { prompt: "After a heavy night, protocol the next day should…", min: "seasoned", options: [
        { value: "off", label: "Be off" },
        { value: "soft", label: "Go soft — titles optional" },
        { value: "same", label: "Stay, because structure helps me" },
        { value: "check", label: "Be decided in the morning, not assumed" },
      ]},
      { prompt: "After edge play, the non-negotiable is…", min: "established", options: [
        { value: "sleep", label: "Sleep in the same place" },
        { value: "24h", label: "A 24-hour check-in, calendar'd" },
        { value: "body", label: "Looking at the body together, honestly" },
        { value: "offswitch", label: "An off-switch phrase that ends all protocol" },
      ]},
    ],
  },
  {
    id: "relationship",
    title: "Relationship",
    blurb: "The bond outside the scene.",
    questions: [
      { prompt: "This week I most need us to be…", options: [
        { value: "partners", label: "Partners first, dynamic second" },
        { value: "dynamic", label: "In dynamic. I miss the shape of it." },
        { value: "friends", label: "Friends who laugh" },
        { value: "quiet", label: "Quiet. Less processing, more sitting." },
      ]},
      { prompt: "A conversation we keep postponing is about…", options: [
        { value: "time", label: "Time and how we spend it" },
        { value: "sex", label: "Sex and how often" },
        { value: "future", label: "The future we have not named" },
        { value: "hurt", label: "Something that still hurts" },
        { value: "none", label: "Nothing. We are current." },
      ]},
      { prompt: "When we miss each other, I want…", options: [
        { value: "repair", label: "A repair the same day" },
        { value: "sleep", label: "Sleep, then talk" },
        { value: "write", label: "It written, so I can reread" },
        { value: "touch", label: "Touch first, words later" },
      ]},
      { prompt: "Jealousy, if it is here…", min: "curious", options: [
        { value: "none", label: "It is not here" },
        { value: "name", label: "Name it without solving it" },
        { value: "rule", label: "We need a clearer rule" },
        { value: "reassurance", label: "I need reassurance, not a lecture" },
      ]},
      { prompt: "Money, chores, admin in a power exchange should…", min: "practiced", options: [
        { value: "equal", label: "Stay equal and boring" },
        { value: "service", label: "Be service, if it is chosen" },
        { value: "split", label: "Be split on purpose, in writing" },
        { value: "talk", label: "Be talked about before it becomes kink" },
      ]},
      { prompt: "How open is this bond to other people?", min: "seasoned", options: [
        { value: "closed", label: "Closed. Us only." },
        { value: "social", label: "Social, not sexual" },
        { value: "play", label: "Play with others, negotiated each time" },
        { value: "unset", label: "We have not actually decided" },
      ]},
      { prompt: "A rupture at this depth is repaired by…", min: "established", options: [
        { value: "time", label: "Time and no scenes until we say" },
        { value: "third", label: "A third — therapist, friend, or text" },
        { value: "contract", label: "Rewriting the contract in the light" },
        { value: "body", label: "Careful, non-sexual body closeness first" },
      ]},
    ],
  },
  {
    id: "communication",
    title: "Communication",
    blurb: "How we speak when it is not a scene.",
    questions: [
      { prompt: "When I go quiet, assume…", options: [
        { value: "processing", label: "I am processing — wait" },
        { value: "check", label: "Check in once" },
        { value: "green", label: "I am fine unless I safeword" },
        { value: "yellow", label: "Treat silence as yellow" },
      ]},
      { prompt: "Correction lands best when it is…", options: [
        { value: "firm", label: "Firm and brief" },
        { value: "warm", label: "Warm, then clear" },
        { value: "written", label: "Written, so I can reread it" },
        { value: "private", label: "Always private" },
      ]},
      { prompt: "I want more of this in our ordinary talk…", options: [
        { value: "ask", label: "Questions, not conclusions" },
        { value: "praise", label: "Praise that is specific" },
        { value: "want", label: "Want, said plainly" },
        { value: "apology", label: "Clean apologies" },
      ]},
      { prompt: "During a fight, titles and protocol should…", min: "curious", options: [
        { value: "off", label: "Come off until we repair" },
        { value: "on", label: "Stay — they keep me from spinning" },
        { value: "pause", label: "Pause if either of us asks" },
        { value: "never", label: "Never mix. Fights are vanilla." },
      ]},
      { prompt: "The check-in cadence I actually want…", min: "practiced", options: [
        { value: "daily", label: "A daily line, even a short one" },
        { value: "weekly", label: "A weekly sit-down" },
        { value: "after", label: "Only after scenes" },
        { value: "asneeded", label: "As needed — don't schedule my feelings" },
      ]},
      { prompt: "A word I want retired from how we speak…", min: "seasoned", options: [
        { value: "joke", label: "A joke that isn't funny anymore" },
        { value: "title", label: "A title that has gone sour" },
        { value: "always", label: "'Always' and 'never'" },
        { value: "none", label: "None. Our language is clean." },
      ]},
      { prompt: "After a heavy negotiation, we should…", min: "established", options: [
        { value: "write", label: "Write it down the same night" },
        { value: "sleep", label: "Sleep on it before anything runs" },
        { value: "cool", label: "Have a cool-off safeword for the contract itself" },
        { value: "third", label: "Have someone else hold a copy" },
      ]},
    ],
  },
];

function switchBody(dominant: WeekPromptBody, submissive: WeekPromptBody): WeekPromptBody {
  return {
    title: `${dominant.title.replace(/\s+—.*$/, "")} / ${submissive.title.replace(/\s+—.*$/, "")}`,
    description:
      "You are switching. Name who leads before anything starts — a coin, a look, or a plain 'I have you tonight.' Pick Easy, Hard, or Extreme together. The lead runs it. The follow can still say yellow. Swap on purpose, or stop. Aftercare belongs to whoever went deepest.",
    easy: `Lead: ${dominant.easy} Follow: ${submissive.easy}`,
    hard: `Lead: ${dominant.hard} Follow: ${submissive.hard}`,
    extreme: `Lead: ${dominant.extreme} Follow: ${submissive.extreme}`,
  };
}

function resolvePrompt(prompt: WeekPrompt, role: Role, kinks: string[], solo = false): ResolvedWeekPrompt {
  const body = solo
    ? soloBody(prompt, role)
    : role === "dominant"
      ? prompt.dominant
      : role === "submissive"
        ? prompt.submissive
        : switchBody(prompt.dominant, prompt.submissive);
  const wanted = new Set(kinks.map((item) => item.toLowerCase()));
  const matchedKinks = prompt.kinks.filter((item) => wanted.has(item.toLowerCase()));
  return {
    ...body,
    id: prompt.id,
    kind: prompt.kind,
    kinks: prompt.kinks,
    matchedKinks,
    min: prompt.min,
    role,
    solo,
  };
}

function promptScore(prompt: WeekPrompt, kinks: string[]) {
  if (!kinks.length || !prompt.kinks.length) return 1;
  const wanted = new Set(kinks.map((item) => item.toLowerCase()));
  const hits = prompt.kinks.filter((item) => wanted.has(item.toLowerCase())).length;
  return hits > 0 ? 10 + hits : 0;
}

export function weeklyQuizzesFor(level: string, seed: string) {
  const experience = parseExperience(level);
  return WEEKLY_QUIZZES.map((pack) => {
    const pool = pack.questions.filter((q) => meetsExperience(q.min ?? "curious", experience));
    const questions = seededPick(pool.length ? pool : pack.questions, `${seed}:${pack.id}`, 4);
    return {
      id: pack.id,
      title: pack.title,
      blurb: pack.blurb,
      questions,
    };
  });
}

export function weeklyTryPrompts(
  level: string,
  seed: string,
  role: Role = "switch",
  kinks: string[] = [],
  solo = false,
) {
  const experience = parseExperience(level);
  const kinkKey = [...new Set(kinks.map((item) => item.toLowerCase()))].sort().join(",");
  return WEEK_KINDS.map((kind) => {
    const all = WEEKLY_PROMPTS.filter((item) => item.kind === kind);
    const leveled = all.filter((item) => meetsExperience(item.min ?? "curious", experience));
    const base = leveled.length ? leveled : all;
    const scored = base.map((item) => ({ item, score: promptScore(item, kinks) }));
    const matched = scored.filter((row) => row.score > 0);
    const pool = matched.length ? matched : scored;
    const max = Math.max(...pool.map((row) => row.score), 0);
    const top = pool.filter((row) => row.score === max).map((row) => row.item);
    const picked = seededPick(top, `${seed}:${kind}:${kinkKey}`, 1)[0] ?? all[0]!;
    return resolvePrompt(picked, role, kinks, solo);
  });
}

export function findWeekPrompt(id: string) {
  return WEEKLY_PROMPTS.find((item) => item.id === id) ?? null;
}

export function resolveWeekPrompt(id: string, role: Role, kinks: string[] = [], solo = false) {
  const found = findWeekPrompt(id);
  return found ? resolvePrompt(found, role, kinks, solo) : null;
}

export function weeklySeed(bondId: string, week = talkWeekKey()) {
  return `${bondId}:${week}`;
}

export function coupleLevel(a?: string | null, b?: string | null) {
  return coupleExperience(a, b);
}

export function formatTalkWeek(week = talkWeekKey()) {
  const [y, m, d] = week.split("-").map(Number);
  const date = new Date(Date.UTC(y ?? 2026, (m ?? 1) - 1, d ?? 1, 0, 1, 0));
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", timeZone: "UTC" });
}

export function talkEventTitle(topic: string) {
  if (topic.startsWith("daily:")) return "Today's card";
  if (topic.startsWith("kink:")) return "Kink inventory";
  if (topic.startsWith("weekquiz:")) {
    const id = topic.split(":")[2] ?? "quiz";
    const pack = WEEKLY_QUIZZES.find((item) => item.id === id);
    return pack ? `Weekly quiz · ${pack.title}` : "Weekly quiz";
  }
  if (topic.startsWith("weektry:")) {
    const kind = (topic.split(":")[2] ?? "prompt") as WeekKind;
    return `This week · ${WEEK_KIND_LABEL[kind] ?? kind}`;
  }
  if (topic.startsWith("quiz:")) return "A quiz";
  return "Talk";
}

export const WEEK_KIND_LABEL: Record<WeekKind, string> = {
  communication: "Communication",
  public: "Public play",
  scene: "Scene",
  roleplay: "Roleplay",
  task: "Task",
  game: "Game",
  training: "Training",
  reward: "Rewards",
  punishment: "Punishment",
  kink: "Kink",
};
