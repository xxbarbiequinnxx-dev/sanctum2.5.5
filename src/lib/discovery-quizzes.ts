import {
  BDSM_FULL_QUESTIONS,
  BDSM_QUICK_QUESTIONS,
  FULL_BLURBS,
  FULL_LABELS,
  LIKERT_OPTIONS,
  QUICK_BLURBS,
  QUICK_LABELS,
  QUICK_SHORT_LABELS,
} from "@/lib/bdsm-quiz-bank";

export type ScoreMap = Record<string, number>;

export type QuizRole = "dominant" | "submissive" | "switch";
export type BdsmRoleFilter = "full" | QuizRole;

export type QuizChoice = {
  label: string;
  weights: ScoreMap;
};

export type QuizItem = {
  prompt: string;
  options?: QuizChoice[];
  axes?: ScoreMap;
  section?: string;
  role?: QuizRole;
};

export type QuizResultRow = {
  key: string;
  label: string;
  pct: number;
  score: number;
};

export type QuizSection = {
  id: string;
  title: string;
  rows: QuizResultRow[];
};

export type QuizPicks = number[][];

export type DiscoveryQuiz = {
  id: string;
  title: string;
  blurb: string;
  topic: string;
  groups: { id: string; title: string; keys: string[] }[];
  labels: Record<string, string>;
  shortLabels?: Record<string, string>;
  questions: QuizItem[];
  multi?: boolean;
  likert?: boolean;
  scoring?: "share" | "independent";
  chart?: "radar";
  blurbs?: Record<string, string>;
  timeHint?: string;
  countHint?: string;
};

export const BDSM_SECTION_TITLES: Record<string, string> = {};

export const LOVE_LABELS: Record<string, string> = {
  words: "Words of affirmation",
  time: "Quality time",
  touch: "Physical touch",
  acts: "Acts of service",
  gifts: "Receiving gifts",
};

const w = (weights: ScoreMap): QuizChoice["weights"] => weights;

export const QUICK_AXIS_KEYS = [
  "dominance",
  "submission",
  "sensation",
  "psychological",
  "bondage",
  "trust",
  "adventurous",
] as const;

export const FULL_ROLE_KEYS = [
  "dominant",
  "submissive",
  "switch",
  "master",
  "slave",
  "daddy",
  "little",
  "sadist",
  "masochist",
  "rigger",
  "rope-bunny",
  "degrader",
  "degradee",
  "hunter",
  "prey",
  "voyeur",
  "exhibitionist",
  "brat",
  "brat-tamer",
  "owner",
  "pet",
  "vanilla",
  "experimentalist",
  "non-hierarchical",
] as const;

export const BDSM_QUICK_QUIZ: DiscoveryQuiz = {
  id: "bdsm-quick",
  title: "Quick Quiz",
  blurb: "See seven scores across Dominance, Submission, Bondage and more.",
  topic: "discovery:bdsm-quick",
  likert: true,
  scoring: "independent",
  chart: "radar",
  timeHint: "About 5 min",
  countHint: "25 questions",
  labels: QUICK_LABELS,
  shortLabels: QUICK_SHORT_LABELS,
  blurbs: QUICK_BLURBS,
  groups: [
    {
      id: "interests",
      title: "Your seven scores",
      keys: [...QUICK_AXIS_KEYS],
    },
  ],
  questions: BDSM_QUICK_QUESTIONS,
};

export const BDSM_FULL_QUIZ: DiscoveryQuiz = {
  id: "bdsm-full",
  title: "Full Profile",
  blurb: "See all 24 roles and interests ranked, including Dominant, Submissive, Switch, Brat and Rigger.",
  topic: "discovery:bdsm-full",
  likert: true,
  scoring: "independent",
  timeHint: "About 15 min",
  countHint: "125 questions",
  labels: FULL_LABELS,
  blurbs: FULL_BLURBS,
  groups: [
    {
      id: "roles",
      title: "Your top BDSM roles and interests",
      keys: [...FULL_ROLE_KEYS],
    },
  ],
  questions: BDSM_FULL_QUESTIONS,
};

export const BDSM_QUIZ = BDSM_FULL_QUIZ;

