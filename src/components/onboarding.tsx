import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DiscoveryQuizRun, BdsmTestChooser } from "@/components/discovery-quiz";
import { BrandMark } from "@/components/brand-mark";
import { PhotoField } from "@/components/photo-field";
import { RoleStyleField } from "@/components/role-style-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { NeedinessField } from "@/components/neediness-field";
import { connectPartner, getMe, listTalkAnswers, saveCompanion, saveProfile } from "@/lib/api";
import { DEFAULT_COMPANION } from "@/lib/companion";
import { BDSM_FULL_QUIZ, BDSM_QUICK_QUIZ, LOVE_QUIZ, parseQuizBody, suggestedRoleFromSections, type QuizSection } from "@/lib/discovery-quizzes";
import { EXPERIENCE_LEVELS } from "@/lib/experience";
import type { Role } from "@/lib/kinds";
import { SEX_OPTIONS, type Me, type TalkAnswer } from "@/lib/types";
import { cn } from "@/lib/utils";

const ROLE_KEY = "sanctum.role";
const SKIP_BDSM_KEY = "sanctum.onboarding.skip.bdsm";
const SKIP_LOVE_KEY = "sanctum.onboarding.skip.love";

function markQuizSkipped(which: "bdsm" | "love") {
  try {
    sessionStorage.setItem(which === "bdsm" ? SKIP_BDSM_KEY : SKIP_LOVE_KEY, "1");
  } catch {
    /* ignore */
  }
}

function quizWasSkipped(which: "bdsm" | "love") {
  try {
    return sessionStorage.getItem(which === "bdsm" ? SKIP_BDSM_KEY : SKIP_LOVE_KEY) === "1";
  } catch {
    return false;
  }
}

export function rememberRole(role: Role) {
  try {
    sessionStorage.setItem(ROLE_KEY, role);
  } catch {
    /* ignore */
  }
}

export function rememberedRole(): Role | null {
  try {
    const value = sessionStorage.getItem(ROLE_KEY);
    if (value === "dominant" || value === "submissive" || value === "switch") return value;
  } catch {
    /* ignore */
  }
  return null;
}

const STEPS = ["You", "BDSM quiz", "Love languages", "Role", "How you play"] as const;

