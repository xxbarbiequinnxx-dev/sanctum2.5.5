import { Mic, Send, Square } from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "sonner";
import { Lightbox, PendingMediaTray, PhotoSourceButtons } from "@/components/photo-field";
import { RichEditor, RichText } from "@/components/rich-text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  addPrivatePhoto,
  deletePrivatePhoto,
  listMessages,
  listPrivatePhotos,
  sendMessage,
} from "@/lib/api";
import { stageFiles, type StagedMedia } from "@/lib/media-access";
import { isVideoDataUrl, MEDIA_ACCEPT } from "@/lib/video";
import type { Me, Message, PrivatePhoto } from "@/lib/types";
import { formatWhen } from "@/lib/format";
import { useLiveReload } from "@/lib/live-sync";
import { cn } from "@/lib/utils";

export function MessagesPanel({
  me,
  open,
  tab,
  onTab,
}: {
  me: Me;
  open: boolean;
  tab: "messages" | "photos";
  onTab: (tab: "messages" | "photos") => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-x-0 top-14 z-40 mx-auto w-[min(100%,28rem)] px-3 sm:right-4 sm:left-auto sm:mx-0 sm:w-[24rem] sm:px-0">
      <div className="overflow-hidden rounded-xl border border-border bg-popover shadow-soft">
        <div className="grid grid-cols-2 border-b border-border p-1">
          <button
            type="button"
            onClick={() => onTab("messages")}
            className={cn(
              "h-10 rounded-lg text-sm",
              tab === "messages" ? "bg-secondary text-foreground" : "text-muted-foreground",
            )}
          >
            Messages
          </button>
          <button
            type="button"
            onClick={() => onTab("photos")}
            className={cn(
              "h-10 rounded-lg text-sm",
              tab === "photos" ? "bg-secondary text-foreground" : "text-muted-foreground",
            )}
          >
            Photos
          </button>
        </div>
        {tab === "messages" ? <Chat me={me} /> : <Album me={me} />}
      </div>
    </div>
  );
}

