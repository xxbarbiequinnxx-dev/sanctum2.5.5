import { NOTES_LIBRARY } from "@/lib/notes-library";
import { DAILY_QUESTIONS } from "@/lib/talk-content";

export const WEEK_KIND_LIBRARY: Record<string, string[]> = {
  communication: ["edu-instructions", "ex-instructions", "ex-role-voice"],
  public: ["edu-kinks", "edu-difficult-talk", "ex-explore-kink"],
  scene: ["edu-negotiate-scene", "ex-create-scene"],
  roleplay: ["edu-roleplay", "ex-create-roleplay"],
  task: ["edu-instructions", "ex-instructions", "edu-good-dom"],
  game: ["edu-good-dom", "edu-good-sub", "ex-confidence"],
  training: ["edu-good-dom", "edu-good-sub", "edu-instructions"],
  reward: ["edu-aftercare", "edu-good-dom"],
  punishment: ["edu-difficult-talk", "edu-good-dom", "edu-train-brat"],
  kink: ["edu-kinks", "ex-explore-kink"],
};

export const QUIZ_LIBRARY: Record<string, string[]> = {
  love: ["ex-know-partner", "ex-dynamic"],
  kink: ["edu-kinks", "ex-explore-kink"],
  roleplay: ["edu-roleplay", "ex-create-roleplay", "ex-role-voice"],
  scene: ["edu-negotiate-scene", "ex-create-scene"],
  aftercare: ["edu-aftercare", "edu-subspace", "edu-domspace"],
  relationship: ["ex-dynamic", "edu-difficult-talk", "edu-partner-body"],
  communication: ["edu-difficult-talk", "ex-communication", "edu-instructions"],
  voice: ["edu-instructions", "ex-role-voice", "ex-instructions"],
  appetite: ["edu-negotiate-scene", "ex-create-scene", "edu-kinks"],
};

export const KINK_LIBRARY: Record<string, string[]> = {
  protocol: ["edu-good-dom", "edu-good-sub", "ex-dynamic"],
  service: ["edu-good-sub", "ex-confidence", "edu-kinks"],
  praise: ["ex-role-voice", "edu-good-dom"],
  "pet-play": ["edu-kinks", "ex-explore-kink"],
  bondage: ["edu-restraints", "ex-explore-kink"],
  restraints: ["edu-restraints", "edu-toys"],
  impact: ["edu-kinks", "edu-toys", "ex-explore-kink"],
  temperature: ["edu-kinks", "edu-toys"],
  sensory: ["edu-kinks", "ex-explore-kink"],
  denial: ["edu-edging", "edu-orgasm-command", "act-edging-lab"],
  exhibition: ["edu-kinks", "ex-explore-kink"],
  primal: ["edu-kinks", "ex-explore-kink"],
  power: ["edu-good-dom", "edu-good-sub", "ex-confidence"],
  uniform: ["edu-kinks", "edu-roleplay"],
  voice: ["edu-instructions", "ex-role-voice", "ex-instructions"],
  ritual: ["edu-good-dom", "ex-dynamic"],
  aftercare: ["edu-aftercare", "edu-subspace", "edu-domspace"],
  public: ["edu-kinks", "edu-difficult-talk"],
};