export function Onboarding({
  userName,
  me,
  onDone,
}: {
  userName?: string | null;
  me?: Me | null;
  onDone: (me: Me) => void;
}) {
  const profile = me?.profile;
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<Role | null>(profile?.role ?? rememberedRole());
  const [roleStyle, setRoleStyle] = useState(profile?.roleStyle ?? "");
  const [experience, setExperience] = useState(profile?.experience || "curious");
  const [name, setName] = useState(profile?.displayName || userName || "");
  const [username, setUsername] = useState(profile?.username || "");
  const [age, setAge] = useState(profile?.age ? String(profile.age) : "");
  const [sex, setSex] = useState(profile?.sex || "");
  const [photos, setPhotos] = useState<string[]>(profile?.avatarData ? [profile.avatarData] : []);
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState("");
  const [pairing, setPairing] = useState<Me | null>(me?.profile ? me : null);
  const [answers, setAnswers] = useState<TalkAnswer[]>([]);
  const [companionName, setCompanionName] = useState(DEFAULT_COMPANION.name);
  const [companionRole, setCompanionRole] = useState(DEFAULT_COMPANION.role);
  const [companionNeediness, setCompanionNeediness] = useState(DEFAULT_COMPANION.neediness);
  const [bdsmHint, setBdsmHint] = useState<QuizSection[] | null>(null);
  const [bdsmPick, setBdsmPick] = useState<"quick" | "full" | null>(null);

  useEffect(() => {
    if (!profile) return;
    void listTalkAnswers()
      .then((rows) => {
        setAnswers(rows);
        const bdsm = rows.find(
          (item: TalkAnswer) => item.topic === BDSM_QUICK_QUIZ.topic || item.topic === BDSM_FULL_QUIZ.topic,
        );
        const love = rows.find((item: TalkAnswer) => item.topic === LOVE_QUIZ.topic);
        const parsed = parseQuizBody(bdsm?.body);
        if (parsed?.sections) setBdsmHint(parsed.sections);
        if (!profile.setupDone) {
          if (!bdsm && !quizWasSkipped("bdsm")) setStep(2);
          else if (!love && !quizWasSkipped("love")) setStep(3);
          else setStep(4);
        }
      })
      .catch(() => null);
  }, [profile?.userId]);

  async function saveBasics() {
    const ageNum = Number(age);
    if (!Number.isInteger(ageNum) || ageNum < 18) {
      toast.error("You must be 18 or older.");
      return;
    }
    if (!name.trim()) {
      toast.error("Add a name. Only you will see it on your profile.");
      return;
    }
    if (!username.trim()) {
      toast.error("Choose a username your partner can see.");
      return;
    }
    if (!sex) {
      toast.error("Choose a gender.");
      return;
    }
    setBusy(true);
    try {
      await saveProfile({
        data: {
          role: role ?? "submissive",
          displayName: name.trim(),
          username: username.trim(),
          age: ageNum,
          sex,
          avatarData: photos[0] ?? null,
          experience,
          setupDone: false,
        },
      });
      const next = await getMe();
      setPairing(next);
      setStep(2);
      onDone(next);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save profile.");
    } finally {
      setBusy(false);
    }
  }

  async function saveRole() {
    if (!role) {
      toast.error("Choose Dominant, Submissive, or Switch.");
      return;
    }
    rememberRole(role);
    setBusy(true);
    try {
      await saveProfile({
        data: { role, roleStyle, experience, setupDone: false },
      });
      setPairing(await getMe());
      setStep(5);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save your role.");
    } finally {
      setBusy(false);
    }
  }

  async function finish(mode: "pair" | "companion" | "solo", nextMe?: Me) {
    setBusy(true);
    try {
      if (mode === "companion") {
        await saveCompanion({
          data: {
            ...DEFAULT_COMPANION,
            name: companionName.trim() || DEFAULT_COMPANION.name,
            role: companionRole,
            neediness: companionNeediness,
          },
        });
      }
      await saveProfile({ data: { playMode: mode, setupDone: true } });
      onDone(nextMe ?? (await getMe()));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not finish setup.");
    } finally {
      setBusy(false);
    }
  }

  async function pair() {
    if (!code.trim()) return;
    setBusy(true);
    try {
      const connected = await connectPartner({ data: { code: code.trim() } });
      await finish("pair", connected);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not connect.");
      setBusy(false);
    }
  }

  function skipBdsmQuiz() {
    markQuizSkipped("bdsm");
    markQuizSkipped("love");
    setStep(4);
  }

  function skipLoveQuiz() {
    markQuizSkipped("love");
    setStep(4);
  }

  const suggestedRole = suggestedRoleFromSections(bdsmHint ?? []);
  const suggestedArch = bdsmHint?.[0]?.rows.find((row) => !["dominant", "submissive", "switch", "dominance", "submission"].includes(row.key) && row.pct > 0)?.label ?? "";

  return (
    <div className="mx-auto w-full max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <BrandMark className="size-11" />
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-primary">Enter Sanctum</p>
      </div>
      <h1 className="font-display text-4xl font-medium">{STEPS[step - 1]}</h1>
      <ol className="flex gap-1.5">
        {STEPS.map((label, i) => (
          <li
            key={label}
            className={cn(
              "h-1.5 flex-1 rounded-full",
              i < step ? "bg-primary" : "bg-secondary",
            )}
            title={label}
          />
        ))}
      </ol>

      {step === 1 ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Your name stays on your profile only. Your partner sees your username. Sanctum is for adults 18 and over.
          </p>
          <label className="block space-y-1.5">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Only you see this" maxLength={80} />
            <p className="text-xs text-muted-foreground">Hidden from everyone else, including a partner.</p>
          </label>
          <label className="block space-y-1.5">
            <Label>Username</Label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/[^A-Za-z0-9._-]/g, "").slice(0, 32))}
              placeholder="What they will see"
              maxLength={32}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1.5">
              <Label>Age</Label>
              <Input type="number" min={18} max={99} value={age} onChange={(e) => setAge(e.target.value)} placeholder="18+" />
            </label>
            <label className="block space-y-1.5">
              <Label>Gender</Label>
              <Select value={sex} onChange={(e) => setSex(e.target.value)}>
                <option value="">Choose…</option>
                {SEX_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </label>
          </div>
          <PhotoField photos={photos} onChange={setPhotos} max={1} label="Profile photo" />
          <Button className="w-full" onClick={() => void saveBasics()} disabled={busy}>
            {busy ? "Saving…" : "Continue"}
          </Button>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-3">
          {!bdsmPick ? (
            <BdsmTestChooser
              onPick={setBdsmPick}
              answers={answers}
              meId={pairing?.profile?.userId ?? profile?.userId}
            />
          ) : (
            <DiscoveryQuizRun
              quiz={bdsmPick === "quick" ? BDSM_QUICK_QUIZ : BDSM_FULL_QUIZ}
              answers={answers}
              meId={pairing?.profile?.userId ?? profile?.userId}
              startOnMount
              onExit={() => setBdsmPick(null)}
              onSaved={(row) => setAnswers((prev) => [row, ...prev.filter((item) => item.topic !== row.topic)])}
              onFinished={(sections) => {
                setBdsmHint(sections);
                const roleKey = suggestedRoleFromSections(sections);
                if (roleKey) setRole(roleKey);
                setStep(3);
              }}
            />
          )}
          <p className="text-center text-xs text-muted-foreground">You can take these later in Talk.</p>
          <Button type="button" variant="ghost" className="w-full" onClick={skipBdsmQuiz}>
            Skip quizzes
          </Button>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-3">
          <DiscoveryQuizRun
            quiz={LOVE_QUIZ}
            answers={answers}
            meId={pairing?.profile?.userId ?? profile?.userId}
            startOnMount
            onSaved={(row) => setAnswers((prev) => [row, ...prev.filter((item) => item.topic !== row.topic)])}
            onFinished={() => setStep(4)}
          />
          <p className="text-center text-xs text-muted-foreground">You can take this later in Talk.</p>
          <Button type="button" variant="ghost" className="w-full" onClick={skipLoveQuiz}>
            Skip this quiz
          </Button>
        </div>
      ) : null}

      {step === 4 ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {suggestedRole
              ? "The quiz suggested a shape. You still choose."
              : "Choose how you sit in the dynamic."}{" "}
            You can change this later on Profiles. Experience opens the matching chapter in The Playbook.
          </p>
          {suggestedRole ? (
            <p className="text-xs text-muted-foreground">
              Quiz leaned {suggestedRole}
              {suggestedArch ? ` · ${suggestedArch.replace(/-/g, " ")}` : ""}.
            </p>
          ) : null}
          <div className="grid grid-cols-3 gap-2">
            <RoleCard
              title="Dominant"
              copy="Hold the dynamic."
              selected={role === "dominant"}
              onClick={() => {
                setRole("dominant");
                setRoleStyle("");
              }}
            />
            <RoleCard
              title="Submissive"
              copy="Offer the dynamic."
              selected={role === "submissive"}
              onClick={() => {
                setRole("submissive");
                setRoleStyle("");
              }}
            />
            <RoleCard
              title="Switch"
              copy="Either seat."
              selected={role === "switch"}
              onClick={() => {
                setRole("switch");
                setRoleStyle("");
              }}
            />
          </div>
          {role ? <RoleStyleField role={role} value={roleStyle} onChange={setRoleStyle} /> : null}
          <label className="block space-y-1.5">
            <Label>Experience in this role</Label>
            <Select value={experience} onChange={(e) => setExperience(e.target.value)}>
              {EXPERIENCE_LEVELS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </Select>
            <p className="text-xs text-muted-foreground">
              {EXPERIENCE_LEVELS.find((item) => item.value === experience)?.hint}
            </p>
          </label>
          <Button className="w-full" onClick={() => void saveRole()} disabled={busy || !role}>
            {busy ? "Saving…" : "Continue"}
          </Button>
        </div>
      ) : null}

      {step === 5 ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Three ways in. You can connect a human later from Profiles even if you start alone.
          </p>
          <div className="space-y-3 rounded-xl border border-border bg-card p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Connect to a partner</p>
            <p className="font-display text-3xl tracking-[0.28em]">{pairing?.profile?.pairingCode ?? profile?.pairingCode}</p>
            <label className="block space-y-1.5">
              <Label>Their code</Label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="ABC123"
                maxLength={12}
                className="tracking-[0.2em]"
              />
            </label>
            <Button className="w-full" onClick={() => void pair()} disabled={busy || !code.trim()}>
              Connect
            </Button>
          </div>
          <div className="space-y-3 rounded-xl border border-border bg-card p-5">
            <p className="font-display text-2xl">Use the companion as a partner</p>
            <p className="text-sm text-muted-foreground">Shape an adult AI to play with. You can still pair a human later.</p>
            <label className="block space-y-1.5">
              <Label>Their name</Label>
              <Input value={companionName} onChange={(e) => setCompanionName(e.target.value)} maxLength={40} />
            </label>
            <label className="block space-y-1.5">
              <Label>Their role</Label>
              <Select value={companionRole} onChange={(e) => setCompanionRole(e.target.value)}>
                <option value="dominant">Dominant</option>
                <option value="submissive">Submissive</option>
                <option value="switch">Switch</option>
              </Select>
            </label>
            <NeedinessField value={companionNeediness} onChange={setCompanionNeediness} />
            <Button className="w-full" variant="outline" onClick={() => void finish("companion")} disabled={busy}>
              Play with the companion
            </Button>
          </div>
          <Button className="w-full" variant="outline" onClick={() => void finish("solo")} disabled={busy}>
            Use as a solo player
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function RoleCard({
  title,
  copy,
  selected,
  onClick,
}: {
  title: string;
  copy: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl border p-3 text-left transition-colors",
        selected ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/40",
      )}
    >
      <p className="font-display text-lg leading-tight">{title}</p>
      <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{copy}</p>
    </button>
  );
}