export const LOVE_QUIZ: DiscoveryQuiz = {
  id: "love",
  title: "Love languages",
  blurb: "Twelve questions about how care actually lands — in the dynamic and out of it. Percentages, not a single winner. Retake whenever you like.",
  topic: "discovery:love",
  labels: LOVE_LABELS,
  groups: [{ id: "languages", title: "How you receive love", keys: ["words", "time", "touch", "acts", "gifts"] }],
  questions: [
    {
      prompt: "I feel most loved when you…",
      options: [
        { label: "Tell me, specifically, what I did well.", weights: w({ words: 3 }) },
        { label: "Give me undivided time with no phones.", weights: w({ time: 3 }) },
        { label: "Reach for me without it having to become a scene.", weights: w({ touch: 3 }) },
        { label: "Do the unglamorous thing I asked for last week.", weights: w({ acts: 3 }) },
        { label: "Leave something small that says you thought of me.", weights: w({ gifts: 3 }) },
      ],
    },
    {
      prompt: "When I am dropping, the first thing I need is…",
      options: [
        { label: "Words: I am safe, I did well, you are here.", weights: w({ words: 3 }) },
        { label: "You staying, even if we say nothing.", weights: w({ time: 3 }) },
        { label: "Quiet touch and a blanket.", weights: w({ touch: 3 }) },
        { label: "Water, food, the lights down.", weights: w({ acts: 3 }) },
        { label: "A comfort I already own from you — tea, a hoodie, the good chocolate.", weights: w({ gifts: 2, acts: 1 }) },
      ],
    },
    {
      prompt: "A fight is repaired, for me, when you…",
      options: [
        { label: "Name what you did and what you will do differently.", weights: w({ words: 3 }) },
        { label: "Sit with me until the charge leaves the room.", weights: w({ time: 3 }) },
        { label: "Hold me, or let me have space and then reach.", weights: w({ touch: 2, time: 1 }) },
        { label: "Fix the practical thing we fought about.", weights: w({ acts: 3 }) },
        { label: "Come back with a small peace offering that is not a bribe.", weights: w({ gifts: 3 }) },
      ],
    },
    {
      prompt: "On an ordinary Tuesday, love looks like…",
      options: [
        { label: "A message that is about me, not logistics.", weights: w({ words: 3 }) },
        { label: "Twenty minutes that are actually ours.", weights: w({ time: 3 }) },
        { label: "A hand on the back of my neck in the kitchen.", weights: w({ touch: 3 }) },
        { label: "You handling something so I do not have to.", weights: w({ acts: 3 }) },
        { label: "A snack, a flower, a link you saved because it was my taste.", weights: w({ gifts: 3 }) },
      ],
    },
    {
      prompt: "In protocol, love feels like…",
      options: [
        { label: "Exact praise. You meant the words.", weights: w({ words: 3 }) },
        { label: "You staying in the room for the whole ritual.", weights: w({ time: 3 }) },
        { label: "The collar, the hand, the body that says mine.", weights: w({ touch: 3 }) },
        { label: "You running aftercare as carefully as you ran the scene.", weights: w({ acts: 3 }) },
        { label: "A token I get to keep — a ribbon, a note, a mark we agreed.", weights: w({ gifts: 3 }) },
      ],
    },
    {
      prompt: "I feel neglected fastest when…",
      options: [
        { label: "You go quiet. No words, no naming.", weights: w({ words: 3 }) },
        { label: "You are in the house but not with me.", weights: w({ time: 3 }) },
        { label: "You stop reaching. I become furniture.", weights: w({ touch: 3 }) },
        { label: "I am carrying the boring load alone.", weights: w({ acts: 3 }) },
        { label: "Every gift and surprise dries up, and so does the thought behind them.", weights: w({ gifts: 3 }) },
      ],
    },
    {
      prompt: "A public way you can love me without anyone else clocking it…",
      options: [
        { label: "A look or a word we already agreed means I have you.", weights: w({ words: 2, time: 1 }) },
        { label: "Choosing to sit with me instead of working the room.", weights: w({ time: 3 }) },
        { label: "A hand on my back that is ours.", weights: w({ touch: 3 }) },
        { label: "Handling the bill, the coats, the way home.", weights: w({ acts: 3 }) },
        { label: "Tucking something in my pocket before we leave.", weights: w({ gifts: 3 }) },
      ],
    },
    {
      prompt: "The love I fake because I think I should is…",
      options: [
        { label: "Praise that sounds like a script.", weights: w({ words: 3 }) },
        { label: "Time I resent because I wanted to be alone.", weights: w({ time: 3 }) },
        { label: "Touch I do not actually want yet.", weights: w({ touch: 3 }) },
        { label: "Service I will sulk about later.", weights: w({ acts: 3 }) },
        { label: "Gifts I smile at and feel nothing for.", weights: w({ gifts: 3 }) },
      ],
    },
    {
      prompt: "After a good scene, the landing that actually feeds me is…",
      options: [
        { label: "You telling me what you saw and what you liked.", weights: w({ words: 3 }) },
        { label: "You not rushing off. The hour after is the scene too.", weights: w({ time: 3 }) },
        { label: "Skin, a bath, being held or holding.", weights: w({ touch: 3 }) },
        { label: "Water, food, marks checked, the kit put away.", weights: w({ acts: 3 }) },
        { label: "A small thing that belongs to that night — a note, a photo we keep.", weights: w({ gifts: 3 }) },
      ],
    },
    {
      prompt: "I believe you are proud of me when…",
      options: [
        { label: "You say it, with evidence.", weights: w({ words: 3 }) },
        { label: "You make time to hear the thing I did.", weights: w({ time: 3 }) },
        { label: "You pull me in.", weights: w({ touch: 3 }) },
        { label: "You back it with help — you show up for the boring part.", weights: w({ acts: 3 }) },
        { label: "You mark it: a treat, a token, a planned reward.", weights: w({ gifts: 3 }) },
      ],
    },
    {
      prompt: "Distance (work trip, a bad week) is easier if you…",
      options: [
        { label: "Write. Voice notes. Specific, not 'you good?'", weights: w({ words: 3 }) },
        { label: "Book a call and actually keep it.", weights: w({ time: 3 }) },
        { label: "Tell me what you will do with me when we are in the same room.", weights: w({ touch: 2, words: 1 }) },
        { label: "Handle something at home so I land in less mess.", weights: w({ acts: 3 }) },
        { label: "Send a small thing, or leave one for me to find.", weights: w({ gifts: 3 }) },
      ],
    },
    {
      prompt: "If I could keep only one way you love me for the next year…",
      options: [
        { label: "Keep talking to me as if I am worth naming.", weights: w({ words: 3 }) },
        { label: "Keep giving me hours that are not leftover.", weights: w({ time: 3 }) },
        { label: "Keep putting your body in the room with mine.", weights: w({ touch: 3 }) },
        { label: "Keep doing the things that make a life possible.", weights: w({ acts: 3 }) },
        { label: "Keep the small, thought-through gifts that say you see me.", weights: w({ gifts: 3 }) },
      ],
    },
  ],
};

