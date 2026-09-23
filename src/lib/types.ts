import type { Kind, Role } from "./kinds";

export type { Kind, Role };

export const SEX_OPTIONS = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "nonbinary", label: "Non-binary" },
  { value: "other", label: "Other" },
] as const;

export type Sex = (typeof SEX_OPTIONS)[number]["value"] | "";

export type Profile = {
  userId: string;
  role: Role;
  displayName: string;
  username: string;
  pairingCode: string;
  partnerUserId: string | null;
  bondId: string;
  avatarData: string | null;
  age: number | null;
  sex: string;
  roleStyle: string;
  experience: string;
  playMode: string;
  setupDone: boolean;
  lastSeen: string | null;
  lastPartnerUserId: string | null;
  lastBondId: string | null;
  kinks: string[];
};

export type Partner = {
  userId: string;
  role: Role;
  displayName: string;
  username: string;
  avatarData: string | null;
  age: number | null;
  sex: string;
  roleStyle: string;
  experience: string;
  lastSeen: string | null;
  bondId?: string;
  active?: boolean;
  available?: boolean;
  kinks: string[];
};

export type PdfAttachment = {
  name: string;
  data: string;
};

export type Entry = {
  id: number;
  bondId: string;
  createdBy: string;
  kind: Kind;
  title: string;
  body: string;
  cadence: string | null;
  weekday: number | null;
  status: string;
  category: string | null;
  subcategory: string | null;
  assignedTo: string | null;
  intensity: number | null;
  photoData: string | null;
  photos: string[];
  pdfs: PdfAttachment[];
  videos: { name: string; data: string }[];
  meta: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  completedOn: string | null;
  effectiveStatus: string;
  sortOrder: number;
};

export type Me = {
  profile: Profile | null;
  partner: Partner | null;
  lastPartner: Partner | null;
  partners: Partner[];
  house: HouseSettings;
  options: UserOptions;
};

export type SubEditKey =
  | "tasks"
  | "habits"
  | "rewards"
  | "punishments"
  | "training"
  | "games"
  | "costs"
  | "earnedCounts"
  | "countdowns";

export type PlayCard = {
  title: string;
  body: string;
};

export type PlaySettings = {
  wheelTitle: string;
  wheelSlices: string[];
  wheelBody: string;
  wheelPrompts: string[];
  wheelCatalogIds: string[];
  drawTitle: string;
  drawCards: PlayCard[];
  drawBody: string;
  drawPrompts: string[];
  drawCatalogIds: string[];
  diceTitle: string;
  diceActs: string[];
  diceBody: string;
  dicePrompts: string[];
  diceCatalogIds: string[];
  timerTitle: string;
  timerBody: string;
};

export type HouseSettings = {
  subEdit: Record<SubEditKey, boolean>;
  vacation: boolean;
  vacationSince: string | null;
  play: PlaySettings;
  wheels: Record<string, string[]>;
  lastWeeklyReset: string | null;
};

export type UserOptions = {
  honorific: string;
  addressAs: string;
  safeword: string;
  checkIn: string;
  hideCompleted: boolean;
  showReminders: boolean;
  autoCompleteNote: boolean;
  noteTask: string;
  noteHabit: string;
  noteTraining: string;
  quickNav: string[];
};

export type LocationFix = {
  sharing: boolean;
  lat: number | null;
  lng: number | null;
  accuracy: number | null;
  placeName: string;
  updatedAt: string | null;
  arrivedAt: string | null;
};

export type LocationBoard = {
  mine: LocationFix;
  partner: LocationFix | null;
};

export type CalendarPerson = {
  userId: string;
  displayName: string;
  role: Role;
  avatarData: string | null;
};

export type CalendarOpen = {
  userId: string;
  openedAt: string;
};

export type CalendarVisit = {
  id: number;
  userId: string;
  placeName: string;
  lat: number | null;
  lng: number | null;
  arrivedAt: string;
  departedAt: string | null;
};

export type CalendarChange = {
  id: number;
  actorId: string;
  action: string;
  entity: string;
  title: string;
  detail: string;
  createdAt: string;
};

export type HouseHistory = {
  people: CalendarPerson[];
  opens: CalendarOpen[];
  visits: CalendarVisit[];
  changes: CalendarChange[];
};


export type Message = {
  id: number;
  bondId: string;
  senderId: string;
  body: string;
  photoData: string | null;
  audioData: string | null;
  createdAt: string;
};

export type PrivatePhoto = {
  id: number;
  bondId: string;
  uploadedBy: string;
  photoData: string;
  caption: string;
  createdAt: string;
};

export type PointEvent = {
  id: number;
  userId: string;
  delta: number;
  reason: string;
  source: string;
  entryId: number | null;
  createdBy: string;
  createdAt: string;
};

export type PointsBoard = {
  mine: number;
  partner: number | null;
  ledger: PointEvent[];
};

export type Dashboard = {
  daily: Entry[];
  weekly: Entry[];
  once: Entry[];
  habits: Entry[];
  custom: Entry[];
  training: Entry[];
  archived: Entry[];
  timed: Entry[];
  calendar: Entry[];
  counts: Record<Kind, number>;
  points: PointsBoard;
};

export type Category = {
  id: number | null;
  kind: Kind;
  name: string;
  slug: string;
  parentSlug: string | null;
  builtin: boolean;
  archived: boolean;
  suppressed?: boolean;
  sortOrder: number;
};

export type TalkAnswer = {
  topic: string;
  userId: string;
  body: string;
  rating: string | null;
  visibility?: string;
  updatedAt: string;
};

export type JournalComment = {
  id: number;
  entryId: number;
  authorId: string;
  body: string;
  photoData: string | null;
  createdAt: string;
};

export type ToyPatternStep = {
  intensity: number;
  intensity2?: number;
  ms: number;
};

export type ToyPattern = {
  id: number;
  title: string;
  steps: ToyPatternStep[];
  createdBy: string;
  createdAt: string;
};

export type SpotifyLink = {
  title: string;
  thumbnail: string | null;
  kind: string;
  id: string;
  embed: string;
  url: string;
};

export type CompanionProfile = {
  name: string;
  gender: string;
  pronouns: string;
  age: number;
  role: string;
  dynamic: string;
  addressAs: string;
  voice: string;
  persona: string;
  appearance: string;
  kinks: string;
  limits: string;
  heat: number;
  extra: string;
  avatarData: string | null;
  neediness: number;
};


export type CompanionMemory = {
  id: number;
  kind: string;
  body: string;
  dueAt: string | null;
  salience: number;
  updatedAt: string;
};

export type CompanionMessage = {
  id: number;
  role: "user" | "assistant";
  body: string;
  photoData: string | null;
  createdAt: string;
};

