import { Link } from "@tanstack/react-router";
import { Info } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { listEntries } from "@/lib/api";
import { NOTE_LIBRARY_CATEGORIES, type LibraryNote } from "@/lib/notes-library";
import { libraryDocsForKeys, relatedLibraryKeys, talkPromptsForLibrary } from "@/lib/talk-notes";
import { LIBRARY_LINKS, linkForActivity, linkForEntry, linkForIdea, sourceKeyFor } from "@/lib/note-links";
import type { Entry, Me } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { SpawnCheckbox } from "@/components/spawn-check";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RichText } from "@/components/rich-text";
import { cn } from "@/lib/utils";

function categoryLabel(slug: string | null | undefined) {
  if (!slug) return "";
  return NOTE_LIBRARY_CATEGORIES.find((item) => item.value === slug)?.label ?? slug;
}

function liveForKey(entries: Entry[], key: string) {
  return entries.find((item) => item.meta.libraryKey === key && item.status !== "archived") ?? null;
}

export function LibraryDocDialog({
  entry,
  doc,
  open,
  canEdit,
  catName,
  subName,
  onClose,
  onEdit,
  relatedKeys,
  me,
  onSpawned,
}: {
  entry?: Entry | null;
  doc?: LibraryNote | null;
  open: boolean;
  canEdit?: boolean;
  catName?: string | null;
  subName?: string | null;
  onClose: () => void;
  onEdit?: () => void;
  relatedKeys?: string[];
  me?: Me | null;
  onSpawned?: (created: Entry, source?: Entry) => void;
}) {
  const key = entry?.meta.libraryKey || doc?.key || "";
  const title = entry?.title ?? doc?.title ?? "Note";
  const body = entry?.body ?? doc?.body ?? "";
  const cat = catName || categoryLabel(entry?.category ?? doc?.category);
  const sub = subName || categoryLabel(entry?.subcategory ?? doc?.subcategory);
  const talk = key ? talkPromptsForLibrary(key) : [];
  const extras = libraryDocsForKeys((relatedKeys ?? []).filter((item) => item !== key));
  const spawnLink = entry
    ? linkForEntry(entry)
    : doc
      ? (LIBRARY_LINKS[doc.key] ??
          (doc.category === "exercises"
            ? linkForActivity(doc.subcategory)
            : doc.category === "ideas"
              ? linkForIdea(doc.subcategory)
              : null))
      : null;

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent className="w-[min(100%-1.5rem,44rem)]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{[cat, sub].filter(Boolean).join(" · ") || "Library"}</DialogDescription>
        </DialogHeader>
        {body ? <RichText html={body} className="text-sm text-foreground" /> : null}
        {extras.length ? (
          <div className="space-y-2 border-t border-border pt-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Also in Notes</p>
            <div className="flex flex-wrap gap-1.5">
              {extras.map((item) => (
                <Link
                  key={item.key}
                  to="/notes"
                  className="rounded-full bg-secondary px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                  onClick={onClose}
                >
                  {item.title}
                </Link>
              ))}
            </div>
          </div>
        ) : null}
        {talk.length ? (
          <div className="space-y-2 border-t border-border pt-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Talk prompts</p>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              {talk.map((prompt) => (
                <li key={prompt} className="rounded-lg bg-secondary/70 px-3 py-2">
                  {prompt}
                </li>
              ))}
            </ul>
            <Link
              to="/talk"
              className="inline-flex text-sm text-primary underline-offset-2 hover:underline"
              onClick={onClose}
            >
              Open Talk
            </Link>
          </div>
        ) : null}
        {entry ? (
          <div className="border-t border-border pt-4">
            <SpawnCheckbox
              suggested={spawnLink}
              title={title}
              body={body}
              sourceKey={sourceKeyFor(entry)}
              sourceEntry={entry}
              me={me}
              onSpawned={onSpawned}
            />
          </div>
        ) : null}
        <div className="flex flex-wrap justify-end gap-2">
          {canEdit && onEdit ? (
            <Button variant="outline" onClick={onEdit}>
              Personalise
            </Button>
          ) : (
            <Button variant="outline" asChild>
              <Link to="/notes" onClick={onClose}>
                Open Notes
              </Link>
            </Button>
          )}
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function MoreInfoButton({
  keys,
  text,
  texts,
  weekKind,
  quizId,
  kinkSlug,
  className,
  tone = "default",
}: {
  keys?: string[];
  text?: string;
  texts?: string[];
  weekKind?: string;
  quizId?: string;
  kinkSlug?: string;
  className?: string;
  tone?: "default" | "onIvory";
}) {
  const resolved = useMemo(
    () =>
      (keys?.length
        ? keys
        : relatedLibraryKeys({ text, texts, weekKind, quizId, kinkSlug })
      ).slice(0, 3),
    [keys, text, texts, weekKind, quizId, kinkSlug],
  );
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(resolved[0] ?? "");
  const [entries, setEntries] = useState<Entry[]>([]);

  useEffect(() => {
    if (!open) return;
    setActive(resolved[0] ?? "");
    void listEntries({ data: { kind: "note" } })
      .then(setEntries)
      .catch(() => setEntries([]));
  }, [open, resolved]);

  if (!resolved.length) return null;

  const docs = libraryDocsForKeys(resolved);
  const current = docs.find((item) => item.key === active) ?? docs[0] ?? null;
  const live = current ? liveForKey(entries, current.key) : null;

  return (
    <>
      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen(true);
        }}
        className={cn(
          "inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-medium uppercase tracking-[0.14em]",
          tone === "onIvory"
            ? "bg-oxblood/10 text-oxblood hover:bg-oxblood/16"
            : "bg-secondary text-muted-foreground hover:text-foreground",
          className,
        )}
      >
        <Info className="size-3.5" />
        More info
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[min(100%-1.5rem,44rem)]">
          <DialogHeader>
            <DialogTitle>{live?.title ?? current?.title ?? "More info"}</DialogTitle>
            <DialogDescription>
              {[categoryLabel(current?.category), categoryLabel(current?.subcategory)].filter(Boolean).join(" · ") ||
                "From Notes"}
            </DialogDescription>
          </DialogHeader>
          {docs.length > 1 ? (
            <div className="flex flex-wrap gap-1.5">
              {docs.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setActive(item.key)}
                  className={cn(
                    "h-8 rounded-full px-3 text-xs",
                    (current?.key ?? "") === item.key
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground",
                  )}
                >
                  {item.title}
                </button>
              ))}
            </div>
          ) : null}
          {live?.body || current?.body ? (
            <RichText html={live?.body ?? current?.body ?? ""} className="text-sm text-foreground" />
          ) : null}
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" asChild>
              <Link to="/notes" onClick={() => setOpen(false)}>
                Open Notes
              </Link>
            </Button>
            <Button onClick={() => setOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
