export const EXPERIENCE_LEVELS = [
  { value: "curious", label: "Curious", hint: "New to this role, or newly naming it. Still finding your feet." },
  { value: "exploring", label: "Exploring", hint: "Some play behind you. You want language, structure, and safer experiments." },
  { value: "practiced", label: "Practiced", hint: "A regular dynamic. You know your tastes and can negotiate them." },
  { value: "seasoned", label: "Seasoned", hint: "Specific, consistent, used to repair as well as intensity." },
  { value: "established", label: "Established", hint: "Long-running power, heavy protocol, or edge play you have studied." },
] as const;

export type Experience = (typeof EXPERIENCE_LEVELS)[number]["value"];

const RANK: Record<Experience, number> = {
  curious: 0,
  exploring: 1,
  practiced: 2,
  seasoned: 3,
  established: 4,
};

const ALIASES: Record<string, Experience> = {
  beginner: "curious",
  curious: "curious",
  exploring: "exploring",
  practiced: "practiced",
  seasoned: "seasoned",
  extreme: "established",
  established: "established",
};

export function parseExperience(raw: unknown): Experience {
  const value = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  return ALIASES[value] ?? "curious";
}

export function experienceLabel(value: string | null | undefined) {
  return EXPERIENCE_LEVELS.find((item) => item.value === parseExperience(value))?.label ?? "Curious";
}

export function experienceRank(value: string | null | undefined) {
  return RANK[parseExperience(value)];
}

export function coupleExperience(a?: string | null, b?: string | null): Experience {
  const left = parseExperience(a);
  const right = b ? parseExperience(b) : left;
  return RANK[left] >= RANK[right] ? left : right;
}

export function meetsExperience(required: string | null | undefined, actual: string | null | undefined) {
  return experienceRank(actual) >= experienceRank(required);
}
