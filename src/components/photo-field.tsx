import { Camera, Images, Send, X } from "lucide-react";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  cameraAcceptFromKind,
  fileFromBlob,
  galleryAcceptFromKind,
  galleryKindFromAccept,
  grantMediaConsent,
  hasNativePicker,
  isMobileDevice,
  pickNative,
  pickFromDeviceGallery,
  requestCameraStream,
  snapshotFromVideo,
  stageFiles,
  stopMediaStream,
  triggerFileInput,
  type StagedMedia,
} from "@/lib/media-access";
import { IMAGE_ACCEPT } from "@/lib/photo";
import { MEDIA_ACCEPT, VIDEO_ACCEPT, type VideoAttachment } from "@/lib/video";
import { cn } from "@/lib/utils";

const pickClass =
  "relative flex h-11 w-full cursor-pointer items-center justify-center overflow-hidden rounded-md border border-dashed border-input text-sm text-muted-foreground";

export function PhotoSourceButtons({
  onFiles,
  busy = false,
  multiple = false,
  galleryLabel = "Gallery",
  cameraLabel = "Camera",
  accept = IMAGE_ACCEPT,
}: {
  onFiles: (files: FileList | File[] | null) => void | Promise<void>;
  busy?: boolean;
  multiple?: boolean;
  galleryLabel?: string;
  cameraLabel?: string;
  accept?: string;
}) {
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [live, setLive] = useState<MediaStream | null>(null);
  const [host, setHost] = useState<HTMLElement | null>(null);
  const kind = galleryKindFromAccept(accept);
  const galleryAccept = galleryAcceptFromKind(kind);
  const cameraAccept = cameraAcceptFromKind(kind);
  const liveCameraOk =
    !isMobileDevice() &&
    kind !== "video" &&
    typeof navigator !== "undefined" &&
    typeof navigator.mediaDevices?.getUserMedia === "function";

  useEffect(() => {
    setHost(document.body);
  }, []);

  useEffect(() => {
    const node = videoRef.current;
    if (!node || !live) return;
    node.srcObject = live;
    void node.play().catch(() => undefined);
    return () => {
      node.srcObject = null;
    };
  }, [live]);

  useEffect(() => () => stopMediaStream(live), [live]);

  function emitFiles(files: FileList | File[] | null | undefined, source: "gallery" | "camera") {
    if (!files || files.length === 0) return;
    grantMediaConsent(source);
    void onFiles(files);
  }

  function handleGallery(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.currentTarget.files ?? []);
    event.currentTarget.value = "";
    emitFiles(files, "gallery");
  }

  function handleCamera(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.currentTarget.files ?? []);
    event.currentTarget.value = "";
    emitFiles(files, "camera");
  }

  async function openGallery() {
    if (busy || live) return;
    if (hasNativePicker()) {
      const kindPick = kind === "video" ? "video" : kind === "media" ? "media" : "gallery";
      const picked = await pickNative(kindPick, multiple);
      if (picked === "cancelled") return;
      emitFiles(picked, "gallery");
      return;
    }
    const picked = await pickFromDeviceGallery({ multiple, kind });
    if (picked === "cancelled") return;
    if (picked !== "unavailable") {
      emitFiles(picked, "gallery");
      return;
    }
    triggerFileInput(galleryRef.current);
  }

  async function startLiveCamera() {
    if (busy) return;
    try {
      const stream = await requestCameraStream();
      grantMediaConsent("camera");
      setLive(stream);
    } catch {
      triggerFileInput(cameraRef.current);
    }
  }

  function openCamera() {
    if (busy || live) return;
    if (hasNativePicker()) {
      void pickNative("camera", false).then((picked) => {
        if (picked === "cancelled") return;
        emitFiles(picked, "camera");
      });
      return;
    }
    if (liveCameraOk) {
      void startLiveCamera();
      return;
    }
    triggerFileInput(cameraRef.current);
  }

  function cancelLive() {
    stopMediaStream(live);
    setLive(null);
  }

  async function snap() {
    const node = videoRef.current;
    if (!node) return;
    try {
      const blob = await snapshotFromVideo(node);
      cancelLive();
      emitFiles([fileFromBlob(blob, "camera.jpg")], "camera");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not take that photo.");
    }
  }

  const blocked = busy || Boolean(live);

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <label className={cn(pickClass, blocked && "pointer-events-none opacity-60")}>
          <Images className="size-4" />
          {galleryLabel}
          <input
            ref={galleryRef}
            type="file"
            accept={galleryAccept}
            multiple={multiple}
            disabled={blocked}
            className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
            onClick={(event) => {
              if (!hasNativePicker()) return;
              event.preventDefault();
              void openGallery();
            }}
            onChange={handleGallery}
            aria-label={galleryLabel}
          />
        </label>
        <label className={cn(pickClass, blocked && "pointer-events-none opacity-60")}>
          <Camera className="size-4" />
          {cameraLabel}
          <input
            ref={cameraRef}
            type="file"
            accept={cameraAccept}
            capture="environment"
            disabled={blocked}
            className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
            onClick={(event) => {
              if (hasNativePicker() || liveCameraOk) {
                event.preventDefault();
                openCamera();
              }
            }}
            onChange={handleCamera}
            aria-label={cameraLabel}
          />
        </label>
      </div>
      <p className="text-xs text-muted-foreground">
        Gallery opens Photos only. Camera opens the camera only. Allow the prompt when the phone asks.
      </p>
      {live && host
        ? createPortal(
            <div className="fixed inset-0 z-[90] grid place-items-center bg-ink/90 p-4">
              <div className="w-full max-w-sm space-y-3">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="aspect-[3/4] w-full rounded-xl bg-secondary object-cover"
                />
                <div className="flex gap-2">
                  <Button type="button" className="flex-1" variant="outline" onClick={cancelLive}>
                    Cancel
                  </Button>
                  <Button type="button" className="flex-1" onClick={() => void snap()}>
                    Take photo
                  </Button>
                </div>
              </div>
            </div>,
            host,
          )
        : null}
    </div>
  );
}

