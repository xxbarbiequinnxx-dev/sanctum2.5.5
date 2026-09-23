import { ImagePlus, Minus, Plus, Send, X } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";
import { PendingMediaTray, PhotoSourceButtons } from "@/components/photo-field";
import { NeedinessField } from "@/components/neediness-field";
import { TagPickField } from "@/components/kink-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  clearCompanionMessages,
  dropCompanionMemory,
  generateCompanionPortrait,
  getCompanion,
  listCompanionMemories,
  listCompanionMessages,
  saveCompanion,
  sendCompanionMessage,
  tickCompanion,
} from "@/lib/api";
import { SaveHint, useAutoSave } from "@/lib/auto-save";
import { COMPANION_HEAT, clampCompanionAge, companionPortrait, companionRevealDelay, DEFAULT_COMPANION } from "@/lib/companion";
import { ALL_KINK_OPTIONS, ALL_TRAIT_OPTIONS, companionRoleKind, encodeTagBag, encodeTagList, kinksFor, parseTagBag, parseTagList, traitsFor } from "@/lib/kinks";
import { stageFiles, type StagedMedia } from "@/lib/media-access";
import { useLiveReload } from "@/lib/live-sync";
import { MEDIA_ACCEPT, isVideoDataUrl } from "@/lib/video";
import { formatWhen } from "@/lib/format";
import type { CompanionMemory, CompanionMessage, CompanionProfile, Me } from "@/lib/types";
import { cn } from "@/lib/utils";

export function CompanionPanel({ me, open }: { me: Me; open: boolean; onClose?: () => void }) {
  const [tab, setTab] = useState<"chat" | "shape">("chat");
  const [profile, setProfile] = useState<CompanionProfile>(DEFAULT_COMPANION);
  const [memories, setMemories] = useState<CompanionMemory[]>([]);

  const loadMemories = useCallback(async () => {
    try {
      setMemories(await listCompanionMemories());
    } catch {
      setMemories([]);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    void getCompanion()
      .then(setProfile)
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : "Could not open the companion.");
      });
    void loadMemories();
  }, [open, tab, loadMemories]);
  useLiveReload(loadMemories);

  if (!open) return null;
  return (
    <div className="fixed inset-x-0 top-14 z-40 mx-auto w-[min(100%,28rem)] px-3 sm:right-4 sm:left-auto sm:mx-0 sm:w-[26rem] sm:px-0">
      <div className="overflow-hidden rounded-xl border border-border bg-popover shadow-soft">
        <div className="grid grid-cols-2 border-b border-border p-1">
          <button
            type="button"
            onClick={() => setTab("chat")}
            className={cn(
              "h-10 rounded-lg text-sm",
              tab === "chat" ? "bg-secondary text-foreground" : "text-muted-foreground",
            )}
          >
            Companion
          </button>
          <button
            type="button"
            onClick={() => setTab("shape")}
            className={cn(
              "h-10 rounded-lg text-sm",
              tab === "shape" ? "bg-secondary text-foreground" : "text-muted-foreground",
            )}
          >
            Shape
          </button>
        </div>
        <div className={tab === "chat" ? "block" : "hidden"}>
          <CompanionChat me={me} profile={profile} onShape={() => setTab("shape")} />
        </div>
        <div className={tab === "shape" ? "block" : "hidden"}>
          <CompanionShape profile={profile} memories={memories} onSaved={setProfile} onMemories={setMemories} />
        </div>
      </div>
    </div>
  );
}