const TEXT_RULES: { re: RegExp; keys: string[] }[] = [
  { re: /\baftercare\b|sub ?drop|dom ?drop/i, keys: ["edu-aftercare", "edu-subspace", "edu-domspace"] },
  { re: /\bsubspace\b/i, keys: ["edu-subspace", "edu-aftercare"] },
  { re: /\bdomspace\b|topspace|top space/i, keys: ["edu-domspace", "edu-aftercare"] },
  { re: /\bbrat|tamer|\bsass\b/i, keys: ["edu-brat-needs", "edu-why-brat", "edu-train-brat"] },
  { re: /\bedg(e|ing)\b|orgasm on command|come on command|come when (told|you say)/i, keys: ["edu-edging", "edu-orgasm-command", "act-edging-lab"] },
  { re: /\b(partner'?s body|body map|where they like to be touched|learn(ing)? (their|your partner))/i, keys: ["edu-partner-body", "act-body-map"] },
  { re: /\bbondage|restrain|\bcuffs?\b|\brope\b|tied|wrists|hogtie/i, keys: ["edu-restraints", "ex-explore-kink"] },
  { re: /\btoys?\b|\bplug\b|wand|vibrator|paddle|dildo|catalogue piece/i, keys: ["edu-toys", "ex-explore-kink"] },
  { re: /\broleplay|role play|strangers? who|inspection|in that role|costume|interrogation/i, keys: ["edu-roleplay", "ex-create-roleplay", "ex-role-voice"] },
  { re: /\binstruction|command you|commands\b|spoken to when we are in dynamic|better instructions/i, keys: ["edu-instructions", "ex-instructions", "ex-role-voice"] },
  { re: /\bsafeword|yellow\b|negotiate|check in without breaking/i, keys: ["edu-negotiate-scene", "ex-create-scene"] },
  { re: /\bscene\b|who should start the next scene|walk into/i, keys: ["edu-negotiate-scene", "ex-create-scene"] },
  { re: /\bdifficult|conflict|apology|unheard|when you are angry|repair that actually|hard conversation/i, keys: ["edu-difficult-talk", "ex-communication"] },
  { re: /\bdominant\b|submissive|kneel|protocol|honorific|being owned|owning\)|in dynamic/i, keys: ["edu-good-dom", "edu-good-sub", "ex-confidence"] },
  { re: /\bkink|impact\b|primal|pet play|exhibition|denial|degrad|orgasm|sensation you want|what kind of pain/i, keys: ["edu-kinks", "ex-explore-kink"] },
  { re: /\bdynamic\b|strengthen|ritual you want|rule that still serves|confidence in your role/i, keys: ["ex-dynamic", "ex-confidence"] },
  { re: /\bfantasy|curious about but not ready/i, keys: ["edu-kinks", "ex-explore-kink", "edu-negotiate-scene"] },
];

const MAX_KEYS = 3;

function pushKeys(into: string[], keys: string[] | undefined) {
  if (!keys) return;
  for (const key of keys) {
    if (into.includes(key)) continue;
    if (NOTES_LIBRARY.some((doc) => doc.key === key)) into.push(key);
    if (into.length >= MAX_KEYS) return;
  }
}

export function relatedLibraryKeys(input: {
  text?: string;
  texts?: string[];
  weekKind?: string;
  quizId?: string;
  kinkSlug?: string;
}): string[] {
  const keys: string[] = [];
  if (input.weekKind) pushKeys(keys, WEEK_KIND_LIBRARY[input.weekKind]);
  if (input.quizId) pushKeys(keys, QUIZ_LIBRARY[input.quizId]);
  if (input.kinkSlug) pushKeys(keys, KINK_LIBRARY[input.kinkSlug]);
  if (keys.length >= MAX_KEYS) return keys.slice(0, MAX_KEYS);

  const blob = [input.text, ...(input.texts ?? [])].filter(Boolean).join(" \n ");
  if (blob) {
    for (const rule of TEXT_RULES) {
      if (!rule.re.test(blob)) continue;
      pushKeys(keys, rule.keys);
      if (keys.length >= MAX_KEYS) break;
    }
  }
  return keys;
}

export function talkPromptsForLibrary(key: string, limit = 3): string[] {
  const out: string[] = [];
  for (const prompt of DAILY_QUESTIONS) {
    if (!relatedLibraryKeys({ text: prompt }).includes(key)) continue;
    out.push(prompt);
    if (out.length >= limit) break;
  }
  return out;
}

export function libraryDocsForKeys(keys: string[]) {
  return keys
    .map((key) => NOTES_LIBRARY.find((doc) => doc.key === key))
    .filter((doc): doc is (typeof NOTES_LIBRARY)[number] => Boolean(doc));
}
