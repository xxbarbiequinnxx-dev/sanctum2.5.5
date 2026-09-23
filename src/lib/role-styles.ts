import type { Role } from "@/lib/kinds";

export const DOMINANT_STYLES = [
  { value: "daddy", label: "Daddy" },
  { value: "master", label: "Master" },
  { value: "owner", label: "Owner" },
  { value: "sir", label: "Sir" },
  { value: "handler", label: "Handler" },
  { value: "caregiver", label: "Caregiver" },
  { value: "rigger", label: "Rigger" },
  { value: "sadist", label: "Sadist" },
  { value: "primal", label: "Primal" },
  { value: "trainer", label: "Trainer" },
  { value: "brat-tamer", label: "Brat tamer" },
  { value: "other", label: "Other" },
] as const;

export const SUBMISSIVE_STYLES = [
  { value: "little", label: "Little" },
  { value: "slave", label: "Slave" },
  { value: "pet", label: "Pet" },
  { value: "brat", label: "Brat" },
  { value: "service", label: "Service" },
  { value: "masochist", label: "Masochist" },
  { value: "prey", label: "Prey" },
  { value: "kitten", label: "Kitten" },
  { value: "princess", label: "Princess" },
  { value: "pup", label: "Pup" },
  { value: "other", label: "Other" },
] as const;

export function stylesFor(role: Role) {
  if (role === "dominant") return DOMINANT_STYLES;
  if (role === "submissive") return SUBMISSIVE_STYLES;
  const seen = new Set<string>();
  const mixed = [...DOMINANT_STYLES, ...SUBMISSIVE_STYLES].filter((item) => {
    if (item.value === "other") return false;
    if (seen.has(item.value)) return false;
    seen.add(item.value);
    return true;
  });
  return [...mixed, { value: "other", label: "Other" }] as const;
}

export function styleFieldLabel(role: Role) {
  if (role === "dominant") return "Type of Dominant";
  if (role === "submissive") return "Type of Submissive";
  return "Your archetype";
}

export function styleLabel(role: Role, value: string) {
  if (!value) return "";
  const known = stylesFor(role).find((item) => item.value === value);
  if (known && known.value !== "other") return known.label;
  if (value === "other") return "Other";
  return value;
}

export function isKnownStyle(role: Role, value: string) {
  return stylesFor(role).some((item) => item.value === value && item.value !== "other");
}