function CompanionChat({
  me,
  profile,
  onShape,
}: {
  me: Me;
  profile: CompanionProfile;
  onShape: () => void;
}) {
  const [messages, setMessages] = useState<CompanionMessage[]>([]);
  const [text, setText] = useState("");
  const [pending, setPending] = useState<StagedMedia[]>([]);
  const [busy, setBusy] = useState(false);
  const [writing, setWriting] = useState(false);
  const [queue, setQueue] = useState<CompanionMessage[]>([]);
  const scroller = useRef<HTMLDivElement>(null);
  const knownIds = useRef(new Set<number>());
  const queueRef = useRef<CompanionMessage[]>([]);
  const busyRef = useRef(false);
  const countRef = useRef(0);
  queueRef.current = queue;
  busyRef.current = busy;
  countRef.current = messages.length;

  function flushQueue() {
    const waiting = queueRef.current;
    if (!waiting.length) return;
    setQueue([]);
    setWriting(false);
    setMessages((prev) => {
      const have = new Set(prev.map((item) => item.id));
      return [...prev, ...waiting.filter((item) => !have.has(item.id))];
    });
  }

  function ingest(rows: CompanionMessage[], drip: boolean) {
    const fresh = rows.filter((item) => item.id > 0 && !knownIds.current.has(item.id));
    if (!fresh.length) return;
    for (const item of fresh) knownIds.current.add(item.id);
    if (!drip) {
      setMessages(rows);
      setQueue([]);
      setWriting(false);
      return;
    }
    const users = fresh.filter((item) => item.role === "user");
    const assistants = fresh.filter((item) => item.role === "assistant");
    if (users.length) {
      setMessages((prev) => {
        const have = new Set(prev.map((item) => item.id));
        const next = prev.filter((item) => item.id > 0 || item.role !== "user");
        return [...next, ...users.filter((item) => !have.has(item.id))];
      });
    }
    if (assistants.length) setQueue((prev) => [...prev, ...assistants]);
  }

  useEffect(() => {
    let cancelled = false;
    void listCompanionMessages()
      .then((rows) => {
        if (cancelled) return;
        const thread = rows as CompanionMessage[];
        knownIds.current = new Set(thread.filter((item) => item.id > 0).map((item) => item.id));
        setMessages(thread);
        if (!thread.some((item) => item.role === "assistant")) {
          setWriting(true);
          void tickCompanion()
            .then((result) => {
              if (cancelled) return;
              const rows = (result.messages ?? []) as CompanionMessage[];
              ingest(rows, true);
              if (!rows.length) setWriting(false);
            })
            .catch(() => {
              if (!cancelled) setWriting(false);
            });
        }
      })
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : "Could not open the companion.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useLiveReload(async () => {
    if (busyRef.current) return;
    const rows = (await listCompanionMessages()) as CompanionMessage[];
    ingest(rows, true);
  });

  useEffect(() => {
    if (!queue.length) {
      setWriting(false);
      return;
    }
    setWriting(true);
    const next = queue[0];
    const wait = companionRevealDelay(next.body, countRef.current === 0 ? 0 : 1);
    const timer = window.setTimeout(() => {
      setMessages((prev) => (prev.some((item) => item.id === next.id) ? prev : [...prev, next]));
      setQueue((prev) => prev.slice(1));
    }, wait);
    return () => window.clearTimeout(timer);
  }, [queue]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
  }, [messages.length, busy, pending.length, writing, queue.length]);

  async function onPick(files: FileList | File[] | null) {
    if (!files?.length) return;
    try {
      const staged = await stageFiles(files, { allowImage: true, allowVideo: true, max: 1 });
      if (!staged.length) {
        toast.error("Choose a photo or video from your gallery.");
        return;
      }
      setPending(staged.slice(0, 1));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not attach that file.");
    }
  }

  async function send() {
    const body = text.trim();
    const media = pending[0] ?? null;
    if ((!body && !media) || busy) return;
    flushQueue();
    setText("");
    setPending([]);
    setBusy(true);
    const optimistic: CompanionMessage = {
      id: -Date.now(),
      role: "user",
      body,
      photoData: media?.data ?? null,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    try {
      const result = (await sendCompanionMessage({ data: { body, photoData: media?.data ?? null } })) as {
        user: CompanionMessage;
        messages: CompanionMessage[];
      };
      knownIds.current.add(result.user.id);
      for (const item of result.messages ?? []) knownIds.current.add(item.id);
      setMessages((prev) => {
        const without = prev.filter((item) => item.id !== optimistic.id && item.id > 0);
        if (without.some((item) => item.id === result.user.id)) return without;
        return [...without, result.user];
      });
      const incoming = (result.messages ?? []).filter((item) => !queueRef.current.some((q) => q.id === item.id));
      if (incoming.length) setQueue((prev) => [...prev, ...incoming.filter((item) => !prev.some((q) => q.id === item.id))]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "They could not answer.");
    } finally {
      setBusy(false);
    }
  }

  async function wipe() {
    flushQueue();
    knownIds.current.clear();
    try {
      await clearCompanionMessages();
      setMessages([]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not clear.");
    }
  }

  const name = profile.name || DEFAULT_COMPANION.name;
  const heat = COMPANION_HEAT.find((item) => item.value === profile.heat)?.label;
  const face = companionPortrait(profile);
  const empty = messages.length === 0 && !writing && !busy && !queue.length;

  return (
    <div className="flex h-[min(68dvh,34rem)] min-h-0 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center gap-3 border-b border-border px-3 py-2">
        <div className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-full border border-border bg-secondary">
          <img src={face} alt="" className="size-full object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{name}</p>
          <p className="truncate text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
            {[profile.role, profile.gender, heat].filter(Boolean).join(" · ") || "Unshaped"}
          </p>
        </div>
        <button type="button" className="text-xs text-muted-foreground" onClick={onShape}>
          Shape
        </button>
      </div>
      <div ref={scroller} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-3">
        {empty ? (
          <div className="px-2 py-8 text-center">
            <div className="mx-auto mb-4 size-20 overflow-hidden rounded-full border border-border">
              <img src={face} alt="" className="size-full object-cover" />
            </div>
            <p className="font-display text-2xl">{name}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Private. Adult. They write when they want — you do not have to answer every text.
            </p>
            <p className="mt-3 text-xs text-muted-foreground">Hello {me.profile?.displayName || ""}.</p>
          </div>
        ) : (
          messages.map((message) => {
            const mine = message.role === "user";
            return (
              <div key={message.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[88%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap",
                    mine ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground",
                  )}
                >
                  {message.photoData ? (
                    isVideoDataUrl(message.photoData) ? (
                      <video
                        src={message.photoData}
                        controls
                        playsInline
                        className="mb-2 max-h-48 w-full rounded-md"
                      />
                    ) : (
                      <img src={message.photoData} alt="" className="mb-2 max-h-48 rounded-md object-cover" />
                    )
                  ) : null}
                  {message.body ? <p>{message.body}</p> : null}
                  <p className={cn("mt-1 text-[10px]", mine ? "text-primary-foreground/70" : "text-muted-foreground")}>
                    {formatWhen(message.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        {busy || writing ? (
          <p data-companion-writing="1" className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
            {name} is writing…
          </p>
        ) : null}
      </div>
      <div className="shrink-0 space-y-2 border-t border-border p-2">
        <PendingMediaTray
          items={pending}
          onRemove={() => setPending([])}
          onCommit={() => void send()}
          onDiscard={() => setPending([])}
          commitLabel="Send"
          busy={busy}
        />
        <PhotoSourceButtons
          onFiles={onPick}
          busy={busy}
          galleryLabel="Gallery"
          cameraLabel="Camera"
          accept={MEDIA_ACCEPT}
        />
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
        >
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Write to ${name}…`}
            className="h-11"
            maxLength={4000}
            disabled={busy}
          />
          <Button type="submit" disabled={busy || (!text.trim() && !pending.length)} aria-label="Send">
            <Send />
            Send
          </Button>
        </form>
        {messages.length || queue.length ? (
          <button type="button" className="px-1 text-[11px] text-muted-foreground" onClick={() => void wipe()}>
            Clear thread
          </button>
        ) : null}
      </div>
    </div>
  );
}

function CompanionShape({
  profile,
  memories,
  onSaved,
  onMemories,
}: {
  profile: CompanionProfile;
  memories: CompanionMemory[];
  onSaved: (next: CompanionProfile) => void;
  onMemories: (next: CompanionMemory[]) => void;
}) {
  const [draft, setDraft] = useState<CompanionProfile>(profile);
  const [ageText, setAgeText] = useState(() => String(clampCompanionAge(profile.age)));
  const [ageFocused, setAgeFocused] = useState(false);
  const [painting, setPainting] = useState(false);
  const [pendingFace, setPendingFace] = useState<StagedMedia[]>([]);
  const dirty = useRef(false);
  const ageId = useId();
  const draftRef = useRef(draft);
  const ageTextRef = useRef(ageText);
  draftRef.current = draft;
  ageTextRef.current = ageText;

  useEffect(() => {
    if (dirty.current || ageFocused) return;
    setDraft(profile);
    setAgeText(String(clampCompanionAge(profile.age)));
  }, [profile, ageFocused]);

  useEffect(() => {
    return () => {
      if (!dirty.current) return;
      const current = draftRef.current;
      const typed = Number.parseInt(ageTextRef.current.replace(/\D/g, ""), 10);
      const age =
        Number.isFinite(typed) && typed >= 21 && typed <= 99 ? typed : clampCompanionAge(current.age);
      void saveCompanion({
        data: {
          name: current.name,
          gender: current.gender,
          pronouns: current.pronouns,
          age,
          role: current.role,
          dynamic: current.dynamic,
          addressAs: current.addressAs,
          voice: current.voice,
          persona: current.persona,
          appearance: current.appearance,
          kinks: current.kinks,
          limits: current.limits,
          heat: current.heat,
          extra: current.extra,
          avatarData: current.avatarData,
          neediness: current.neediness,
        },
      });
    };
  }, []);

  function touchDraft(update: (prev: CompanionProfile) => CompanionProfile) {
    dirty.current = true;
    setDraft(update);
  }

  function applyAge(next: number) {
    const age = clampCompanionAge(next);
    setAgeText(String(age));
    touchDraft((p) => (p.age === age ? p : { ...p, age }));
  }

  function onAgeChange(raw: string) {
    const digits = raw.replace(/\D/g, "").slice(0, 2);
    setAgeText(digits);
    dirty.current = true;
    if (digits.length !== 2) return;
    const parsed = Number.parseInt(digits, 10);
    if (Number.isFinite(parsed) && parsed >= 21 && parsed <= 99) {
      touchDraft((p) => (p.age === parsed ? p : { ...p, age: parsed }));
    }
  }

  function onAgeBlur() {
    setAgeFocused(false);
    const digits = ageTextRef.current.replace(/\D/g, "");
    if (!digits) {
      setAgeText(String(draftRef.current.age));
      return;
    }
    applyAge(Number.parseInt(digits, 10));
  }

  function bumpAge(delta: number) {
    const parsed = Number.parseInt(ageTextRef.current, 10);
    const base = Number.isFinite(parsed) ? parsed : draftRef.current.age;
    applyAge(base + delta);
  }

  const signature = JSON.stringify({
    name: draft.name,
    gender: draft.gender,
    pronouns: draft.pronouns,
    age: draft.age,
    role: draft.role,
    dynamic: draft.dynamic,
    addressAs: draft.addressAs,
    voice: draft.voice,
    persona: draft.persona,
    appearance: draft.appearance,
    kinks: draft.kinks,
    limits: draft.limits,
    heat: draft.heat,
    extra: draft.extra,
    neediness: draft.neediness,
    avatarData: draft.avatarData ? `${draft.avatarData.length}:${draft.avatarData.slice(-32)}` : "",
  });
  const saveStatus = useAutoSave(
    signature,
    async () => {
      const current = draftRef.current;
      const typed = Number.parseInt(ageTextRef.current.replace(/\D/g, ""), 10);
      const age =
        Number.isFinite(typed) && typed >= 21 && typed <= 99 ? typed : clampCompanionAge(current.age);
      const saved = await saveCompanion({
        data: {
          name: current.name,
          gender: current.gender,
          pronouns: current.pronouns,
          age,
          role: current.role,
          dynamic: current.dynamic,
          addressAs: current.addressAs,
          voice: current.voice,
          persona: current.persona,
          appearance: current.appearance,
          kinks: current.kinks,
          limits: current.limits,
          heat: current.heat,
          extra: current.extra,
          avatarData: current.avatarData,
          neediness: current.neediness,
        },
      });
      if (saved.age !== current.age) {
        setDraft((prev) => ({ ...prev, age: saved.age }));
        if (!ageFocused) setAgeText(String(saved.age));
      }
      onSaved(saved);
    },
    { delay: 500, enabled: !painting },
  );

  async function paintPortrait() {
    const look = draft.appearance.trim();
    if (look.length < 8) {
      toast.error("Write how they look first.");
      return;
    }
    if (painting) return;
    setPainting(true);
    try {
      const saved = await generateCompanionPortrait({
        data: {
          appearance: look,
          name: draft.name,
          gender: draft.gender,
          pronouns: draft.pronouns,
          age: clampCompanionAge(draft.age),
        },
      });
      dirty.current = true;
      setDraft((prev) => ({ ...prev, avatarData: saved.avatarData, appearance: saved.appearance }));
      onSaved({ ...draft, avatarData: saved.avatarData, appearance: saved.appearance });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not make that portrait.");
    } finally {
      setPainting(false);
    }
  }

  const face = pendingFace[0]?.data || companionPortrait(draft);
  const roleKind = companionRoleKind(draft.role);
  const traitCatalog = traitsFor(roleKind);
  const kinkCatalog = kinksFor(roleKind);
  const personaBag = parseTagBag(draft.persona, ALL_TRAIT_OPTIONS);
  const kinkTags = parseTagList(draft.kinks, ALL_KINK_OPTIONS);

  return (
    <div className="max-h-[min(68dvh,34rem)] space-y-5 overflow-y-auto p-4">
      <p className="text-sm text-muted-foreground">
        Entirely yours. Name them, write the face, make the image. They keep what you tell them. They only write onto your pages when they are your live partner.
      </p>
      {memories.length ? (
        <section className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">What they know</p>
          <ul className="space-y-1.5">
            {memories.map((item) => (
              <li key={item.id} className="flex items-start gap-2 rounded-lg bg-secondary px-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{item.kind}</p>
                  <p className="text-sm">{item.body}</p>
                  {item.dueAt ? (
                    <p className="text-xs text-muted-foreground">{formatWhen(item.dueAt)}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  className="mt-0.5 text-muted-foreground hover:text-destructive"
                  aria-label="Forget this"
                  onClick={() => {
                    void dropCompanionMemory({ data: { id: item.id } })
                      .then(() => onMemories(memories.filter((row) => row.id !== item.id)))
                      .catch((err) => toast.error(err instanceof Error ? err.message : "Could not forget that."));
                  }}
                >
                  <X className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <p className="text-xs text-muted-foreground">They will keep facts, kinks, hobbies, and appointments you tell them in chat.</p>
      )}

      <section className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Who they are</p>
        <label className="block space-y-1.5">
          <Label>Name</Label>
          <Input value={draft.name} onChange={(e) => touchDraft((p) => ({ ...p, name: e.target.value }))} maxLength={80} />
        </label>
        <div className="block space-y-1.5">
          <Label htmlFor={ageId}>Age</Label>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="icon" className="shrink-0" aria-label="Decrease age" onClick={() => bumpAge(-1)}>
              <Minus />
            </Button>
            <Input
              id={ageId}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              maxLength={2}
              value={ageText}
              placeholder="21–99"
              className="min-w-0 flex-1 text-center tabular-nums"
              onFocus={() => setAgeFocused(true)}
              onChange={(e) => onAgeChange(e.target.value)}
              onBlur={onAgeBlur}
            />
            <Button type="button" variant="outline" size="icon" className="shrink-0" aria-label="Increase age" onClick={() => bumpAge(1)}>
              <Plus />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Adult characters only, 21–99. Saved on its own.</p>
        </div>
        <label className="block space-y-1.5">
          <Label>Pronouns</Label>
          <Input
            value={draft.pronouns}
            onChange={(e) => touchDraft((p) => ({ ...p, pronouns: e.target.value }))}
            placeholder="she/her"
          />
        </label>
        <Chips
          values={["she/her", "he/him", "they/them"]}
          current={draft.pronouns}
          onPick={(pronouns) => touchDraft((p) => ({ ...p, pronouns }))}
        />
        <label className="block space-y-1.5">
          <Label>Gender</Label>
          <Input
            value={draft.gender}
            onChange={(e) => touchDraft((p) => ({ ...p, gender: e.target.value }))}
            placeholder="Feminine, masculine, your words"
          />
        </label>
        <Chips
          values={["feminine", "masculine", "androgynous"]}
          current={draft.gender}
          onPick={(gender) => touchDraft((p) => ({ ...p, gender }))}
        />
      </section>

      <section className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Look</p>
        <div className="relative overflow-hidden rounded-xl border border-border bg-secondary">
          <img src={face} alt={draft.name || "Companion"} className="aspect-square w-full object-cover" />
          {painting ? (
            <div className="absolute inset-0 grid place-items-center bg-background/70">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Creating their face…</p>
            </div>
          ) : null}
        </div>
        <label className="block space-y-1.5">
          <Label>How they look</Label>
          <Textarea
            className="min-h-28"
            value={draft.appearance}
            onChange={(e) => touchDraft((p) => ({ ...p, appearance: e.target.value }))}
            placeholder="Face, hair, body, clothes, marks — all adults. This is what we paint."
            maxLength={4000}
            disabled={painting}
          />
        </label>
        <p className="text-xs text-muted-foreground">
          {draft.appearance.trim().length}/4000 · Write the person, then create the portrait. You can still use a photo instead.
        </p>
        <Button className="w-full" onClick={() => void paintPortrait()} disabled={painting || draft.appearance.trim().length < 8}>
          <ImagePlus className="size-4" />
          {painting ? "Creating…" : draft.avatarData ? "Create a new portrait" : "Create portrait"}
        </Button>
        <PhotoSourceButtons
          onFiles={async (files) => {
            try {
              const staged = await stageFiles(files, { allowImage: true, max: 1 });
              if (!staged.length) {
                toast.error("Choose a JPEG or PNG from your gallery.");
                return;
              }
              setPendingFace(staged.slice(0, 1));
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Could not read that photo.");
            }
          }}
          busy={painting}
          galleryLabel="Use a photo"
          cameraLabel="Camera"
        />
        <PendingMediaTray
          items={pendingFace}
          onRemove={() => setPendingFace([])}
          onCommit={() => {
            const nextFace = pendingFace[0];
            if (!nextFace) return;
            touchDraft((p) => ({ ...p, avatarData: nextFace.data }));
            setPendingFace([]);
          }}
          onDiscard={() => setPendingFace([])}
          commitLabel="Send"
          busy={painting}
        />
        {draft.avatarData ? (
          <button
            type="button"
            className="text-xs text-muted-foreground"
            onClick={() => touchDraft((p) => ({ ...p, avatarData: null }))}
          >
            Remove portrait
          </button>
        ) : null}
      </section>

      <section className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Dynamic</p>
        <label className="block space-y-1.5">
          <Label>Role</Label>
          <Input
            value={draft.role}
            onChange={(e) => touchDraft((p) => ({ ...p, role: e.target.value }))}
            placeholder="Dominant, pet, your word"
          />
        </label>
        <Chips
          values={["dominant", "submissive", "switch", "service", "brat", "caretaker", "owner", "pet"]}
          current={draft.role}
          onPick={(role) => touchDraft((p) => ({ ...p, role }))}
        />
        <label className="block space-y-1.5">
          <Label>They are to you</Label>
          <Input
            value={draft.dynamic}
            onChange={(e) => touchDraft((p) => ({ ...p, dynamic: e.target.value }))}
            placeholder="Private companion, owner, pet…"
          />
        </label>
        <Chips
          values={["private companion", "owner", "pet", "partner", "mistress", "servant"]}
          current={draft.dynamic}
          onPick={(dynamic) => touchDraft((p) => ({ ...p, dynamic }))}
        />
        <label className="block space-y-1.5">
          <Label>They address you as</Label>
          <Input
            value={draft.addressAs}
            onChange={(e) => touchDraft((p) => ({ ...p, addressAs: e.target.value }))}
            placeholder="Sir, girl, by your name…"
          />
        </label>
      </section>

      <section className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Heat</p>
        <div className="grid grid-cols-5 gap-1">
          {COMPANION_HEAT.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => touchDraft((p) => ({ ...p, heat: item.value }))}
              className={cn(
                "h-11 rounded-lg text-[11px]",
                draft.heat === item.value ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <NeedinessField
          value={draft.neediness}
          onChange={(neediness) => touchDraft((p) => ({ ...p, neediness }))}
        />
      </section>

      <section className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Voice and mind</p>
        <label className="block space-y-1.5">
          <Label>Voice</Label>
          <Textarea
            className="min-h-20"
            value={draft.voice}
            onChange={(e) => touchDraft((p) => ({ ...p, voice: e.target.value }))}
            placeholder="How they sound on the page"
          />
        </label>
        <TagPickField
          label="Personality"
          hint="These follow their role. Pick several. Add your own. Remove any from Chosen."
          catalog={traitCatalog}
          value={personaBag.tags}
          onChange={(tags) =>
            touchDraft((p) => ({
              ...p,
              persona: encodeTagBag({ tags, notes: parseTagBag(p.persona, ALL_TRAIT_OPTIONS).notes }, ALL_TRAIT_OPTIONS),
            }))
          }
          addPlaceholder="Add a trait"
        />
        {personaBag.notes ? (
          <label className="block space-y-1.5">
            <Label>More about them</Label>
            <Textarea
              className="min-h-20"
              value={personaBag.notes}
              onChange={(e) =>
                touchDraft((p) => ({
                  ...p,
                  persona: encodeTagBag(
                    { tags: parseTagBag(p.persona, ALL_TRAIT_OPTIONS).tags, notes: e.target.value },
                    ALL_TRAIT_OPTIONS,
                  ),
                }))
              }
              placeholder="Anything else about how they are"
            />
          </label>
        ) : null}
      </section>

      <section className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Hunger and law</p>
        <TagPickField
          label="Kinks"
          hint="These follow their role. Pick several. Add your own. Remove any from Chosen."
          catalog={kinkCatalog}
          value={kinkTags}
          onChange={(kinks) => touchDraft((p) => ({ ...p, kinks: encodeTagList(kinks, ALL_KINK_OPTIONS) }))}
          addPlaceholder="Add a kink"
        />
        <label className="block space-y-1.5">
          <Label>Limits</Label>
          <Textarea
            className="min-h-20"
            value={draft.limits}
            onChange={(e) => touchDraft((p) => ({ ...p, limits: e.target.value }))}
            placeholder="What they will not do"
          />
        </label>
        <label className="block space-y-1.5">
          <Label>Anything else</Label>
          <Textarea
            className="min-h-20"
            value={draft.extra}
            onChange={(e) => touchDraft((p) => ({ ...p, extra: e.target.value }))}
            placeholder="Freeform instructions they must follow"
          />
        </label>
      </section>
      <SaveHint status={saveStatus} />
    </div>
  );
}

function Chips({
  values,
  current,
  onPick,
}: {
  values: string[];
  current: string;
  onPick: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {values.map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => onPick(value)}
          className={cn(
            "h-8 rounded-full px-3 text-xs capitalize",
            current === value ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground",
          )}
        >
          {value}
        </button>
      ))}
    </div>
  );
}