export function discoveryById(id: string) {
  if (id === "love") return LOVE_QUIZ;
  if (id === "bdsm-quick") return BDSM_QUICK_QUIZ;
  return BDSM_FULL_QUIZ;
}

export function emptyScores(): ScoreMap {
  return {};
}

export function addWeights(into: ScoreMap, weights: ScoreMap) {
  for (const [key, value] of Object.entries(weights)) {
    into[key] = (into[key] ?? 0) + value;
  }
  return into;
}

export function normalizePicks(raw: unknown): QuizPicks {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    if (Array.isArray(item)) return item.filter((n): n is number => typeof n === "number" && n >= 0);
    if (typeof item === "number" && item >= 0) return [item];
    return [];
  });
}

function roundPercents(rows: { key: string; score: number }[], labels: Record<string, string>): QuizResultRow[] {
  const total = rows.reduce((sum, row) => sum + row.score, 0);
  if (!total) {
    return rows.map((row) => ({ key: row.key, label: labels[row.key] ?? row.key, pct: 0, score: 0 }));
  }
  const raw = rows.map((row) => ({
    ...row,
    exact: (100 * row.score) / total,
  }));
  const floored = raw.map((row) => ({ ...row, pct: Math.floor(row.exact) }));
  let remainder = 100 - floored.reduce((sum, row) => sum + row.pct, 0);
  const order = [...floored].sort((a, b) => b.exact - a.exact - Math.floor(b.exact) + Math.floor(a.exact) || b.score - a.score);
  for (const item of order) {
    if (remainder <= 0) break;
    if (item.score <= 0) continue;
    item.pct += 1;
    remainder -= 1;
  }
  return floored
    .map((row) => ({
      key: row.key,
      label: labels[row.key] ?? row.key,
      pct: row.score > 0 ? row.pct : 0,
      score: row.score,
    }))
    .sort((a, b) => b.pct - a.pct || b.score - a.score);
}

function independentPercents(
  rows: { key: string; score: number; max: number }[],
  labels: Record<string, string>,
): QuizResultRow[] {
  return rows.map((row) => ({
    key: row.key,
    label: labels[row.key] ?? row.key,
    pct: row.max > 0 ? Math.round((100 * row.score) / row.max) : 0,
    score: row.score,
  }));
}

export function rankRows(rows: QuizResultRow[]): QuizResultRow[] {
  return [...rows].sort((a, b) => b.pct - a.pct || b.score - a.score || a.label.localeCompare(b.label));
}

const LIKERT_MAX = LIKERT_OPTIONS.length - 1;

