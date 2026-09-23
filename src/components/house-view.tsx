import { ExternalLink, MapPin, Navigation } from "lucide-react";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { toast } from "sonner";
import { Editor, PartnerCard } from "@/components/profile-view";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { VacationToggle } from "@/components/vacation-control";
import { InstallApps } from "@/components/install-apps";
import { HouseCalendar } from "@/components/house-calendar";
import { deleteEntry, getLocationBoard, getMe, listArchived, pingLocation, saveHouseSettings, saveUserOptions, setLocationSharing, updateEntry } from "@/lib/api";
import { SaveHint, useAutoSave } from "@/lib/auto-save";
import { EDIT_SCOPES, parseHouseTab } from "@/lib/house";
import { subscribeMe } from "@/lib/me-sync";
import { useLiveReload } from "@/lib/live-sync";
import { HOUSE_NAV, NAV } from "@/lib/nav";
import { formatWhen } from "@/lib/format";
import { entityLabel } from "@/lib/history";
import { KINDS } from "@/lib/kinds";
import {
  formatAgo,
  formatMeters,
  googleMapsEmbed,
  googleMapsLink,
  haversineMeters,
  notifyLocationChanged,
} from "@/lib/location";
import type { Entry, HouseSettings, LocationBoard, Me, SubEditKey, UserOptions } from "@/lib/types";
import { cn } from "@/lib/utils";

export function HouseView() {
  const hash = useRouterState({ select: (s) => s.location.hash });
  const tab = parseHouseTab(hash);
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setMe(await getMe());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not open settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => subscribeMe(setMe), []);
  useLiveReload(load);

  if (loading || !me?.profile) {
    return <div className="h-64 animate-pulse rounded-xl bg-card" />;
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">Settings</p>
        <h1 className="mt-1 font-display text-4xl font-medium">
          {HOUSE_NAV.find((item) => item.hash === tab)?.label ?? "Settings"}
        </h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Profiles, options, the shared calendar, archived entries, location, and the Dominant's lock on who may write in each category.
        </p>
      </header>

      <div className="flex gap-1 overflow-x-auto pb-1 md:hidden">
        {HOUSE_NAV.map((item) => (
          <Link
            key={item.hash}
            to="/house"
            hash={item.hash}
            className={cn(
              "h-10 shrink-0 rounded-full border px-3 text-sm",
              tab === item.hash
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border text-muted-foreground",
            )}
          >
            {item.label}
          </Link>
        ))}
      </div>

      {tab === "you" ? (
        <Editor profile={me.profile} lastPartner={me.lastPartner} partners={me.partners} onSaved={setMe} />
      ) : null}
      {tab === "partner" ? <PartnerCard me={me} onChange={setMe} /> : null}
      {tab === "options" ? <OptionsPanel me={me} onChange={setMe} /> : null}
      {tab === "app" ? <AppPanel me={me} onChange={setMe} /> : null}
      {tab === "calendar" ? <HouseCalendar me={me} /> : null}
      {tab === "archive" ? <ArchivePanel /> : null}
      {tab === "location" ? <LocationPanel me={me} /> : null}
      {tab === "permissions" ? <PermissionsPanel me={me} onChange={setMe} /> : null}
    </div>
  );
}