export function PendingMediaTray({
  items,
  onRemove,
  onCommit,
  onDiscard,
  commitLabel = "Send",
  busy = false,
}: {
  items: StagedMedia[];
  onRemove?: (index: number) => void;
  onCommit: () => void;
  onDiscard: () => void;
  commitLabel?: string;
  busy?: boolean;
}) {
  const tray = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!items.length) return;
    tray.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [items.length]);

  if (!items.length) return null;
  return (
    <div ref={tray} className="space-y-2 rounded-lg border border-border bg-secondary/60 p-2">
      <p className="px-1 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Ready to send</p>
      <div className="grid grid-cols-4 gap-2">
        {items.map((item, index) => (
          <div key={`${item.kind}-${item.name}-${index}`} className="relative aspect-square overflow-hidden rounded-md bg-secondary">
            {item.kind === "video" ? (
              <video src={item.data} className="size-full object-cover" muted playsInline />
            ) : (
              <img src={item.data} alt="" className="size-full object-cover" />
            )}
            {onRemove ? (
              <button
                type="button"
                className="absolute top-1 right-1 grid size-7 place-items-center rounded-full bg-ink/70 text-foreground"
                onClick={() => onRemove(index)}
                aria-label="Remove"
              >
                <X className="size-3.5" />
              </button>
            ) : null}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="ghost" className="h-11" onClick={onDiscard} disabled={busy}>
          Discard
        </Button>
        <Button type="button" className="h-11 flex-1" onClick={onCommit} disabled={busy}>
          <Send />
          {busy ? "Sending…" : commitLabel}
        </Button>
      </div>
    </div>
  );
}

export function PhotoField({
  photos,
  onChange,
  max = 4,
  label = "Photos",
  commitLabel = "Send",
}: {
  photos: string[];
  onChange: (next: string[]) => void;
  max?: number;
  label?: string;
  commitLabel?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<StagedMedia[]>([]);
  const replacing = max === 1 && photos.length >= 1;
  const room = replacing ? Math.max(0, 1 - pending.length) : Math.max(0, max - photos.length - pending.length);

  async function onPick(files: FileList | File[] | null) {
    if (!files?.length) return;
    if (room <= 0) {
      toast.error(replacing ? "Send or discard the photo waiting first." : `You can attach up to ${max} photos.`);
      return;
    }
    setBusy(true);
    try {
      const staged = await stageFiles(files, { allowImage: true, max: room });
      if (!staged.length) {
        toast.error("That file is not a photo. Choose a JPEG, PNG, or HEIC from your gallery.");
        return;
      }
      setPending((prev) => [...prev, ...staged]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not read that photo.");
    } finally {
      setBusy(false);
    }
  }

  function commit() {
    if (!pending.length) return;
    onChange(replacing ? pending.map((item) => item.data) : [...photos, ...pending.map((item) => item.data)]);
    setPending([]);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">
          {photos.length}/{max}
        </p>
      </div>
      {photos.length ? (
        <div className="grid grid-cols-4 gap-2">
          {photos.map((src, index) => (
            <div key={`${src.slice(0, 24)}-${index}`} className="relative aspect-square overflow-hidden rounded-md bg-secondary">
              <img src={src} alt="" className="size-full object-cover" />
              <button
                type="button"
                className="absolute top-1 right-1 grid size-7 place-items-center rounded-full bg-ink/70 text-foreground"
                onClick={() => onChange(photos.filter((_, i) => i !== index))}
                aria-label="Remove photo"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : null}
      <PendingMediaTray
        items={pending}
        onRemove={(index) => setPending((prev) => prev.filter((_, i) => i !== index))}
        onCommit={commit}
        onDiscard={() => setPending([])}
        commitLabel={commitLabel}
        busy={busy}
      />
      {room > 0 ? (
        <PhotoSourceButtons onFiles={onPick} busy={busy} multiple={!replacing && max - photos.length > 1} />
      ) : null}
    </div>
  );
}

export function MediaField({
  photos,
  videos,
  onPhotos,
  onVideos,
  maxPhotos = 4,
  maxVideos = 3,
}: {
  photos: string[];
  videos: VideoAttachment[];
  onPhotos: (next: string[]) => void;
  onVideos: (next: VideoAttachment[]) => void;
  maxPhotos?: number;
  maxVideos?: number;
  commitLabel?: string;
}) {
  const [busy, setBusy] = useState(false);
  const photoRoom = Math.max(0, maxPhotos - photos.length);
  const videoRoom = Math.max(0, maxVideos - videos.length);
  const room = photoRoom + videoRoom;

  async function onPick(files: FileList | File[] | null) {
    if (!files?.length) return;
    if (room <= 0) {
      toast.error("Send or discard what is waiting first, or remove a still or clip.");
      return;
    }
    setBusy(true);
    try {
      const staged = await stageFiles(files, { allowImage: true, allowVideo: true, max: room });
      const next: StagedMedia[] = [];
      let usedPhotos = photos.length;
      let usedVideos = videos.length;
      for (const item of staged) {
        if (item.kind === "video") {
          if (videos.length + usedVideos >= maxVideos) continue;
          usedVideos += 1;
          next.push(item);
          continue;
        }
        if (photos.length + usedPhotos >= maxPhotos) continue;
        usedPhotos += 1;
        next.push(item);
      }
      const skipped = staged.length - next.length;
      if (!next.length) {
        toast.error(skipped ? "No room left for that file." : "Choose a photo or video from your gallery.");
        return;
      }
      const images = next.filter((item) => item.kind === "image").map((item) => item.data);
      const clips = next.filter((item) => item.kind === "video").map((item) => ({ name: item.name, data: item.data }));
      if (images.length) onPhotos([...photos, ...images]);
      if (clips.length) onVideos([...videos, ...clips]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not read that file.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Photos & videos</p>
      {photos.length || videos.length ? (
        <div className="grid grid-cols-4 gap-2">
          {photos.map((src, index) => (
            <div key={`${src.slice(0, 24)}-${index}`} className="relative aspect-square overflow-hidden rounded-md bg-secondary">
              <img src={src} alt="" className="size-full object-cover" />
              <button
                type="button"
                className="absolute top-1 right-1 grid size-7 place-items-center rounded-full bg-ink/70 text-foreground"
                onClick={() => onPhotos(photos.filter((_, i) => i !== index))}
                aria-label="Remove photo"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
          {videos.map((clip, index) => (
            <div key={`${clip.name}-${index}`} className="relative aspect-square overflow-hidden rounded-md bg-secondary">
              <video src={clip.data} className="size-full object-cover" muted playsInline />
              <button
                type="button"
                className="absolute top-1 right-1 grid size-7 place-items-center rounded-full bg-ink/70 text-foreground"
                onClick={() => onVideos(videos.filter((_, i) => i !== index))}
                aria-label="Remove video"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : null}
      {room > 0 ? (
        <PhotoSourceButtons
          onFiles={onPick}
          busy={busy}
          multiple
          accept={MEDIA_ACCEPT}
          galleryLabel="Gallery"
          cameraLabel="Camera"
        />
      ) : null}
    </div>
  );
}

export function PhotoStrip({
  photos,
  className,
  onOpen,
}: {
  photos: string[];
  className?: string;
  onOpen?: (src: string) => void;
}) {
  if (!photos.length) return null;
  return (
    <div className={cn("flex gap-2 overflow-x-auto", className)}>
      {photos.map((src, index) => (
        <button
          key={`${src.slice(0, 18)}-${index}`}
          type="button"
          onClick={() => onOpen?.(src)}
          className="h-20 w-20 shrink-0 overflow-hidden rounded-md bg-secondary"
        >
          <img src={src} alt="" className="size-full object-cover" />
        </button>
      ))}
    </div>
  );
}

export function Lightbox({
  src,
  onClose,
}: {
  src: string | null;
  onClose: () => void;
}) {
  if (!src) return null;
  return (
    <button
      type="button"
      className="fixed inset-0 z-[80] grid place-items-center bg-ink/90 p-4"
      onClick={onClose}
      aria-label="Close photo"
    >
      <img src={src} alt="" className="max-h-[90dvh] max-w-full rounded-lg object-contain" />
    </button>
  );
}

export function VideoField({
  videos,
  onChange,
  max = 3,
  commitLabel = "Send",
}: {
  videos: VideoAttachment[];
  onChange: (next: VideoAttachment[]) => void;
  max?: number;
  commitLabel?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<StagedMedia[]>([]);
  const room = Math.max(0, max - videos.length - pending.length);

  async function onPick(files: FileList | File[] | null) {
    if (!files?.length) return;
    if (room <= 0) {
      toast.error(`You can attach up to ${max} videos.`);
      return;
    }
    setBusy(true);
    try {
      const staged = await stageFiles(files, { allowImage: false, allowVideo: true, max: room });
      if (!staged.length) {
        toast.error("That file is not a video. Choose a clip from your gallery.");
        return;
      }
      setPending((prev) => [...prev, ...staged]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not read that video.");
    } finally {
      setBusy(false);
    }
  }

  function commit() {
    if (!pending.length) return;
    onChange([...videos, ...pending.map((item) => ({ name: item.name, data: item.data }))]);
    setPending([]);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Videos</p>
        <p className="text-xs text-muted-foreground">
          {videos.length}/{max}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {videos.map((clip, index) => (
          <div key={`${clip.name}-${index}`} className="relative overflow-hidden rounded-md bg-secondary">
            <video src={clip.data} className="h-28 w-full object-cover" muted playsInline />
            <p className="truncate px-2 py-1 text-[11px] text-muted-foreground">{clip.name}</p>
            <button
              type="button"
              className="absolute top-1 right-1 grid size-7 place-items-center rounded-full bg-ink/70 text-foreground"
              onClick={() => onChange(videos.filter((_, i) => i !== index))}
              aria-label="Remove video"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}
      </div>
      <PendingMediaTray
        items={pending}
        onRemove={(index) => setPending((prev) => prev.filter((_, i) => i !== index))}
        onCommit={commit}
        onDiscard={() => setPending([])}
        commitLabel={commitLabel}
        busy={busy}
      />
      {room > 0 ? (
        <PhotoSourceButtons
          onFiles={onPick}
          busy={busy}
          multiple={max - videos.length > 1}
          accept={VIDEO_ACCEPT}
          galleryLabel="Gallery"
          cameraLabel="Record"
        />
      ) : null}
    </div>
  );
}

export function VideoStrip({ videos }: { videos: VideoAttachment[] }) {
  if (!videos.length) return null;
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {videos.map((clip, index) => (
        <video
          key={`${clip.name}-${index}`}
          src={clip.data}
          controls
          playsInline
          className="max-h-48 w-full rounded-md bg-secondary"
        />
      ))}
    </div>
  );
}