function Chat({ me }: { me: Me }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [pending, setPending] = useState<StagedMedia[]>([]);
  const [busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const userId = me.profile?.userId;

  const load = useCallback(async () => {
    try {
      setMessages(await listMessages());
    } catch {
      /* ignore poll errors */
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);
  useLiveReload(load);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
  }, [messages.length]);

  async function send(photoData?: string | null, audioData?: string | null) {
    const body = text.trim();
    const photo = photoData ?? pending[0]?.data ?? null;
    if (!body && !photo && !audioData) return;
    setBusy(true);
    try {
      const message = await sendMessage({
        data: { body, photoData: photo, audioData: audioData ?? null },
      });
      setMessages((prev) => [...prev, message]);
      setText("");
      setPending([]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send.");
    } finally {
      setBusy(false);
    }
  }

  async function onPhoto(files: FileList | File[] | null) {
    if (!files?.length) return;
    try {
      const staged = await stageFiles(files, { allowImage: true, allowVideo: true, max: 1 });
      if (!staged.length) {
        toast.error("Choose a photo or video from your gallery.");
        return;
      }
      setPending(staged.slice(0, 1));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not attach that photo.");
    }
  }

  async function toggleRecord() {
    if (recording) {
      recorder.current?.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const rec = new MediaRecorder(stream, { mimeType: mime });
      chunks.current = [];
      rec.ondataavailable = (event) => {
        if (event.data.size) chunks.current.push(event.data);
      };
      rec.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        setRecording(false);
        const blob = new Blob(chunks.current, { type: rec.mimeType || "audio/webm" });
        if (blob.size > 1_400_000) {
          toast.error("Voice note is too long. Keep it under about a minute.");
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          const data = String(reader.result ?? "");
          if (data.startsWith("data:")) void send(null, data);
        };
        reader.readAsDataURL(blob);
      };
      recorder.current = rec;
      rec.start();
      setRecording(true);
    } catch {
      toast.error("Microphone access was denied.");
    }
  }

  if (!me.partner) {
    return (
      <div className="px-5 py-10 text-center text-sm text-muted-foreground">
        Connect a partner from Settings → Partner to send private messages.
      </div>
    );
  }

  return (
    <div className="flex h-[min(62dvh,28rem)] min-h-0 flex-col overflow-hidden">
      <div ref={scroller} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-3">
        {messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Private between you and {me.partner.displayName || "your partner"}.
          </p>
        ) : (
          messages.map((message) => {
            const mine = message.senderId === userId;
            return (
              <div key={message.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[85%] rounded-lg px-3 py-2 text-sm",
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
                  {message.audioData ? (
                    <audio src={message.audioData} controls className="mb-2 w-full" />
                  ) : null}
                  {message.body ? (
                    <RichText
                      html={message.body}
                      className={mine ? "text-primary-foreground" : "text-foreground"}
                    />
                  ) : null}
                  <p className={cn("mt-1 text-[10px]", mine ? "text-primary-foreground/70" : "text-muted-foreground")}>
                    {formatWhen(message.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
      <div className="shrink-0 space-y-2 border-t border-border p-2">
        <RichEditor
          value={text}
          onChange={setText}
          placeholder="Write privately…"
          compact
        />
        <PendingMediaTray
          items={pending}
          onRemove={() => setPending([])}
          onCommit={() => void send()}
          onDiscard={() => setPending([])}
          commitLabel="Send"
          busy={busy}
        />
        <PhotoSourceButtons
          onFiles={onPhoto}
          busy={busy}
          galleryLabel="Gallery"
          cameraLabel="Camera"
          accept={MEDIA_ACCEPT}
        />
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            size="icon"
            variant={recording ? "default" : "outline"}
            disabled={busy}
            aria-label={recording ? "Stop recording" : "Voice note"}
            onClick={() => void toggleRecord()}
          >
            {recording ? <Square /> : <Mic />}
          </Button>
          <Button
            type="button"
            disabled={busy || (!text.trim() && !pending.length)}
            aria-label="Send"
            onClick={() => void send()}
          >
            <Send />
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}

function Album({ me }: { me: Me }) {
  const [photos, setPhotos] = useState<PrivatePhoto[]>([]);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [pending, setPending] = useState<StagedMedia[]>([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setPhotos(await listPrivatePhotos());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load photos.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);
  useLiveReload(load);

  async function onPick(files: FileList | File[] | null) {
    if (!files?.length) return;
    try {
      const staged = await stageFiles(files, { allowImage: true, max: 1 });
      if (!staged.length) {
        toast.error("Choose a photo from your gallery.");
        return;
      }
      setPending(staged.slice(0, 1));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add photo.");
    }
  }

  async function send() {
    const media = pending[0];
    if (!media) return;
    setBusy(true);
    try {
      const saved = await addPrivatePhoto({ data: { photoData: media.data, caption } });
      setPhotos((prev) => [saved, ...prev]);
      setCaption("");
      setPending([]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add photo.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: number) {
    try {
      await deletePrivatePhoto({ data: { id } });
      setPhotos((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete.");
    }
  }

  return (
    <div className="flex h-[min(62dvh,28rem)] min-h-0 flex-col overflow-hidden">
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {photos.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            A private album for the two of you. Choose photos from your gallery or take a new one.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {photos.map((photo) => (
              <figure key={photo.id} className="overflow-hidden rounded-md bg-secondary">
                <button type="button" className="block w-full" onClick={() => setLightbox(photo.photoData)}>
                  <img src={photo.photoData} alt="" className="h-28 w-full object-cover" />
                </button>
                <figcaption className="flex items-center justify-between gap-2 px-2 py-1.5 text-[11px] text-muted-foreground">
                  <span className="truncate">{photo.caption || formatWhen(photo.createdAt)}</span>
                  {photo.uploadedBy === me.profile?.userId ? (
                    <button type="button" onClick={() => void remove(photo.id)} className="hover:text-foreground">
                      Remove
                    </button>
                  ) : null}
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </div>
      <div className="shrink-0 space-y-2 border-t border-border p-2">
        <Input
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Caption (optional)"
        />
        <PhotoSourceButtons onFiles={onPick} busy={busy} />
        <PendingMediaTray
          items={pending}
          onRemove={() => setPending([])}
          onCommit={() => void send()}
          onDiscard={() => setPending([])}
          commitLabel="Send"
          busy={busy}
        />
      </div>
      <Lightbox src={lightbox} onClose={() => setLightbox(null)} />
    </div>
  );
}
