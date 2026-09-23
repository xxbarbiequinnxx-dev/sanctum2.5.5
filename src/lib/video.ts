export const VIDEO_ACCEPT = "video/*";
export const MEDIA_ACCEPT = "image/*,video/*";
export const VIDEO_META_KEY = "_videos";
export const MAX_VIDEOS = 3;
export const MAX_VIDEO_CHARS = 1_800_000;

export type VideoAttachment = {
  name: string;
  data: string;
};

export function isVideoFile(file: File) {
  if (file.type.startsWith("video/")) return true;
  return /\.(mp4|mov|webm|m4v|avi)$/i.test(file.name);
}

export function isVideoDataUrl(src: string | null | undefined) {
  if (!src) return false;
  return src.startsWith("data:video") || /\.(mp4|webm|mov|m4v)(\?|$)/i.test(src);
}

export function parseVideos(raw: string | undefined | null): VideoAttachment[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is VideoAttachment =>
          Boolean(
            item &&
              typeof item === "object" &&
              typeof (item as VideoAttachment).name === "string" &&
              typeof (item as VideoAttachment).data === "string" &&
              (item as VideoAttachment).data.startsWith("data:"),
          ),
      )
      .slice(0, MAX_VIDEOS)
      .map((item) => ({
        name: item.name.replace(/[^\w.\- ()]+/g, "").slice(0, 80) || "clip.mp4",
        data: item.data,
      }));
  } catch {
    return [];
  }
}

export function encodeVideos(list: VideoAttachment[]) {
  return JSON.stringify(list.slice(0, MAX_VIDEOS).map((item) => ({ name: item.name, data: item.data })));
}

export function applyVideos(meta: Record<string, string>, videos: VideoAttachment[]) {
  const next = { ...meta };
  if (videos.length) next[VIDEO_META_KEY] = encodeVideos(videos);
  else delete next[VIDEO_META_KEY];
  return next;
}

export function readVideoFile(file: File): Promise<VideoAttachment> {
  return new Promise((resolve, reject) => {
    if (file.size > 1_400_000) {
      reject(new Error("Video is too large. Use a short clip under about 1 MB."));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const data = String(reader.result ?? "");
      if (!data.startsWith("data:")) {
        reject(new Error("Could not read that video."));
        return;
      }
      if (data.length > MAX_VIDEO_CHARS) {
        reject(new Error("Video is too large after reading. Try a shorter clip."));
        return;
      }
      resolve({ name: file.name.slice(0, 80) || "clip.mp4", data });
    };
    reader.onerror = () => reject(new Error("Could not read that video."));
    reader.readAsDataURL(file);
  });
}

export async function stillFromVideoFile(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.src = url;
    await new Promise<void>((resolve, reject) => {
      let settled = false;
      const ok = () => {
        if (settled) return;
        settled = true;
        resolve();
      };
      const fail = () => {
        if (settled) return;
        settled = true;
        reject(new Error("Could not read that video."));
      };
      video.addEventListener("loadeddata", ok, { once: true });
      video.addEventListener("error", fail, { once: true });
      setTimeout(fail, 8_000);
    });
    try {
      video.currentTime = Math.min(0.2, Math.max(0, (video.duration || 0) * 0.05));
      await new Promise<void>((resolve) => {
        video.addEventListener("seeked", () => resolve(), { once: true });
        setTimeout(resolve, 400);
      });
    } catch {
      /* iOS may refuse currentTime before play */
    }
    const width = Math.max(1, video.videoWidth || 720);
    const height = Math.max(1, video.videoHeight || 720);
    const scale = Math.min(1, 720 / Math.max(width, height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not read that video.");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    video.removeAttribute("src");
    video.load();
    let quality = 0.64;
    let data = canvas.toDataURL("image/jpeg", quality);
    while (data.length > 280_000 && quality > 0.35) {
      quality -= 0.08;
      data = canvas.toDataURL("image/jpeg", quality);
    }
    if (!data.startsWith("data:image/")) throw new Error("Could not read that video.");
    return data;
  } finally {
    URL.revokeObjectURL(url);
  }
}
