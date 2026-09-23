const MAX_EDGE = 720;
const JPEG_QUALITY = 0.64;
const MAX_CHARS = 280_000;

export const IMAGE_ACCEPT = "image/*";

export function isImageFile(file: File) {
  if (file.type.startsWith("video/")) return false;
  if (!file.type || file.type.startsWith("image/")) return true;
  return /\.(heic|heif|jpe?g|png|webp|gif|bmp|avif)$/i.test(file.name);
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Could not read that photo from your gallery."));
    reader.readAsDataURL(file);
  });
}

async function bitmapFromBlob(blob: Blob): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(blob, { imageOrientation: "from-image" } as ImageBitmapOptions);
  } catch {
    return await createImageBitmap(blob);
  }
}

async function bitmapFromFile(file: File): Promise<ImageBitmap> {
  try {
    return await bitmapFromBlob(file);
  } catch {
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () =>
          reject(new Error("Could not read that photo from your gallery. Try JPEG or PNG, or use the camera."));
        image.src = url;
      });
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, img.naturalWidth);
      canvas.height = Math.max(1, img.naturalHeight);
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not read this image");
      ctx.drawImage(img, 0, 0);
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (next) => (next ? resolve(next) : reject(new Error("Could not read this image"))),
          "image/jpeg",
          0.92,
        );
      });
      return await bitmapFromBlob(blob);
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

function encodeCanvas(canvas: HTMLCanvasElement) {
  let quality = JPEG_QUALITY;
  let data = canvas.toDataURL("image/jpeg", quality);
  while (data.length > MAX_CHARS && quality > 0.35) {
    quality -= 0.08;
    data = canvas.toDataURL("image/jpeg", quality);
  }
  if (data.length > MAX_CHARS) {
    const scale = Math.sqrt(MAX_CHARS / data.length) * 0.92;
    const next = document.createElement("canvas");
    next.width = Math.max(1, Math.round(canvas.width * scale));
    next.height = Math.max(1, Math.round(canvas.height * scale));
    const ctx = next.getContext("2d");
    if (!ctx) throw new Error("Could not compress this photo.");
    ctx.drawImage(canvas, 0, 0, next.width, next.height);
    data = next.toDataURL("image/jpeg", 0.55);
  }
  if (data.length > MAX_CHARS) {
    throw new Error("Photo is still too large after compressing. Try a smaller image or use the camera.");
  }
  return data;
}

function compressBitmap(bitmap: ImageBitmap) {
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not read this image");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  return encodeCanvas(canvas);
}

export async function compressImage(file: File): Promise<string> {
  try {
    return compressBitmap(await bitmapFromFile(file));
  } catch (err) {
    const raw = await readAsDataUrl(file);
    if (!raw.startsWith("data:image/")) {
      throw err instanceof Error ? err : new Error("Could not read that photo.");
    }
    if (/^data:image\/(jpeg|jpg|png|webp|gif)/i.test(raw) && raw.length <= MAX_CHARS) return raw;
    try {
      const blob = await (await fetch(raw)).blob();
      return compressBitmap(await bitmapFromBlob(blob));
    } catch {
      throw err instanceof Error ? err : new Error("Could not read that photo from your gallery.");
    }
  }
}