export function scoreQuiz(quiz: DiscoveryQuiz, picks: QuizPicks | number[]): { scores: ScoreMap; sections: QuizSection[] } {
  const scores: ScoreMap = {};
  const maxima: ScoreMap = {};
  const normalized = normalizePicks(picks);
  quiz.questions.forEach((item, index) => {
    const chosen = normalized[index] ?? [];
    if (item.axes) {
      if (!chosen.length) return;
      const scale = Math.min(LIKERT_MAX, Math.max(0, chosen[0] ?? 0));
      for (const [key, weight] of Object.entries(item.axes)) {
        const span = LIKERT_MAX * Math.abs(weight);
        maxima[key] = (maxima[key] ?? 0) + span;
        const contrib = weight >= 0 ? scale * weight : (LIKERT_MAX - scale) * Math.abs(weight);
        scores[key] = (scores[key] ?? 0) + contrib;
      }
      return;
    }
    for (const oi of chosen) {
      const option = item.options?.[oi];
      if (option) addWeights(scores, option.weights);
    }
  });
  const independent = quiz.scoring === "independent";
  const sections = quiz.groups.map((group) => ({
    id: group.id,
    title: group.title,
    rows: independent
      ? independentPercents(
          group.keys.map((key) => ({ key, score: scores[key] ?? 0, max: maxima[key] ?? 0 })),
          quiz.labels,
        )
      : roundPercents(
          group.keys.map((key) => ({ key, score: scores[key] ?? 0 })),
          quiz.labels,
        ),
  }));
  return { scores, sections };
}

export function parseQuizBody(body: string | null | undefined): {
  picks: QuizPicks;
  sections: QuizSection[];
  filter?: BdsmRoleFilter;
  quizSize?: number;
} | null {
  if (!body) return null;
  try {
    const parsed = JSON.parse(body) as {
      picks?: unknown;
      sections?: QuizSection[];
      filter?: BdsmRoleFilter;
      quizSize?: number;
    };
    if (!Array.isArray(parsed.sections)) return null;
    const filter = parsed.filter;
    return {
      picks: normalizePicks(parsed.picks),
      sections: parsed.sections,
      filter: filter === "dominant" || filter === "submissive" || filter === "switch" || filter === "full" ? filter : undefined,
      quizSize: typeof parsed.quizSize === "number" ? parsed.quizSize : undefined,
    };
  } catch {
    return null;
  }
}

export function topKey(section: QuizSection | undefined) {
  return rankRows(section?.rows ?? []).find((row) => row.pct > 0)?.key ?? "";
}

export function suggestedRoleFromSections(sections: QuizSection[]): QuizRole | null {
  const rows = sections.flatMap((section) => section.rows);
  const get = (...keys: string[]) => Math.max(0, ...keys.map((key) => rows.find((row) => row.key === key)?.pct ?? 0));
  const dominant = get("dominant", "dominance");
  const submissive = get("submissive", "submission");
  const sw = get("switch");
  if (!dominant && !submissive && !sw) return null;
  if (sw >= dominant && sw >= submissive && sw >= 40) return "switch";
  if (dominant >= 45 && submissive >= 45 && Math.abs(dominant - submissive) <= 12) return "switch";
  if (dominant > submissive) return "dominant";
  if (submissive > dominant) return "submissive";
  return "switch";
}

export function questionsForFilter(quiz: DiscoveryQuiz, filter: BdsmRoleFilter) {
  return quiz.questions
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => (filter === "full" ? true : item.role === filter));
}

function hashSeed(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return h >>> 0;
}

function seededShuffle<T>(items: T[], seed: string): T[] {
  const out = items.slice();
  let h = hashSeed(seed) || 1;
  for (let i = out.length - 1; i > 0; i -= 1) {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    const j = (h >>> 0) % (i + 1);
    const swap = out[i]!;
    out[i] = out[j]!;
    out[j] = swap;
  }
  return out;
}

export function orderedQuestions(quiz: DiscoveryQuiz) {
  const items = questionsForFilter(quiz, "full");
  if (!quiz.likert) return items;
  return seededShuffle(items, quiz.id);
}

export function picksComplete(picks: QuizPicks, indices: number[]) {
  return indices.every((index) => (picks[index]?.length ?? 0) > 0);
}

export const KINK_TO_TALK: Record<string, string> = {
  sadist: "sadomasochism",
  masochist: "sadomasochism",
  rigger: "rope",
  "rope-bunny": "rope",
  degrader: "degradation",
  degradee: "degradation",
  hunter: "primal",
  prey: "primal",
  voyeur: "voyeurism",
  exhibitionist: "exhibitionism",
  brat: "brat-dynamic",
  "brat-tamer": "brat-dynamic",
  owner: "ownership",
  pet: "pet-play",
  master: "protocol",
  slave: "service",
  daddy: "praise",
  little: "pet-play",
  dominant: "power-exchange",
  submissive: "power-exchange",
  sensation: "sensation-play",
  bondage: "bondage",
};
