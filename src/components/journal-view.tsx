import { Archive, Lock, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { EntryForm } from "@/components/entry-form";
import { EmptyState } from "@/components/kind-page";
import { Lightbox, PendingMediaTray, PhotoSourceButtons, PhotoStrip } from "@/components/photo-field";
import { PdfStrip } from "@/components/pdf-field";
import { RichEditor, RichText } from "@/components/rich-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  addJournalComment,
  deleteEntry,
  deleteJournalComment,
  getMe,
  listEntries,
  listJournalComments,
  updateEntry,
} from "@/lib/api";
import { isArchivedEntry } from "@/lib/kinds";
import { formatWhen, intensityMarks } from "@/lib/format";
import { fillSelectOptions, KINDS } from "@/lib/kinds";
import { stageFiles, type StagedMedia } from "@/lib/media-access";
import type { Entry, JournalComment, Me } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useLiveReload } from "@/lib/live-sync";

const CONFIG = fillSelectOptions(KINDS.journal);

export function JournalView() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [comments, setComments] = useState<JournalComment[]>([]);
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "shared" | "private" | "archived">("all");
  const [editing, setEditing] = useState<Entry | null | undefined>(undefined);
  const [lightbox, setLightbox] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [rows, notes, mine] = await Promise.all([
        listEntries({ data: { kind: "journal" } }),
        listJournalComments(),
        getMe(),
      ]);
      setEntries(rows);
      setComments(notes);
      setMe(mine);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load the journal.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);
  useLiveReload(load);

  const visible = useMemo(() => {
    return entries.filter((item) => {
      const archived = isArchivedEntry(item);
      if (filter === "archived") return archived;
      if (archived) return false;
      const vis = item.meta.visibility === "private" ? "private" : "shared";
      if (filter === "all") return true;
      return vis === filter;
    });
  }, [entries, filter]);

  const names: Record<string, string> = {};
  if (me?.profile) names[me.profile.userId] = me.profile.displayName || "Me";
  if (me?.partner) names[me.partner.userId] = me.partner.displayName || "Partner";

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">{CONFIG.kicker}</p>
          <h1 className="mt-1 font-display text-4xl font-medium">{CONFIG.title}</h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">{CONFIG.blurb}</p>
        </div>
        <Button onClick={() => setEditing(null)}>
          <Plus />
          {CONFIG.addLabel}
        </Button>
      </header>

      <div className="flex flex-wrap gap-1.5">
        {(["all", "shared", "private", "archived"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={cn(
              "h-9 rounded-full px-3 text-sm capitalize",
              filter === value ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground",
            )}
          >
            {value}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl bg-card" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          title={CONFIG.emptyTitle}
          body={CONFIG.emptyBody}
          action={CONFIG.addLabel}
          onAction={() => setEditing(null)}
        />
      ) : (
        <div className="space-y-4">
          {visible.map((entry) => (
            <JournalCard
              key={entry.id}
              entry={entry}
              comments={comments.filter((item) => item.entryId === entry.id)}
              names={names}
              me={me}
              onOpen={() => setEditing(entry)}
              onPhoto={setLightbox}
              onComments={setComments}
              onBody={(html) => {
                void updateEntry({ data: { id: entry.id, kind: "journal", body: html } })
                  .then((updated) => {
                    setEntries((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
                  })
                  .catch((err) => toast.error(err instanceof Error ? err.message : "Could not update."));
              }}
              onArchive={() => {
                const next = entry.status === "archived" ? "open" : "archived";
                void updateEntry({ data: { id: entry.id, kind: "journal", status: next } })
                  .then((updated) => {
                    setEntries((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
                  })
                  .catch((err) => toast.error(err instanceof Error ? err.message : "Could not archive."));
              }}
              onDelete={() => {
                if (typeof window !== "undefined" && !window.confirm(`Delete “${entry.title}”? This cannot be undone.`)) {
                  return;
                }
                void deleteEntry({ data: { id: entry.id } })
                  .then(() => setEntries((prev) => prev.filter((item) => item.id !== entry.id)))
                  .catch((err) => toast.error(err instanceof Error ? err.message : "Could not delete."));
              }}
            />
          ))}
        </div>
      )}

      <EntryForm
        config={CONFIG}
        entry={editing ?? undefined}
        open={editing !== undefined}
        onOpenChange={(open) => {
          if (!open) setEditing(undefined);
        }}
        onSaved={(entry, removed) => {
          setEntries((prev) => {
            if (removed) return prev.filter((item) => item.id !== entry.id);
            const exists = prev.some((item) => item.id === entry.id);
            return exists ? prev.map((item) => (item.id === entry.id ? entry : item)) : [entry, ...prev];
          });
        }}
      />
      <Lightbox src={lightbox} onClose={() => setLightbox(null)} />
    </div>
  );
}

function JournalCard({
  entry,
  comments,
  names,
  me,
  onOpen,
  onPhoto,
  onComments,
  onBody,
  onArchive,
  onDelete,
}: {
  entry: Entry;
  comments: JournalComment[];
  names: Record<string, string>;
  me: Me | null;
  onOpen: () => void;
  onPhoto: (src: string) => void;
  onComments: (updater: (prev: JournalComment[]) => JournalComment[]) => void;
  onBody: (html: string) => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const shared = entry.meta.visibility !== "private";
  const [body, setBody] = useState("");
  const [pending, setPending] = useState<StagedMedia[]>([]);
  const [busy, setBusy] = useState(false);
  const author = names[entry.createdBy] ?? "Someone";
  const canComment = shared && Boolean(me?.profile);

  async function send() {
    const media = pending[0];
    if (!body.trim() && !media) return;
    setBusy(true);
    try {
      const created = await addJournalComment({
        data: { entryId: entry.id, body: body.trim(), photoData: media?.data ?? null },
      });
      onComments((prev) => [...prev, created]);
      setBody("");
      setPending([]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not comment.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: number) {
    try {
      await deleteJournalComment({ data: { id } });
      onComments((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete.");
    }
  }

  return (
    <article className="overflow-hidden rounded-xl border border-border bg-card">
      {entry.photos[0] ? (
        <button type="button" className="block w-full" onClick={() => onPhoto(entry.photos[0]!)}>
          <img src={entry.photos[0]} alt="" className="h-52 w-full object-cover" />
        </button>
      ) : null}
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <button type="button" onClick={onOpen} className="text-left">
            <h2 className="font-display text-2xl font-medium leading-snug">{entry.title}</h2>
            <p className="mt-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">
              {author}
              {entry.meta.mood ? ` · ${entry.meta.mood}` : ""}
            </p>
          </button>
          <Badge variant={shared ? "default" : "muted"}>
            {shared ? "Shared" : (
              <span className="inline-flex items-center gap-1">
                <Lock className="size-3" />
                Private
              </span>
            )}
          </Badge>
        </div>
        {entry.body ? <RichText html={entry.body} onChange={onBody} /> : null}
        {entry.intensity ? (
          <div className="flex gap-1" aria-label={`Charge ${entry.intensity}`}>
            {intensityMarks(entry.intensity).map((on, i) => (
              <span key={i} className={cn("size-2 rounded-full", on ? "bg-primary" : "bg-border")} />
            ))}
          </div>
        ) : null}
        {entry.photos.length > 1 ? <PhotoStrip photos={entry.photos.slice(1)} onOpen={onPhoto} /> : null}
        {entry.pdfs?.length ? <PdfStrip pdfs={entry.pdfs} /> : null}
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{formatWhen(entry.createdAt)}</p>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={onOpen}>
              Edit
            </Button>
            <Button size="sm" variant="ghost" onClick={onArchive}>
              <Archive className="size-3.5" />
              {entry.status === "archived" ? "Restore" : "Archive"}
            </Button>
            <Button size="sm" variant="ghost" onClick={onDelete}>
              <Trash2 className="size-3.5" />
              Delete
            </Button>
          </div>
        </div>
      </div>
      {shared ? (
        <div className="border-t border-border px-4 py-4">
          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
            Comments {comments.length ? `· ${comments.length}` : ""}
          </p>
          {comments.length ? (
            <ul className="mt-3 space-y-3">
              {comments.map((item) => (
                <li key={item.id} className="rounded-lg bg-secondary/70 p-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                      {names[item.authorId] ?? "Partner"}
                    </p>
                    <span className="text-[11px] text-muted-foreground">{formatWhen(item.createdAt)}</span>
                  </div>
                  {item.body ? <RichText html={item.body} className="mt-1" /> : null}
                  {item.photoData ? (
                    <button type="button" className="mt-2 block" onClick={() => onPhoto(item.photoData!)}>
                      <img src={item.photoData} alt="" className="h-28 rounded-md object-cover" />
                    </button>
                  ) : null}
                  {item.authorId === me?.profile?.userId ? (
                    <button
                      type="button"
                      className="mt-2 text-xs text-muted-foreground"
                      onClick={() => void remove(item.id)}
                    >
                      Remove
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              {me?.partner
                ? "No comments yet. Your partner can answer this page."
                : "No comments yet. Write one, or connect a partner to share the page."}
            </p>
          )}
          {canComment ? (
            <div className="mt-3 space-y-2">
              <RichEditor
                value={body}
                onChange={setBody}
                placeholder="A comment on this page"
                compact
              />
              <PhotoSourceButtons
                onFiles={async (files) => {
                  try {
                    const staged = await stageFiles(files, { allowImage: true, max: 1 });
                    if (!staged.length) {
                      toast.error("Choose a photo from your gallery.");
                      return;
                    }
                    setPending(staged.slice(0, 1));
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Could not attach that photo.");
                  }
                }}
                busy={busy}
              />
              <PendingMediaTray
                items={pending}
                onRemove={() => setPending([])}
                onCommit={() => void send()}
                onDiscard={() => setPending([])}
                commitLabel="Send"
                busy={busy}
              />
              <Button type="button" size="sm" onClick={() => void send()} disabled={busy || (!body.trim() && !pending.length)}>
                {busy ? "Sending…" : "Send"}
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
