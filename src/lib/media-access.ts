import { compressImage, isImageFile } from "@/lib/photo";
import { isVideoFile, readVideoFile, stillFromVideoFile } from "@/lib/video";
import { toast } from "sonner";

export type MediaKind = "gallery" | "camera";
export type GalleryKind = "image" | "video" | "media";

const CONSENT_KEY: Record<MediaKind, string> = {
  gallery: "sanctum.media.gallery",
  camera: "sanctum.media.camera",
};

export type StagedMedia = {
  kind: "image" | "video";
  data: string;
  name: string;
};

export type NativePickKind = "gallery" | "camera" | "pdf" | "video" | "media";

type NativeFilePayload = {
  files?: { name?: string; mime?: string; base64?: string }[];
  error?: string;
};

type SanctumAndroid = {
  pick: (kind: NativePickKind, multiple: boolean) => void;
};

declare global {
  interface Window {
    SanctumAndroid?: SanctumAndroid;
    __sanctumNativeFile?: (payload: string) => void;
  }
}

export function hasNativePicker() {
  return typeof window !== "undefined" && typeof window.SanctumAndroid?.pick === "function";
}

export function filesFromNativePayload(raw: string): File[] {
  let parsed: NativeFilePayload;
  try {
    parsed = JSON.parse(raw) as NativeFilePayload;
  } catch {
    return [];
  }
  const files: File[] = [];
  for (const item of parsed.files ?? []) {
    if (!item?.base64) continue;
    const binary = atob(item.base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    const name = item.name?.trim() || "file";
    const mime = item.mime?.trim() || "";
    files.push(new File([bytes], name, { type: mime }));
  }
  return files;
}

let nativePickOpen = false;

export function pickNative(kind: NativePickKind, multiple = false): Promise<File[] | "cancelled"> {
  if (!hasNativePicker() || nativePickOpen) return Promise.resolve("cancelled");
  nativePickOpen = true;
  return new Promise((resolve) => {
    const finish = (files: File[] | "cancelled") => {
      nativePickOpen = false;
      window.__sanctumNativeFile = undefined;
      resolve(files);
    };
    // A user may spend several minutes locating a document. Avoid timing out
    // a picker while Android still owns the foreground activity.
    const timer = window.setTimeout(() => finish("cancelled"), 600_000);
    window.__sanctumNativeFile = (payload: string) => {
      window.clearTimeout(timer);
      try {
        const message = (JSON.parse(payload) as NativeFilePayload).error;
        if (message) toast.error(message);
        const files = filesFromNativePayload(payload);
        finish(files.length ? files : "cancelled");
      } catch {
        toast.error("Android could not return the selected file. Please try again.");
        finish("cancelled");
      }
    };
    try {
      window.SanctumAndroid!.pick(kind, multiple);
    } catch {
      window.clearTimeout(timer);
      finish("cancelled");
    }
  });
}

export function hasMediaConsent(kind: MediaKind) {
  if (typeof localStorage === "undefined") return false;
  return localStorage.getItem(CONSENT_KEY[kind]) === "allow";
}

export function grantMediaConsent(kind: MediaKind) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(CONSENT_KEY[kind], "allow");
}

