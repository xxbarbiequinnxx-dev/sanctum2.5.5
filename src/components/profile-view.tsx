import { Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { PhotoField } from "@/components/photo-field";
import { KinkField, KinkList } from "@/components/kink-field";
import { RoleStyleField } from "@/components/role-style-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { connectPartner, disconnectPartner, getMe, playWithCompanion, removePartner, saveProfile, switchPartner } from "@/lib/api";
import { SaveHint, useAutoSave } from "@/lib/auto-save";
import { roleLabel, sexLabel } from "@/lib/format";
import { SEX_OPTIONS, type Me, type Partner, type Profile } from "@/lib/types";
import type { Role } from "@/lib/kinds";
import { EXPERIENCE_LEVELS, experienceLabel, parseExperience } from "@/lib/experience";
import { parseKinks } from "@/lib/kinks";
import { styleLabel, stylesFor } from "@/lib/role-styles";
import { cn } from "@/lib/utils";
import { useLiveReload } from "@/lib/live-sync";

export function ProfileView() {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setMe(await getMe());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load profile.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);
  useLiveReload(load);

  if (loading || !me?.profile) {
    return <div className="h-64 animate-pulse rounded-xl bg-card" />;
  }

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">The pair</p>
        <h1 className="mt-1 font-display text-4xl font-medium">Profiles</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Your name stays on this page. Your partner sees your username. Keep several people — one live bond at a time. Role, experience, kinks, and how you play live here.
        </p>
      </header>
      <div className="grid gap-4 lg:grid-cols-2">
        <Editor profile={me.profile} lastPartner={me.lastPartner} partners={me.partners} onSaved={setMe} />
        <PartnerCard me={me} onChange={setMe} />
      </div>
    </div>
  );
}

