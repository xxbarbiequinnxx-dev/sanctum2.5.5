import type { Role } from "@/lib/kinds";

const SHARED = [
  "Name one need out loud before noon.",
  "Hold eye contact for a full minute.",
  "Write three lines about yesterday's dynamic.",
  "Practice the safeword and aftercare check together.",
  "Do one act of service without being asked.",
  "Photograph something that belongs to the dynamic.",
  "Sit in protocol posture for five minutes.",
  "Send one voice note of praise or thanks.",
  "Review one limit and confirm it still holds.",
  "Choose a word of the day and use it on purpose.",
  "Stretch and check in with your body before play.",
  "Read last week's journal page and mark one growth.",
  "Leave a note your partner will find later.",
  "Practice a cue or command until it is clean.",
  "Drink water and pause before any scene talk.",
];

const DOMINANT = [
  "Set one clear expectation for tonight.",
  "Give specific praise for something they did well.",
  "Check their calendar and adjust one duty if needed.",
  "Hold a five-minute inspection or posture check.",
  "Write a short protocol they can keep.",
  "Name a reward that is actually available.",
  "Ask what would make them feel chosen today.",
  "Correct one small thing with care, not heat.",
  "Plan aftercare before you plan intensity.",
  "Let them hear that you are proud, in detail.",
];

const SUBMISSIVE = [
  "Offer a report of how you slept and how you feel.",
  "Complete one open duty before you ask for play.",
  "Practice kneeling or waiting posture for three minutes.",
  "Ask for what you need in one clean sentence.",
  "Tidy one thing that belongs to service.",
  "Wear or carry a reminder of your role today.",
  "Thank them for a specific instruction.",
  "Journal a drop or a high without editing it pretty.",
  "Ask permission for one small pleasure.",
  "Repeat a rule back in your own words.",
];

export function challengesFor(role: Role, monthKey: string) {
  const extra = role === "dominant" ? DOMINANT : role === "submissive" ? SUBMISSIVE : [...DOMINANT, ...SUBMISSIVE];
  const pool = [...SHARED, ...extra];
  const seed = monthKey.split("").reduce((n, ch) => n + ch.charCodeAt(0), role === "dominant" ? 11 : role === "switch" ? 19 : 29);
  const days = daysInMonth(monthKey);
  const out: { day: number; title: string }[] = [];
  for (let day = 1; day <= days; day += 1) {
    const index = (seed * 17 + day * 13) % pool.length;
    out.push({ day, title: pool[index] ?? SHARED[0] });
  }
  return out;
}

export function monthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function daysInMonth(key: string) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m, 0).getDate();
}

export function monthLabel(key: string) {
  const [y, m] = key.split("-").map(Number);
  return new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(new Date(y, m - 1, 1));
}