export function isIosDevice() {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export function isMobileDevice() {
  if (typeof navigator === "undefined") return false;
  if (isIosDevice() || /Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) return true;
  if (typeof window !== "undefined" && navigator.maxTouchPoints > 1 && window.matchMedia?.("(pointer: coarse)")?.matches) {
    return true;
  }
  return false;
}

export function filesFromList(list: FileList | File[] | null | undefined): File[] {
  if (!list) return [];
  return Array.from(list);
}

export function galleryKindFromAccept(accept: string): GalleryKind {
  const hasImage = /image|\.hei[cf]/i.test(accept);
  const hasVideo = /video|\.mp4|\.mov|\.webm|\.m4v/i.test(accept);
  if (hasImage && hasVideo) return "media";
  if (hasVideo && !hasImage) return "video";
  return "image";
}

type PickerHandle = { getFile: () => Promise<File> };

function pickerTypes(kind: GalleryKind) {
  if (kind === "video") {
    return [{ description: "Videos", accept: { "video/*": [".mp4", ".mov", ".webm", ".m4v"] } }];
  }
  if (kind === "image") {
    return [
      {
        description: "Photos",
        accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp", ".gif", ".heic", ".heif", ".bmp", ".avif"] },
      },
    ];
  }
  return [
    {
      description: "Photos and videos",
      accept: {
        "image/*": [".jpg", ".jpeg", ".png", ".webp", ".gif", ".heic", ".heif"],
        "video/*": [".mp4", ".mov", ".webm", ".m4v"],
      },
    },
  ];
}

export function canUsePicturesPicker() {
  if (typeof window === "undefined") return false;
  if (isMobileDevice()) return false;
  return typeof (window as Window & { showOpenFilePicker?: unknown }).showOpenFilePicker === "function";
}

export async function pickFromDeviceGallery(options: {
  multiple?: boolean;
  kind?: GalleryKind;
}): Promise<File[] | "unavailable" | "cancelled"> {
  if (!canUsePicturesPicker()) return "unavailable";
  const picker = (window as Window & {
    showOpenFilePicker?: (opts: {
      multiple?: boolean;
      startIn?: string;
      types?: ReturnType<typeof pickerTypes>;
    }) => Promise<PickerHandle[]>;
  }).showOpenFilePicker;
  if (typeof picker !== "function") return "unavailable";
  try {
    const handles = await picker({
      multiple: Boolean(options.multiple),
      startIn: "pictures",
      types: pickerTypes(options.kind ?? "media"),
    });
    return Promise.all(handles.map((handle) => handle.getFile()));
  } catch (err) {
    if (err && typeof err === "object" && "name" in err && (err as { name: string }).name === "AbortError") {
      return "cancelled";
    }
    return "unavailable";
  }
}

export function galleryAcceptFromKind(kind: GalleryKind) {
  if (kind === "video") return "video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm,.m4v";
  if (kind === "media") return "image/*,video/mp4,video/quicktime,.jpg,.jpeg,.png,.heic,.heif,.mp4,.mov";
  return "image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.gif,.heic,.heif";
}

export function cameraAcceptFromKind(kind: GalleryKind) {
  if (kind === "video") return "video/*";
  return "image/*";
}

export const PDF_ACCEPT = "application/pdf,application/x-pdf,.pdf";

export function canUseDocumentsPicker() {
  if (typeof window === "undefined") return false;
  if (isMobileDevice()) return false;
  return typeof (window as Window & { showOpenFilePicker?: unknown }).showOpenFilePicker === "function";
}

export async function pickPdfFromFiles(options: { multiple?: boolean } = {}): Promise<File[] | "unavailable" | "cancelled"> {
  if (!canUseDocumentsPicker()) return "unavailable";
  const picker = (window as Window & {
    showOpenFilePicker?: (opts: {
      multiple?: boolean;
      startIn?: string;
      types?: { description: string; accept: Record<string, string[]> }[];
    }) => Promise<PickerHandle[]>;
  }).showOpenFilePicker;
  if (typeof picker !== "function") return "unavailable";
  try {
    const handles = await picker({
      multiple: Boolean(options.multiple),
      startIn: "documents",
      types: [{ description: "PDF", accept: { "application/pdf": [".pdf"] } }],
    });
    return Promise.all(handles.map((handle) => handle.getFile()));
  } catch (err) {
    if (err && typeof err === "object" && "name" in err && (err as { name: string }).name === "AbortError") {
      return "cancelled";
    }
    return "unavailable";
  }
}

export function triggerFileInput(input: HTMLInputElement | null | undefined) {
  if (!input || input.disabled) return;
  // iOS treats showPicker() more like a generic file sheet. click() honours capture vs gallery.
  if (!isMobileDevice()) {
    try {
      if (typeof input.showPicker === "function") {
        input.showPicker();
        return;
      }
    } catch {
      /* fall through */
    }
  }
  input.click();
}

export async function requestCameraStream() {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("Camera is not available in this browser.");
  }
  return navigator.mediaDevices.getUserMedia({
    video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
    audio: false,
  });
}

export function stopMediaStream(stream: MediaStream | null | undefined) {
  stream?.getTracks().forEach((track) => track.stop());
}

export function snapshotFromVideo(video: HTMLVideoElement): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, video.videoWidth || 720);
  canvas.height = Math.max(1, video.videoHeight || 720);
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.reject(new Error("Could not take that photo."));
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not take that photo."))),
      "image/jpeg",
      0.92,
    );
  });
}

export function fileFromBlob(blob: Blob, name: string) {
  return new File([blob], name, { type: blob.type || "image/jpeg" });
}

export async function stageFiles(
  list: FileList | File[] | null | undefined,
  options: { allowImage?: boolean; allowVideo?: boolean; max?: number } = {},
): Promise<StagedMedia[]> {
  const allowImage = options.allowImage !== false;
  const allowVideo = Boolean(options.allowVideo);
  const max = options.max ?? 8;
  const staged: StagedMedia[] = [];
  for (const file of filesFromList(list)) {
    if (staged.length >= max) break;
    if (allowVideo && isVideoFile(file)) {
      try {
        const clip = await readVideoFile(file);
        staged.push({ kind: "video", data: clip.data, name: clip.name });
        continue;
      } catch (err) {
        if (!allowImage) throw err;
        try {
          const still = await stillFromVideoFile(file);
          staged.push({
            kind: "image",
            data: still,
            name: `${(file.name.replace(/\.[^.]+$/, "") || "clip").slice(0, 60)}.jpg`,
          });
          toast.message("That clip is too large to send. Attached a still from it instead.");
          continue;
        } catch {
          throw err;
        }
      }
    }
    if (allowImage && isImageFile(file)) {
      staged.push({
        kind: "image",
        data: await compressImage(file),
        name: file.name.slice(0, 80) || "photo.jpg",
      });
    }
  }
  return staged;
}