export function Editor({
  profile,
  lastPartner,
  partners = [],
  onSaved,
}: {
  profile: Profile;
  lastPartner?: Partner | null;
  partners?: Partner[];
  onSaved: (me: Me) => void;
}) {
  const [name, setName] = useState(profile.displayName);
  const [username, setUsername] = useState(profile.username);
  const [age, setAge] = useState(profile.age ? String(profile.age) : "");
  const [sex, setSex] = useState(profile.sex);
  const [role, setRole] = useState<Role>(profile.role);
  const [roleStyle, setRoleStyle] = useState(profile.roleStyle);
  const [experience, setExperience] = useState(parseExperience(profile.experience));
  const [playMode, setPlayMode] = useState(profile.playMode || (profile.partnerUserId ? "pair" : "solo"));
  const [photos, setPhotos] = useState(profile.avatarData ? [profile.avatarData] : []);
  const [kinks, setKinks] = useState(() => parseKinks(profile.kinks));
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    setPlayMode(profile.playMode || (profile.partnerUserId ? "pair" : "solo"));
  }, [profile.playMode, profile.partnerUserId]);

  function chooseRole(next: Role) {
    setRole(next);
    if (!stylesFor(next).some((item) => item.value === roleStyle)) {
      setRoleStyle("");
    }
  }

  async function choosePlay(next: "pair" | "companion" | "solo") {
    if (switching) return;
    if (next === "solo") {
      if (profile.partnerUserId) {
        if (
          typeof window !== "undefined" &&
          !window.confirm("Switch to solo? Shared pages wait on this bond. You can reconnect later.")
        ) {
          return;
        }
      }
      setSwitching(true);
      try {
        onSaved(await disconnectPartner());
        setPlayMode("solo");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not switch to solo.");
      } finally {
        setSwitching(false);
      }
      return;
    }
    if (next === "companion") {
      if (profile.partnerUserId) {
        if (
          typeof window !== "undefined" &&
          !window.confirm("Switch to the companion? Shared pages wait. Everyone stays on your roster.")
        ) {
          return;
        }
      }
      setSwitching(true);
      try {
        onSaved(await playWithCompanion());
        setPlayMode("companion");
        toast.success("Companion pages are live. Solo and partner pages wait.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not switch to the companion.");
      } finally {
        setSwitching(false);
      }
      return;
    }
    if (next === "pair" && !profile.partnerUserId) {
      const waiting = partners.filter((item) => !item.active);
      const pick = waiting.find((item) => item.available) ?? lastPartner;
      if (waiting.length > 1) {
        setPlayMode("pair");
        toast.message("Pick who to switch to on their card.");
        return;
      }
      if (pick?.available) {
        setSwitching(true);
        try {
          onSaved(await switchPartner({ data: { userId: pick.userId } }));
          setPlayMode("pair");
          toast.success(`Now with ${pick.username || "them"}.`);
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Could not switch.");
          setPlayMode("pair");
        } finally {
          setSwitching(false);
        }
        return;
      }
      setPlayMode("pair");
      return;
    }
    setPlayMode(next);
  }

  const ageNum = Number(age);
  const ageOk = Number.isInteger(ageNum) && ageNum >= 18;
  const usernameOk = Boolean(username.trim());
  const canSave = ageOk && usernameOk;
  const signature = JSON.stringify({
    name,
    username,
    age,
    sex,
    role,
    roleStyle,
    experience,
    photo: photos[0] ?? "",
    kinks,
  });
  const saveStatus = useAutoSave(
    signature,
    async () => {
      await saveProfile({
        data: {
          displayName: name.trim(),
          username: username.trim(),
          age: ageNum,
          sex,
          role,
          roleStyle,
          experience,
          avatarData: photos[0] ?? null,
          kinks,
        },
      });
      onSaved(await getMe());
    },
    { delay: 500, enabled: canSave, resetKey: `${profile.userId}:${profile.partnerUserId}:${profile.playMode}` },
  );

  const typeName = styleLabel(role, roleStyle);

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="font-display text-2xl">You</h2>
        <Badge>
          {typeName ? `${typeName} · ` : ""}
          {roleLabel(role)}
        </Badge>
      </div>
      {photos[0] ? (
        <img src={photos[0]} alt="" className="mb-4 h-40 w-full rounded-lg object-cover" />
      ) : null}
      <div className="space-y-3">
        <PhotoField photos={photos} onChange={setPhotos} max={1} label="Photo" />
        <label className="block space-y-1.5">
          <Label>Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} placeholder="Only you see this" />
          <p className="text-xs text-muted-foreground">Hidden from everyone else, including a partner. It only appears here.</p>
        </label>
        <label className="block space-y-1.5">
          <Label>Username</Label>
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value.replace(/[^A-Za-z0-9._-]/g, "").slice(0, 32))}
            maxLength={32}
            placeholder="What they will see"
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block space-y-1.5">
            <Label>Age</Label>
            <Input type="number" min={18} max={99} value={age} onChange={(e) => setAge(e.target.value)} />
          </label>
          <label className="block space-y-1.5">
            <Label>Sex</Label>
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
        <div className="grid grid-cols-3 gap-2">
          {(["dominant", "submissive", "switch"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => chooseRole(value)}
              className={cn(
                "h-11 rounded-lg border text-sm",
                role === value ? "border-primary bg-primary/10" : "border-border",
              )}
            >
              {roleLabel(value)}
            </button>
          ))}
        </div>
        <RoleStyleField role={role} value={roleStyle} onChange={setRoleStyle} />
        <label className="block space-y-1.5">
          <Label>Experience in this role</Label>
          <Select value={experience} onChange={(e) => setExperience(parseExperience(e.target.value))}>
            {EXPERIENCE_LEVELS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </Select>
          <p className="text-xs text-muted-foreground">
            {EXPERIENCE_LEVELS.find((item) => item.value === experience)?.hint}{" "}
            <Link to="/playbook" className="text-primary underline-offset-2 hover:underline">
              Opens {experienceLabel(experience)} in The Playbook
            </Link>
            . You can change this as you grow.
          </p>
        </label>
        <KinkField role={role} value={kinks} onChange={setKinks} />
        <div className="space-y-2">
          <Label>How you play</Label>
          <div className="grid gap-2">
            {(
              [
                {
                  value: "pair" as const,
                  title: "Partner",
                  copy: profile.partnerUserId
                    ? "Connected. These shared pages are only for this pair."
                    : partners.length
                      ? "Pick who is live on the other card, or pair a new code. Each bond has its own pages."
                      : "A human bond. Pair with a code on the other card. Separate from solo and the companion.",
                },
                {
                  value: "companion" as const,
                  title: "Companion as partner",
                  copy: "Their own pages. The companion may write here. Solo and human bonds wait, unseen.",
                },
                {
                  value: "solo" as const,
                  title: "Solo",
                  copy: "Your private pages. The companion can talk, but cannot change anything. Partner pages wait.",
                },
              ] as const
            ).map((item) => (
              <button
                key={item.value}
                type="button"
                disabled={switching}
                onClick={() => void choosePlay(item.value)}
                className={cn(
                  "rounded-lg border px-3 py-2 text-left",
                  playMode === item.value ? "border-primary bg-primary/10" : "border-border",
                )}
              >
                <p className="text-sm font-medium">{item.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{item.copy}</p>
              </button>
            ))}
          </div>
        </div>
        {!usernameOk ? (
          <p className="text-xs text-muted-foreground">Choose a username your partner can see.</p>
        ) : !ageOk ? (
          <p className="text-xs text-muted-foreground">Age must be 18 or older.</p>
        ) : (
          <SaveHint status={saveStatus} />
        )}
      </div>
    </section>
  );
}