function ArchivePanel() {
  const [rows, setRows] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      setRows(await listArchived());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load archived entries.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);
  useLiveReload(load);

  async function restore(entry: Entry) {
    setBusyId(entry.id);
    try {
      await updateEntry({ data: { id: entry.id, kind: entry.kind, status: "open" } });
      toast.success(`Restored “${entry.title}”.`);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not restore.");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(entry: Entry) {
    if (typeof window !== "undefined" && !window.confirm(`Permanently delete “${entry.title}”? This cannot be undone.`)) {
      return;
    }
    setBusyId(entry.id);
    try {
      await deleteEntry({ data: { id: entry.id } });
      toast.success("Deleted permanently.");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete.");
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <div className="h-64 animate-pulse rounded-xl bg-card" />;

  return (
    <section className="space-y-4 rounded-xl border border-border bg-card p-5">
      <div>
        <h2 className="font-display text-2xl">Archived</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Restore anything you filed away, or delete it permanently. Completions still stay on the calendar.
        </p>
      </div>
      {rows.length === 0 ? (
        <p className="rounded-lg bg-secondary px-3 py-8 text-center text-sm text-muted-foreground">
          Nothing is archived. Archive a task, habit, reward, or anything else from its page, then it lands here.
        </p>
      ) : (
        <div className="space-y-2">
          {rows.map((entry) => {
            const kindLabel =
              entry.kind === "task" && entry.cadence === "habit"
                ? "Habit"
                : entry.kind === "rabbit"
                  ? "Training"
                  : KINDS[entry.kind]?.title ?? entityLabel(entry.kind);
            return (
              <div
                key={entry.id}
                className="flex flex-wrap items-start justify-between gap-3 rounded-lg bg-secondary/70 px-3 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{entry.title}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.12em] text-muted-foreground">
                    {kindLabel}
                    {entry.category ? ` · ${entry.category}` : ""}
                    {` · ${formatWhen(entry.updatedAt || entry.createdAt)}`}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button size="sm" variant="outline" disabled={busyId === entry.id} onClick={() => void restore(entry)}>
                    Restore
                  </Button>
                  <Button size="sm" variant="ghost" disabled={busyId === entry.id} onClick={() => void remove(entry)}>
                    Delete
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function OptionsPanel({ me, onChange }: { me: Me; onChange: (me: Me) => void }) {
  const profile = me.profile!;
  const [draft, setDraft] = useState<UserOptions>(me.options);
  const isDom = profile.role === "dominant";
  const data = {
    honorific: draft.honorific.trim(),
    addressAs: draft.addressAs.trim(),
    safeword: draft.safeword.trim(),
    checkIn: draft.checkIn.trim(),
  };
  const dirty =
    data.honorific !== me.options.honorific ||
    data.addressAs !== me.options.addressAs ||
    data.safeword !== me.options.safeword ||
    data.checkIn !== me.options.checkIn;
  const saveStatus = useAutoSave(
    JSON.stringify(data),
    async () => {
      onChange(await saveUserOptions({ data }));
    },
    { delay: 500, enabled: dirty },
  );

  return (
    <section className="space-y-5 rounded-xl border border-border bg-card p-5">
      <div>
        <h2 className="font-display text-2xl">{isDom ? "Dominant options" : "Submissive options"}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          How you wish to be addressed, how you address them, and the words that keep the dynamic safe. Changes save as you type.
        </p>
      </div>
      <label className="block space-y-1.5">
        <Label>Address me as</Label>
        <Input
          value={draft.honorific}
          onChange={(e) => setDraft((p) => ({ ...p, honorific: e.target.value }))}
          placeholder={isDom ? "Sir, Mistress, Owner…" : "pet, boy, girl…"}
          maxLength={40}
        />
      </label>
      <label className="block space-y-1.5">
        <Label>I address my partner as</Label>
        <Input
          value={draft.addressAs}
          onChange={(e) => setDraft((p) => ({ ...p, addressAs: e.target.value }))}
          placeholder={isDom ? "pet, toy…" : "Sir, Mistress…"}
          maxLength={40}
        />
      </label>
      <label className="block space-y-1.5">
        <Label>Safeword</Label>
        <Input
          value={draft.safeword}
          onChange={(e) => setDraft((p) => ({ ...p, safeword: e.target.value }))}
          placeholder="Shared with your connected partner"
          maxLength={40}
        />
        <p className="text-xs text-muted-foreground">Visible to your connected partner. Empty stays private.</p>
      </label>
      <label className="block space-y-1.5">
        <Label>Daily check-in</Label>
        <Input
          type="time"
          value={draft.checkIn}
          onChange={(e) => setDraft((p) => ({ ...p, checkIn: e.target.value }))}
        />
      </label>
      <SaveHint status={saveStatus} />
    </section>
  );
}

function AppPanel({ me, onChange }: { me: Me; onChange: (me: Me) => void }) {
  const [hideCompleted, setHideCompleted] = useState(me.options.hideCompleted);
  const [showReminders, setShowReminders] = useState(me.options.showReminders);
  const [quickNav, setQuickNav] = useState<string[]>(me.options.quickNav?.length ? me.options.quickNav : ["/", "/training", "/games", "/talk"]);
  const [busy, setBusy] = useState(false);

  async function persist(next: Partial<UserOptions>) {
    setBusy(true);
    try {
      onChange(await saveUserOptions({ data: next }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
    <section className="space-y-5 rounded-xl border border-border bg-card p-5">
      <div>
        <h2 className="font-display text-2xl">App settings</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Hide-completed and reminders stay on your login. Vacation pauses duties for both of you.
        </p>
      </div>
      <SettingRow
        title="Vacation"
        copy="Pause every task, habit, training item, and protocol. Either of you can resume at any time."
      >
        <VacationToggle me={me} onChange={onChange} />
      </SettingRow>
      <SettingRow
        title="Hide completed on Home"
        copy="Keep the day list focused on what is still open."
      >
        <AllowToggle
          allowed={hideCompleted}
          labels={["On", "Off"]}
          disabled={busy}
          onChange={(on) => {
            setHideCompleted(on);
            void persist({ hideCompleted: on });
          }}
        />
      </SettingRow>
      <SettingRow title="Home reminders" copy="Show timed tasks and habits at the top of Home.">
        <AllowToggle
          allowed={showReminders}
          labels={["On", "Off"]}
          disabled={busy}
          onChange={(on) => {
            setShowReminders(on);
            void persist({ showReminders: on });
          }}
        />
      </SettingRow>
      <div className="space-y-2">
        <p className="text-sm font-medium">Quick access bar</p>
        <p className="text-xs text-muted-foreground">Pick up to four categories for the bar at the bottom of the screen.</p>
        <div className="flex flex-wrap gap-1.5">
          {NAV.map((item) => {
            const on = quickNav.includes(item.to);
            return (
              <button
                key={item.to}
                type="button"
                disabled={busy}
                onClick={() => {
                  const next = on
                    ? quickNav.filter((path) => path !== item.to)
                    : quickNav.length >= 4
                      ? [...quickNav.slice(1), item.to]
                      : [...quickNav, item.to];
                  const paths = next.slice(0, 4);
                  setQuickNav(paths);
                  void persist({ quickNav: paths });
                }}
                className={cn(
                  "h-9 rounded-full px-3 text-sm",
                  on ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground",
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </section>
    <InstallApps />
    </div>
  );
}

function PermissionsPanel({ me, onChange }: { me: Me; onChange: (me: Me) => void }) {
  const isDom = me.profile?.role === "dominant";
  const [house, setHouse] = useState<HouseSettings>(me.house);
  const [busy, setBusy] = useState(false);
  const partnerName = me.partner?.displayName || "your submissive";

  async function setKey(key: SubEditKey, allowed: boolean) {
    if (!isDom) return;
    const next: HouseSettings = {
      ...house,
      subEdit: { ...house.subEdit, [key]: allowed },
    };
    setHouse(next);
    setBusy(true);
    try {
      onChange(await saveHouseSettings({ data: next }));
    } catch (err) {
      setHouse(me.house);
      toast.error(err instanceof Error ? err.message : "Could not update permissions.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-5 rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl">Edit permissions</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {isDom
              ? `Allow or deny ${partnerName} the ability to write tasks, habits, rewards, punishments, training, and games — whether they may set points costs or change counts on punishments, rewards, scenes, and roleplay — and whether they may set days, hours, and minutes on timers.`
              : "Your Dominant decides whether you may write in these categories, set points costs, change those counts, or edit timers. Completing, skipping, serving, and buying still belong to you."}
          </p>
        </div>
        <Badge>{isDom ? "Dominant" : "Read only"}</Badge>
      </div>
      {!me.partner ? (
        <p className="rounded-lg bg-secondary px-3 py-3 text-sm text-muted-foreground">
          Connect a partner to apply these locks to a bond. You can still set them now.
        </p>
      ) : null}
      <div className="space-y-3">
        {EDIT_SCOPES.map((scope) => (
          <SettingRow key={scope.key} title={scope.label} copy={scope.hint}>
            <AllowToggle
              allowed={house.subEdit[scope.key]}
              disabled={busy || !isDom}
              onChange={(allowed) => void setKey(scope.key, allowed)}
            />
          </SettingRow>
        ))}
      </div>
    </section>
  );
}

function LocationPanel({ me }: { me: Me }) {
  const [board, setBoard] = useState<LocationBoard | null>(null);
  const [busy, setBusy] = useState(false);
  const [geoError, setGeoError] = useState("");

  const load = useCallback(async () => {
    try {
      setBoard(await getLocationBoard());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load location.");
    }
  }, []);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), 12_000);
    return () => window.clearInterval(id);
  }, [load]);
  useLiveReload(load);

  function sendFix(pos: GeolocationPosition) {
    void pingLocation({
      data: {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: Number.isFinite(pos.coords.accuracy) ? pos.coords.accuracy : null,
      },
    })
      .then((fix) => {
        setBoard((prev) => (prev ? { ...prev, mine: fix } : prev));
        setGeoError("");
      })
      .catch((err) => {
        setGeoError(err instanceof Error ? err.message : "Could not send location.");
      });
  }

  async function toggleShare(sharing: boolean) {
    setBusy(true);
    try {
      const next = await setLocationSharing({ data: { sharing } });
      setBoard(next);
      notifyLocationChanged();
      if (sharing && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(sendFix, (err) => {
          setGeoError(err.message || "Location permission was denied.");
        }, { enableHighAccuracy: true, timeout: 20_000 });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update sharing.");
    } finally {
      setBusy(false);
    }
  }

  if (!board) return <div className="h-64 animate-pulse rounded-xl bg-card" />;

  const partnerFix = board.partner;
  const partnerLive = Boolean(partnerFix?.sharing && partnerFix.lat != null && partnerFix.lng != null);
  const mineLive = Boolean(board.mine.sharing && board.mine.lat != null && board.mine.lng != null);
  const distance =
    partnerLive && mineLive
      ? haversineMeters(
          { lat: board.mine.lat!, lng: board.mine.lng! },
          { lat: partnerFix!.lat!, lng: partnerFix!.lng! },
        )
      : null;

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-border bg-card p-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl">
              {me.partner?.displayName || "Partner"} on the map
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Live pin on Google Maps, only while they choose to share it.
            </p>
          </div>
          <Badge variant={partnerLive ? "default" : "outline"}>{partnerLive ? "Live" : "Hidden"}</Badge>
        </div>
        {!me.partner ? (
          <p className="rounded-lg bg-secondary px-3 py-3 text-sm text-muted-foreground">
            Connect a partner from Settings → Partner to see their location.
          </p>
        ) : partnerLive ? (
          <MapCard
            lat={partnerFix!.lat!}
            lng={partnerFix!.lng!}
            label={me.partner.displayName || "Partner"}
            place={partnerFix!.placeName}
            updatedAt={partnerFix!.updatedAt}
            accuracy={partnerFix!.accuracy}
            distance={distance}
          />
        ) : (
          <p className="rounded-lg bg-secondary px-3 py-3 text-sm text-muted-foreground">
            {me.partner.displayName || "Your partner"} is not sharing a location right now.
          </p>
        )}
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <SettingRow
          title="Share my location"
          copy="Sends a live pin to your connected partner. You can stop at any time. Passenger / public use only — never while driving."
        >
          <AllowToggle
            allowed={board.mine.sharing}
            labels={["Share", "Hide"]}
            disabled={busy}
            onChange={(on) => void toggleShare(on)}
          />
        </SettingRow>
        {geoError ? <p className="mt-3 text-sm text-destructive">{geoError}</p> : null}
        {mineLive ? (
          <div className="mt-4">
            <MapCard
              lat={board.mine.lat!}
              lng={board.mine.lng!}
              label="You"
              place={board.mine.placeName}
              updatedAt={board.mine.updatedAt}
              accuracy={board.mine.accuracy}
            />
          </div>
        ) : board.mine.sharing ? (
          <p className="mt-3 text-sm text-muted-foreground">Waiting for a GPS fix from this device…</p>
        ) : null}
      </section>
    </div>
  );
}

function MapCard({
  lat,
  lng,
  label,
  place,
  updatedAt,
  accuracy,
  distance,
}: {
  lat: number;
  lng: number;
  label: string;
  place: string;
  updatedAt: string | null;
  accuracy: number | null;
  distance?: number | null;
}) {
  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-xl border border-border">
        <iframe
          title={`${label} on Google Maps`}
          src={googleMapsEmbed(lat, lng)}
          className="h-72 w-full border-0 sm:h-96"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 text-sm">
          <p className="flex items-center gap-1.5 font-medium">
            <MapPin className="size-4 text-primary" />
            {place || `${lat.toFixed(5)}, ${lng.toFixed(5)}`}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatAgo(updatedAt)}
            {accuracy != null ? ` · ±${Math.round(accuracy)} m` : ""}
            {distance != null ? ` · ${formatMeters(distance)} away` : ""}
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <a href={googleMapsLink(lat, lng)} target="_blank" rel="noreferrer">
            <Navigation className="size-4" />
            Open in Google Maps
            <ExternalLink className="size-3.5" />
          </a>
        </Button>
      </div>
    </div>
  );
}

function SettingRow({
  title,
  copy,
  children,
}: {
  title: string;
  copy: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg bg-secondary/60 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 sm:pr-4">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{copy}</p>
      </div>
      <div className="w-full shrink-0 sm:w-44">{children}</div>
    </div>
  );
}

function AllowToggle({
  allowed,
  onChange,
  disabled,
  labels = ["Allow", "Deny"],
}: {
  allowed: boolean;
  onChange: (allowed: boolean) => void;
  disabled?: boolean;
  labels?: [string, string];
}) {
  return (
    <div className="grid grid-cols-2 rounded-lg bg-background p-1">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(true)}
        className={cn(
          "h-10 rounded-md text-sm",
          allowed ? "bg-primary text-primary-foreground" : "text-muted-foreground",
        )}
      >
        {labels[0]}
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(false)}
        className={cn(
          "h-10 rounded-md text-sm",
          !allowed ? "bg-primary text-primary-foreground" : "text-muted-foreground",
        )}
      >
        {labels[1]}
      </button>
    </div>
  );
}