export function PartnerCard({ me, onChange }: { me: Me; onChange: (me: Me) => void }) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const partner = me.partner;
  const roster = (me.partners ?? []).filter((item) => !item.active);
  const mine = me.profile!;

  async function connect() {
    setBusy("connect");
    try {
      onChange(await connectPartner({ data: { code } }));
      toast.success("Connected.");
      setCode("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not connect.");
    } finally {
      setBusy(null);
    }
  }

  async function activate(person: Partner) {
    if (person.active) return;
    if (!person.available) {
      if (
        typeof window !== "undefined" &&
        !window.confirm(
          `${person.username || "They"} are with someone else. Switch anyway? They'll be pulled here. Shared pages for each pair stay separate.`,
        )
      ) {
        return;
      }
    }
    setBusy(person.userId);
    try {
      onChange(await switchPartner({ data: { userId: person.userId } }));
      toast.success(`Now with ${person.username || "them"}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not switch.");
    } finally {
      setBusy(null);
    }
  }

  async function goSolo() {
    if (partner) {
      if (
        typeof window !== "undefined" &&
        !window.confirm("Switch to solo? Shared pages wait on this bond. Everyone stays on your roster.")
      ) {
        return;
      }
    }
    setBusy("solo");
    try {
      onChange(await disconnectPartner());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not switch to solo.");
    } finally {
      setBusy(null);
    }
  }

  async function goCompanion() {
    if (partner) {
      if (
        typeof window !== "undefined" &&
        !window.confirm("Switch to the companion? Shared pages wait. Everyone stays on your roster.")
      ) {
        return;
      }
    }
    setBusy("companion");
    try {
      onChange(await playWithCompanion());
      toast.success("Companion pages are live. Solo and partner pages wait.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not switch to the companion.");
    } finally {
      setBusy(null);
    }
  }

  async function drop(person: Partner) {
    if (
      typeof window !== "undefined" &&
      !window.confirm(
        `Drop ${person.username || "them"} from your roster? Shared pages stay if you pair their code again.`,
      )
    ) {
      return;
    }
    setBusy(`drop:${person.userId}`);
    try {
      onChange(await removePartner({ data: { userId: person.userId } }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not drop them.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="font-display text-2xl">{partner ? "Partner" : "Partners"}</h2>
        {partner ? <Badge variant="outline">{roleLabel(partner.role)}</Badge> : null}
      </div>

      {partner ? (
        <>
          <Portrait person={partner} />
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <Stat label="Username" value={partner.username || partner.displayName || "—"} />
            <Stat label="Age" value={partner.age ? String(partner.age) : "—"} />
            <Stat label="Sex" value={sexLabel(partner.sex) || "—"} />
            <Stat label="Role" value={roleLabel(partner.role)} />
            <Stat label="Type" value={styleLabel(partner.role, partner.roleStyle) || "—"} />
            <Stat label="Experience" value={experienceLabel(partner.experience)} />
          </dl>
          <KinkList values={parseKinks(partner.kinks)} role={partner.role} />
          <Button variant="outline" className="mt-5 w-full" onClick={() => void goSolo()} disabled={Boolean(busy)}>
            {busy === "solo" ? "Switching…" : "Switch to solo"}
          </Button>
          <Button variant="outline" className="mt-2 w-full" onClick={() => void goCompanion()} disabled={Boolean(busy)}>
            {busy === "companion" ? "Switching…" : "Switch to the companion"}
          </Button>
          <Button
            variant="ghost"
            className="mt-2 w-full text-destructive"
            onClick={() => void drop(partner)}
            disabled={Boolean(busy)}
          >
            Drop from roster
          </Button>
        </>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {mine.playMode === "companion"
              ? "The companion is live. Pair a human from the roster, or keep shaping them from Companion."
              : "No one is live. Switch to someone on the roster, pair a new code, or play with the companion."}
          </p>
          {mine.playMode === "companion" ? (
            <>
              <p className="mt-4 text-sm">Playing with the companion. These pages are only this house.</p>
              <Button variant="outline" className="mt-5 w-full" onClick={() => void goSolo()} disabled={Boolean(busy)}>
                {busy === "solo" ? "Switching…" : "Switch to solo"}
              </Button>
            </>
          ) : (
            <Button variant="outline" className="mt-5 w-full" onClick={() => void goCompanion()} disabled={Boolean(busy)}>
              {busy === "companion" ? "Switching…" : "Switch to the companion"}
            </Button>
          )}
        </>
      )}

      {roster.length ? (
        <div className="mt-6 space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Roster</p>
          {roster.map((person) => (
            <div key={person.userId} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2">
              <Portrait person={person} compact />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{person.username || "Partner"}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {roleLabel(person.role)}
                  {person.available ? "" : " · with someone else"}
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-1">
                <Button size="sm" onClick={() => void activate(person)} disabled={Boolean(busy)}>
                  {busy === person.userId ? "…" : "Switch"}
                </Button>
                <button
                  type="button"
                  className="text-[11px] text-muted-foreground hover:text-destructive"
                  onClick={() => void drop(person)}
                  disabled={Boolean(busy)}
                >
                  Drop
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-6 space-y-3 border-t border-border pt-5">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Pair someone new</p>
        <div className="rounded-lg bg-secondary px-4 py-5 text-center">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Your pairing code</p>
          <p className="mt-2 font-display text-4xl tracking-[0.28em]">{mine.pairingCode}</p>
        </div>
        <label className="block space-y-1.5">
          <Label>Their code</Label>
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ABC123"
            className="tracking-[0.2em]"
          />
        </label>
        <Button className="w-full" onClick={() => void connect()} disabled={Boolean(busy) || code.length < 4}>
          {busy === "connect" ? "Connecting…" : partner ? "Connect and switch" : "Connect"}
        </Button>
      </div>
    </section>
  );
}

function Portrait({ person, compact }: { person: Partner; compact?: boolean }) {
  if (person.avatarData) {
    return (
      <img
        src={person.avatarData}
        alt=""
        className={compact ? "size-12 shrink-0 rounded-lg object-cover" : "h-48 w-full rounded-lg object-cover"}
      />
    );
  }
  return (
    <div
      className={
        compact
          ? "grid size-12 shrink-0 place-items-center rounded-lg bg-secondary font-display text-lg text-muted-foreground"
          : "grid h-48 place-items-center rounded-lg bg-secondary font-display text-5xl text-muted-foreground"
      }
    >
      {(person.username || person.displayName || "?").charAt(0)}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{label}</dt>
      <dd className="mt-1">{value}</dd>
    </div>
  );
}
